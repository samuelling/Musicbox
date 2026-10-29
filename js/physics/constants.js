// Physical constants and presets. SI units throughout (m, kg, s, Pa, N).
// Values are handbook figures (room temperature); loss factors are the
// most uncertain numbers and are flagged as such in PHYSICS.md.

export const AIR = {
  rho: 1.204,        // kg/m^3 at 20 C
  c: 343.2,          // m/s
  mu: 1.81e-5,       // dynamic viscosity, Pa s
  T0: 293.15,        // K
};

// Tine materials.  E Young's modulus, rho density, alpha thermal expansion,
// k thermal conductivity, cp specific heat, eta intrinsic (material) loss
// factor at audio frequencies for the hardened/spring temper.
export const TINE_MATERIALS = {
  steel:   { name: 'Hardened carbon steel', E: 205e9, rho: 7850, alpha: 11.5e-6, k: 45,  cp: 475, eta: 2.6e-4, color: 0xb9c0c8 },
  brass:   { name: 'Spring brass (CuZn30)', E: 110e9, rho: 8530, alpha: 19.9e-6, k: 120, cp: 375, eta: 1.3e-3, color: 0xd8b25a },
  bronze:  { name: 'Phosphor bronze',       E: 115e9, rho: 8800, alpha: 18.0e-6, k: 62,  cp: 380, eta: 6.0e-4, color: 0xc48a4a },
  becu:    { name: 'Beryllium copper',      E: 128e9, rho: 8250, alpha: 17.0e-6, k: 105, cp: 420, eta: 2.2e-4, color: 0xd99a6c },
  titanium:{ name: 'Titanium Ti-6Al-4V',    E: 114e9, rho: 4430, alpha: 8.6e-6,  k: 6.7, cp: 526, eta: 1.8e-4, color: 0x9aa3ad },
  aluminum:{ name: 'Aluminium 7075-T6',     E: 71.7e9,rho: 2810, alpha: 23.4e-6, k: 130, cp: 960, eta: 1.5e-4, color: 0xd5d9de },
  glass:   { name: 'Borosilicate glass',    E: 64e9,  rho: 2230, alpha: 3.3e-6,  k: 1.14,cp: 830, eta: 4.0e-4, color: 0xcfe8ef },
};

// Plate materials. Orthotropic: EL along grain (x), ER across (y), G shear,
// nuLR major Poisson ratio.  Isotropic materials just set EL = ER.
export const PLATE_MATERIALS = {
  spruce:   { name: 'Sitka spruce',     EL: 11.0e9, ER: 0.85e9, G: 0.72e9, nu: 0.37, rho: 425,  eta: 0.008 },
  maple:    { name: 'Hard maple',       EL: 12.6e9, ER: 1.65e9, G: 1.10e9, nu: 0.42, rho: 705,  eta: 0.012 },
  walnut:   { name: 'Black walnut',     EL: 11.6e9, ER: 1.30e9, G: 0.98e9, nu: 0.45, rho: 610,  eta: 0.013 },
  rosewood: { name: 'Indian rosewood',  EL: 12.5e9, ER: 1.80e9, G: 1.20e9, nu: 0.40, rho: 830,  eta: 0.009 },
  cherry:   { name: 'Black cherry',     EL: 10.3e9, ER: 1.00e9, G: 0.95e9, nu: 0.39, rho: 560,  eta: 0.012 },
  oak:      { name: 'White oak',        EL: 12.3e9, ER: 1.45e9, G: 0.90e9, nu: 0.37, rho: 750,  eta: 0.015 },
  plywood:  { name: 'Birch plywood',    EL: 8.0e9,  ER: 5.0e9,  G: 0.60e9, nu: 0.08, rho: 680,  eta: 0.020 },
  abs:      { name: 'ABS plastic',      EL: 2.3e9,  ER: 2.3e9,  G: 0.85e9, nu: 0.35, rho: 1050, eta: 0.040 },
  zamak:    { name: 'Zinc alloy (Zamak 3)', EL: 96e9, ER: 96e9, G: 35e9,   nu: 0.27, rho: 6700, eta: 0.002 },
  glass:    { name: 'Tempered glass',   EL: 70e9,   ER: 70e9,   G: 28e9,   nu: 0.22, rho: 2500, eta: 0.0015 },
  marble:   { name: 'Marble',           EL: 50e9,   ER: 50e9,   G: 20e9,   nu: 0.25, rho: 2700, eta: 0.005 },
};

