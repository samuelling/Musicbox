// A golden (Syrian) hamster, Mesocricetus auratus, running in a wheel that is belted to the
// music box crank.  Everything here runs inside the audio worklet at the audio sample rate,
// so the wheel, the hamster's body, its legs and the belt are integrated together with the
// cylinder, and every stride reaches the pins.  PHYSICS.md §"Hamster drive" has the sources.
//
// Bodies and coordinates (all SI):
//   wheel   angle θw, speed ωw (> 0 when the running surface under the hamster moves backwards)
//   hamster centre of mass on a circle of radius Rc = R − hc inside the rim, at angle φ from the
//           bottom (> 0 = forward, up the front of the wheel)
//   legs    a tangential ground-reaction force F (forward on the hamster, backward on the rim)
//
//   m Rc φ̈ = F − m g sin φ                     (body: pushed by its feet, pulled back by gravity)
//   Iw ω̇w  = F R − τaxle(ωw) − Fbelt r_w        (wheel)
//
// F is not prescribed: it comes from a neuromuscular controller that tries to make the body
// move over the surface at the speed the hamster has chosen (v_rel = Rc φ̇ + R ωw), limited by
// Hill's force–velocity curve, shaped by the footfall pattern of the gait (walk / trot /
// half-bound), and capped by paw friction μN with N from the vertical ground reaction.
// Where the hamster ends up sitting in the wheel is therefore not scripted: it is the angle at
// which gravity on its own body balances the load (sin φ = τload / (m g R)).

const G = 9.81;

// ---- the animal (golden hamster, adult) ----
export const HAMSTER = {
  mass: 0.125,            // kg; adults 100–150 g (pet-breeder lines 175–225 g)
  length: 0.155,          // m nose–rump
  hc: 0.026,              // m CoM height above the running surface while running
  // gait (treadmill data at 0.16 m/s: stride 8 cm, 2.0 Hz, 72 % stance; allometry above that)
  fWalk: 2.0, vWalk: 0.16, fExp: 0.628,
  vTrot: 0.24, vBound: 0.72,           // walk→trot, trot→half-bound transitions (m/s)
  // muscle (time-averaged over a stride)
  Fprop: 1.2,             // isometric propulsive capacity, body weights
  Fbrake: 1.6,            // eccentric braking capacity, body weights
  vmax: 1.7,              // m/s where the legs can no longer push (Hill)
  hillK: 0.25,            // Hill curvature a/F0
  kv: 14,                 // 1/s: how hard the legs correct a speed error (spinal/reflex loop)
  // energetics (Taylor, Heglund & Maloiy 1982; Weibel et al. VO2max allometry)
  effMech: 0.25,          // muscle efficiency for external work
  hrRest: 310, hrMax: 470,// beats/min (pet hamsters: 250–500)
  brRest: 70, brMax: 135, // breaths/min (35–135)
};

export const WHEELS = {
  d20: { D: 0.20, mass: 0.12, label: '20 cm (8″) pet-shop wheel' },
  d28: { D: 0.28, mass: 0.17, label: '28 cm (11″) wheel' },
  d35: { D: 0.35, mass: 0.26, label: '35 cm lab wheel (hamsters prefer it)' },
};
export const SURFACES_H = {
  rungs: { mu: 1.0, rung: 0.009, label: 'Wire rungs, 9 mm apart' },
  solid: { mu: 0.65, rung: 0, label: 'Solid plastic tread' },
};
export const AXLES = {
  bearing: { tauC: 1.5e-4, c: 1.5e-5, squeak: 0, label: 'Ball bearing' },
  dry: { tauC: 2.2e-3, c: 4e-5, squeak: 1, label: 'Dry plastic bushing (squeaks)' },
};

// limb order: LF, RF, LH, RH.  Touch-down phase offsets per gait.
export const GAITS = {
  walk: [0.25, 0.75, 0.0, 0.5],      // lateral-sequence walk
  trot: [0.52, 0.02, 0.0, 0.5],      // diagonal pairs (fore lands a hair late)
  bound: [0.48, 0.6, 0.0, 0.08],     // half-bound: hinds together, forelimbs staggered
};
const PROP_W = [0.55, 0.55, 1.45, 1.45];  // share of propulsion (hindlimbs drive)
const VERT_W = [1.2, 1.2, 0.8, 0.8];      // share of body weight (forelimbs carry more)

