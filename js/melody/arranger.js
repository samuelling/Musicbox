// Fit a compiled tune onto a comb: choose a transposition, fold notes into
// range, assign duplicate tines round-robin (least-recently plucked first)
// and turn onsets into pin angles on one cylinder revolution.

const FOLD_SCORE = 0.55, SUB_SCORE = 0.08;

function nearest(sorted, m) {
  let best = sorted[0], bd = Infinity;
  for (const p of sorted) { const d = Math.abs(p - m); if (d < bd || (d === bd && p < best)) { bd = d; best = p; } }
  return best;
}

function mapPitch(m, set, lo, hi) {
  if (set.has(m)) return { p: m, how: 'exact' };
  for (let k = 1; k <= 4; k++) for (const s of [1, -1]) {
    const c = m + s * 12 * k;
    if (set.has(c)) return { p: c, how: 'fold' };
  }
  return null;
}

export function chooseTranspose(song, combNotes) {
  const set = new Set(combNotes);
  const lo = Math.min(...combNotes), hi = Math.max(...combNotes);
  let best = { t: 0, score: -1e9 };
  for (let t = -36; t <= 36; t++) {
    let sc = 0;
    for (const n of song.notes) {
      const w = n.voice === 0 ? 2 : 1;
      const m = n.midi + t;
      if (set.has(m)) sc += w;
      else if (mapPitch(m, set, lo, hi)) sc += w * FOLD_SCORE;
      else sc += w * (Math.abs(nearest(combNotes, m) - m) <= 1 ? SUB_SCORE : 0);
    }
    sc -= Math.abs(t) * 0.002 * Math.max(1, song.notes.length); // mild preference for small shifts (and none for an empty tune)
    if (sc > best.score) best = { t, score: sc };
  }
  return best.t;
}

// Build a comb tuned to the tune, like a Swiss arranger: every pitch the
// tune needs, with extra duplicate tines for fast repeated notes.
export function buildTuneComb(song, count, lo, hi, nominalStepSec) {
  // transposition that keeps most notes inside [lo, hi]
  let bestT = 0, bestS = -1e9;
  for (let t = -36; t <= 36; t++) {
    let s = 0;
    for (const n of song.notes) { const m = n.midi + t; if (m >= lo && m <= hi) s += n.voice === 0 ? 2 : 1; }
    // prefer the melody high in the comb (music-box sparkle), and small shifts
    const mel = song.notes.filter((n) => n.voice === 0).map((n) => n.midi + t);
    const top = Math.max(...mel);
    s -= Math.abs(hi - 4 - top) * 0.05 + Math.abs(t) * 0.01;
    if (s > bestS) { bestS = s; bestT = t; }
  }
  const fold = (m) => { while (m < lo) m += 12; while (m > hi) m -= 12; return m; };
  const use = new Map();
  const times = new Map();
  for (const n of song.notes) {
    const m = fold(n.midi + bestT);
    use.set(m, (use.get(m) || 0) + (n.voice === 0 ? 2 : 1));
    if (!times.has(m)) times.set(m, []);
    times.get(m).push(n.step * nominalStepSec);
  }
  let pitches = [...use.keys()].sort((a, b) => use.get(b) - use.get(a));
  if (pitches.length > count) pitches = pitches.slice(0, count);
  const tines = new Map(pitches.map((p) => [p, 1]));
  // need: max number of onsets of a pitch inside a 0.4 s window (pluck + ring-over)
  const need = new Map();
  for (const p of pitches) {
    const ts = [...new Set(times.get(p))].sort((a, b) => a - b);
    let mx = 1;
    for (let i = 0, j = 0; i < ts.length; i++) { while (ts[i] - ts[j] > 0.4) j++; mx = Math.max(mx, i - j + 1); }
    need.set(p, Math.min(4, mx));
  }
  let spare = count - pitches.length;
  while (spare > 0) {
    let pick = null, bestScore = -1;
    for (const p of pitches) {
      const deficit = need.get(p) - tines.get(p);
      const score = deficit > 0 ? 1000 * deficit + use.get(p) : use.get(p) / (tines.get(p) * tines.get(p) * 4);
      if (score > bestScore) { bestScore = score; pick = p; }
    }
    if (!pick) break;
    tines.set(pick, tines.get(pick) + 1); spare--;
  }
  const notes = [];
  for (const [p, k] of tines) for (let i = 0; i < k; i++) notes.push(p);
  notes.sort((a, b) => a - b);
  return { notes, transpose: bestT };
}

