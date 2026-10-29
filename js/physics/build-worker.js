// Builds the full physical model off the main thread (FEM tuning of every
// tine, plate modes, drive train) and returns a transferable patch.
import { buildModel } from './model.js';
import { COMBS } from './constants.js';
import { contactGeometry, DEFAULT_CONFIG } from './model.js';
import { arrange, buildTuneComb } from '../melody/arranger.js';

export function buildAll(cfg, song, combOverride) {
  const comb = COMBS[cfg.comb];
  let combNotes, transpose;
  const stepSec = 60 / (song.bpm * 4);
  if (combOverride) combNotes = combOverride;
  else if (comb.notes === 'tune' && !song.notes.length) {
    combNotes = Array.from({ length: comb.count }, (_, i) => comb.lo + 12 + i);
  } else if (comb.notes === 'tune') {
    const tc = buildTuneComb(song, comb.count, comb.lo, comb.hi, stepSec);
    combNotes = tc.notes; transpose = tc.transpose;
  } else combNotes = comb.notes;
  const g = contactGeometry(comb.R * 1.2, { ...DEFAULT_CONFIG, ...cfg });
  const minGap = (g.slideAngle + 0.05) / (2 * Math.PI);
  const arrangement = arrange(song, combNotes, { transpose: transpose ?? cfg.transpose, staggerMs: cfg.staggerMs, minGap });
  arrangement.minGap = minGap;
  const { patch, info } = buildModel({ ...cfg }, combNotes, arrangement);
  return { patch, info, arrangement, combNotes };
}

function transferables(patch) {
  const out = [];
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (ArrayBuffer.isView(o)) { if (!out.includes(o.buffer)) out.push(o.buffer); return; }
    for (const k in o) walk(o[k]);
  };
  walk(patch);
  return out;
}

if (typeof self !== 'undefined' && typeof window === 'undefined' && typeof importScripts !== 'undefined') {
  self.onmessage = (e) => {
    const { id, cfg, song, combOverride } = e.data;
    try {
      const t0 = performance.now();
      const res = buildAll(cfg, song, combOverride);
      res.info.buildMs = performance.now() - t0;
      // patch pins are transferable too; keep a plain copy for the UI
      res.pinsCopy = res.patch.tines.pins.map((p) => Array.from(p));
      self.postMessage({ id, ok: true, ...res }, transferables(res.patch));
    } catch (err) {
      self.postMessage({ id, ok: false, error: String(err && err.stack || err) });
    }
  };
}