export function strideFreq(v) {
  const H = HAMSTER, a = Math.max(0.04, v);
  const f = H.fWalk * Math.pow(a / H.vWalk, H.fExp);
  if (a <= H.vBound) return f;
  const fb = H.fWalk * Math.pow(H.vBound / H.vWalk, H.fExp);
  return fb * Math.pow(a / H.vBound, 0.2);             // frequency nearly flat in the gallop
}
export function dutyFactor(v) { return Math.min(0.75, Math.max(0.32, 0.72 - 0.42 * (v - 0.16))); }

// mass-specific metabolic power while running (Taylor et al. 1982), W
export function metabolicPower(M, v) { return M * (10.7 * Math.pow(M, -0.316) * Math.max(0, v) + 6.03 * Math.pow(M, -0.303)); }
export function vo2maxW(M) { return 1.94 * Math.pow(M, 0.87) * 20.1; }  // ml O2/s × 20.1 J/ml
export function bmrW(M) { return 3.4 * Math.pow(M, 0.75); }             // Kleiber

export class Hamster {
  constructor(sr) {
    this.sr = sr; this.dt = 1 / sr;
    this.rng = 0x2545f491;
    this.opts = { mass: HAMSTER.mass, wheel: 'd28', surface: 'rungs', axle: 'bearing', lover: false, diurnal: false };
    this.inWheel = false; this.restT = 0; this.bouts = 0;
    this.derive();
    // state
    this.thw = 0; this.ww = 0; this.phi = 0; this.dphi = 0;
    this.phase = 0; this.gait = 'walk'; this.f = 0; this.D = 0.7; this.vEst = 0;
    this.F = 0; this.N = 0; this.slip = 0;
    this.prevStance = [0, 0, 0, 0]; this.stance = [0, 0, 0, 0];
    // behaviour
    this.state = 'rest'; this.timer = 2.5; this.vBout = 0.5; this.vOU = 0; this.vCmd = 0; this.vGoal = 0;
    this.burst = 0; this.stutter = 0; this.motiv = 0; this.dayFactor = 1; this.act = 'sit';
    this.reserve = 1; this.Emet = bmrW(this.m); this.dist = 0; this.kJ = 0; this.revs = 0;
    this.hr = HAMSTER.hrRest; this.br = HAMSTER.brRest;
    // sound
    this.res = new Float64Array(12);  // three 2-pole resonators: thud, tick, knock
    this.sq = { ph: 0, env: 0, f: 1900 };
    this.lastRung = 0; this.lastRev = 0;
  }

  rand() { let s = this.rng; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rng = s >>> 0; return this.rng / 4294967296; }
  gauss() { return Math.sqrt(-2 * Math.log(this.rand() + 1e-12)) * Math.cos(6.283185 * this.rand()); }

  set(o) { Object.assign(this.opts, o); this.derive(); }
  derive() {
    const o = this.opts, W = WHEELS[o.wheel] || WHEELS.d28;
    this.m = o.mass;
    const s = Math.cbrt(o.mass / HAMSTER.mass);
    this.hc = HAMSTER.hc * s; this.len = HAMSTER.length * s;
    this.R = W.D / 2; this.Rc = this.R - this.hc;
    this.Iw = 0.78 * W.mass * this.R * this.R + 2e-5;     // rim + rungs + spokes + hub pulley
    this.surf = SURFACES_H[o.surface] || SURFACES_H.rungs;
    this.axle = AXLES[o.axle] || AXLES.bearing;
    this.vmaxAer = (0.7 * vo2maxW(this.m) / this.m - 6.03 * Math.pow(this.m, -0.303)) / (10.7 * Math.pow(this.m, -0.316));
  }

  // belt pulleys: the crank must turn at its design rate when the hamster runs at its usual pace
  setDrive(Gcrank, omegaNom) {
    [this.rw, this.rc] = pulleyRadii(Gcrank, omegaNom, this.R, this.opts.gear || 1);
    this.kb = 140; this.Fslip = 1.68;                         // silicone O-ring, 1 N pretension, μ 0.8, half wrap
    this.belt = { x: 0, off: 0, back: 0 };
  }

  // ------------------------------------------------------------- behaviour (block rate)
  // he climbs in or out (decided by his life in the cage, js/sim/hamster-life.js)
  setInWheel(on) {
    if (on === this.inWheel) return;
    this.inWheel = on;
    this.phi = 0; this.dphi = 0; this.vCmd = 0; this.vGoal = 0; this.vEst = this.R * this.ww;
    this.state = 'rest'; this.act = 'sit'; this.restT = 0;
    this.timer = on ? 0.6 + 1.2 * this.rand() : 1e9;
  }

