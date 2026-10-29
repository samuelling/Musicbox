// Generative ambient pieces for the cylinder, in the spirit of tape-loop music: a handful of short
// phrases, each repeating on its own period. The periods share no common factor, so the phrases
// drift against each other and the music never lines up the same way twice in a revolution.
// A new seed every time the piece is chosen gives a new piece.

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const PRIMES = [37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137];

// p: { pitches: [midi...], bars, loops, phrase: [min,max] notes, minGap (steps), bass: [midi...] }
export function ambient(p, seed = (Math.random() * 2 ** 32) >>> 0) {
  const r = rng(seed), L = p.bars * 16, notes = [];
  const pick = (a) => a[Math.floor(r() * a.length)];
  const periods = [...PRIMES].filter((q) => q >= (p.minP || 41) && q <= (p.maxP || 131)).sort(() => r() - 0.5).slice(0, p.loops);
  periods.forEach((period, v) => {
    // a phrase of one to three notes close together in the scale, a few steps apart
    const n = p.phrase[0] + Math.floor(r() * (p.phrase[1] - p.phrase[0] + 1));
    let i = Math.floor(r() * p.pitches.length), off = 0;
    const phrase = [];
    for (let k = 0; k < n; k++) {
      phrase.push([off, p.pitches[i]]);
      i = Math.max(0, Math.min(p.pitches.length - 1, i + pick([-2, -1, 1, 2, 3])));
      off += pick([3, 4, 6, 8]);
    }
    for (let t = Math.floor(r() * period); t < L; t += period) for (const [o, m] of phrase) if (t + o < L) notes.push({ step: t + o, midi: m, voice: v });
  });
  // a slow bass bell under it all, on its own long period
  if (p.bass) { const per = pick([173, 181, 191, 197]); let k = 0; for (let t = Math.floor(r() * 32); t < L; t += per) notes.push({ step: t, midi: p.bass[k++ % p.bass.length], voice: 8 }); }
  // a tine that is still ringing gets damped by the next pin on it: keep repeats on one tine apart
  notes.sort((a, b) => a.step - b.step);
  const last = new Map(), out = [];
  for (const n of notes) { const l = last.get(n.midi); if (l !== undefined && n.step - l < p.minGap) continue; last.set(n.midi, n.step); out.push(n); }
  return { notes: out, length: L, seed };
}
