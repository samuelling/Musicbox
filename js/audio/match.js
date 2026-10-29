// A struck match, synthesised (no samples), timed to the candle animation in scene.js.
//  1. strike   (0–120 ms): stick–slip of the head across the striker — a train of tiny
//               impacts whose rate rises as the head speeds up, each ringing the matchbox
//               (a damped resonance near 3.6 kHz) plus a broadband tick.
//  2. flare    (~100–450 ms): the phosphorus/sulfur head igniting — a fast-attack hiss with
//               crackle (sparse popping from the burning head).
//  3. catch    (~350–1100 ms): the candle wick taking the flame — a soft, low "whoof"
//               of buoyant combustion gas, mostly below 400 Hz.
// Played straight to the output (it is the room, not the music box), slightly left,
// because the candle sits to the left of the box.
export function strikeMatch(ctx, level = 0.28) {
  if (!ctx) return;
  try {
    const sr = ctx.sampleRate, N = Math.round(sr * 1.3);
    const x = new Float32Array(N);
    let seed = 0x9e3779b9;
    const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967296); };
    const nz = () => rnd() * 2 - 1;

    // 1) strike: Poisson impulse train, rate 0.9 → 9 kHz, amplitude envelope rising then cut
    const imp = new Float32Array(N);
    for (let t = 0.004; t < 0.12;) {
      const u = t / 0.12;
      t += -Math.log(1 - rnd() + 1e-12) / (900 + 8000 * u);
      const i = Math.round(t * sr); if (i >= N) break;
      imp[i] += (0.35 + 0.65 * rnd()) * (0.4 + 0.6 * u) * (u < 0.92 ? 1 : (1 - u) / 0.08);
    }
    // matchbox resonance (two-pole) + direct tick (one-pole highpassed)
    const f0 = 3600, r = Math.exp(-Math.PI * 900 / sr), cw = Math.cos(2 * Math.PI * f0 / sr);
    let y1 = 0, y2 = 0, hp = 0, prev = 0;
    for (let i = 0; i < N; i++) {
      const v = imp[i];
      const y = v + 2 * r * cw * y1 - r * r * y2; y2 = y1; y1 = y;
      hp = 0.6 * (hp + v - prev); prev = v;
      x[i] += 0.11 * y + 0.9 * hp;
    }

    // 2) flare: hiss (noise, twice one-pole highpassed ~1.2 kHz) with crackle
    const a1 = Math.exp(-2 * Math.PI * 1200 / sr);
    let h1 = 0, h2 = 0, p1 = 0, p2 = 0;
    for (let i = 0; i < N; i++) {
      const t = i / sr - 0.1; if (t < 0) continue;
      const env = Math.min(1, t / 0.015) * Math.exp(-t / 0.16) + 0.08 * Math.exp(-t / 0.6);
      const n = nz();
      h1 = a1 * (h1 + n - p1); p1 = n;
      h2 = a1 * (h2 + h1 - p2); p2 = h1;
      let v = 0.5 * h2 * env;
      if (rnd() < 60 / sr * Math.exp(-t / 0.3)) v += (rnd() < 0.5 ? -1 : 1) * (0.4 + 0.6 * rnd()) * env;   // pops
      x[i] += v;
    }

    // 3) catch: low whoof (noise through two one-pole lowpasses ~280 Hz)
    const b = 1 - Math.exp(-2 * Math.PI * 280 / sr);
    let l1 = 0, l2 = 0;
    for (let i = 0; i < N; i++) {
      const t = i / sr - 0.36; if (t < 0) continue;
      const env = Math.min(1, t / 0.07) ** 2 * Math.exp(-t / 0.22);
      l1 += b * (nz() - l1); l2 += b * (l1 - l2);
      x[i] += 5.5 * l2 * env;
    }

    // normalise, gentle fade at the end
    let pk = 1e-9; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(x[i]));
    const g = level / pk, fade = Math.round(0.05 * sr);
    const buf = ctx.createBuffer(2, N, sr);
    const L = buf.getChannelData(0), R = buf.getChannelData(1);
    const d = Math.round(0.00025 * sr);                       // ~0.25 ms interaural delay: source to the left
    for (let i = 0; i < N; i++) {
      const w = i > N - fade ? (N - i) / fade : 1;
      L[i] = x[i] * g * w;
      R[i] = (i >= d ? x[i - d] : 0) * g * w * 0.72;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    src.connect(ctx.destination); src.start(0);
  } catch (e) { /* a missing match sound is never worth breaking the start */ }
}
