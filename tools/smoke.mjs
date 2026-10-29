import { buildModel } from '../js/physics/model.js';
import { COMBS } from '../js/physics/constants.js';
import { makeProcessor, render, writeWav } from './harness.mjs';
const comb = process.argv[2] || 'c30';
const notes = COMBS[comb].notes;
const pins = notes.map((_, i) => [ (0.02 + i * 0.6 / notes.length) % 1 ]);
// a chord at 0.8
[0, 4, 7, 12].forEach((k) => pins[k].push(0.8));
const t0 = Date.now();
const { patch, info } = buildModel({ comb, enclosure: process.argv[3] || 'classic', surface: process.argv[4] || 'oak', room: 'living' }, notes, { pins, Trev: 20, minSeparation: 0 });
console.log('build ms', Date.now() - t0, 'R', info.cylinder.R, 'slideDeg', info.cylinder.slideDeg.toFixed(1), 'ks', info.bed.ks.toExponential(2), 'mBed', info.bed.mass.toFixed(3), 'fH', info.cavity.fH?.toFixed(0));
console.log('drive', info.drive, 'G_fan', info.driveP.G_fan.toFixed(0), 'G_crank', info.driveP.G_crank, 'G_spring', info.driveP.G_spring.toFixed(2));
for (const t of info.tines.filter((_, i) => i % 6 === 0)) console.log(t.name, 'L', (t.L * 1e3).toFixed(1), 'lead', (t.lead * 1e3).toFixed(2), 'g', t.modes.map((m) => `${m.f.toFixed(0)}Hz T60 ${m.T60.toFixed(2)}`).join(' | '));
const proc = await makeProcessor();
proc.send({ type: 'patch', patch });
proc.send({ type: 'listener', listener: { x: patch.room.boxPos[0], y: patch.room.boxPos[1] + 0.8, z: 1.2, yaw: -Math.PI / 2 } });
proc.send({ type: 'mode', mode: 'spring' });
proc.send({ type: 'setTurns', turns: 5 });
proc.send({ type: 'brake', on: false });
let maxSpl = 0, st;
proc.port.onstate = (m) => { st = m; maxSpl = Math.max(maxSpl, m.splL); };
const t1 = Date.now();
const [L, R] = render(proc, 20, 48000, (t) => { if (st && Math.abs(t % 2) < 0.003) console.log(`t=${t.toFixed(1)} w=${st.omega.toFixed(4)} turns=${st.turns.toFixed(3)} fan=${st.fanRpm.toFixed(0)} spl=${st.splL.toFixed(1)} awake=${st.awake} contacts=${st.contacts}`); });
const el = (Date.now() - t1) / 1000;
let pk = 0, nan = 0; for (const x of L) { if (!isFinite(x)) nan++; pk = Math.max(pk, Math.abs(x)); }
console.log('render x realtime', (20 / el).toFixed(2), 'peak', pk.toFixed(3), 'nan', nan, 'maxSPL', maxSpl.toFixed(1));
await writeWav('/tmp/smoke.wav', [L, R], 48000);
