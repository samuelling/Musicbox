// Assemble every physical sub-model into one "patch" that the audio
// worklet integrates in real time, plus a human-readable report for the UI.

import { TINE_MATERIALS, PLATE_MATERIALS, ENCLOSURES, SURFACES, FEET, ROOMS, COMBS, PIN, AIR, midiToHz, noteName } from './constants.js';
import { tuneTine, modalIntegrals, shapeAt } from './beam.js';
import { tineModeLoss } from './damping.js';
import { plateModes } from './plate.js';
import { driveParams } from './drive.js';

const D2R = Math.PI / 180;

// FEM tuning is the expensive part of a rebuild; cache it per tine design.
const TINE_CACHE = new Map();
function tunedTine(f0, base) {
  const key = [f0.toFixed(5), base.w, base.t0.toPrecision(6), base.t1.toPrecision(6), base.E, base.rho, base.Lmax].join('|');
  let m = TINE_CACHE.get(key);
  if (!m) {
    m = tuneTine(f0, base, 5);
    TINE_CACHE.set(key, m);
    if (TINE_CACHE.size > 600) TINE_CACHE.delete(TINE_CACHE.keys().next().value);
  }
  return m;
}

// Exact zero-order-hold discretisation of q'' + 2 z w q' + w^2 q = f
export function zoh(f, zeta, dt) {
  const w = 2 * Math.PI * f;
  const wd = w * Math.sqrt(1 - zeta * zeta);
  const e = Math.exp(-zeta * w * dt), c = Math.cos(wd * dt), s = Math.sin(wd * dt);
  const A11 = e * (c + ((zeta * w) / wd) * s);
  const A12 = (e * s) / wd;
  const A21 = (-e * w * w * s) / wd;
  const A22 = e * (c - ((zeta * w) / wd) * s);
  return { A11, A12, A21, A22, B1: (1 - A11) / (w * w), B2: A12 };
}

function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function gauss(rnd) { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); }

export const DEFAULT_CONFIG = {
  sr: 48000, comb: 'c30', material: 'steel', enclosure: 'classic', surface: 'oak', room: 'living',
  lid: 'open', dampers: true, engage: PIN.engage, pinEdge: PIN.edge, tipAngle: PIN.tipAngle, combTilt: PIN.combTilt,
  thickness: 1, length: 1, a4: 440, detune: 0, quality: 'high', airBrake: 1, noise: 1, gain: 1,
};

// Geometry of tine tip and pins in the cylinder cross-section (y,z), cylinder axis at origin.
export function contactGeometry(R, cfg) {
  const rho = R + PIN.h;
  const e = cfg.engage;
  const rt = rho - e;
  const phT = cfg.tipAngle * D2R, beta = cfg.combTilt * D2R;
  const T = [rt * Math.cos(phT), rt * Math.sin(phT)];
  const u = [Math.sin(phT + beta), -Math.cos(phT + beta)];   // tip -> root
  const n = [Math.cos(phT + beta), Math.sin(phT + beta)];    // bending direction (pin pushes along +n)
  const hd = PIN.d / 2, re = Math.min(cfg.pinEdge, 0.95 * hd);
  // Release: trailing edge of the pin passes the tine tip
  const phiRel = phT + Math.asin(Math.min(0.9, hd / rt)) + 0.004;
  // First contact: leading pin corner reaches the undeflected underside.
  const lcGlobal = Math.sqrt(2 * rho * e) * 1.35 + PIN.d;
  let phiStart = phiRel - 0.05;
  for (let ph = phiRel - 1.4; ph < phiRel; ph += 0.0005) {
    const d = [Math.cos(ph), Math.sin(ph)], p = [-Math.sin(ph), Math.cos(ph)];
    const C = [(rho - re) * d[0] + (hd - re) * p[0], (rho - re) * d[1] + (hd - re) * p[1]];
    const rel = [C[0] - T[0], C[1] - T[1]];
    const s = rel[0] * u[0] + rel[1] * u[1];
    const h = rel[0] * n[0] + rel[1] * n[1];
    if (s >= 0 && s <= lcGlobal && h + re > 0) { phiStart = ph; break; }
  }
  return {
    R, rho, e, T, u, n, hd, re, phiRel,
    winStart: phiStart - phiRel - 0.03, winEnd: 0.14,
    lcGlobal, slideAngle: phiRel - phiStart,
  };
}

