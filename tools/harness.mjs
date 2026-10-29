// Run the AudioWorklet processor offline in Node.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
let Proc = null;
globalThis.sampleRate = 48000;
globalThis.AudioWorkletProcessor = class { constructor() { this.port = { postMessage: (m) => { this.port.last = m; this.port.onstate && this.port.onstate(m); }, onmessage: null }; } };
globalThis.registerProcessor = (n, c) => { Proc = c; };
export async function makeProcessor(sr = 48000) {
  globalThis.sampleRate = sr;
  if (!Proc) await import(pathToFileURL(path.resolve('js/audio/musicbox-worklet.js')).href);
  const p = new Proc();
  p.send = (m) => p.port.onmessage({ data: m });
  return p;
}
export function render(proc, seconds, sr = 48000, each) {
  const n = Math.round(seconds * sr / 128);
  const L = new Float32Array(n * 128), R = new Float32Array(n * 128);
  const bl = new Float32Array(128), br = new Float32Array(128);
  for (let b = 0; b < n; b++) {
    if (each) each(b * 128 / sr);
    proc.process([], [[bl, br]]);
    L.set(bl, b * 128); R.set(br, b * 128);
  }
  return [L, R];
}
export function writeWav(file, chans, sr) {
  const n = chans[0].length, nc = chans.length;
  const buf = Buffer.alloc(44 + n * nc * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * nc * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(nc, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * nc * 2, 28); buf.writeUInt16LE(nc * 2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(chans[c][i] * 32767))), 44 + (i * nc + c) * 2);
  return import('node:fs').then((fs) => fs.writeFileSync(file, buf));
}