// Enclosures. Dimensions are outer box (x = along the comb, y = front/back,
// z = height). The movement is screwed to the floor panel, which is the
// soundboard.  cavity:false means there is no enclosed air volume.
export const ENCLOSURES = {
  bare: {
    name: 'Bare movement', boxed: false,
    plate: { mat: 'zamak', a: 0.078, b: 0.052, h: 0.003 },
    wall: 0, size: [0.078, 0.052, 0.022], caseMat: 'zamak', lidMat: null, leak: 0,
  },
  toy: {
    name: 'Plastic toy box', boxed: true,
    plate: { mat: 'abs', a: 0.11, b: 0.075, h: 0.0022 },
    wall: 0.0022, size: [0.115, 0.08, 0.05], caseMat: 'abs', lidMat: 'abs', lidH: 0.002, leak: 3e-4,
  },
  jewelry: {
    name: 'Walnut jewelry box', boxed: true,
    plate: { mat: 'walnut', a: 0.15, b: 0.10, h: 0.004 },
    wall: 0.007, size: [0.165, 0.115, 0.07], caseMat: 'walnut', lidMat: 'walnut', lidH: 0.005, leak: 2.5e-4,
  },
  classic: {
    name: 'Maple box, spruce soundboard', boxed: true,
    plate: { mat: 'spruce', a: 0.19, b: 0.13, h: 0.003 },
    wall: 0.008, size: [0.206, 0.146, 0.085], caseMat: 'maple', lidMat: 'maple', lidH: 0.006, leak: 3.5e-4,
  },
  swiss: {
    name: 'Swiss rosewood cabinet', boxed: true,
    plate: { mat: 'spruce', a: 0.40, b: 0.20, h: 0.0035 },
    wall: 0.012, size: [0.424, 0.224, 0.14], caseMat: 'rosewood', lidMat: 'rosewood', lidH: 0.008, leak: 6e-4,
  },
};

// What the box sits on.  plate:null means held in the air.
export const SURFACES = {
  hand:      { name: 'Held in your hand', plate: null, height: 1.15, feet: 'hand' },
  oak:       { name: 'Oak table',      plate: { mat: 'oak', a: 1.40, b: 0.85, h: 0.028 }, height: 0.75, feet: 'felt' },
  oakHard:   { name: 'Oak table (no felt feet)', plate: { mat: 'oak', a: 1.40, b: 0.85, h: 0.028 }, height: 0.75, feet: 'hard' },
  glass:     { name: 'Glass table',    plate: { mat: 'glass', a: 1.20, b: 0.70, h: 0.010 }, height: 0.74, feet: 'hard' },
  marble:    { name: 'Marble counter', plate: { mat: 'marble', a: 2.00, b: 0.60, h: 0.030 }, height: 0.91, feet: 'hard' },
  resonator: { name: 'Spruce resonance box', plate: { mat: 'spruce', a: 0.46, b: 0.30, h: 0.003 }, height: 0.78, feet: 'hard', baffled: true },
};

// Foot contact: stiffness per foot (N/m) and damping ratio of the box bouncing on them.
export const FEET = {
  felt: { name: 'Felt pads', k: 3.0e4, zeta: 0.30 },
  hard: { name: 'Hard wood feet', k: 3.0e6, zeta: 0.04 },
  hand: { name: 'Your hand', k: 2.5e3, zeta: 0.6, plateDamp: 0.03 },
};

