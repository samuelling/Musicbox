// Minimal Standard MIDI File reader -> onset list quantised to 16ths.

function readVar(d, p) {
  let v = 0, b;
  do { b = d[p.i++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80);
  return v;
}

export function parseMidi(buf, name = 'Imported MIDI') {
  const d = new Uint8Array(buf);
  const str = (i, n) => String.fromCharCode(...d.slice(i, i + n));
  if (str(0, 4) !== 'MThd') throw new Error('Not a MIDI file');
  const ntrk = (d[10] << 8) | d[11];
  const div = (d[12] << 8) | d[13];
  if (div & 0x8000) throw new Error('SMPTE time division not supported');
  let p = 14;
  const events = []; // {tick, type, ...}
  for (let tr = 0; tr < ntrk; tr++) {
    while (str(p, 4) !== 'MTrk') { p += 8 + ((d[p + 4] << 24) | (d[p + 5] << 16) | (d[p + 6] << 8) | d[p + 7]); if (p >= d.length) break; }
    const len = (d[p + 4] << 24) | (d[p + 5] << 16) | (d[p + 6] << 8) | d[p + 7];
    const end = p + 8 + len;
    const ptr = { i: p + 8 };
    let tick = 0, status = 0;
    while (ptr.i < end) {
      tick += readVar(d, ptr);
      let b = d[ptr.i];
      if (b & 0x80) { status = b; ptr.i++; } // else running status
      const hi = status & 0xf0;
      if (status === 0xff) {
        const type = d[ptr.i++]; const l = readVar(d, ptr);
        if (type === 0x51) events.push({ tick, tempo: (d[ptr.i] << 16) | (d[ptr.i + 1] << 8) | d[ptr.i + 2] });
        if (type === 0x03 && tr <= 1 && name === 'Imported MIDI') name = new TextDecoder().decode(d.slice(ptr.i, ptr.i + l)) || name;
        ptr.i += l;
      } else if (status === 0xf0 || status === 0xf7) { const l = readVar(d, ptr); ptr.i += l; }
      else if (hi === 0x90) { const n = d[ptr.i++], v = d[ptr.i++]; if (v > 0 && (status & 0x0f) !== 9) events.push({ tick, note: n, vel: v }); }
      else if (hi === 0x80 || hi === 0xa0 || hi === 0xb0 || hi === 0xe0) ptr.i += 2;
      else if (hi === 0xc0 || hi === 0xd0) ptr.i += 1;
      else ptr.i++;
    }
    p = end;
  }
  events.sort((a, b) => a.tick - b.tick);
  const tempo = events.find((e) => e.tempo)?.tempo || 500000;
  const bpm = Math.round(60e6 / tempo);
  const notesEv = events.filter((e) => e.note !== undefined);
  if (!notesEv.length) throw new Error('No notes found');
  const t0 = notesEv[0].tick;
  const per16 = div / 4;
  const notes = [];
  const seen = new Set();
  // highest notes get voice 0 (melody) when they are the top of a chord
  const bySt = new Map();
  for (const e of notesEv) {
    const step = Math.round((e.tick - t0) / per16);
    const key = step * 128 + e.note;
    if (seen.has(key)) continue; seen.add(key);
    if (!bySt.has(step)) bySt.set(step, []);
    bySt.get(step).push(e.note);
  }
  for (const [step, list] of bySt) { const top = Math.max(...list); list.forEach((m) => notes.push({ step, midi: m, voice: m === top ? 0 : 1 })); }
  notes.sort((a, b) => a.step - b.step || a.midi - b.midi);
  const last = notes[notes.length - 1].step;
  const steps = Math.ceil((last + 4) / 16) * 16;
  return { id: 'midi-' + Date.now(), title: name.replace(/\.midi?$/i, ''), credit: 'Imported MIDI', bpm, meter: [4, 4], steps, notes };
}
