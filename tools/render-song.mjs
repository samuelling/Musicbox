// Offline render of a library tune through the full physical model.
// usage: node tools/render-song.mjs <songId> <comb> <enclosure> <surface> <room> <seconds> <out.wav> [mode]
import { SONGS } from '../js/melody/songs.js';
import { compileSong } from '../js/melody/notation.js';
import { buildAll } from '../js/physics/build-worker.js';
import { makeProcessor, render, writeWav } from './harness.mjs';
const [id = 'brahms', comb = 'c30', enclosure = 'classic', surface = 'oak', room = 'living', secs = '20', out = '/tmp/song.wav', mode = 'spring'] = process.argv.slice(2);
const song = compileSong(SONGS.find((s) => s.id === id));
const t0 = Date.now();
const { patch, info, arrangement } = buildAll({ ...(await import('../js/physics/model.js')).DEFAULT_CONFIG, comb, enclosure, surface, room }, song);
console.log(`${song.title}: build ${Date.now() - t0} ms, ${info.tines.length} tines, R ${(info.cylinder.R * 1e3).toFixed(1)} mm, Trev ${arrangement.Trev.toFixed(1)} s, lost ${info.cylinder.lostPins}, t=${arrangement.transpose}`);
const proc = await makeProcessor();
proc.send({ type: 'patch', patch });
const bp = patch.room.boxPos;
const L = bp ? { x: bp[0] + 0.3, y: bp[1] - 1.2, z: 1.2, yaw: Math.atan2(1.2, -0.3) } : { x: 2, y: 2, z: 1.2, yaw: 0 };
proc.send({ type: 'listener', listener: L });
proc.send({ type: 'mode', mode });
let spl = [], omega = [];
proc.port.onstate = (m) => { spl.push(Math.max(m.splL, m.splR)); omega.push(m.omega); };
if (mode === 'spring') { proc.send({ type: 'setTurns', turns: patch.drive.turnsMax * 0.8 }); proc.send({ type: 'brake', on: false }); }
let crank = 0;
const t1 = Date.now();
const [Lc, Rc] = render(proc, +secs, 48000, (t) => {
  if (mode === 'crank') { crank += 2 * Math.PI * 1.15 * (128 / 48000) * (1 + 0.15 * Math.sin(t * 2.1)); proc.send({ type: 'hand', angle: crank, active: true }); }
});
const el = (Date.now() - t1) / 1000;
let pk = 0, sq = 0, nan = 0; for (const x of Lc) { if (!isFinite(x)) nan++; pk = Math.max(pk, Math.abs(x)); sq += x * x; }
const sorted = spl.filter(isFinite).sort((a, b) => a - b);
console.log(`render ${(+secs / el).toFixed(2)}x realtime, peak ${pk.toFixed(3)}, rms ${(10 * Math.log10(sq / Lc.length)).toFixed(1)} dBFS, nan ${nan}, SPL median ${sorted[sorted.length >> 1]?.toFixed(1)} p95 ${sorted[Math.floor(sorted.length * 0.95)]?.toFixed(1)}, omega ${(omega[omega.length - 1] || 0).toFixed(3)} (nominal ${patch.drive.omegaNom.toFixed(3)})`);
await writeWav(out, [Lc, Rc], 48000);
