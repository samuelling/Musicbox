// Compact tune notation and song compilation.
//
//   "C5:4 D5 E5:2 F#5+A5:8 r:4 | ..."
//   NOTE[:dur]  dur in sixteenth notes; omitted -> previous duration
//   A+B+C       chord (simultaneous onsets)
//   r           rest
//   |           bar line (ignored, for readability)
//
// A music box only cares about onsets, so durations just advance time.

import { parseNote } from '../physics/constants.js';

export function parseVoice(text) {
  const notes = [];
  let t = 0, dur = 4;
  for (const tok of text.trim().split(/\s+/)) {
    if (!tok || tok === '|') continue;
    const [head, d] = tok.split(':');
    if (d !== undefined) dur = parseFloat(d);
    if (head !== 'r') {
      for (const n of head.split('+')) {
        const m = parseNote(n);
        if (m === null) throw new Error(`bad note "${n}" in "${tok}"`);
        notes.push({ step: t, midi: m });
      }
    }
    t += dur;
  }
  return { notes, length: t };
}

// ---- key detection (Krumhansl–Schmuckler) ----
const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MIN = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
export function detectKey(notes) {
  const h = new Array(12).fill(0);
  for (const n of notes) h[((n.midi % 12) + 12) % 12] += n.w || 1;
  let best = { score: -1e9 };
  for (let k = 0; k < 12; k++) for (const [mode, prof] of [['major', MAJ], ['minor', MIN]]) {
    let s = 0;
    for (let i = 0; i < 12; i++) s += h[(i + k) % 12] * prof[i];
    if (s > best.score) best = { score: s, tonic: k, mode };
  }
  return best;
}