export function buildModel(cfgIn, combNotes, arrangement) {
  const cfg = { ...DEFAULT_CONFIG, ...cfgIn };
  const sr = cfg.sr, dt = 1 / sr;
  const comb = COMBS[cfg.comb];
  const mat = TINE_MATERIALS[cfg.material];
  const enc = ENCLOSURES[cfg.enclosure];
  const surf = SURFACES[cfg.surface];
  const feet = FEET[surf.feet];
  const room = ROOMS[cfg.room];
  const hq = cfg.quality !== 'eco';
  const maxTineModes = hq ? 4 : 3;
  const fTop = Math.min(0.42 * sr, 19500);
  const rnd = seeded(1234567);

  // ---------- tines ----------
  const N = combNotes.length;
  const fTopNote = midiToHz(Math.max(...combNotes), cfg.a4);
  const tines = [];
  let pitch = 1.0;
  for (let i = 0; i < N; i++) {
    const midi = combNotes[i];
    const cents = cfg.detune ? gauss(rnd) * cfg.detune : 0;
    const f0 = midiToHz(midi, cfg.a4) * Math.pow(2, cents / 1200);
    const grade = Math.pow(f0 / fTopNote, comb.grade);
    const base = {
      // Length scale k at constant pitch: f ∝ t/L², so L -> kL needs t -> k²t (and the
      // comb's maximum free length scales with it, so lead-weighting is preserved).
      w: comb.w, t0: comb.t0 * grade * cfg.thickness * cfg.length ** 2, t1: comb.t1 * grade * cfg.thickness * cfg.length ** 2,
      E: mat.E, rho: mat.rho, Lmax: comb.Lmax * cfg.length, nel: 14,
    };
    const model = tunedTine(f0, base);
    const { integrals, mass } = modalIntegrals(model);
    const spec = model.spec;
    const tmean = 0.5 * (spec.t0 + spec.t1);
    const massPerLen = mass / spec.L;
    const modes = [];
    for (let k = 0; k < model.modes.length && modes.length < maxTineModes; k++) {
      const f = model.modes[k].f;
      if (f > fTop) break;
      const tip = shapeAt(model, k, spec.L);
      const leadFrac = spec.tipMass ? spec.tipMass * tip.w * tip.w : 0;
      const loss = tineModeLoss(f, mat, { t: tmean, w: spec.w1, massPerLen, psi: integrals[k].psi, gamma: integrals[k].gamma, leadFrac });
      modes.push({ k, f, loss, ...integrals[k] });
    }
    tines.push({ midi, f0, cents, model, spec, mass, modes, tmean });
    pitch = f0;
  }

  // ---------- cylinder sizing so pins fit ----------
  const tineW = comb.w, pitchX = comb.w + comb.gap;
  const combLen = N * pitchX + 6e-3;
  let R = comb.R;
  const minSep = arrangement.minSeparation; // minimum same-tine separation in revolution fraction
  let geom = contactGeometry(R, cfg);
  if (minSep > 0) {
    for (let iter = 0; iter < 40; iter++) {
      const need = (geom.slideAngle + 0.05) / (2 * Math.PI);
      if (need <= 0.85 * minSep || R >= comb.R * 1.35) break;
      R *= 1.06; geom = contactGeometry(R, cfg);
    }
  }
  // pins lost because they arrive while the previous pin still holds the tine
  const lostWindow = (geom.slideAngle + 0.03) / (2 * Math.PI);
  let lost = 0;
  for (const list of arrangement.pins) {
    for (let j = 1; j < list.length; j++) if (list[j] - list[j - 1] < lostWindow) lost++;
    if (list.length > 1 && 1 + list[0] - list[list.length - 1] < lostWindow) lost++;
  }

  // ---------- drive ----------
  // A stiffer comb needs a stronger mainspring: pluck work ∝ tip stiffness ∝ length³ at
  // constant lift (t ∝ L², k_tip ∝ t³/L³), so the maker fits a spring scaled to match.
  const springScale = Math.pow(cfg.length, 3) * Math.pow(cfg.thickness, 1.5);
  const drive = driveParams({ R, cylLen: combLen + 8e-3, Trev: arrangement.Trev, comb: { ...comb, springTorque: comb.springTorque * springScale }, airBrake: cfg.airBrake });

  // ---------- bedplate (comb bar + cylinder + cast bedplate as one rigid body) ----------
  const steel = 7850, zinc = 6700;
  const combDepth = 9e-3, combThick = 2.8e-3;
  const mComb = steel * combLen * combDepth * combThick;
  const bedLen = combLen + 22e-3, bedDep = 2 * R + 40e-3;
  const mBedCast = enc.boxed || cfg.enclosure !== 'bare' ? zinc * bedLen * bedDep * 3.2e-3 : 0;
  const mBed = mComb + drive.mCyl + mBedCast + 0.012;
  const Jx = (mBed * (bedDep * bedDep + 0.02 ** 2)) / 12, Jy = (mBed * (bedLen * bedLen)) / 12;
  // Cylinder axis relative to bedplate centre (box coords: y front/back, z up)
  const axisY = -bedDep / 2 + R + 12e-3, axisZ = R + 7e-3;
  // Tine root positions and moment levers
  const [ny, nz] = geom.n, [uy, uz] = geom.u;

  // ---------- soundboard plate ----------
  const plateExtra = surf.feet === 'hand' ? FEET.hand.plateDamp : 0;
  const fmaxPlate = Math.min(hq ? 9000 : 6000, 0.42 * sr);
  const sb = plateModes(enc.plate, fmaxPlate, hq ? 44 : 24, plateExtra);
  // bedplate footprint on the soundboard (offset from centre to avoid symmetry nodes)
  const bx = sb.a * 0.52, by = sb.b * 0.56;
  const half = (v, lim) => Math.min(v, lim);
  const sxh = half(bedLen / 2 - 4e-3, sb.a * 0.46), syh = half(bedDep / 2 - 4e-3, sb.b * 0.42);
  const screws = [[-sxh, -syh], [sxh, -syh], [sxh, syh], [-sxh, syh]];
  let ks = cfg.enclosure === 'bare' ? 1.5e6 : 4e5;
  // keep the explicit coupling stable: w_c dt < 0.9
  let sumPsi2 = 0;
  for (const [sx, sy] of screws) { let s2 = 0; for (const md of sb.modes) s2 += sb.psiAt(md, bx + sx, by + sy) ** 2; sumPsi2 = Math.max(sumPsi2, s2); }
  const ksMax = (0.9 * sr) ** 2 / (sumPsi2 + 4 / mBed);
  ks = Math.min(ks, ksMax);
  const cs = 2 * 0.06 * Math.sqrt(ks * (1 / (sumPsi2 + 1e-9)));

  // support-loss mobility for the tines: bedplate mass on the plate
  const reY = (f) => { const w = 2 * Math.PI * f; const Z = sb.Zinf; return Z / (w * w * mBed * mBed + Z * Z); };
  for (const t of tines) for (const md of t.modes) {
    const sup = 2 * Math.PI * md.f * md.gamma * md.gamma * reY(md.f);
    md.loss.parts.support = sup; md.loss.eta += sup; md.loss.T60 = 6.91 / (Math.PI * md.f * md.loss.eta);
  }

  // ---------- cavity ----------
  const caseMat = PLATE_MATERIALS[enc.caseMat];
  const [Lx, Ly, Lz] = enc.size;
  let cavity = { on: false };
  let lid = { leak: 1, fc: 0 };
  let mFrame, Vbox = Lx * Ly * Lz;
  if (enc.boxed) {
    const w = enc.wall;
    const Vin = Math.max(1e-5, (Lx - 2 * w) * (Ly - 2 * w) * (Lz - 2 * w) - combLen * 0.035 * 0.03);
    const shell = Lx * Ly * Lz - (Lx - 2 * w) * (Ly - 2 * w) * (Lz - 2 * w);
    mFrame = caseMat.rho * shell;
    let A, Leff, Q;
    if (cfg.lid === 'open') { A = (Lx - 2 * w) * (Ly - 2 * w) * 0.85; Leff = 0.6 * Math.sqrt(A / Math.PI); Q = 1.6; }
    else { A = enc.leak; Leff = w + 1.6 * Math.sqrt(A / Math.PI); Q = 7; }
    const ma = (AIR.rho * Leff) / A;
    const kc = (AIR.rho * AIR.c * AIR.c) / Vin;
    const fH = (AIR.c / (2 * Math.PI)) * Math.sqrt(A / (Vin * Leff));
    cavity = { on: true, V: Vin, A, Leff, ma, kc, Ra: (2 * Math.PI * fH * ma) / Q, fH };
    if (cfg.lid === 'closed') {
      const lidMat = PLATE_MATERIALS[enc.lidMat];
      const msurf = lidMat.rho * enc.lidH;
      lid = { leak: Math.min(0.5, Math.sqrt(enc.leak / ((Lx - 2 * w) * (Ly - 2 * w)))), fc: Math.pow(10, 47 / 20) / msurf };
    }
  } else {
    mFrame = 0.004;
  }
  const mTotal = mFrame + sb.mass + mBed;

  // ---------- surface / table ----------
  const kFeet = feet.k * 4;
  const cFeet = 2 * feet.zeta * Math.sqrt(kFeet * mTotal);
  let table = null;
  if (surf.plate) {
    const tp = plateModes(surf.plate, Math.min(hq ? 5000 : 3000, 0.42 * sr), hq ? 48 : 24, 0);
    const px = tp.a * 0.43, py = tp.b * 0.47;
    table = {
      tp, px, py,
      unbaffled: !surf.baffled,
      deff: 0.85 * Math.sqrt((tp.a * tp.b) / Math.PI),
    };
  }

  // ---------- room placement ----------
  const [RX, RY, RZ] = room.dims;
  let boxPos, held = surf.plate === null;
  const tableXY = [RX * 0.42, RY * 0.4];
  if (!held) boxPos = [tableXY[0], tableXY[1], surf.height + Lz / 2];
  else boxPos = null; // follows the listener

  // ---------- pack the patch ----------
  const tineCount = N;
  const nm = new Int32Array(tineCount), base = new Int32Array(tineCount);
  let total = 0;
  for (let i = 0; i < N; i++) { nm[i] = tines[i].modes.length; base[i] = total; total += nm[i]; }
  const K = 16;
  const A11 = new Float64Array(total), A12 = new Float64Array(total), A21 = new Float64Array(total), A22 = new Float64Array(total), B1 = new Float64Array(total), B2 = new Float64Array(total);
  const SUB = 2; // contact substeps
  const sA11 = new Float64Array(total), sA12 = new Float64Array(total), sA21 = new Float64Array(total), sA22 = new Float64Array(total), sB1 = new Float64Array(total), sB2 = new Float64Array(total);
  const GAM = new Float64Array(total), LAM = new Float64Array(total), PSI = new Float64Array(total);
  const PHI = new Float64Array(total * K);
  const lc = new Float64Array(N), xPos = new Float64Array(N), lever = new Float64Array(N), meff = new Float64Array(N), damper = new Uint8Array(N);
  const tineInfo = [];
  for (let i = 0; i < N; i++) {
    const t = tines[i];
    const L = t.spec.L;
    lc[i] = Math.min(0.55 * L, geom.lcGlobal);
    xPos[i] = (i - (N - 1) / 2) * pitchX;
    const rootY = axisY + geom.T[0] + L * uy, rootZ = axisZ + geom.T[1] + L * uz;
    lever[i] = ny * rootZ - nz * rootY;
    meff[i] = 0.24 * t.mass + (t.spec.tipMass || 0) * 0.8;
    damper[i] = cfg.dampers && t.f0 < 1400 ? 1 : 0;
    for (let k = 0; k < nm[i]; k++) {
      const md = t.modes[k], idx = base[i] + k;
      const z = zoh(md.f, md.loss.eta / 2, dt);
      A11[idx] = z.A11; A12[idx] = z.A12; A21[idx] = z.A21; A22[idx] = z.A22; B1[idx] = z.B1; B2[idx] = z.B2;
      const zs = zoh(md.f, md.loss.eta / 2, dt / SUB);
      sA11[idx] = zs.A11; sA12[idx] = zs.A12; sA21[idx] = zs.A21; sA22[idx] = zs.A22; sB1[idx] = zs.B1; sB2[idx] = zs.B2;
      GAM[idx] = md.gamma; LAM[idx] = md.lambda; PSI[idx] = md.psi;
      for (let j = 0; j < K; j++) {
        const s = (j / (K - 1)) * lc[i];
        PHI[idx * K + j] = shapeAt(t.model, md.k, L - s).w;
      }
    }
    tineInfo.push({
      i, midi: t.midi, name: noteName(t.midi), f0: t.f0, cents: t.cents,
      L: L, t0: t.spec.t0, t1: t.spec.t1, w: t.spec.w0, lead: t.spec.tipMass || 0, leadL: t.spec.leadL || 0,
      mass: t.mass, damper: !!damper[i], x: xPos[i], rootY, rootZ,
      modes: t.modes.map((md) => ({ f: md.f, ratio: md.f / t.modes[0].f, T60: md.loss.T60, eta: md.loss.eta, parts: md.loss.parts, gamma: md.gamma })),
      allModes: t.model.modes.map((md) => md.f),
      shapes: t.model.modes.slice(0, 4).map((_, k) => Array.from({ length: 33 }, (_, j) => shapeAt(t.model, k, (j / 32) * L).w)),
    });
  }

  const pins = arrangement.pins.map((list) => Float64Array.from(list.map((x) => x * 2 * Math.PI)));

  const packPlate = (pl, pts, sign) => {
    const n = pl.modes.length;
    const P = { n, A11: new Float64Array(n), A12: new Float64Array(n), A21: new Float64Array(n), A22: new Float64Array(n), B1: new Float64Array(n), B2: new Float64Array(n), W: new Float64Array(n), Dx: new Float64Array(n), Dy: new Float64Array(n), psi: new Float64Array(n * pts.length), npts: pts.length, rhoh: pl.rhoh, mass: pl.mass, f: new Float64Array(n) };
    pl.modes.forEach((md, k) => {
      const z = zoh(md.f, md.zeta, dt);
      P.A11[k] = z.A11; P.A12[k] = z.A12; P.A21[k] = z.A21; P.A22[k] = z.A22; P.B1[k] = z.B1; P.B2[k] = z.B2;
      P.W[k] = md.W; P.Dx[k] = md.Dx * sign; P.Dy[k] = md.Dy * sign; P.f[k] = md.f;
      pts.forEach(([x, y], j) => { P.psi[k * pts.length + j] = pl.psiAt(md, x, y); });
    });
    return P;
  };

  const patch = {
    sr,
    geom: {
      R: geom.R, rho: geom.rho, Ty: geom.T[0], Tz: geom.T[1], uy, uz, ny, nz, hd: geom.hd, re: geom.re,
      phiRel: geom.phiRel, winStart: geom.winStart, winEnd: geom.winEnd,
      kHertz: 4e6, kAxial: (PIN.E * Math.PI * PIN.d * PIN.d) / 4 / PIN.h, kBend: (3 * PIN.E * Math.PI * PIN.d ** 4) / 64 / PIN.h ** 3,
      mu: PIN.mu, zetaC: 0.6, beta: 0.1, maxPen: 60e-6, contactDamp: 900, damperWin: 0.22, damperRate: 900,
    },
    tines: { N, nm, base, K, A11, A12, A21, A22, B1, B2, SUB, sA11, sA12, sA21, sA22, sB1, sB2, GAM, LAM, PSI, PHI, lc, xPos, lever, meff, damper, pins },
    bed: { m: mBed, Jx, Jy, screws: Float64Array.from(screws.flat()), ks, cs },
    plate: packPlate(sb, screws.map(([sx, sy]) => [bx + sx, by + sy]), -1),
    plateUnbaffled: !enc.boxed, plateDeff: 0.85 * Math.sqrt((sb.a * sb.b) / Math.PI),
    cavity, lid,
    frame: { m: mFrame + sb.mass, kf: kFeet, cf: cFeet, V: Vbox, held },
    table: table ? { ...packPlate(table.tp, [[table.px, table.py]], 1), unbaffled: table.unbaffled, deff: table.deff } : null,
    drive,
    room: {
      dims: room.dims, alpha: room.alpha, floor: room.floor, walls: room.walls, reverb: room.reverb,
      boxPos, tableTop: surf.plate ? surf.height : null, held, boxYaw: cfg.boxYaw || 0,
    },
    noise: cfg.noise, gain: cfg.gain,
  };

  const info = {
    tines: tineInfo,
    cylinder: { R, combLen, slideDeg: (geom.slideAngle * 180) / Math.PI, lostPins: lost, pinCount: pins.reduce((s, p) => s + p.length, 0) },
    plate: { name: PLATE_MATERIALS[enc.plate.mat].name, modes: sb.modes.slice(0, 24).map((m) => ({ f: m.f, m: m.m, n: m.n })), count: sb.modes.length, fc: sb.fCoincidence, mass: sb.mass },
    bed: { mass: mBed, ks },
    cavity, lid,
    table: table ? { name: PLATE_MATERIALS[surf.plate.mat].name, count: table.tp.modes.length, first: table.tp.modes.slice(0, 6).map((m) => m.f), fc: table.tp.fCoincidence } : null,
    drive: drive.info, driveP: drive, Trev: arrangement.Trev,
    feet: feet.name, mTotal,
  };
  return { patch, info, cfg };
}