  behave(dt, hour) {
    const H = HAMSTER;
    if (!this.inWheel) {
      this.state = 'out'; this.vGoal = this.vCmd = 0;
      this.Emet += (bmrW(this.m) * 1.8 - this.Emet) * (1 - Math.exp(-dt / 20));
      const x = Math.max(0, Math.min(1, (this.Emet - bmrW(this.m)) / (vo2maxW(this.m) - bmrW(this.m))));
      this.hr = H.hrRest + (H.hrMax - H.hrRest) * Math.sqrt(x); this.br = H.brRest + (H.brMax - H.brRest) * x;
      return;
    }
    const lover = this.opts.lover;
    // nocturnal: most running happens in the dark phase
    const night = (hour >= 19.5 || hour < 5.5) ? 1 : (hour >= 17.5 || hour < 7.5) ? 0.85 : 0.55;
    this.dayFactor = night;
    const A = Math.min(1.6, night + this.motiv);
    this.motiv *= Math.exp(-dt / 60);
    this.timer -= dt;
    if (this.state === 'rest') {
      this.vGoal = 0;
      this.restT += dt;
      if (this.timer <= 0) {
        this.state = 'run'; this.restT = 0; this.bouts++; this.timer = 8 + (-Math.log(this.rand() + 1e-9)) * (lover ? 90 : 40) * A;
        const med = 0.46 * (0.85 + 0.15 * A) * (0.8 + 0.2 * this.reserve);
        this.vBout = Math.min(1.05, Math.max(0.22, med * Math.exp(0.22 * this.gauss())));
        this.act = 'run';
      } else if (this.rand() < dt * 0.15) this.act = this.rand() < 0.4 ? 'groom' : this.rand() < 0.5 ? 'look' : 'sit';
    } else {
      // Ornstein–Uhlenbeck wander around the bout's pace, sprints and brief stutters
      this.vOU += (-this.vOU / 2.5) * dt + 0.055 * Math.sqrt(dt) * this.gauss() * 1.4;
      if (this.burst <= 0 && this.rand() < dt * 0.02 * A) this.burst = 1.5 + 2.5 * this.rand();
      if (this.stutter <= 0 && this.rand() < dt * 0.03) this.stutter = 0.4 + 0.5 * this.rand();
      this.burst = Math.max(0, this.burst - dt); this.stutter = Math.max(0, this.stutter - dt);
      let g = this.vBout * (1 + this.vOU) + (this.burst > 0 ? 0.25 : 0);
      if (this.stutter > 0) g *= 0.35;
      if (this.reserve < 0.25) g *= 0.6 + 1.6 * this.reserve;   // tiring: slows down
      this.vGoal = Math.min(1.15, Math.max(0.12, g));
      if (this.timer <= 0 || this.reserve < 0.03) {
        this.state = 'rest'; this.restT = 0; this.timer = 1.5 + (-Math.log(this.rand() + 1e-9)) * (lover ? 2.5 : 7) / A * (1.6 - this.reserve);
        this.act = 'sit';
      }
    }
    // acceleration is limited by what the legs and the wheel allow anyway; the command slews
    const dv = this.vGoal - this.vCmd, lim = (dv > 0 ? 1.4 : 2.5) * dt;
    this.vCmd += Math.max(-lim, Math.min(lim, dv));
    // energetics
    const v = Math.max(0, this.vEst), Pm = Math.max(0, this.F * this.R * this.ww);
    const run = this.state === 'run' || v > 0.05;
    const E = (run ? metabolicPower(this.m, v) : bmrW(this.m) * 1.6) + Pm / H.effMech;
    this.Emet += (E - this.Emet) * (1 - Math.exp(-dt / 20));      // O2 on-kinetics, t½ ≈ 15–20 s
    const Emax = vo2maxW(this.m), crit = 0.7 * Emax;
    const Wp = 120;                                               // J anaerobic reserve
    if (E > crit) this.reserve -= (E - crit) * dt / Wp; else this.reserve += 0.004 * dt * (crit - E) / crit * 10;
    this.reserve = Math.min(1, Math.max(0, this.reserve));
    this.kJ += this.Emet * dt / 1000;
    const x = Math.max(0, Math.min(1, (this.Emet - bmrW(this.m)) / (Emax - bmrW(this.m))));
    this.hr = H.hrRest + (H.hrMax - H.hrRest) * Math.sqrt(x);
    this.br = H.brRest + (H.brMax - H.brRest) * x;
  }

