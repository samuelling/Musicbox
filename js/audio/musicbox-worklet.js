// Music box physical model — real-time integrator (AudioWorklet).
//
// Signal/force flow, all at audio rate:
//   hand crank or mainspring+governor  ->  cylinder angle & speed
//   pins on cylinder  --implicit penalty contact-->  tine modal oscillators
//   tine root shear & moment  ->  rigid bedplate (z, rot x, rot y)
//   bedplate  --4 screw springs-->  soundboard plate modes  <-> cavity (Helmholtz)
//   box frame  --feet-->  table plate modes
//   volume accelerations + dipole moments  ->  image-source room + spherical head -> ears
// Contact reaction torque is fed back into the cylinder, so heavy chords
// really do drag the mechanism.  See PHYSICS.md for the derivations.

import { Hamster } from '../physics/hamster.js';

const TWO_PI = Math.PI * 2;
const DL = 16384, DM = DL - 1;           // delay line length (power of two)
const RHO = 1.204, C = 343.2;
const HEAD_A = 0.0875;

function wrapPi(x) {
  x = x % TWO_PI;
  if (x > Math.PI) x -= TWO_PI; else if (x <= -Math.PI) x += TWO_PI;
  return x;
}

class MusicBoxProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.p = null;
    this.sr = sampleRate;
    this.dt = 1 / sampleRate;
    this.drv = {
      mode: 'spring', theta: 0, thetaMod: 0, omega: 0, turns: 0, brake: true,
      hand: 0, handFrom: 0, handTo: 0, handRamp: 0, handRampLen: 800, handActive: false, handPrev: 0,
      offset: 0, back: 0, windTo: 0, windCur: 0, windAcc: 0, crankTickAcc: 0,
      fanPhase: 0, wormPhase: 0, tauContact: 0, airBrake: 1,
    };
    this.listener = { x: 2.5, y: 2.5, z: 1.2, yaw: 0 };
    this.listenerDirty = true;
    this.noiseLevel = 1; this.userGain = 1;
    this.postEvery = 1024; this.postCount = 0;
    this.rng = 0x9e3779b9;
    this.pulses = new Float64Array(16); // [remaining, amp, len, kind] x 4
    this.pingState = [0, 0];
    this.fanBp = [0, 0, 0, 0];
    this.meter = [0, 0];
    this.limEnv = 0; this.limRel = Math.exp(-1 / (0.08 * sampleRate));
    this.ham = new Hamster(sampleRate); this.hamHour = null;
    // how you are listening: in-ear (full structural HRTF), over-ear (your own pinna helps a
    // little), or loudspeakers (plain stereo panning); head radius and pinna scale
    this.bin = { mode: 'inear', headA: HEAD_A, pinna: 1 };
    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  rand() { // xorshift32 -> [-1,1)
    let s = this.rng; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.rng = s >>> 0;
    return (this.rng / 2147483648) - 1;
  }

  onMessage(m) {
    const d = this.drv;
    switch (m.type) {
      case 'patch': this.load(m.patch); break;
      case 'pins': if (this.p) { this.p.tines.pins = m.pins; this.initPointers(); } break;
      case 'listener': Object.assign(this.listener, m.listener); this.listenerDirty = true; break;
      case 'mode':
        // hooking the belt up: seat it with no stretch where the wheel and crank are now
        if (m.mode === 'auto' && d.mode !== 'auto' && this.p && this.ham.belt) { const H = this.ham; H.belt.off = (H.rw * H.thw) / H.rc - this.p.drive.G_crank * d.theta; H.belt.x = 0; }
        d.mode = m.mode; break;
      case 'hand':
        d.handFrom = d.hand; d.handTo = m.angle; d.handRamp = 0; d.handActive = m.active;
        if (m.reset) { d.hand = d.handFrom = d.handTo = d.handPrev = m.angle; d.offset = 0; }
        break;
      case 'wind': d.windTo += m.delta; break;
      case 'brake': d.brake = m.on; break;
      case 'airBrake': d.airBrake = m.value; break;
      case 'noise': this.noiseLevel = m.value; break;
      case 'gain': this.userGain = m.value; break;
      case 'setTurns': d.turns = m.turns; break;
      case 'binaural': Object.assign(this.bin, m.bin); this.listenerDirty = true; break;
      case 'hamster':
        if (m.opts) { this.ham.set(m.opts); if (this.p) this.setupBelt(); }
        if (m.hour !== undefined) this.hamHour = m.hour;
        if (m.inWheel !== undefined) this.ham.setInWheel(m.inWheel);
        if (m.silent !== undefined) this.ham.silent = m.silent;
        if (m.vol !== undefined) this.hamVol = m.vol;
        if (m.stopWheel) this.ham.ww = 0;            // the blanket goes over: the empty wheel is stilled
        if (m.wake) this.ham.wake();
        break;
      case 'seek': d.theta = m.theta; d.thetaMod = ((m.theta % TWO_PI) + TWO_PI) % TWO_PI; this.initPointers(); break;
    }
  }

  // ------------------------------------------------------------------ setup
  load(p) {
    const keepTheta = this.p ? this.drv.thetaMod : 0;
    // A new tune brings a new cylinder speed and new gear ratios. Carry the drive over in
    // proportion (same tempo fraction), and re-seat the hand, crank and belt couplings at zero
    // stretch, so nothing has to race to catch up (that race was the "speed-run" on tune changes).
    const old = this.p ? this.p.drive : null, d = this.drv;
    if (old) {
      d.omega *= p.drive.omegaNom / old.omegaNom;
      d.offset = d.theta - d.hand / p.drive.G_crank;
      if (this.ham.belt) { this.ham.belt.off = (this.ham.rw * this.ham.thw) / this.ham.rc - p.drive.G_crank * d.theta; this.ham.belt.x = 0; }
      d.turns = Math.min(d.turns, p.drive.turnsMax);
    }
    this.p = p;
    const t = p.tines;
    const total = t.A11.length;
    this.q = new Float64Array(total); this.v = new Float64Array(total);
    this.qf = new Float64Array(16); this.vf = new Float64Array(16); this.phs = new Float64Array(16);
    this.ptr = new Int32Array(t.N);
    this.dPrev = new Float64Array(t.N);
    this.asleep = new Uint8Array(t.N).fill(1);
    this.amp = new Float32Array(t.N); this.defl = new Float32Array(t.N);
    this.structAwake = false; this.renderLeft = 0; this.activeTines = 0; this.sleepCheck = 0;
    this.contactFlag = new Uint8Array(t.N);
    this.drv.thetaMod = keepTheta;
    this.initPointers();
    // bedplate rigid body
    this.bed = { z: 0, vz: 0, ax: 0, vax: 0, ay: 0, vay: 0 };
    const pl = p.plate;
    this.pq = new Float64Array(pl.n); this.pv = new Float64Array(pl.n);
    this.cav = { pc: 0, Q: 0 };
    this.frame = { z: 0, vz: 0, acc: 0 };
    if (p.table) { this.tq = new Float64Array(p.table.n); this.tv = new Float64Array(p.table.n); }
    // radiation delay lines: 0 Mdot, 1-3 Ddot xyz, 4-6 Dddot xyz, 7 bottom Mdot
    this.lines = Array.from({ length: 8 }, () => new Float32Array(DL));
    this.w = 0;
    this.prevDdot = [0, 0, 0];
    this.lidLP = [0, 0, 0];
    const lidFc = p.lid.fc;
    this.lidA = lidFc ? Math.exp((-TWO_PI * lidFc) / this.sr) : 0;
    this.buildCoupling();
    this.setupBelt();
    this.setupRoom();
    this.listenerDirty = true;
  }

  // belt between the hamster wheel's hub pulley and a pulley on the crank shaft
  setupBelt() {
    const P = this.p.drive, H = this.ham;
    const B0 = H.belt;
    H.setDrive(P.G_crank, P.omegaNom);
    // keep the belt where it was, re-seated with no stretch for the new pulleys
    H.belt.off = (H.rw * H.thw) / H.rc - P.G_crank * this.drv.theta;
    const mEff = P.Icrank / (P.G_crank * P.G_crank * H.rc * H.rc);   // crank train seen at the belt
    this.beltC = 2 * 0.12 * Math.sqrt(H.kb * mEff);                 // rubber: ζ ≈ 0.12
  }

  initPointers() {
    if (!this.p) return;
    // Point each tine at its next pin that has not reached the tine yet. Pins
    // already inside the contact window (e.g. just added under a tine, or
    // present at load) are skipped rather than snapped in.
    const t = this.p.tines, th = this.drv.thetaMod, start = this.p.geom.winStart - this.p.geom.damperWin;
    for (let i = 0; i < t.N; i++) {
      const pl = t.pins[i];
      let best = 0, bestD = 1e9;
      for (let j = 0; j < pl.length; j++) {
        let d = (pl[j] - (th - start)) % TWO_PI; if (d < 0) d += TWO_PI; // distance ahead of the window start
        if (d < bestD) { bestD = d; best = j; }
      }
      this.ptr[i] = best;
    }
  }

  setupRoom() {
    const r = this.p.room;
    const [X, Y, Z] = r.dims;
    this.roomR = r;
    const betaL = (a) => Math.sqrt(Math.max(0, 1 - a[0]));
    const betaH = (a) => Math.sqrt(Math.max(0, 1 - a[1]));
    // image list for the top source: [mirror axis (0 none,1 x,2 y,3 z), plane coordinate, bL, bH]
    const imgs = [[0, 0, 1, 1]];
    if (r.tableTop !== null && !r.held) imgs.push([3, r.tableTop, 0.92, 0.85]);
    if (r.alpha[0] < 1 || r.floor[0] < 1) {
      const occl = r.tableTop !== null && !r.held ? 0.35 : 1;
      imgs.push([3, 0, betaL(r.floor) * occl, betaH(r.floor) * occl]);
    }
    if (r.walls) {
      imgs.push([3, Z, betaL(r.alpha), betaH(r.alpha)]);
      imgs.push([1, 0, betaL(r.alpha), betaH(r.alpha)]);
      imgs.push([1, X, betaL(r.alpha), betaH(r.alpha)]);
      imgs.push([2, 0, betaL(r.alpha), betaH(r.alpha)]);
      imgs.push([2, Y, betaL(r.alpha), betaH(r.alpha)]);
    }
    this.imgs = imgs;
    const hasBottom = this.p.table && this.p.table.unbaffled;
    this.bottomImgs = hasBottom ? [[0, 0, 1, 1], [3, 0, betaL(r.floor), betaH(r.floor)]] : [];
    const P = (imgs.length + this.bottomImgs.length) * 2;
    this.P = P;
    this.pDelay = new Float64Array(P); this.pDelayT = new Float64Array(P);
    this.pG = new Float64Array(P * 7); this.pGT = new Float64Array(P * 7);
    this.pAir = new Float64Array(P); this.pAirZ = new Float64Array(P);
    this.pB0 = new Float64Array(P).fill(1); this.pB1 = new Float64Array(P); this.pA1 = new Float64Array(P);
    this.pX1 = new Float64Array(P); this.pY1 = new Float64Array(P);
    // structural HRTF per path and ear: 5 pinna echoes + a shoulder echo, read from a short ring
    this.pRing = new Float64Array(P * 128); this.pRi = 0;
    this.pTapD = new Float64Array(P * 6); this.pTapG = new Float64Array(P * 6);
    this.pSh = new Float64Array(P); this.pRear = new Float64Array(P); this.pRearZ = new Float64Array(P);
    this.pFirst = true;
    this.renderTail = Math.round(((2 * Math.hypot(X, Y, Z)) / C) * this.sr) + 2048;
    // reverb
    this.rev = null;
    if (r.reverb) {
      const S = 2 * (X * Y + X * Z + Y * Z), V = X * Y * Z;
      const aw = (k) => (r.alpha[k] * (S - X * Y) + r.floor[k] * X * Y) / S;
      const rt = (a) => (0.161 * V) / (-S * Math.log(1 - Math.min(a, 0.95)) + 4 * 0.004 * V);
      const rtL = rt(aw(0)), rtH = rt(aw(1)) * 0.85;
      const am = 0.5 * (aw(0) + aw(1));
      const Rroom = (S * am) / (1 - am);
      const mfp = (4 * V) / S;
      const base = (mfp / C) * this.sr;
      const mult = [0.71, 0.79, 0.87, 0.97, 1.07, 1.19, 1.31, 1.46];
      const len = mult.map((m) => Math.max(211, Math.round(base * m)) | 1);
      const lines = len.map((L) => new Float32Array(L));
      const gL = len.map((L) => Math.pow(10, (-3 * L) / (this.sr * rtL)));
      const gH = len.map((L) => Math.pow(10, (-3 * L) / (this.sr * rtH)));
      const a1 = gL.map((g, i) => (g - gH[i]) / (g + gH[i]));
      const b0 = gL.map((g, i) => g * (1 - a1[i]));
      this.rev = { len, lines, idx: new Int32Array(8), a1, b0, z: new Float64Array(8), out: new Float64Array(8), gain: 1, pre: Math.round(base * 0.6), rtL, rtH, Rroom };
      // calibrate: reverberant energy = 16 pi / R relative to direct energy at 1 m
      let E = 0;
      const nCal = Math.min(Math.round(this.sr * rtL * 1.2), this.sr * 8);
      for (let n = 0; n < nCal; n++) { const [l] = this.revTick(n === 0 ? 1 : 0); E += l * l; }
      this.rev.gain = Math.sqrt((16 * Math.PI) / Rroom / Math.max(E, 1e-12));
      lines.forEach((b) => b.fill(0)); this.rev.z.fill(0);
      this.renderTail += Math.round(rtL * 1.3 * this.sr);
    }
  }

  revTick(x) {
    const r = this.rev;
    const o = r.out;
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      const L = r.len[i];
      let k = r.idx[i];
      const y = r.lines[i][k];
      const f = r.b0[i] * y + r.a1[i] * r.z[i];
      r.z[i] = f;
      o[i] = f; sum += f;
    }
    sum *= 0.25; // Householder: y - 2/N sum
    let L = 0, R = 0;
    for (let i = 0; i < 8; i++) {
      const fb = o[i] - sum;
      const inj = (i & 1 ? -x : x) * 0.35;
      const k = r.idx[i];
      r.lines[i][k] = fb + inj;
      r.idx[i] = k + 1 >= r.len[i] ? 0 : k + 1;
      L += (i & 2 ? -o[i] : o[i]); R += (i & 4 ? -o[i] : o[i]) * (i & 1 ? -1 : 1);
    }
    return [L * 0.35, R * 0.35];
  }

  // Recompute image-source paths for the current listener (once per block).
  updatePaths() {
    const p = this.p, r = this.roomR, L = this.listener;
    const [X, Y, Z] = r.dims;
    const fx = Math.cos(L.yaw), fy = Math.sin(L.yaw);
    const rx = Math.sin(L.yaw), ry = -Math.cos(L.yaw);   // right ear axis
    let S;
    let boxYaw = r.boxYaw;
    if (r.held) {
      S = [L.x + fx * 0.30 + rx * 0.06, L.y + fy * 0.30 + ry * 0.06, L.z - 0.36];
      boxYaw = L.yaw + Math.PI / 2;
    } else S = r.boxPos;
    this.srcPos = S;
    const cb = Math.cos(boxYaw), sb = Math.sin(boxYaw);
    const H = [L.x, L.y, L.z];
    const cosW = Math.cos((TWO_PI * 8000) / this.sr);
    const bin = this.bin, A_HEAD = bin.headA, spk = bin.mode === 'speakers';
    const pinnaK = spk ? 0 : bin.mode === 'overear' ? 0.6 : 1;
    const tau = 1 / (2 * (C / A_HEAD)), K2 = 2 * this.sr, sScale = (this.sr / 44100) * bin.pinna;
    const RHO_P = [0.5, -1, 0.5, -0.25, 0.25], AP = [1, 5, 5, 5, 5], BP = [2, 4, 7, 11, 13], DP = [1, 0.6, 0.6, 0.6, 0.6];
    let pi = 0;
    const doSet = (src, imgs, bottom) => {
      for (const [axis, plane, bL, bH] of imgs) {
        const I = [src[0], src[1], src[2]], m = [1, 1, 1];
        if (axis) { I[axis - 1] = 2 * plane - I[axis - 1]; m[axis - 1] = -1; }
        let vx = H[0] - I[0], vy = H[1] - I[1], vz = H[2] - I[2];
        let rr = Math.hypot(vx, vy, vz);
        rr = Math.max(rr, 0.06);
        vx /= rr; vy /= rr; vz /= rr;
        // mirrored direction into the (unmirrored) box frame
        const mx = vx * m[0], my = vy * m[1], mz = vz * m[2];
        const bx = cb * mx + sb * my, by = -sb * mx + cb * my, bz = mz;
        // direction of arrival in head coordinates
        const uf = -(vx * fx + vy * fy), ur = -(vx * rx + vy * ry), uu = -vz;
        const polar = Math.atan2(uu, uf) * 180 / Math.PI;                  // 0 front, 90 up, ±180 behind
        const front = Math.abs(polar) <= 90;
        const elev = front ? polar : (polar > 0 ? 180 - polar : -180 - polar); // pinna cues are front/back folded
        const rear = Math.min(1, Math.max(0, (Math.abs(polar) - 75) / 60));
        for (let ear = 0; ear < 2; ear++) {
          const ex = ear ? rx : -rx, ey = ear ? ry : -ry;
          const cosT = -(ex * vx + ey * vy);      // ear axis vs direction to source
          const th = Math.acos(Math.max(-1, Math.min(1, cosT)));
          const extra = spk ? 0 : th < Math.PI / 2 ? -A_HEAD * cosT : A_HEAD * (th - Math.PI / 2);
          this.pDelayT[pi] = Math.min(DL - 8, ((rr + extra) / C) * this.sr);
          // near field: each ear's own distance sets its level (the held box is 30 cm away)
          let g = bL * (spk ? Math.SQRT2 * Math.sqrt(0.5 * (1 + (ear ? ur : -ur))) : rr / Math.max(0.05, rr + extra));
          // Brown & Duda structural pinna: echoes whose delays depend on elevation and lateral angle
          const lat = Math.abs(Math.asin(Math.max(-1, Math.min(1, ear ? ur : -ur)))) * 180 / Math.PI;
          const d2r = Math.PI / 180;
          for (let q = 0; q < 5; q++) {
            this.pTapD[pi * 6 + q] = Math.max(0.5, (AP[q] * Math.cos(lat * d2r / 2) * Math.sin(DP[q] * (90 - elev) * d2r) + BP[q]) * sScale);
            this.pTapG[pi * 6 + q] = RHO_P[q] * pinnaK * (ear ? 1 : 1) * (0.55 + 0.45 * Math.cos(lat * d2r * 0.5));
          }
          // shoulder/torso reflection for sound from above, ~0.3–1.2 ms later
          const tsh = 1.2e-3 * ((180 - lat) / 180) * Math.max(0.15, 1 - 0.00004 * Math.pow((elev - 80) * 180 / (180 + lat), 2));
          this.pTapD[pi * 6 + 5] = Math.min(120, tsh * this.sr);
          this.pTapG[pi * 6 + 5] = spk ? 0 : 0.3 * Math.max(0, Math.min(1, (elev + 30) / 60)) * pinnaK;
          this.pRear[pi] = spk ? 0 : rear * 0.55;
          // reflections arrive diffuse-ish and later: three pinna echoes are enough for them (saves CPU)
          if (pi >= 2) { this.pTapG[pi * 6 + 3] = 0; this.pTapG[pi * 6 + 4] = 0; this.pTapG[pi * 6 + 5] = 0; }
          const o = pi * 7;
          this.pGT[o] = (RHO / (4 * Math.PI * rr)) * g;
          if (!bottom) {
            const g1 = (RHO / (4 * Math.PI * C * rr)) * g, g2 = (RHO / (4 * Math.PI * rr * rr)) * g;
            this.pGT[o + 1] = g2 * bx; this.pGT[o + 2] = g2 * by; this.pGT[o + 3] = g2 * bz;
            this.pGT[o + 4] = g1 * bx; this.pGT[o + 5] = g1 * by; this.pGT[o + 6] = g1 * bz;
          } else for (let j = 1; j < 7; j++) this.pGT[o + j] = 0;
          // air absorption (~0.1 dB/m at 8 kHz) + boundary HF loss, as one one-pole
          let G = Math.pow(10, (-0.1 * rr) / 20) * Math.min(1, bH / Math.max(bL, 1e-6));
          if (bottom) G *= 0.18;
          let a = 0;
          if (G < 0.9999) {
            const A = G * G - 1, B = 2 - 2 * G * G * cosW;
            const disc = Math.sqrt(Math.max(0, B * B - 4 * A * A));
            a = (-B + disc) / (2 * A); if (a < 0 || a >= 1) a = (-B - disc) / (2 * A);
            a = Math.min(0.999, Math.max(0, a));
          }
          this.pAir[pi] = a;
          // Brown–Duda spherical-head shadow (none on loudspeakers: your real head does that)
          const al = spk ? 1 : 1.05 + 0.95 * Math.cos((th / (150 * Math.PI / 180)) * Math.PI);
          const at = al * tau * K2, t1 = tau * K2;
          this.pB0[pi] = (1 + at) / (1 + t1); this.pB1[pi] = (1 - at) / (1 + t1); this.pA1[pi] = (1 - t1) / (1 + t1);
          pi++;
        }
      }
    };
    doSet(S, this.imgs, false);
    if (this.bottomImgs.length) {
      const B = [S[0], S[1], (r.tableTop || 0.75) - p.table.deff];
      doSet(B, this.bottomImgs, true);
    }
    if (this.pFirst) { this.pDelay.set(this.pDelayT); this.pG.set(this.pGT); this.pFirst = false; }
    this.listenerDirty = false;
  }

  // ------------------------------------------------------------- mechanics
  pulse(amp, len) {
    const P = this.pulses;
    for (let k = 0; k < 4; k++) if (P[k * 4] <= 0) { P[k * 4] = len; P[k * 4 + 1] = amp; P[k * 4 + 2] = len; return; }
  }
  pulseForce() {
    const P = this.pulses; let f = 0;
    for (let k = 0; k < 4; k++) {
      const rem = P[k * 4];
      if (rem > 0) { const len = P[k * 4 + 2]; f += P[k * 4 + 1] * Math.sin((Math.PI * (len - rem + 0.5)) / len); P[k * 4] = rem - 1; }
    }
    return f;
  }

  stepDrive() {
    const d = this.drv, P = this.p.drive, dt = this.dt;
    if (d.mode !== 'auto') this.ham.step(0);   // his wheel turns on its own when it is not belted to the box
    let tau, I;
    const sgn = d.omega > 1e-9 ? 1 : 0;
    const noise = this.noiseLevel;
    if (d.mode === 'crank') {
      // hand position ramps toward the latest finger sample
      if (d.handRamp < d.handRampLen) { d.handRamp++; d.hand = d.handFrom + (d.handTo - d.handFrom) * (d.handRamp / d.handRampLen); }
      const handOmega = (d.hand - d.handPrev) * this.sr;
      const dh = d.hand - d.handPrev;
      d.handPrev = d.hand;
      const G = P.G_crank;
      let e = d.hand / G + d.offset - d.theta;
      const lag = 0.4 / G;
      if (e < -lag) { d.offset += -lag - e; e = -lag; }
      // pawl clicks while the hand turns the crank backwards (freewheel)
      if (dh < 0 && d.handActive) {
        d.back += -dh;
        const step = TWO_PI / P.crankTeeth;
        if (d.back > step) { d.back -= step; this.pulse(0.22 * noise * (0.7 + 0.3 * this.rand()), 5); }
      }
      tau = d.handActive ? P.kHand * e + P.cHand * (handOmega / G - d.omega) : 0;
      if (!d.handActive) d.offset = d.theta - d.hand / G; // re-grip wherever the crank is
      I = P.Icrank;
      tau += -P.tauBearing * sgn - P.viscous * d.omega + d.tauContact;
      // gear-tooth ticks from the crank train
      d.crankTickAcc += d.omega * dt * G;
      const step = TWO_PI / P.crankTeeth;
      if (d.crankTickAcc > step) { d.crankTickAcc -= step; this.pulse(0.012 * noise * (1 + 0.4 * this.rand()), 4); }
    } else if (d.mode === 'auto') {
      // hamster wheel -> O-ring belt -> crank pulley -> freewheel -> crank train -> cylinder
      const H = this.ham, B = H.belt, G = P.G_crank;
      let x = H.rw * H.thw - H.rc * (G * d.theta + B.off);
      if (x < 0) {
        // the belt would turn the crank backwards: the freewheel lets the pulley overrun (pawl clicks)
        B.off += x / H.rc; B.back += -x / H.rc; x = 0;
        const step = TWO_PI / P.crankTeeth;
        if (B.back > step) { B.back -= step; this.pulse(0.16 * noise * (0.7 + 0.3 * this.rand()), 5); }
      }
      let F = H.kb * x + this.beltC * (H.rw * H.ww - H.rc * G * d.omega);
      if (F > H.Fslip) { const xs = H.Fslip / H.kb; B.off += (x - xs) / H.rc; x = xs; F = H.Fslip; }   // belt slips on the pulley
      if (F < 0) F = 0;                                    // a belt can only pull
      B.x = x;
      H.step(F);
      I = P.Icrank;
      tau = F * H.rc * G * 0.92 - P.tauBearing * sgn - P.viscous * d.omega + d.tauContact;
      d.crankTickAcc += d.omega * dt * G;
      const step = TWO_PI / P.crankTeeth;
      if (d.crankTickAcc > step) { d.crankTickAcc -= step; this.pulse(0.012 * noise * (1 + 0.4 * this.rand()), 4); }
    } else {
      // winding the key (ratchet clicks at each click-wheel tooth)
      if (d.windTo > d.windCur) {
        const inc = Math.min(d.windTo - d.windCur, 0.004);
        d.windCur += inc;
        const room = P.turnsMax - d.turns;
        const dturn = Math.min(inc / TWO_PI, Math.max(0, room));
        d.turns += dturn;
        if (dturn > 0) {
          d.windAcc += dturn * TWO_PI;
          const step = TWO_PI / P.clickTeeth;
          if (d.windAcc > step) { d.windAcc -= step; this.pulse(0.9 * noise * (0.8 + 0.2 * this.rand()), 6); this.pingState[0] += 0.06 * noise; }
        }
      } else d.windCur = d.windTo;
      const frac = d.turns / P.turnsMax;
      const tauS = d.turns > 0 ? ((P.tauEmpty + (P.tauFull - P.tauEmpty) * frac) / P.G_spring) * P.etaTrain * Math.min(1, d.turns / 0.04) : 0;
      I = P.Ispring;
      if (d.brake) {
        tau = 0; d.omega = 0;
      } else {
        tau = tauS - P.cGov * d.airBrake * d.omega * Math.abs(d.omega) - P.tauBearing * sgn - P.viscous * d.omega + d.tauContact;
        if (d.omega <= 1e-9 && tau < 0) tau = 0;  // static friction holds a stalled train
      }
      // governor fan and worm
      const wf = P.G_fan * d.omega;
      d.fanPhase += wf * dt; if (d.fanPhase > TWO_PI) d.fanPhase -= TWO_PI;
      d.wormPhase += wf * dt;
      if (d.wormPhase > TWO_PI) { d.wormPhase -= TWO_PI; this.pulse(0.006 * noise * (1 + 0.5 * this.rand()), 4); }
    }
    d.omega += (tau / I) * dt;
    if (d.omega < 0) d.omega = 0;           // ratchet / click wheel
    const dth = d.omega * dt;
    d.theta += dth;
    d.thetaMod += dth; if (d.thetaMod >= TWO_PI) d.thetaMod -= TWO_PI;
    if (d.mode === 'spring') { d.turns -= dth / (TWO_PI * P.G_spring); if (d.turns < 0) d.turns = 0; }
  }

  // Contact of one pin (at offset dphi from release) with tine i, using the
  // predicted (free) tine shape.  Returns penetration etc. in this.cres.
  contact(i, dphi, w0, w1, lc, b, m) {
    const g = this.p.geom;
    const ph = g.phiRel + dphi;
    const cd = Math.cos(ph), sd = Math.sin(ph);
    const Ty = g.Ty, Tz = g.Tz, uy = g.uy, uz = g.uz, ny = g.ny, nz = g.nz;
    const re = g.re, hy = g.hd - re;
    const P0y = Ty + w0 * ny, P0z = Tz + w0 * nz;
    const P1y = Ty + lc * uy + w1 * ny, P1z = Tz + lc * uz + w1 * nz;
    let best = 0, bny = 0, bnz = 0, bs = 0, bry = 0, brz = 0;
    // A: tine tip corner P0 against the pin's rounded-box profile
    {
      const xi = P0y * cd + P0z * sd, et = -P0y * sd + P0z * cd;   // pin-local (radial, lateral)
      const xc = 0.5 * (g.R + g.rho - re), hx = 0.5 * (g.rho - re - g.R);
      const dx = xi - xc;
      const qx = Math.abs(dx) - hx, qy = Math.abs(et) - hy;
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      const outside = Math.hypot(ox, oy);
      const sdf = outside + Math.min(Math.max(qx, qy), 0) - re;
      if (sdf < 0 && sdf > -g.maxPen) {   // deeper means we are on the wrong side of the pin
        let lx, ly;
        if (outside > 0) { lx = (ox * Math.sign(dx)) / outside; ly = (oy * Math.sign(et)) / outside; }
        else if (qx > qy) { lx = Math.sign(dx); ly = 0; } else { lx = 0; ly = Math.sign(et); }
        const wy = lx * cd - ly * sd, wz = lx * sd + ly * cd;
        if (wy * ny + wz * nz > 0.05) { best = -sdf; bny = wy; bnz = wz; bs = 0; bry = P0y; brz = P0z; }
      }
    }
    // B: the pin's two outer edge-circles against the tine underside chord
    for (let side = -1; side <= 1; side += 2) {
      const cr = g.rho - re, cl = side * hy;
      const Cy = cr * cd - cl * sd, Cz = cr * sd + cl * cd;
      const ey = P1y - P0y, ez = P1z - P0z;
      const len2 = ey * ey + ez * ez;
      const s = ((Cy - P0y) * ey + (Cz - P0z) * ez) / len2;
      if (s <= 0 || s >= 1) continue;
      const il = 1 / Math.sqrt(len2);
      const nty = -ez * il, ntz = ey * il;               // rot90 of chord = tine normal
      // exact deflection at the contact point (consistent with the force projection)
      const t = this.p.tines, K = t.K, sl = s * lc;
      const js = s * (K - 1); let j0 = Math.floor(js); if (j0 >= K - 1) j0 = K - 2;
      const fr = js - j0;
      let ws = 0;
      for (let k = 0; k < m; k++) { const idx = (b + k) * K; ws += (t.PHI[idx + j0] * (1 - fr) + t.PHI[idx + j0 + 1] * fr) * this.qf[k]; }
      const Py = Ty + sl * uy + ws * ny, Pz = Tz + sl * uz + ws * nz;
      const h = (Cy - Py) * nty + (Cz - Pz) * ntz;
      const pen = re + h;
      if (pen > 0 && pen < g.maxPen && pen > best) {
        best = pen; bny = nty; bnz = ntz; bs = sl;
        bry = Py; brz = Pz;
      }
    }
    const R = this.cres;
    R.pen = best; R.ny = bny; R.nz = bnz; R.s = bs; R.ry = bry; R.rz = brz; R.cd = cd; R.sd = sd;
    return best > 0;
  }

  stepTines() {
    const p = this.p, t = p.tines, g = p.geom, d = this.drv;
    const K = t.K, sr = this.sr, dt = this.dt;
    const th = d.thetaMod, omega = d.omega;
    const q = this.q, v = this.v, qf = this.qf, vf = this.vf, phs = this.phs;
    let S = 0, Mx = 0, My = 0, Pd = 0, tauC = 0;
    const nzG = g.nz;
    const winS = g.winStart, winE = g.winEnd, dWin = g.damperWin;
    for (let i = 0; i < t.N; i++) {
      const b = t.base[i], m = t.nm[i];
      const pl = t.pins[i];
      let dA = 99, dB = 99;
      if (pl.length) {
        let ptr = this.ptr[i], dd = wrapPi(th - pl[ptr]), guard = pl.length;
        while (dd > winE && guard-- > 0) { ptr = ptr + 1 >= pl.length ? 0 : ptr + 1; dd = wrapPi(th - pl[ptr]); }
        this.ptr[i] = ptr;
        dA = dd;
        if (pl.length > 1) dB = wrapPi(th - pl[ptr + 1 >= pl.length ? 0 : ptr + 1]);
      }
      const inWin = (dA >= winS && dA <= winE) || (dB >= winS && dB <= winE);
      const inDamp = t.damper[i] && ((dA >= winS - dWin && dA < winS) || (dB >= winS - dWin && dB < winS));
      if (!inWin && !inDamp && this.asleep[i]) { this.contactFlag[i] = 0; continue; }
      this.asleep[i] = 0;
      let touched = 0;
      if (!inWin) {
        for (let k = 0; k < m; k++) {
          const idx = b + k, qq = q[idx], vv = v[idx];
          qf[k] = t.A11[idx] * qq + t.A12[idx] * vv;
          vf[k] = t.A21[idx] * qq + t.A22[idx] * vv;
        }
      } else {
        // contact: integrate this tine in SUB substeps with the pin moving between them
        const SUB = t.SUB, lc = t.lc[i], hdt = dt / SUB;
        for (let k = 0; k < m; k++) { qf[k] = q[b + k]; vf[k] = v[b + k]; }
        for (let sub = 1; sub <= SUB; sub++) {
          const back = omega * dt * (SUB - sub) / SUB; // pin angle lag of this substep
          let w0 = 0, w1 = 0;
          for (let k = 0; k < m; k++) {
            const idx = b + k, qq = qf[k], vv = vf[k];
            qf[k] = t.sA11[idx] * qq + t.sA12[idx] * vv;
            vf[k] = t.sA21[idx] * qq + t.sA22[idx] * vv;
            w0 += t.PHI[idx * K] * qf[k]; w1 += t.PHI[idx * K + K - 1] * qf[k];
          }
          for (let pass = 0; pass < 2; pass++) {
            const dphi = (pass === 0 ? dA : dB) - back;
            if (!(dphi >= winS && dphi <= winE)) continue;
            if (!this.contact(i, dphi, w0, w1, lc, b, m)) continue;
            const R = this.cres;
            const js = (R.s / lc) * (K - 1);
            let j0 = Math.floor(js); if (j0 >= K - 1) j0 = K - 2; if (j0 < 0) j0 = 0;
            const fr = js - j0;
            const pn = R.ny * g.ny + R.nz * g.nz;
            let G = 0, Gv = 0, vt = 0;
            for (let k = 0; k < m; k++) {
              const idx = (b + k) * K;
              const ph = t.PHI[idx + j0] * (1 - fr) + t.PHI[idx + j0 + 1] * fr;
              phs[k] = ph; G += ph * ph * t.sB1[b + k]; Gv += ph * ph * t.sB2[b + k]; vt += ph * vf[k];
            }
            G *= pn * pn; Gv *= pn * pn;
            // Rigid, perfectly inelastic contact at velocity level (the pin/Hertz contact is
            // ~10^3 x stiffer than any tine). Choose the normal force so that after this
            // substep the penetration rate is -beta*pen/dt: the pin carries the tine along
            // its own motion without bouncing and without injecting energy.
            // Compliance of the pin itself (axial / bending, by direction) and Hertz contact
            // is kept in series, so jammed geometries give a bounded force (XPBD-style).
            const ra = R.ny * R.cd + R.nz * R.sd, rl = -R.ny * R.sd + R.nz * R.cd;
            const kEff = 1 / (1 / g.kHertz + (ra * ra) / g.kAxial + (rl * rl) / g.kBend);
            const penRate = omega * (-R.rz * R.ny + R.ry * R.nz) - vt * pn;
            let F = (penRate + (g.beta * R.pen) / hdt) / (Gv + 1 / (kEff * hdt));
            if (F < 0) F = 0;
            this.dPrev[i] = R.pen - G * F;
            // Coulomb friction (smoothed) from the pin sliding against the tine
            const vpy = -omega * R.rz, vpz = omega * R.ry;
            const ty = -R.nz, tz = R.ny;
            const slip = vpy * ty + vpz * tz;
            const fric = g.mu * F * Math.tanh(slip / 2e-4);
            const Fy = F * R.ny + fric * ty, Fz = F * R.nz + fric * tz;
            // Only the normal force bends the tine. Feeding the friction's bending component
            // back in creates a mode-coupling (brake-squeal) limit cycle at ~1 kHz while the
            // tine rests on the pin's end face; oiled music-box pins don't squeal, so friction
            // only loads the cylinder (torque below).
            const Fn = F * pn;
            for (let k = 0; k < m; k++) { qf[k] += t.sB1[b + k] * phs[k] * Fn; vf[k] += t.sB2[b + k] * phs[k] * Fn; }
            tauC -= (R.ry * Fz - R.rz * Fy) / SUB;
            touched = 1;
            if (pass === 0) { w0 = 0; w1 = 0; for (let k = 0; k < m; k++) { const idx = (b + k) * K; w0 += t.PHI[idx] * qf[k]; w1 += t.PHI[idx + K - 1] * qf[k]; } }
          }
        }
      }
      if (!touched) this.dPrev[i] = 0;
      else { // lubricated sliding contact damps the pinned tine's own vibration
        const gc = Math.exp(-g.contactDamp * dt); for (let k = 0; k < m; k++) vf[k] *= gc;
      }
      if (inDamp) { const gd = Math.exp(-g.damperRate * dt); for (let k = 0; k < m; k++) vf[k] *= gd; }
      let Si = 0, Li = 0, wt = 0, en = 0;
      for (let k = 0; k < m; k++) {
        const idx = b + k;
        const a = (vf[k] - v[idx]) * sr;
        q[idx] = qf[k]; v[idx] = vf[k];
        Si += t.GAM[idx] * a; Li += t.LAM[idx] * a; Pd += t.PSI[idx] * a;
        const tw = t.PHI[idx * K] * qf[k];
        wt += tw; en += Math.abs(tw) + Math.abs(t.PHI[idx * K] * vf[k]) * 3e-5;
      }
      S += Si; Mx += t.lever[i] * Si + Li; My += t.xPos[i] * nzG * Si;
      const aw = Math.abs(wt);
      if (aw > this.amp[i]) this.amp[i] = aw;
      this.defl[i] = wt;
      this.contactFlag[i] = touched;
      if (!touched && !inDamp && en < 2e-10) {
        this.asleep[i] = 1;
        for (let k = 0; k < m; k++) { q[b + k] = 0; v[b + k] = 0; }
      }
    }
    d.tauContact = tauC;
    this.activeTines = 0;
    for (let i = 0; i < t.N; i++) if (!this.asleep[i]) { this.activeTines = 1; break; }
    this.out = this.out || {};
    this.out.Fz = -nzG * S; this.out.Mx = Mx; this.out.My = My; this.out.Pd = Pd;
  }

  // Precompute the implicit screw-coupling matrix (bedplate <-> soundboard).
  // f = A^-1 rhs with A = I + k(Hb + Gp) + c(Hb/dt + Gv); see PHYSICS.md §5.
  buildCoupling() {
    const p = this.p, dt = this.dt, B = p.bed, pl = p.plate, sc = B.screws;
    const A = new Float64Array(16);
    const Mc = [B.m, B.Jx, B.Jy];
    const row = (j) => [1, sc[2 * j + 1], -sc[2 * j]];
    for (let j = 0; j < 4; j++) for (let l = 0; l < 4; l++) {
      const rj = row(j), rl = row(l);
      let Hb = 0; for (let c = 0; c < 3; c++) Hb += (rj[c] * rl[c]) / Mc[c];
      Hb *= dt * dt;
      let Gp = 0, Gv = 0;
      for (let k = 0; k < pl.n; k++) { const pp = pl.psi[k * 4 + j] * pl.psi[k * 4 + l]; Gp += pp * pl.B1[k]; Gv += pp * pl.B2[k]; }
      A[j * 4 + l] = (j === l ? 1 : 0) + B.ks * (Hb + Gp) + B.cs * (Hb / dt + Gv);
    }
    // Gauss-Jordan inverse
    const n = 4, M = Array.from({ length: n }, (_, i) => [...A.slice(i * 4, i * 4 + 4), ...[0, 1, 2, 3].map((c) => (c === i ? 1 : 0))]);
    for (let c = 0; c < n; c++) {
      let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
      [M[c], M[piv]] = [M[piv], M[c]];
      const d = M[c][c]; for (let k = 0; k < 2 * n; k++) M[c][k] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let k = 0; k < 2 * n; k++) M[r][k] -= f * M[c][k]; }
    }
    this.Ainv = new Float64Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) this.Ainv[i * 4 + j] = M[i][4 + j];
    // feet / table scalar implicit coefficients
    let Gt = 0, Gtv = 0;
    if (p.table) for (let k = 0; k < p.table.n; k++) { Gt += p.table.psi[k] ** 2 * p.table.B1[k]; Gtv += p.table.psi[k] ** 2 * p.table.B2[k]; }
    const F = p.frame;
    this.feetDen = 1 + F.kf * (dt * dt / F.m + Gt) + F.cf * (dt / F.m + Gtv);
    this.pqf = new Float64Array(pl.n); this.pvf = new Float64Array(pl.n);
    if (p.table) { this.tqf = new Float64Array(p.table.n); this.tvf = new Float64Array(p.table.n); }
  }

  stepStructure(Fmech) {
    const p = this.p, dt = this.dt, sr = this.sr;
    const bed = this.bed, B = p.bed, pl = p.plate, fr = this.frame, F = p.frame;
    const sc = B.screws, o = this.out, cav = this.cav, cv = p.cavity;
    // --- bedplate free prediction (symplectic Euler) ---
    const vz = bed.vz + ((o.Fz + Fmech) / B.m) * dt, vax = bed.vax + (o.Mx / B.Jx) * dt, vay = bed.vay + (o.My / B.Jy) * dt;
    const z = bed.z + vz * dt, ax = bed.ax + vax * dt, ay = bed.ay + vay * dt;
    // --- plate free prediction with cavity pressure & moving-support load ---
    const qf = this.pqf, vf = this.pvf;
    for (let k = 0; k < pl.n; k++) {
      const go = -cav.pc * pl.W[k] - pl.rhoh * pl.W[k] * fr.acc;
      const qq = this.pq[k], vv = this.pv[k];
      qf[k] = pl.A11[k] * qq + pl.A12[k] * vv + pl.B1[k] * go;
      vf[k] = pl.A21[k] * qq + pl.A22[k] * vv + pl.B2[k] * go;
    }
    // --- implicit screw forces (force on the bedplate at each screw) ---
    const rhs = this._rhs || (this._rhs = new Float64Array(4));
    const fs = this._fs || (this._fs = new Float64Array(4));
    for (let j = 0; j < 4; j++) {
      const sx = sc[2 * j], sy = sc[2 * j + 1];
      const zb = z + ax * sy - ay * sx, vb = vz + vax * sy - vay * sx;
      let wp = fr.z, vp = fr.vz;
      for (let k = 0; k < pl.n; k++) { const ps = pl.psi[k * 4 + j]; wp += ps * qf[k]; vp += ps * vf[k]; }
      rhs[j] = -B.ks * (zb - wp) - B.cs * (vb - vp);
    }
    const Ai = this.Ainv;
    let fz = 0, fmx = 0, fmy = 0;
    for (let j = 0; j < 4; j++) {
      const f = Ai[j * 4] * rhs[0] + Ai[j * 4 + 1] * rhs[1] + Ai[j * 4 + 2] * rhs[2] + Ai[j * 4 + 3] * rhs[3];
      fs[j] = f; fz += f; fmx += f * sc[2 * j + 1]; fmy -= f * sc[2 * j];
    }
    const az = fz / B.m, aax = fmx / B.Jx, aay = fmy / B.Jy;
    bed.vz = vz + az * dt; bed.z = z + az * dt * dt;
    bed.vax = vax + aax * dt; bed.ax = ax + aax * dt * dt;
    bed.vay = vay + aay * dt; bed.ay = ay + aay * dt * dt;
    // --- apply screw forces to the plate ---
    let Wa = 0, Dxa = 0, Dya = 0, Qv = 0;
    for (let k = 0; k < pl.n; k++) {
      let gs = 0;
      for (let j = 0; j < 4; j++) gs -= fs[j] * pl.psi[k * 4 + j];
      const nq = qf[k] + pl.B1[k] * gs, nv = vf[k] + pl.B2[k] * gs;
      const a = (nv - this.pv[k]) * sr;
      this.pq[k] = nq; this.pv[k] = nv;
      Wa += pl.W[k] * a; Qv += pl.W[k] * nv; Dxa += pl.Dx[k] * a; Dya += pl.Dy[k] * a;
    }
    const QoutDot = -Wa, Qout = -Qv;   // floor panel: outward is -z
    // --- Helmholtz cavity (semi-implicit Euler) ---
    let QportDot = 0;
    if (cv.on) {
      QportDot = (cav.pc - cv.Ra * cav.Q) / cv.ma;
      cav.Q += QportDot * dt;
      cav.pc += -cv.kc * (Qout + cav.Q) * dt;
    }
    // --- frame free prediction, then implicit feet force ---
    let sumF = 0; for (let j = 0; j < 4; j++) sumF -= fs[j];
    const vff = fr.vz + ((sumF - pl.rhoh * Wa) / F.m) * dt;
    const zff = fr.z + vff * dt;
    let wt = 0, vt = 0;
    const T = p.table;
    if (T) {
      for (let k = 0; k < T.n; k++) {
        const qq = this.tq[k], vv = this.tv[k];
        const a = T.A11[k] * qq + T.A12[k] * vv, b = T.A21[k] * qq + T.A22[k] * vv;
        this.tqf[k] = a; this.tvf[k] = b; wt += T.psi[k] * a; vt += T.psi[k] * b;
      }
    }
    const Ff = (F.kf * (zff - wt) + F.cf * (vff - vt)) / this.feetDen;
    const vOld = fr.vz;
    fr.vz = vff - (Ff / F.m) * dt; fr.z = zff - (Ff / F.m) * dt * dt;
    fr.acc = (fr.vz - vOld) * sr;
    let tWa = 0;
    if (T) {
      for (let k = 0; k < T.n; k++) {
        const gk = Ff * T.psi[k];
        const nq = this.tqf[k] + T.B1[k] * gk, nv = this.tvf[k] + T.B2[k] * gk;
        tWa += T.W[k] * (nv - this.tv[k]) * sr;
        this.tq[k] = nq; this.tv[k] = nv;
      }
    }
    o.QoutDot = QoutDot; o.QportDot = QportDot; o.Dxa = Dxa; o.Dya = Dya; o.tWa = tWa; o.frameAcc = fr.acc; o.Wa = Wa;
  }

  // -------------------------------------------------------------- process
  process(inputs, outputs) {
    const out = outputs[0];
    const L = out[0], R = out[1] || out[0];
    const n = L.length;
    if (!this.p) { L.fill(0); if (R !== L) R.fill(0); return true; }
    if (!this.cres) this.cres = {};
    const p = this.p, sr = this.sr, dt = this.dt;
    this.updatePaths();
    // per-sample ramp increments for path parameters
    const P = this.P;
    const dStep = this._dStep || (this._dStep = new Float64Array(P));
    const gStep = this._gStep || (this._gStep = new Float64Array(P * 7));
    for (let k = 0; k < P; k++) {
      let dd = (this.pDelayT[k] - this.pDelay[k]) / n;
      dd = Math.max(-0.06, Math.min(0.06, dd)); // limit Doppler shift when jumping around
      dStep[k] = dd;
    }
    for (let k = 0; k < P * 7; k++) gStep[k] = (this.pGT[k] - this.pG[k]) / n;
    const lines = this.lines;
    const nTop = this.imgs.length * 2;
    const noise = this.noiseLevel;
    const d = this.drv, dp = p.drive;
    const fanNom = dp.G_fan * dp.omegaNom;
    const auto = d.mode === 'auto', ham = this.ham;
    if (!this.hourT || (this.hourT -= n) <= 0) { const now = new Date(); this.hourNow = now.getHours() + now.getMinutes() / 60; this.hourT = sr * 30; }
    ham.behave(n * dt, this.hamHour ?? this.hourNow);      // his body clock follows your local time
    const gain = 4.0 * this.userGain * (p.gain || 1);
    const lidA = this.lidA, leak = p.lid.leak;
    const tableUnb = p.table && p.table.unbaffled;
    const bare = p.plateUnbaffled;
    const boxed = p.cavity.on;
    const rev = this.rev;
    for (let s = 0; s < n; s++) {
      this.stepDrive();
      this.stepTines();
      // mechanical noise forces into the bedplate (clicks, gear mesh, pawl ping)
      let Fm = this.pulseForce();
      {
        const ps = this.pingState; // pawl spring ping ~5.6 kHz, 4 ms decay
        const w = (TWO_PI * 5600) / sr, rr = Math.exp(-1 / (0.004 * sr));
        const y = 2 * rr * Math.cos(w) * ps[0] - rr * rr * ps[1];
        ps[1] = ps[0]; ps[0] = y; Fm += y * 0.3;
      }
      const busy = this.activeTines || Fm !== 0 || (d.mode === 'spring' && d.omega > 0) || (d.mode !== 'spring' && d.omega > 1e-4) || (ham.f > 0 || Math.abs(ham.ww) > 2e-3);
      if (busy && !this.structAwake) { this.structAwake = true; }
      if (busy) this.renderLeft = this.renderTail;
      if (!this.structAwake) {
        const w = this.w;
        for (let j = 0; j < 8; j++) lines[j][w] = 0;
        this.prevDdot[0] = this.prevDdot[1] = this.prevDdot[2] = 0;
        if (this.renderLeft <= 0) { this.w = (w + 1) & DM; L[s] = 0; if (R !== L) R[s] = 0; continue; }
        this.renderLeft--;
      } else {
        this.stepStructure(Fm);
        const o = this.out;
        // ----- assemble radiation channels -----
        let Mdot = 0, Dx = 0, Dy = 0, Dz = 0;
        if (boxed) Mdot += o.QoutDot + o.QportDot;
        else Dz += p.plateDeff * o.Wa;                         // small unbaffled base plate: dipole
        if (p.table) Mdot += o.tWa;
        Dx += o.Dxa; Dy += o.Dya;
        Dz += 1.5 * p.frame.V * o.frameAcc;
        // tine direct radiation (dipole along n), through the lid if closed
        let ty = (Math.PI / 4) * p.geom.ny * o.Pd, tz = (Math.PI / 4) * p.geom.nz * o.Pd;
        // governor fan whirr (aerodynamic, inside the box)
        let fan = 0;
        if (d.mode === 'spring' && d.omega > 0) {
          const r = (dp.G_fan * d.omega) / fanNom;
          const amp = 2.2e-3 * noise * r * r * r;
          if (amp > 1e-7) {
            // 2-pole band-pass of white noise around 2.4 kHz
            const bp = this.fanBp;
            const w = (TWO_PI * 2400) / sr, Q = 0.9, al = Math.sin(w) / (2 * Q);
            const x = this.rand();
            const y = ((al * x - al * bp[1]) - (-2 * Math.cos(w)) * bp[2] - (1 - al) * bp[3]) / (1 + al);
            bp[1] = bp[0]; bp[0] = x; bp[3] = bp[2]; bp[2] = y;
            fan = amp * y * (1 + 0.55 * Math.cos(dp.blades * d.fanPhase));
          }
        }
        if (lidA) {
          const z = this.lidLP;
          z[0] = (1 - lidA) * ty + lidA * z[0]; z[1] = (1 - lidA) * tz + lidA * z[1]; z[2] = (1 - lidA) * fan + lidA * z[2];
          ty = leak * ty + (1 - leak) * z[0]; tz = leak * tz + (1 - leak) * z[1]; fan = leak * fan + (1 - leak) * z[2];
        }
        Dy += ty; Dz += tz; Mdot += fan;
        if (!ham.silent && this.hamVol !== 0) Mdot += ham.sound(noise) * (this.hamVol ?? 1);   // the wheel: paws, rungs, axle (radiated from beside the box)
        const pd = this.prevDdot;
        const Ddx = (Dx - pd[0]) * sr, Ddy = (Dy - pd[1]) * sr, Ddz = (Dz - pd[2]) * sr;
        pd[0] = Dx; pd[1] = Dy; pd[2] = Dz;
        const w = this.w;
        lines[0][w] = Mdot; lines[1][w] = Dx; lines[2][w] = Dy; lines[3][w] = Dz;
        lines[4][w] = Ddx; lines[5][w] = Ddy; lines[6][w] = Ddz;
        lines[7][w] = tableUnb ? -o.tWa : 0;
        // go to sleep once the wood has stopped moving
        if (!busy && ((this.sleepCheck = (this.sleepCheck + 1) & 255) === 0)) {
          let mx = Math.abs(this.frame.vz) + Math.abs(this.bed.vz) + Math.abs(this.cav.Q) * 1e3;
          for (let k = 0; k < this.pv.length; k++) mx = Math.max(mx, Math.abs(this.pv[k]));
          if (this.tv) for (let k = 0; k < this.tv.length; k++) mx = Math.max(mx, Math.abs(this.tv[k]));
          if (mx < 3e-10) {
            this.pq.fill(0); this.pv.fill(0); if (this.tq) { this.tq.fill(0); this.tv.fill(0); }
            Object.assign(this.bed, { z: 0, vz: 0, ax: 0, vax: 0, ay: 0, vay: 0 });
            Object.assign(this.frame, { z: 0, vz: 0, acc: 0 }); this.cav.pc = 0; this.cav.Q = 0;
            this.lidLP.fill(0);
            this.structAwake = false;
          }
        }
      }
      const w = this.w;
      // ----- render paths -----
      let yl = 0, yr = 0;
      for (let k = 0; k < P; k++) {
        const del = (this.pDelay[k] += dStep[k]);
        const gb = k * 7;
        for (let j = 0; j < 7; j++) this.pG[gb + j] += gStep[gb + j];
        const pos = w - del;
        const i0 = Math.floor(pos), fr = pos - i0;
        let x;
        if (k >= nTop) {
          const ln = lines[7];
          x = this.pG[gb] * (ln[i0 & DM] * (1 - fr) + ln[(i0 + 1) & DM] * fr);
        } else if (k < 2) {
          // cubic Hermite for the direct path
          const im1 = (i0 - 1) & DM, ia = i0 & DM, ib = (i0 + 1) & DM, ic = (i0 + 2) & DM;
          x = 0;
          for (let j = 0; j < 7; j++) {
            const gj = this.pG[gb + j]; if (gj === 0) continue;
            const ln = lines[j];
            const y0 = ln[im1], y1 = ln[ia], y2 = ln[ib], y3 = ln[ic];
            const c1 = 0.5 * (y2 - y0), c2 = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3, c3 = 0.5 * (y3 - y0) + 1.5 * (y1 - y2);
            x += gj * (((c3 * fr + c2) * fr + c1) * fr + y1);
          }
        } else {
          const ia = i0 & DM, ib = (i0 + 1) & DM;
          x = 0;
          for (let j = 0; j < 7; j++) { const gj = this.pG[gb + j]; if (gj !== 0) x += gj * (lines[j][ia] * (1 - fr) + lines[j][ib] * fr); }
        }
        const a = this.pAir[k];
        const ya = (1 - a) * x + a * this.pAirZ[k]; this.pAirZ[k] = ya;
        let ys = this.pB0[k] * ya + this.pB1[k] * this.pX1[k] - this.pA1[k] * this.pY1[k];
        this.pX1[k] = ya; this.pY1[k] = ys;
        // pinna echoes and the shoulder reflection, from a short per-path ring buffer
        const rb = k * 128, ri = this.pRi;
        this.pRing[rb + ri] = ys;
        const tb = k * 6;
        let yp = ys;
        for (let q = 0; q < 6; q++) {
          const gq = this.pTapG[tb + q]; if (gq === 0) continue;
          const dq = this.pTapD[tb + q], ip = Math.floor(dq), fq = dq - ip;
          yp += gq * (this.pRing[rb + ((ri - ip) & 127)] * (1 - fq) + this.pRing[rb + ((ri - ip - 1) & 127)] * fq);
        }
        // behind you the pinna flap shades the highs
        const rr0 = this.pRear[k];
        if (rr0 > 0) { const z = (this.pRearZ[k] += 0.45 * (yp - this.pRearZ[k])); yp = yp - rr0 * (yp - z); }
        if (k & 1) yr += yp; else yl += yp;
      }
      this.pRi = (this.pRi + 1) & 127;
      if (rev) {
        const pre = (w - rev.pre) & DM;
        const xin = (RHO / (4 * Math.PI)) * (lines[0][pre] + lines[7][pre] * 0.7 + (Math.abs(lines[6][pre]) + 0.7 * lines[5][pre]) / C);
        const [rl, rrv] = this.revTick(xin);
        yl += rl * rev.gain; yr += rrv * rev.gain;
      }
      this.w = (w + 1) & DM;
      this.meter[0] += yl * yl; this.meter[1] += yr * yr;
      let ol = yl * gain, or = yr * gain;
      // peak limiter (instant attack, 80 ms release) — keeps pin clicks from clipping
      const pk = Math.max(Math.abs(ol), Math.abs(or));
      this.limEnv = pk > this.limEnv ? pk : this.limEnv * this.limRel + pk * (1 - this.limRel);
      const lg = this.limEnv > 0.89 ? 0.89 / this.limEnv : 1;
      L[s] = ol * lg; if (R !== L) R[s] = or * lg;
    }
    this.postCount += n;
    if (this.postCount >= this.postEvery) {
      const c = this.postCount; this.postCount = 0;
      const splL = 10 * Math.log10(this.meter[0] / c / 4e-10 + 1e-12), splR = 10 * Math.log10(this.meter[1] / c / 4e-10 + 1e-12);
      this.meter[0] = this.meter[1] = 0;
      let contacts = 0, awake = 0;
      for (let i = 0; i < p.tines.N; i++) { contacts += this.contactFlag[i]; awake += 1 - this.asleep[i]; }
      this.port.postMessage({
        type: 'state', theta: d.theta, thetaMod: d.thetaMod, omega: d.omega, turns: d.turns,
        fanRpm: (dp.G_fan * d.omega * 60) / TWO_PI, crank: d.theta * dp.G_crank, brake: d.brake,
        amp: this.amp.slice(), defl: this.defl.slice(), splL, splR, contacts, awake,
        torque: d.tauContact, srcPos: this.srcPos,
        ham: ham.report(), hooked: auto,
      });
      this.amp.fill(0);
    }
    return true;
  }
}

registerProcessor('musicbox', MusicBoxProcessor);