// ---- simple diatonic harmoniser for melody-only tunes ----
// Chooses one triad per segment by dynamic programming over chord-tone fit
// plus functional-harmony transition preferences, then writes a music-box
// style accompaniment (bass root + broken chord) below the melody.
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
export function parseKey(k) {
  const m = /^([A-G][#b]?)(m?)$/.exec(k || '');
  return m ? { tonic: PC[m[1]], mode: m[2] ? 'minor' : 'major' } : null;
}

export function harmonize(melody, length, meter, opts = {}) {
  const key = parseKey(opts.key) || detectKey(melody.map((n, i) => ({ ...n, w: (melody[i + 1]?.step ?? length) - n.step || 1 })));
  const T = key.tonic, minor = key.mode === 'minor';
  const deg = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const chords = (minor ? [[0, 'm'], [3, 'm'], [4, 'M'], [5, 'M'], [2, 'M'], [6, 'M']] : [[0, 'M'], [1, 'm'], [3, 'M'], [4, 'M'], [5, 'm'], [2, 'm']])
    .map(([d, q]) => {
      const root = (T + deg[d]) % 12;
      const third = (root + (q === 'M' ? 4 : 3)) % 12;
      return { d, root, pcs: [root, third, (root + 7) % 12] };
    });
  const prior = { 0: 0.45, 4: 0.25, 3: 0.2 };
  const barLen = (meter[0] * 16) / meter[1];
  const segLen = meter[0] === 4 && meter[1] === 4 ? barLen / 2 : barLen;
  const pickup = opts.pickup || 0;
  const segs = [];
  for (let s = pickup; s < length; s += segLen) segs.push([s, Math.min(length, s + segLen)]);
  const fit = segs.map(([a, b]) => chords.map((ch) => {
    let sc = prior[ch.d] || 0;
    for (let i = 0; i < melody.length; i++) {
      const n = melody[i];
      const end = melody[i + 1]?.step ?? length;
      const ov = Math.min(b, end) - Math.max(a, n.step);
      if (ov <= 0) continue;
      const w = ov * (n.step === a ? 1.6 : 1);
      sc += ch.pcs.includes(((n.midi % 12) + 12) % 12) ? w : -0.6 * w;
    }
    return sc;
  }));
  const trans = (p, q) => {
    const a = chords[p].d, b = chords[q].d;
    if (a === 4 && b === 0) return 0.9;
    if ((a === 3 || a === 1) && b === 4) return 0.4;
    if (a === b) return 0.15;
    return 0;
  };
  const n = segs.length, C = chords.length;
  const dp = Array.from({ length: n }, () => new Array(C).fill(-1e9)), bk = Array.from({ length: n }, () => new Array(C).fill(0));
  for (let c = 0; c < C; c++) dp[0][c] = fit[0][c] + (chords[c].d === 0 ? 1.5 : 0);
  for (let i = 1; i < n; i++) for (let c = 0; c < C; c++) for (let p = 0; p < C; p++) {
    const v = dp[i - 1][p] + fit[i][c] + trans(p, c);
    if (v > dp[i][c]) { dp[i][c] = v; bk[i][c] = p; }
  }
  let last = 0; for (let c = 0; c < C; c++) if (dp[n - 1][c] + (chords[c].d === 0 ? 2.5 : 0) > dp[n - 1][last] + (chords[last].d === 0 ? 2.5 : 0)) last = c;
  const pick = new Array(n); pick[n - 1] = last;
  for (let i = n - 1; i > 0; i--) pick[i - 1] = bk[i][pick[i]];
  // accompaniment pattern
  const lowMel = Math.min(...melody.map((m) => m.midi));
  const out = [];
  const place = (pc, below) => { let m = 12 * 4 + pc; while (m >= below) m -= 12; while (m < below - 12) m += 12; return m; };
  segs.forEach(([a, b], i) => {
    const ch = chords[pick[i]];
    const bass = place(ch.root, Math.min(lowMel - 7, 60));
    out.push({ step: a, midi: bass, voice: 9 });
    const len = b - a;
    const style = opts.style || 'broken';
    if (style === 'root') return;
    const tones = [place(ch.pcs[2], lowMel - 2), place(ch.pcs[1], lowMel - 1)];
    if (meter[0] === 3 && len >= 12) { out.push({ step: a + 4, midi: tones[0], voice: 9 }); out.push({ step: a + 8, midi: tones[1], voice: 9 }); }
    else if (meter[0] === 6 && len >= 12) { out.push({ step: a + 6, midi: tones[0], voice: 9 }); }
    else if (len >= 8) { out.push({ step: a + len / 2, midi: tones[0], voice: 9 }); }
  });
  return { notes: out, key, chords: pick.map((c) => chords[c]) };
}

// Compile a library song into onset events.
export function compileSong(song) {
  let length = 0;
  const all = [];
  if (song.generate) {
    // generative: a fresh piece every time it is chosen
    const g = song.generate();
    g.notes.sort((a, b) => a.step - b.step || a.midi - b.midi);
    return { id: song.id, title: song.title, credit: song.credit, bpm: song.bpm, meter: song.meter, steps: g.length, notes: g.notes, key: null, seed: g.seed };
  }
  song.voices.forEach((v, vi) => {
    const { notes, length: L } = parseVoice(v);
    length = Math.max(length, L);
    notes.forEach((n) => all.push({ ...n, voice: vi }));
  });
  if (song.length) length = song.length;
  // canon / round: duplicate voice 0 at offsets
  if (song.canon) {
    const base = all.filter((n) => n.voice === 0);
    song.canon.forEach(([off, shift], k) => base.forEach((n) => all.push({ step: (n.step + off) % length, midi: n.midi + shift, voice: 1 + k })));
  }
  let key = null;
  if (song.accomp && song.accomp !== 'none') {
    const mel = all.filter((n) => n.voice === 0).sort((a, b) => a.step - b.step);
    const h = harmonize(mel, length, song.meter, { pickup: song.pickup || 0, style: song.accomp, key: song.key });
    all.push(...h.notes); key = h.key;
  }
  all.sort((a, b) => a.step - b.step || a.midi - b.midi);
  return { id: song.id, title: song.title, credit: song.credit, bpm: song.bpm, meter: song.meter, steps: length, notes: all, key };
}
