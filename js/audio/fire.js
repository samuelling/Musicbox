// The fireplace, heard from where you stand: a synthesised crackle (resin pops, hiss of
// escaping gas, the low roar of the flames) through an HRTF panner at the hearth.
export class FireSound {
  constructor(ctx) {
    this.ctx = ctx;
    const sr = ctx.sampleRate, N = Math.round(sr * 9);
    const buf = ctx.createBuffer(1, N, sr), x = buf.getChannelData(0);
    let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    // roar: brown-ish noise, low-passed, slowly breathing
    let b = 0, l1 = 0, l2 = 0;
    const a1 = 1 - Math.exp(-2 * Math.PI * 180 / sr);
    for (let i = 0; i < N; i++) {
      b = 0.995 * b + (rnd() * 2 - 1) * 0.1; l1 += a1 * (b - l1); l2 += a1 * (l1 - l2);
      x[i] = l2 * 3.2 * (0.75 + 0.25 * Math.sin(i / sr * 0.7 + 1.3 * Math.sin(i / sr * 0.23)));
    }
    // hiss: high-passed noise in gusts
    let hp = 0, pr = 0;
    for (let i = 0; i < N; i++) { const n = rnd() * 2 - 1; hp = 0.85 * (hp + n - pr); pr = n; x[i] += hp * 0.012 * (0.5 + 0.5 * Math.sin(i / sr * 1.9 + Math.sin(i / sr * 0.5) * 3)); }
    // crackles: Poisson pops, sometimes in little bursts; each a damped click with a random ring
    for (let t = 0.05; t < 8.9;) {
      t += -Math.log(1 - rnd()) / (rnd() < 0.1 ? 40 : 5);
      const i0 = Math.floor(t * sr), A = 0.08 + 0.35 * rnd() * rnd(), f = 1200 + 3800 * rnd(), tau = 0.0006 + 0.002 * rnd();
      const len = Math.min(N - i0, Math.floor(sr * tau * 6));
      for (let k = 0; k < len; k++) { const tt = k / sr; x[i0 + k] += A * Math.exp(-tt / tau) * Math.sin(2 * Math.PI * f * tt + rnd() * 0.3); }
    }
    // seamless loop: cross-fade the last 0.5 s into the start
    const cf = Math.floor(sr * 0.5);
    for (let k = 0; k < cf; k++) { const w = k / cf; x[k] = x[k] * w + x[N - cf + k] * (1 - w); }
    this.buf = buf;
    this.gain = ctx.createGain(); this.gain.gain.value = 0;
    this.pan = ctx.createPanner(); Object.assign(this.pan, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1, rolloffFactor: 1 });
    this.pan.connect(this.gain).connect(ctx.destination);
    this.src = null; this.level = 0.35;
  }
  start() {
    if (this.src) return;
    this.src = this.ctx.createBufferSource(); this.src.buffer = this.buf; this.src.loop = true; this.src.loopEnd = this.buf.duration - 0.5;
    this.src.connect(this.pan); this.src.start();
  }
  // room coords (x, y on the floor, z up) -> Web Audio (x, y up, z towards the listener's back)
  place(px, py, pz) { const p = this.pan; if (p.positionX) { p.positionX.value = px; p.positionY.value = pz; p.positionZ.value = -py; } else p.setPosition(px, pz, -py); }
  listen(L) {
    const l = this.ctx.listener, fx = Math.cos(L.yaw), fz = -Math.sin(L.yaw);
    if (l.positionX) { l.positionX.value = L.x; l.positionY.value = L.z; l.positionZ.value = -L.y; l.forwardX.value = fx; l.forwardY.value = 0; l.forwardZ.value = fz; l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0; }
    else { l.setPosition(L.x, L.z, -L.y); l.setOrientation(fx, 0, fz, 0, 1, 0); }
  }
  set(on, vol = 1) { this.gain.gain.setTargetAtTime(on ? this.level * vol : 0, this.ctx.currentTime, 0.4); if (on) this.start(); }
}

// The storm outside, heard through the timber walls and the window: gusting wind (broadband
// roar), the howl of air over the eaves (a narrow resonance whose pitch rides the gusts), and
// ice pellets ticking on the glass.  The walls take the highs off; the panner sits at the window.
export class StormSound {
  constructor(ctx) {
    this.ctx = ctx;
    const sr = ctx.sampleRate, N = Math.round(sr * 14);
    const buf = ctx.createBuffer(1, N, sr), x = buf.getChannelData(0);
    let seed = 777; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    // gust envelope: slow random walk, a few big gusts
    const env = new Float32Array(N); let g = 0.5, gv = 0;
    for (let i = 0; i < N; i++) { if (i % 64 === 0) { gv += (rnd() - 0.5) * 0.02 - (g - 0.55) * 0.0015; gv *= 0.995; g = Math.max(0.15, Math.min(1.2, g + gv)); } env[i] = g; }
    let lp1 = 0, lp2 = 0, y1 = 0, y2 = 0, ph = 0;
    for (let i = 0; i < N; i++) {
      const e = env[i], n = rnd() * 2 - 1;
      const a = 1 - Math.exp(-2 * Math.PI * (120 + 260 * e) / sr);
      lp1 += a * (n - lp1); lp2 += a * (lp1 - lp2);
      // howl: two-pole resonator, pitch follows the gust
      const f = 260 + 420 * e + 30 * Math.sin(i / sr * 0.9), r = 0.9985, w = 2 * Math.PI * f / sr;
      const yy = n * 0.02 + 2 * r * Math.cos(w) * y1 - r * r * y2; y2 = y1; y1 = yy;
      x[i] = lp2 * 1.6 * e + yy * 0.9 * Math.max(0, e - 0.35);
      ph += 1 / sr;
    }
    // sleet ticks on the window during gusts
    for (let t = 0.02; t < 13.9;) {
      const i0 = Math.floor(t * sr), e = env[i0];
      t += -Math.log(1 - rnd()) / (2 + 60 * Math.max(0, e - 0.5));
      const A = 0.03 * rnd(), f = 3000 + 3000 * rnd();
      for (let k = 0; k < 120 && i0 + k < N; k++) x[i0 + k] += A * Math.exp(-k / 18) * Math.sin(2 * Math.PI * f * k / sr);
    }
    const cf = Math.floor(sr * 0.8);
    for (let k = 0; k < cf; k++) { const w = k / cf; x[k] = x[k] * w + x[N - cf + k] * (1 - w); }
    this.buf = buf;
    this.wall = ctx.createBiquadFilter(); this.wall.type = 'lowpass'; this.wall.frequency.value = 1400; this.wall.Q.value = 0.5;
    this.gain = ctx.createGain(); this.gain.gain.value = 0;
    this.pan = ctx.createPanner(); Object.assign(this.pan, { panningModel: 'HRTF', distanceModel: 'inverse', refDistance: 1.5, rolloffFactor: 0.6 });
    this.wall.connect(this.pan).connect(this.gain).connect(ctx.destination);
    this.src = null; this.level = 0.5;
  }
}
for (const k of ['start', 'place', 'listen', 'set']) StormSound.prototype[k] = FireSound.prototype[k];
StormSound.prototype.start = function () {
  if (this.src) return;
  this.src = this.ctx.createBufferSource(); this.src.buffer = this.buf; this.src.loop = true; this.src.loopEnd = this.buf.duration - 0.8;
  this.src.connect(this.wall); this.src.start();
};
