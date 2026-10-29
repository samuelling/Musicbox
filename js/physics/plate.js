// Modal model of a thin rectangular orthotropic plate, simply supported on
// all four edges (a reasonable idealisation of a box panel glued into its
// frame, and of a table top resting on an apron).
//
//   f_mn = (pi/2) sqrt( [D1 (m/a)^4 + 2 D3 (m/a)^2 (n/b)^2 + D2 (n/b)^4] / (rho h) )
//   D1 = EL h^3 / 12(1-nuLR nuRL),  D2 = ER h^3 / 12(1-nuLR nuRL),
//   D3 = nuRL D1 + 2 Dk,  Dk = G h^3 / 12
//   psi_mn(x,y) = 2/sqrt(rho h a b) sin(m pi x/a) sin(n pi y/b)   (mass-normalised)
//
// For radiation we need, per mode, the net volume displacement W = ∫psi dA
// (monopole) and the first moments ∫(x-a/2) psi dA, ∫(y-b/2) psi dA
// (in-plane dipoles of the velocity distribution).

import { PLATE_MATERIALS } from './constants.js';

export function plateModes(p, fmax, nmax, extraEta = 0) {
  const mat = PLATE_MATERIALS[p.mat];
  const { a, b, h } = p;
  const nuRL = (mat.nu * mat.ER) / mat.EL;
  const den = 12 * (1 - mat.nu * nuRL);
  const D1 = (mat.EL * h ** 3) / den, D2 = (mat.ER * h ** 3) / den;
  const Dk = (mat.G * h ** 3) / 12, D3 = nuRL * D1 + 2 * Dk;
  const rhoh = mat.rho * h;
  const psi0 = 2 / Math.sqrt(rhoh * a * b);
  const modes = [];
  outer: for (let m = 1; m <= 80; m++) {
    for (let n = 1; n <= 80; n++) {
      const X = m / a, Y = n / b;
      const f = (Math.PI / 2) * Math.sqrt((D1 * X ** 4 + 2 * D3 * X * X * Y * Y + D2 * Y ** 4) / rhoh);
      if (f > fmax) { if (n === 1) break outer; break; }
      const Sx = (a * (1 - (-1) ** m)) / (m * Math.PI);
      const Sy = (b * (1 - (-1) ** n)) / (n * Math.PI);
      const Mx = m % 2 === 0 ? -(a * a) / (m * Math.PI) : 0;
      const My = n % 2 === 0 ? -(b * b) / (n * Math.PI) : 0;
      modes.push({ m, n, f, W: psi0 * Sx * Sy, Dx: psi0 * Mx * Sy, Dy: psi0 * Sx * My });
    }
  }
  modes.sort((p1, p2) => p1.f - p2.f);
  const kept = modes.slice(0, nmax);
  const eta = mat.eta + extraEta;
  const Deff = Math.sqrt(D1 * D2);
  return {
    a, b, h, rhoh, mass: rhoh * a * b, mat, eta,
    modes: kept.map((md) => ({ ...md, zeta: eta / 2 })),
    psiAt: (md, x, y) => psi0 * Math.sin((md.m * Math.PI * x) / a) * Math.sin((md.n * Math.PI * y) / b),
    Zinf: 8 * Math.sqrt(Deff * rhoh),         // infinite-plate drive-point impedance
    fCoincidence: (343 ** 2 / (2 * Math.PI)) * Math.sqrt(rhoh / Deff),
  };
}
