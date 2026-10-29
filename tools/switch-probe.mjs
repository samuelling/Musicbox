// Switch tunes while playing and watch the cylinder speed (the old "speed-run" bug).
import { SONGS } from '../js/melody/songs.js';
import { compileSong } from '../js/melody/notation.js';
import { buildAll } from '../js/physics/build-worker.js';
import { makeProcessor, render } from './harness.mjs';
const { DEFAULT_CONFIG } = await import('../js/physics/model.js');
const mk = (id) => buildAll({ ...DEFAULT_CONFIG }, compileSong(SONGS.find((s) => s.id === id))).patch;
for (const mode of ['crank', 'spring', 'auto']) {
  const A = mk('brahms'), B = mk('elise');
  const proc = await makeProcessor(); proc.send({ type: 'patch', patch: A }); proc.send({ type: 'mode', mode });
  if (mode === 'spring') { proc.send({ type: 'setTurns', turns: A.drive.turnsMax * 0.8 }); proc.send({ type: 'brake', on: false }); }
  if (mode === 'auto') { proc.send({ type: 'hamster', inWheel: true, hour: 22, opts: { lover: true } }); proc.send({ type: 'hamster', wake: true }); }
  let crank = 0, cur = A, log = [];
  proc.port.onstate = (m) => log.push([m.omega / cur.drive.omegaNom]);
  render(proc, 6, 48000, () => { if (mode === 'crank') { crank += cur.drive.omegaNom * cur.drive.G_crank * 128 / 48000; proc.send({ type: 'hand', angle: crank, active: true }); } });
  const before = log.slice(-10).map((x) => x[0]); log = [];
  proc.send({ type: 'patch', patch: B }); cur = B;
  render(proc, 2, 48000, () => { if (mode === 'crank') { crank += cur.drive.omegaNom * cur.drive.G_crank * 128 / 48000; proc.send({ type: 'hand', angle: crank, active: true }); } });
  const after = log.map((x) => x[0]);
  console.log(mode.padEnd(6), 'tempo before', (before.reduce((a, b) => a + b, 0) / before.length * 100).toFixed(0) + '%', '| after switch: max', (Math.max(...after) * 100).toFixed(0) + '%', 'first 0.5 s', after.slice(0, 22).map((v) => (v * 100).toFixed(0)).join(' '));
}
