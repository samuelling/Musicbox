// Offline: a hamster drives the music box for a while. Prints behaviour, gait, tempo and stability.
// usage: node tools/hamster-probe.mjs [seconds] [hour] [wheel] [axle] [surface] [mass] [song] [comb] [out.wav]
import { SONGS } from '../js/melody/songs.js';
import { compileSong } from '../js/melody/notation.js';
import { buildAll } from '../js/physics/build-worker.js';
import { makeProcessor, render, writeWav } from './harness.mjs';
const [secs = '120', hour = '22', wheel = 'd28', axle = 'bearing', surface = 'rungs', mass = '0.125', id = 'brahms', comb = 'c30', out = ''] = process.argv.slice(2);
const { DEFAULT_CONFIG } = await import('../js/physics/model.js');
const song = compileSong(SONGS.find((s) => s.id === id));
const { patch } = buildAll({ ...DEFAULT_CONFIG, comb }, song);
const proc = await makeProcessor();
proc.send({ type: 'patch', patch });
const bp = patch.room.boxPos;
proc.send({ type: 'listener', listener: { x: bp[0] + 0.3, y: bp[1] - 1.2, z: 1.2, yaw: Math.atan2(1.2, -0.3) } });
proc.send({ type: 'hamster', opts: { wheel, axle, surface, mass: +mass }, hour: +hour });
proc.send({ type: 'mode', mode: 'auto' });
const rows = []; let last = -1, nanCount = 0;
proc.port.onstate = (m) => { if (m.ham) rows.push({ t: rows.length * 1024 / 48000, om: m.omega, ...m.ham }); };
const [L, R] = render(proc, +secs, 48000);
for (const x of L) if (!isFinite(x)) nanCount++;
const P = patch.drive, nom = P.omegaNom;
console.log(`wheel R ${(rows[0].R * 100).toFixed(1)} cm, pulleys rw ${(rows[0].rw * 1e3).toFixed(1)} mm / rc ${(rows[0].rc * 1e3).toFixed(1)} mm, nominal ω ${nom.toFixed(3)}; max aerobic speed ${rows[0].vmaxAer.toFixed(2)} m/s`);
for (const r of rows) {
  if (Math.floor(r.t / 4) === last) continue; last = Math.floor(r.t / 4);
  console.log(`t ${r.t.toFixed(0).padStart(4)}s ${r.state.padEnd(4)} ${r.act.padEnd(5)} v ${r.v.toFixed(2)} (cmd ${r.vCmd.toFixed(2)}) ${r.gait.padEnd(5)} f ${r.f.toFixed(1)}Hz D ${r.D.toFixed(2)} φ ${(r.phi * 57.3).toFixed(1).padStart(5)}° tempo ${(r.om / nom * 100).toFixed(0).padStart(3)}% belt ${(r.belt).toFixed(3)}N E ${r.Emet.toFixed(2)}W HR ${r.hr.toFixed(0)} res ${r.reserve.toFixed(2)} dist ${r.dist.toFixed(0)}m`);
}
// tempo ripple during steady running
const run = rows.filter((r) => r.state === 'run' && r.v > 0.3);
if (run.length) {
  const oms = run.map((r) => r.om / nom), mean = oms.reduce((a, b) => a + b, 0) / oms.length;
  const sd = Math.sqrt(oms.reduce((a, b) => a + (b - mean) ** 2, 0) / oms.length);
  console.log(`running: mean tempo ${(mean * 100).toFixed(0)}%, sd ${(sd * 100).toFixed(1)}%, φ range ${(Math.min(...run.map((r) => r.phi)) * 57.3).toFixed(1)}..${(Math.max(...run.map((r) => r.phi)) * 57.3).toFixed(1)}°, slip frames ${run.filter((r) => r.slip).length}`);
}
let pk = 0; for (const x of L) pk = Math.max(pk, Math.abs(x));
console.log(`NaN ${nanCount}, peak ${pk.toFixed(3)}`);
if (out) await writeWav(out, [L, R], 48000);