  wake() { this.motiv = Math.min(0.8, this.motiv + 0.5); if (this.state === 'rest') { this.timer = Math.min(this.timer, 0.4 + 0.8 * this.rand()); this.restT = 0; } }

  // ------------------------------------------------------------- mechanics (audio rate)
  // Fb: belt force pulling the rim pulley back (N). Returns nothing; updates state.
  step(Fb) {
    const H = HAMSTER, dt = this.dt, m = this.m, R = this.R, Rc = this.Rc;
    if (!this.inWheel) {
      // an empty wheel just coasts down on its axle
      this.f = 0; this.F = 0; this.phi = 0; this.dphi = 0; this.vEst = 0;
      for (let k = 0; k < 4; k++) this.stance[k] = -1;
      const ax = this.axle;
      const dw = (-(ax.c * this.ww + ax.tauC * Math.tanh(this.ww / 0.05)) - Fb * this.rw) / this.Iw;
      this.ww += dw * dt; this.thw += this.ww * dt;
      return;
    }
    const vRel = Rc * this.dphi + R * this.ww;
    // stride clock runs on the actual speed over the surface
    this.vEst += (vRel - this.vEst) * 0.0015;
    const vAbs = Math.abs(this.vEst);
    const moving = vAbs > 0.05 || this.vCmd > 0.05;
    let F = 0, Nfac = 1;
    if (moving) {
      // gait choice with hysteresis
      if (this.gait === 'walk' && vAbs > H.vTrot + 0.03) this.gait = 'trot';
      else if (this.gait === 'trot' && vAbs < H.vTrot - 0.03) this.gait = 'walk';
      else if (this.gait === 'trot' && vAbs > H.vBound + 0.04) this.gait = 'bound';
      else if (this.gait === 'bound' && vAbs < H.vBound - 0.04) this.gait = 'trot';
      this.f = strideFreq(Math.max(vAbs, 0.08)); this.D = dutyFactor(vAbs);
      this.phase += this.f * dt; if (this.phase >= 1) this.phase -= 1;
      const off = GAITS[this.gait], D = this.D;
      let W = 0, V = 0, osc = 0;
      for (let k = 0; k < 4; k++) {
        let t = this.phase - off[k]; t -= Math.floor(t);
        const st = t < D ? t / D : -1;
        this.stance[k] = st;
        if (st >= 0) {
          const s = Math.sin(Math.PI * st);
          W += PROP_W[k] * s; V += VERT_W[k] * s;
          osc += -Math.sin(2 * Math.PI * st) * s;           // braking then propulsion within each stance
        }
      }
      const mean = D * (2 / Math.PI) * 4;                    // stride means of Σw·sin(πτ)
      Nfac = V / mean; const Wn = W / mean;
      // neuromuscular command: close the speed error, hold the body steady
      const Fc = m * H.kv * (this.vCmd - vRel);
      // Hill force–velocity limits (time-averaged), then distribute over the stance pattern
      const x = Math.max(0, vRel) / H.vmax;
      const Fp = H.Fprop * m * G * Math.max(0, (1 - x) / (1 + x / H.hillK)), Fbk = H.Fbrake * m * G;
      F = Math.max(-Fbk, Math.min(Fp, Fc)) * Wn;
      F += 0.2 * m * G * Math.min(1.4, Math.sqrt(vAbs / 0.5)) * osc;   // per-footfall braking/propulsive pulses
    } else {
      // resting: the paws grip the tread; the body rides with the wheel and the pair swing as a pendulum
      this.f = 0;
      F = m * 30 * (0 - vRel);
      for (let k = 0; k < 4; k++) this.stance[k] = 0.5;
    }
    // paw friction: |F| ≤ μ N, N from body weight, centripetal load and the stance pattern
    const N = Math.max(0, m * (G * Math.cos(this.phi) + Rc * this.dphi * this.dphi)) * Nfac;
    const Fmax = this.surf.mu * N;
    this.slip = 0;
    if (F > Fmax) { F = 0.85 * Fmax; this.slip = 1; } else if (F < -Fmax) { F = -0.85 * Fmax; this.slip = 1; }
    this.F = F; this.N = N;
    // integrate body and wheel (semi-implicit Euler; both modes are slow compared with the sample rate)
    const ddphi = (F - m * G * Math.sin(this.phi)) / (m * Rc);
    const ax = this.axle;
    let tauA = ax.c * this.ww + ax.tauC * Math.tanh(this.ww / 0.05);
    const dw = (F * R - tauA - Fb * this.rw) / this.Iw;
    this.dphi += ddphi * dt; this.phi += this.dphi * dt;
    this.ww += dw * dt; this.thw += this.ww * dt;
    this.dist += Math.max(0, R * this.ww) * dt;
    this.revs = this.thw / (2 * Math.PI);
  }

