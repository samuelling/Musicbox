// Euler–Bernoulli finite-element model of a single comb tine: a tapered
// cantilever clamped at the comb root, optionally carrying a lead tuning
// weight (point mass + rotary inertia) at the tip.
//
// x runs from the root (x = 0) to the free tip (x = L).  Each node has a
// transverse displacement w and a slope theta = dw/dx.  Elements use cubic
// Hermite shape functions, giving the classic 4x4 stiffness and consistent
// mass matrices.  Section properties are evaluated at each element's
// midpoint, which converges quickly for smooth tapers.

import { generalizedEigen } from './linalg.js';

const GAUSS3 = [[-Math.sqrt(3 / 5), 5 / 9], [0, 8 / 9], [Math.sqrt(3 / 5), 5 / 9]];

export function section(spec, x) {
  const s = x / spec.L;
  const t = spec.t0 + (spec.t1 - spec.t0) * s;
  const w = spec.w0 + (spec.w1 - spec.w0) * s;
  return { t, w, A: t * w, I: (w * t * t * t) / 12 };
}

function hermite(xi, h) {
  // xi in [0,1]
  const x2 = xi * xi, x3 = x2 * xi;
  return [1 - 3 * x2 + 2 * x3, h * (xi - 2 * x2 + x3), 3 * x2 - 2 * x3, h * (-x2 + x3)];
}
function hermiteD(xi, h) {
  const x2 = xi * xi;
  return [(-6 * xi + 6 * x2) / h, 1 - 4 * xi + 3 * x2, (6 * xi - 6 * x2) / h, -2 * xi + 3 * x2];
}

export function assemble(spec) {
  const nel = spec.nel || 14;
  const nd = 2 * (nel + 1);
  const K = new Float64Array(nd * nd), M = new Float64Array(nd * nd);
  const h = spec.L / nel;
  for (let e = 0; e < nel; e++) {
    const sec = section(spec, (e + 0.5) * h);
    const EI = spec.E * sec.I, rA = spec.rho * sec.A;
    const k = EI / (h * h * h), m = (rA * h) / 420;
    const ke = [
      [12, 6 * h, -12, 6 * h], [6 * h, 4 * h * h, -6 * h, 2 * h * h],
      [-12, -6 * h, 12, -6 * h], [6 * h, 2 * h * h, -6 * h, 4 * h * h]];
    const me = [
      [156, 22 * h, 54, -13 * h], [22 * h, 4 * h * h, 13 * h, -3 * h * h],
      [54, 13 * h, 156, -22 * h], [-13 * h, -3 * h * h, -22 * h, 4 * h * h]];
    const base = 2 * e;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      K[(base + i) * nd + base + j] += k * ke[i][j];
      M[(base + i) * nd + base + j] += m * me[i][j];
    }
  }
  if (spec.tipMass) {
    const it = nd - 2, ir = nd - 1;
    M[it * nd + it] += spec.tipMass;
    M[ir * nd + ir] += spec.tipJ || 0;
    // lead block centre of mass sits a little behind the tip: couple w and theta
    const off = spec.tipOffset || 0;
    M[it * nd + ir] -= spec.tipMass * off; M[ir * nd + it] -= spec.tipMass * off;
    M[ir * nd + ir] += spec.tipMass * off * off;
  }
  return { K, M, nd, nel, h };
}

// Solve for the first nModes modes. Returns frequencies (Hz) and full DOF
// vectors (including the clamped root, zero) normalised so phi^T M phi = 1.
export function tineModes(spec, nModes = 5) {
  const { K, M, nd, nel, h } = assemble(spec);
  const n = nd - 2; // remove clamped w0, theta0
  const Kr = new Float64Array(n * n), Mr = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    Kr[i * n + j] = K[(i + 2) * nd + j + 2];
    Mr[i * n + j] = M[(i + 2) * nd + j + 2];
  }
  const { values, vectors } = generalizedEigen(Kr, Mr, n);
  const modes = [];
  for (let k = 0; k < Math.min(nModes, n); k++) {
    const dof = new Float64Array(nd);
    dof.set(vectors[k], 2);
    // sign convention: positive tip displacement
    if (dof[nd - 2] < 0) for (let i = 0; i < nd; i++) dof[i] = -dof[i];
    modes.push({ f: Math.sqrt(Math.max(values[k], 0)) / (2 * Math.PI), dof });
  }
  return { spec, nel, h, modes };
}

// Shape value and slope of mode k at position x (0..L)
export function shapeAt(model, k, x) {
  const { nel, h } = model;
  const dof = model.modes[k].dof;
  let e = Math.min(nel - 1, Math.max(0, Math.floor(x / h)));
  const xi = (x - e * h) / h;
  const N = hermite(xi, h), D = hermiteD(xi, h);
  const d = [dof[2 * e], dof[2 * e + 1], dof[2 * e + 2], dof[2 * e + 3]];
  let w = 0, s = 0;
  for (let i = 0; i < 4; i++) { w += N[i] * d[i]; s += D[i] * d[i]; }
  return { w, slope: s };
}