// Rooms: dimensions (m), absorption coefficient at low and high frequency
// for the boundaries, and the floor material for the ground reflection.
export const ROOMS = {
  anechoic: { name: 'Anechoic chamber', dims: [8, 8, 6], alpha: [1, 1], floor: [1, 1], walls: false, reverb: false },
  outdoors: { name: 'Garden (outdoors)', dims: [30, 30, 30], alpha: [1, 1], floor: [0.25, 0.55], walls: false, reverb: false },
  nursery:  { name: 'Nursery (carpet, curtains)', dims: [3.6, 3.2, 2.5], alpha: [0.22, 0.45], floor: [0.25, 0.5], walls: true, reverb: true },
  living:   { name: 'Living room', dims: [5.6, 4.3, 2.7], alpha: [0.16, 0.32], floor: [0.12, 0.25], walls: true, reverb: true },
  parlor:   { name: 'Wood-panelled parlour', dims: [8.0, 6.0, 3.4], alpha: [0.09, 0.16], floor: [0.08, 0.12], walls: true, reverb: true },
  chapel:   { name: 'Stone chapel', dims: [22, 11, 9], alpha: [0.06, 0.10], floor: [0.03, 0.05], walls: true, reverb: true },
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const noteName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const midiToHz = (m, a4 = 440) => a4 * Math.pow(2, (m - 69) / 12);
export function parseNote(s) {
  const mm = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(s.trim());
  if (!mm) return null;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[mm[1].toLowerCase()];
  const acc = mm[2] === '#' ? 1 : mm[2] === 'b' ? -1 : 0;
  return (parseInt(mm[3], 10) + 1) * 12 + base + acc;
}

const range = (lo, hi, steps) => {
  const out = []; for (let m = lo; m <= hi; m++) if (!steps || steps.includes(((m % 12) + 12) % 12)) out.push(m); return out;
};
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

// Comb presets.  notes: list of MIDI pitches (duplicates allowed), or
// 'tune' to build the comb from the loaded tune like a Swiss arranger.
// Geometry: tine width w, root/tip thickness, max free length before a
// lead weight is needed, cylinder radius R and length.
export const COMBS = {
  c15: {
    name: '15-tine diatonic (C major)', notes: range(72, 96, MAJOR),
    w: 1.55e-3, t0: 0.52e-3, t1: 0.44e-3, Lmax: 19e-3, gap: 0.45e-3, R: 6.5e-3, grade: 0,
    springTurns: 6, springTorque: 0.045, crankGear: 24,
  },
  c18t: {
    name: '18-tine, tuned to the tune', notes: 'tune', count: 18, lo: 67, hi: 98,
    w: 1.45e-3, t0: 0.50e-3, t1: 0.42e-3, Lmax: 19e-3, gap: 0.40e-3, R: 7.5e-3, grade: 0.08,
    springTurns: 7, springTorque: 0.05, crankGear: 24,
  },
  c30: {
    name: '30-tine chromatic (F4–A#6)', notes: range(65, 94),
    w: 1.30e-3, t0: 0.50e-3, t1: 0.40e-3, Lmax: 22e-3, gap: 0.35e-3, R: 9e-3, grade: 0.1,
    springTurns: 8, springTorque: 0.08, crankGear: 28,
  },
  c50: {
    name: '50-tine Swiss (G3–C7, lead-weighted bass)',
    notes: [...range(55, 96), 72, 74, 76, 77, 79, 81, 83, 84].sort((a, b) => a - b),
    w: 1.15e-3, t0: 0.55e-3, t1: 0.42e-3, Lmax: 26e-3, gap: 0.30e-3, R: 14e-3, grade: 0.16,
    springTurns: 10, springTorque: 0.20, crankGear: 36,
  },
  c72t: {
    name: '72-tine grand, tuned to the tune', notes: 'tune', count: 72, lo: 43, hi: 98,
    w: 1.0e-3, t0: 0.58e-3, t1: 0.44e-3, Lmax: 30e-3, gap: 0.26e-3, R: 22e-3, grade: 0.2,
    springTurns: 12, springTorque: 0.45, crankGear: 40,
  },
};

// Pin and engagement defaults (cylinder pins are hardened steel wire).
export const PIN = {
  d: 0.42e-3,        // wire diameter
  h: 0.95e-3,        // protrusion above the cylinder surface
  edge: 0.035e-3,    // radius of the cut end's edge
  E: 205e9,
  engage: 0.35e-3,   // radial overlap of tine tip into the pin circle
  mu: 0.14,          // lubricated steel-on-steel friction
  tipAngle: 32,      // degrees above horizontal where the tine tips sit
  combTilt: 25,      // degrees the tines are tilted away from tangent
};