export function arrange(song, combNotes, opts = {}) {
  const stepSec = 60 / (song.bpm * 4);
  const Trev = Math.min(150, Math.max(8, song.steps * stepSec));
  const t = opts.transpose ?? chooseTranspose(song, combNotes);
  const set = new Set(combNotes);
  const sorted = [...new Set(combNotes)].sort((a, b) => a - b);
  const lo = sorted[0], hi = sorted[sorted.length - 1];
  const tinesOf = new Map();
  combNotes.forEach((p, i) => { if (!tinesOf.has(p)) tinesOf.set(p, []); tinesOf.get(p).push(i); });
  const lastUse = new Float64Array(combNotes.length).fill(-1e9);
  const pins = combNotes.map(() => []);
  const placed = [];
  let substituted = 0, folded = 0, unison = 0;
  const stagger = (opts.staggerMs ?? 4) / 1000;
  // group by step to stagger chords (bass first, like a pinning arranger)
  const bySt = new Map();
  for (const n of song.notes) { if (!bySt.has(n.step)) bySt.set(n.step, []); bySt.get(n.step).push(n); }
  const steps = [...bySt.keys()].sort((a, b) => a - b);
  for (const st of steps) {
    const group = bySt.get(st).slice().sort((a, b) => a.midi - b.midi);
    const usedHere = new Set();
    group.forEach((n, gi) => {
      let m = n.midi + t, how = 'exact';
      const mp = mapPitch(m, set, lo, hi);
      if (mp) { m = mp.p; how = mp.how; } else { m = nearest(sorted, m); how = 'sub'; }
      const time = st * stepSec + gi * stagger;
      const gap = (opts.minGap || 0) * Trev;           // a pin needs this long to clear its tine
      const free = (i) => !usedHere.has(i) && time - lastUse[i] >= gap;
      let cands = tinesOf.get(m).filter((i) => !usedHere.has(i));
      if (!cands.length) { unison++; return; }
      cands.sort((a, b) => lastUse[a] - lastUse[b]);
      let ti = cands.find(free);
      if (ti === undefined && gap > 0) {
        // like a pinning arranger: move a too-fast repeat to the octave
        for (const alt of [m + 12, m - 12, m + 24, m - 24]) {
          const c2 = (tinesOf.get(alt) || []).filter(free).sort((a, b) => lastUse[a] - lastUse[b]);
          if (c2.length) { ti = c2[0]; m = alt; how = 'fold'; break; }
        }
      }
      if (ti === undefined) ti = cands[0];
      usedHere.add(ti); lastUse[ti] = time;
      if (how === 'fold') folded++; if (how === 'sub') substituted++;
      pins[ti].push(((time / Trev) % 1 + 1) % 1);
      placed.push({ step: st, midi: m, src: n.midi, tine: ti, how, voice: n.voice });
    });
  }
  let minSeparation = 1;
  for (const list of pins) {
    list.sort((a, b) => a - b);
    for (let j = 1; j < list.length; j++) minSeparation = Math.min(minSeparation, list[j] - list[j - 1]);
    if (list.length > 1) minSeparation = Math.min(minSeparation, 1 + list[0] - list[list.length - 1]);
  }
  return { pins, Trev, stepSec, transpose: t, placed, minSeparation, stats: { notes: song.notes.length, substituted, folded, unison } };
}
