// Measures the torque the movement asks of whatever turns the cylinder (crank mode, steady speed).
import { SONGS } from '../js/melody/songs.js';
import { compileSong } from '../js/melody/notation.js';
import { buildAll } from '../js/physics/build-worker.js';
import { makeProcessor, render } from './harness.mjs';
const { DEFAULT_CONFIG } = await import('../js/physics/model.js');
for (const [id, comb] of [['brahms', 'c30'], ['jingle', 'c18t'], ['canon', 'c72t'], ['elise', 'c50']]) {
  const song = compileSong(SONGS.find((s) => s.id === id));
  const { patch } = buildAll({ ...DEFAULT_CONFIG, comb }, song);
  const P = patch.drive;
  const proc = await makeProcessor(); proc.send({ type: 'patch', patch }); proc.send({ type: 'mode', mode: 'crank' });
  let tq = [], om = [];
  proc.port.onstate = (m) => { tq.push(m.torque); om.push(m.omega); };
  let crank = 0;
  render(proc, 20, 48000, () => { crank += P.omegaNom * P.G_crank * 128 / 48000; proc.send({ type: 'hand', angle: crank, active: true }); });
  const k = Math.floor(tq.length / 4); tq = tq.slice(k); om = om.slice(k);
  const mean = tq.reduce((a, b) => a + b, 0) / tq.length, peak = Math.min(...tq);
  const wm = om.reduce((a, b) => a + b, 0) / om.length;
  console.log(`${id}/${comb}: cyl torque mean ${(-mean * 1e3).toFixed(2)} mN·m peak ${(-peak * 1e3).toFixed(1)}, bearing ${(P.tauBearing * 1e3).toFixed(2)}, ω ${wm.toFixed(3)} nom ${P.omegaNom.toFixed(3)} G_crank ${P.G_crank} crank rpm ${(P.G_crank * P.omegaNom * 60 / 6.283).toFixed(0)} power ${(-mean * wm * 1e3).toFixed(3)} mW  Icrank ${P.Icrank.toExponential(2)}`);
}