  // ------------------------------------------------------------- sound (audio rate)
  // Volume acceleration (m^3/s^2) radiated by the wheel: paw strikes on the tread, claws on wire
  // rungs, the axle knocking once a turn, and stick–slip squeal from a dry bushing.
  sound(noise) {
    const r = this.res, sr = this.sr;
    let exThud = 0, exTick = 0, exKnock = 0;
    for (let k = 0; k < 4; k++) {
      const st = this.stance[k];
      if (st >= 0 && this.prevStance[k] < 0 && this.f > 0) {
        const v = Math.max(0.1, Math.abs(this.vEst));
        exThud += (0.6 + 0.4 * this.rand()) * VERT_W[k] * Math.sqrt(v) * (this.surf.rung ? 0.075 : 0.05);
        if (this.surf.rung) exTick += (0.4 + 0.6 * this.rand()) * Math.sqrt(v) * 0.05;
      }
      this.prevStance[k] = st;
    }
    const rev = Math.floor(this.thw / (2 * Math.PI));
    if (rev !== this.lastRev) { exKnock += Math.min(1, Math.abs(this.ww) / 4) * 0.03 * (0.7 + 0.3 * this.rand()); this.lastRev = rev; }
    // three resonators: wheel shell thump (~240 Hz), rung/claw tick (~3.4 kHz), stand knock (~620 Hz)
    const out = this.reso(0, exThud, 240, 0.018) + this.reso(4, exTick, 3400, 0.0025) + this.reso(8, exKnock, 620, 0.01);
    // squeal: Stribeck stick–slip in a dry bushing, strongest at low sliding speed and at one
    // spot per turn where the axle load peaks
    let sq = 0;
    if (this.axle.squeak) {
      const w = Math.abs(this.ww);
      const band = smooth(w, 0.25, 1.0) * (1 - smooth(w, 6, 10));
      const spot = Math.pow(0.5 + 0.5 * Math.cos(this.thw - 0.7), 6);
      const target = band * (0.25 + 0.75 * spot);
      const q = this.sq;
      q.env += (target - q.env) * (target > q.env ? 0.004 : 0.0008);
      q.f += ((1750 + 55 * w) - q.f) * 0.001;
      q.ph += (q.f * (1 + 0.004 * (this.rand() - 0.5))) / sr; if (q.ph > 1) q.ph -= 1;
      const p = 2 * Math.PI * q.ph;
      sq = q.env * 0.07 * (Math.sin(p) + 0.45 * Math.sin(2 * p + 0.3) + 0.2 * Math.sin(3 * p + 1.1));
    }
    return noise * (out + sq);
  }
  reso(i, ex, f, tau) {
    const r = this.res, w = 2 * Math.PI * f / this.sr, a = Math.exp(-1 / (tau * this.sr));
    const y = ex + 2 * a * Math.cos(w) * r[i] - a * a * r[i + 1];
    r[i + 1] = r[i]; r[i] = y;
    return y * Math.sin(w);
  }

  report() {
    return {
      thw: this.thw, ww: this.ww, phi: this.phi, phase: this.phase, f: this.f, D: this.D, gait: this.gait,
      v: this.vEst, vCmd: this.vCmd, state: this.state, act: this.act, slip: this.slip, F: this.F,
      Emet: this.Emet, hr: this.hr, br: this.br, dist: this.dist, kJ: this.kJ, reserve: this.reserve,
      day: this.dayFactor, inWheel: this.inWheel, restT: this.restT, bouts: this.bouts, rw: this.rw, rc: this.rc, R: this.R, mass: this.m, stance: this.stance.slice(),
      belt: this.belt ? this.belt.x * this.kb : 0, vmaxAer: this.vmaxAer,
    };
  }
}

// Belt pulleys sized so the crank turns at its design rate when he runs at his usual
// pace (~0.44 m/s): r_wheel / r_crank = ω_crank / ω_wheel.
// `gear` scales the hub pulley: ×2 makes the tune run twice as fast for the same pace.
export function pulleyRadii(Gcrank, omegaNom, R, gear = 1) {
  const rc = 0.012, wCrank = Gcrank * omegaNom, wWheel = 0.44 / R;
  return [Math.min(0.09, Math.max(0.005, gear * rc * wCrank / wWheel)), rc];
}

function smooth(x, a, b) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
