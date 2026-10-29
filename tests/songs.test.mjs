import { SONGS } from '../js/melody/songs.js';
import { compileSong } from '../js/melody/notation.js';
import { arrange, buildTuneComb } from '../js/melody/arranger.js';
import { COMBS, noteName } from '../js/physics/constants.js';
let ok = true;
for (const s of SONGS) {
  try {
    const c = compileSong(s);
    const barLen = s.meter[0] * 16 / s.meter[1];
    const k = c.key ? `${noteName(c.key.tonic + 60).replace(/\d/, '')} ${c.key.mode}` : '-';
    const parts = [];
    for (const comb of ['c15', 'c30', 'c50']) {
      const a = arrange(c, COMBS[comb].notes);
      parts.push(`${comb}: t=${a.transpose} sub=${a.stats.substituted} fold=${a.stats.folded}`);
    }
    const tc = buildTuneComb(c, 18, 67, 98, 60 / (c.bpm * 4));
    console.log(`${s.title.padEnd(42)} steps=${c.steps} bars=${(c.steps / barLen).toFixed(2)} Trev=${(c.steps * 60 / (c.bpm * 4)).toFixed(1)}s key=${k} notes=${c.notes.length} | ${parts.join(' | ')} | tune18 distinct=${new Set(tc.notes).size}`);
  } catch (e) { ok = false; console.log('FAIL', s.title, e.message); }
}
process.exit(ok ? 0 : 1);
