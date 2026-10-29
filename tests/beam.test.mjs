import { tineModes, uniformCantileverF1, modalIntegrals, tuneTine } from '../js/physics/beam.js';
import { TINE_MATERIALS } from '../js/physics/constants.js';

const st = TINE_MATERIALS.steel;
const spec = { L: 0.015, w0: 1.5e-3, w1: 1.5e-3, t0: 0.5e-3, t1: 0.5e-3, E: st.E, rho: st.rho, nel: 14 };
const m = tineModes(spec, 5);
const fa = uniformCantileverF1(0.015, 1.5e-3, 0.5e-3, st.E, st.rho);
const ratiosTheory = [1, 6.2669, 17.5475, 34.3861, 56.8426];
console.log('f1 FEM', m.modes[0].f.toFixed(2), 'analytic', fa.toFixed(2), 'err', ((m.modes[0].f / fa - 1) * 100).toExponential(2), '%');
m.modes.forEach((md, i) => console.log(` mode ${i + 1}: ratio ${(md.f / m.modes[0].f).toFixed(4)} theory ${ratiosTheory[i]}`));
const { integrals, mass } = modalIntegrals(m);
const sumG2 = integrals.reduce((s, x) => s + x.gamma ** 2, 0);
console.log('effective mass fraction mode1', (integrals[0].gamma ** 2 / mass).toFixed(4), '(theory 0.6131); sum5', (sumG2 / mass).toFixed(4));
let ok = Math.abs(m.modes[0].f / fa - 1) < 1e-4 && Math.abs(integrals[0].gamma ** 2 / mass - 0.6131) < 2e-3;
for (const [hz, label] of [[2093, 'C7'], [523.25, 'C5'], [196, 'G3']]) {
  const base = { w: 1.3e-3, t0: 0.55e-3, t1: 0.42e-3, E: st.E, rho: st.rho, Lmax: 0.026 };
  const t = tuneTine(hz, base, 4);
  console.log(label, 'L', (t.spec.L * 1e3).toFixed(2), 'mm  lead', (t.spec.tipMass * 1e3).toFixed(3), 'g  f', t.modes.map((x) => x.f.toFixed(1)).join(', '));
  ok = ok && Math.abs(t.modes[0].f / hz - 1) < 1e-4;
}
console.log(ok ? 'PASS' : 'FAIL');
if (!ok) process.exit(1);
