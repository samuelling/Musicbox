// Scales for quantised composing. Intervals are semitones above the root (12-TET).
export const SCALE_GROUPS = [
  ['', [
    ['chromatic', 'Chromatic (all 12)', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
  ]],
  ['Major & minor', [
    ['major', 'Major', [0, 2, 4, 5, 7, 9, 11]],
    ['minor', 'Natural minor', [0, 2, 3, 5, 7, 8, 10]],
    ['harmonic', 'Harmonic minor', [0, 2, 3, 5, 7, 8, 11]],
    ['melodic', 'Melodic minor', [0, 2, 3, 5, 7, 9, 11]],
  ]],
  ['Pentatonic & blues', [
    ['penta', 'Major pentatonic', [0, 2, 4, 7, 9]],
    ['pentaMin', 'Minor pentatonic', [0, 3, 5, 7, 10]],
    ['blues', 'Blues', [0, 3, 5, 6, 7, 10]],
  ]],
  ['Church modes', [
    ['dorian', 'Dorian', [0, 2, 3, 5, 7, 9, 10]],
    ['phrygian', 'Phrygian', [0, 1, 3, 5, 7, 8, 10]],
    ['lydian', 'Lydian', [0, 2, 4, 6, 7, 9, 11]],
    ['mixolydian', 'Mixolydian', [0, 2, 4, 5, 7, 9, 10]],
    ['locrian', 'Locrian', [0, 1, 3, 5, 6, 8, 10]],
  ]],
  ['Jewish & Middle Eastern', [
    ['freygish', 'Freygish / Ahava Rabbah', [0, 1, 4, 5, 7, 8, 10]],
    ['misheberakh', 'Mi Sheberakh (Ukrainian Dorian)', [0, 2, 3, 6, 7, 9, 10]],
    ['hijazkar', 'Double harmonic (Hijaz Kar)', [0, 1, 4, 5, 7, 8, 11]],
    ['hungarian', 'Hungarian minor', [0, 2, 3, 6, 7, 8, 11]],
  ]],
  ['East Asian', [
    ['hirajoshi', 'Hirajōshi', [0, 2, 3, 7, 8]],
    ['in', 'In (Miyako-bushi)', [0, 1, 5, 7, 8]],
    ['yo', 'Yo', [0, 2, 5, 7, 9]],
    ['gong', 'Chinese gong (pentatonic)', [0, 2, 4, 7, 9]],
  ]],
  ['Symmetric', [
    ['whole', 'Whole tone', [0, 2, 4, 6, 8, 10]],
    ['dim', 'Diminished (half–whole)', [0, 1, 3, 4, 6, 7, 9, 10]],
    ['augmented', 'Augmented', [0, 3, 4, 7, 8, 11]],
    ['prometheus', 'Prometheus', [0, 2, 4, 6, 9, 10]],
  ]],
];
export const SCALES = Object.fromEntries(SCALE_GROUPS.flatMap(([, list]) => list.map(([id, name, iv]) => [id, { name, iv }])));
export const ROOTS = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

// pitch classes in the scale, or null for chromatic
export function scaleSet(id, root) {
  const s = SCALES[id];
  if (!s || s.iv.length === 12) return null;
  return new Set(s.iv.map((i) => (i + root) % 12));
}
// scale degree (1-based) of a MIDI note, or 0 if outside the scale
export function degreeOf(midi, id, root) {
  const s = SCALES[id]; if (!s) return 0;
  const k = s.iv.indexOf((((midi - root) % 12) + 12) % 12);
  return k + 1;
}
// nearest in-scale pitch (ties go down, which keeps leading tones from jumping a step up)
export function snapToScale(midi, set) {
  if (!set) return midi;
  const pc = (m) => ((m % 12) + 12) % 12;
  for (let d = 0; d <= 6; d++) { if (set.has(pc(midi - d))) return midi - d; if (set.has(pc(midi + d))) return midi + d; }
  return midi;
}
