// Loss mechanisms of a vibrating tine. Each returns a loss factor eta
// (= 1/Q); they add.  T60 = 6.91 / (pi f eta).
import { AIR } from './constants.js';

// Zener thermoelastic damping of a beam of thickness t.
export function tedLoss(f, mat, t) {
  const kappa = mat.k / (mat.rho * mat.cp);              // thermal diffusivity
  const fr = (Math.PI * kappa) / (2 * t * t);             // relaxation peak
  const delta = (mat.E * mat.alpha * mat.alpha * AIR.T0) / (mat.rho * mat.cp);
  const r = f / fr;
  return { eta: (delta * r) / (1 + r * r), fPeak: fr, strength: delta };
}

// Viscous + acoustic boundary-layer drag on a thin strip (Hosaka et al.):
// drag per unit length c' = 3 pi mu + (3/4) pi w sqrt(2 rho_a mu omega).
// massPerLen includes any lead weight averaged along the tine.
export function airLoss(f, w, massPerLen) {
  const om = 2 * Math.PI * f;
  const c = 3 * Math.PI * AIR.mu + 0.75 * Math.PI * w * Math.sqrt(2 * AIR.rho * AIR.mu * om);
  return c / (massPerLen * om);
}

// Acoustic radiation damping: power radiated by the tine's own dipole.
// Point dipole of moment D (m^4/s, i.e. volume velocity x separation).
export function radiationLoss(f, psi) {
  // P = rho w^4 |D|^2 / (24 pi c^3) (peak amplitudes), |D| = (pi/4) psi w q,
  // modal energy E = w^2 q^2 / 2  ->  eta = P/(w E)
  const om = 2 * Math.PI * f;
  return (AIR.rho * om ** 3 * (Math.PI / 4) ** 2 * psi * psi) / (12 * Math.PI * AIR.c ** 3);
}

// Energy leaking into the comb base: eta = omega * gamma^2 * Re(Y_base)
export function supportLoss(f, gamma, reY) {
  return 2 * Math.PI * f * gamma * gamma * reY(f);
}

export function tineModeLoss(f, mat, geo) {
  const material = mat.eta;
  const ted = tedLoss(f, mat, geo.t).eta;
  const air = airLoss(f, geo.w, geo.massPerLen);
  const rad = radiationLoss(f, geo.psi);
  const support = geo.reY ? supportLoss(f, geo.gamma, geo.reY) : 0;
  const lead = geo.leadFrac ? 4e-4 * geo.leadFrac : 0;    // soldered joint & lead creep (soft solder, low strain)
  const eta = material + ted + air + rad + support + lead;
  return { eta, parts: { material, ted, air, rad, support, lead }, T60: 6.91 / (Math.PI * f * eta) };
}