// Modal integrals used by the coupling and radiation models:
//   gamma  = ∫ rhoA phi dx  (+ tip mass phi_tip)          -> base shear
//   lambda = ∫ rhoA x phi dx (+ tip mass terms)           -> base moment
//   psi    = ∫ width(x)^2 phi dx                          -> acoustic dipole
//   mass   = total tine mass
export function modalIntegrals(model) {
  const { spec, nel, h } = model;
  const out = [];
  let mass = 0;
  for (let e = 0; e < nel; e++) {
    for (const [g, wg] of GAUSS3) {
      const xi = 0.5 * (g + 1), x = (e + xi) * h;
      mass += spec.rho * section(spec, x).A * wg * 0.5 * h;
    }
  }
  mass += spec.tipMass || 0;
  for (let k = 0; k < model.modes.length; k++) {
    let gamma = 0, lambda = 0, psi = 0;
    for (let e = 0; e < nel; e++) {
      for (const [g, wg] of GAUSS3) {
        const xi = 0.5 * (g + 1), x = (e + xi) * h;
        const sec = section(spec, x);
        const { w } = shapeAt(model, k, x);
        const dx = wg * 0.5 * h;
        gamma += spec.rho * sec.A * w * dx;
        lambda += spec.rho * sec.A * x * w * dx;
        psi += sec.w * sec.w * w * dx;
      }
    }
    if (spec.tipMass) {
      const tip = shapeAt(model, k, spec.L);
      const off = spec.tipOffset || 0;
      const wc = tip.w - off * tip.slope;
      gamma += spec.tipMass * wc;
      lambda += spec.tipMass * (spec.L - off) * wc + (spec.tipJ || 0) * tip.slope;
      psi += (spec.leadW || sec0(spec)) ** 2 * wc * (spec.leadL || 0);
    }
    out.push({ gamma, lambda, psi });
  }
  return { integrals: out, mass };
}
const sec0 = (spec) => spec.w1;

// Analytical first-mode frequency of a uniform cantilever (for checks & initial guesses)
export function uniformCantileverF1(L, w, t, E, rho) {
  const I = (w * t ** 3) / 12, A = w * t;
  return (1.8751040687 ** 2 / (2 * Math.PI * L * L)) * Math.sqrt((E * I) / (rho * A));
}

const LEAD_RHO = 11340;

// Find a tine that sounds targetHz.  Length is solved first (f ~ 1/L^2);
// if the required length exceeds Lmax, the length is capped and a lead tip
// weight is solved instead, as Swiss makers do for bass tines.
export function tuneTine(targetHz, base, nModes = 5) {
  const mk = (L, m) => {
    const leadH = 1.6e-3; // lead block soldered under the tip
    const leadL = m ? Math.min(0.45 * L, m / (LEAD_RHO * base.w * leadH)) : 0;
    return {
      ...base, L, w0: base.w, w1: base.w, nel: base.nel || 14,
      tipMass: m || 0,
      tipJ: m ? (m * (leadL * leadL + leadH * leadH)) / 12 + m * ((leadH + base.t1) / 2) ** 2 : 0,
      tipOffset: m ? leadL / 2 : 0, leadL, leadW: base.w, leadH,
    };
  };
  const tmean = 0.5 * (base.t0 + base.t1);
  let L = Math.sqrt((1.8751 ** 2 / (2 * Math.PI * targetHz)) * Math.sqrt((base.E * tmean * tmean) / (12 * base.rho)));
  let model;
  for (let it = 0; it < 12; it++) {
    model = tineModes(mk(L, 0), 1);
    const f = model.modes[0].f;
    const r = f / targetHz;
    L *= Math.sqrt(r);
    if (Math.abs(r - 1) < 2e-6) break;
  }
  let m = 0;
  if (L > base.Lmax) {
    L = base.Lmax;
    const tineMass = base.rho * tmean * base.w * L;
    let lo = 0, hi = tineMass * 0.5;
    const f1 = (mm) => tineModes(mk(L, mm), 1).modes[0].f;
    while (f1(hi) > targetHz && hi < tineMass * 400) hi *= 2;
    // bisection in log space for robustness
    for (let it = 0; it < 60; it++) {
      const mid = lo === 0 ? hi / 2 : Math.sqrt(lo * hi);
      if (f1(mid) > targetHz) lo = mid; else hi = mid;
      if (hi / Math.max(lo, 1e-12) < 1 + 1e-6) break;
    }
    m = 0.5 * (lo + hi);
  }
  const spec = mk(L, m);
  model = tineModes(spec, nModes);
  return model;
}
