// Pin-roll editor: rows are the comb's distinct pitches, columns are 16ths.
import { noteName } from '../physics/constants.js';

export class PinRoll {
  constructor(canvas, onToggle) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.onToggle = onToggle;
    this.rows = []; this.steps = 64; this.cell = 12; this.scroll = 0; this.placed = []; this.play = -1; this.meter = [4, 4];
    this.drag = null; this.lastUser = 0;
    canvas.addEventListener('pointerdown', (e) => { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } this.drag = { x: e.clientX, y: e.clientY, s: this.scroll, moved: false }; });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x;
      if (Math.abs(dx) > 6) this.drag.moved = true;
      if (this.drag.moved) { this.scroll = Math.max(0, Math.min(this.maxScroll(), this.drag.s - dx * this.dpr)); this.lastUser = performance.now(); this.draw(); }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (this.drag && !this.drag.moved) this.tap(e);
      this.drag = null;
    });
    canvas.addEventListener('wheel', (e) => { this.scroll = Math.max(0, Math.min(this.maxScroll(), this.scroll + (e.deltaX || e.deltaY))); this.lastUser = performance.now(); this.draw(); e.preventDefault(); }, { passive: false });
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (!r.width) return;
    this.cv.width = r.width * d; this.cv.height = r.height * d; this.dpr = d; this.draw();
  }
  labelW() { return 40 * this.dpr; }
  rowH() { return Math.max(6 * this.dpr, (this.cv.height - 14 * this.dpr) / Math.max(1, this.rows.length)); }
  maxScroll() { return Math.max(0, this.steps * this.cell * this.dpr - (this.cv.width - this.labelW())); }
  set(rows, steps, placed, meter) {
    this.rows = rows; this.steps = steps; this.placed = placed; this.meter = meter;
    this.cell = Math.max(8, Math.min(16, 900 / steps * 2));
    this.scroll = Math.min(this.scroll, this.maxScroll()); this.draw();
  }
  setPlayhead(step) {
    this.play = step;
    const x = step * this.cell * this.dpr;
    const vis = this.cv.width - this.labelW();
    if (performance.now() - this.lastUser > 2500 && (x < this.scroll || x > this.scroll + vis * 0.85)) this.scroll = Math.max(0, Math.min(this.maxScroll(), x - vis * 0.15));
    this.draw();
  }
  tap(e) {
    const r = this.cv.getBoundingClientRect();
    const px = (e.clientX - r.left) * this.dpr, py = (e.clientY - r.top) * this.dpr;
    if (px < this.labelW() || py < 14 * this.dpr) return;
    const step = Math.floor((px - this.labelW() + this.scroll) / (this.cell * this.dpr));
    const row = Math.floor((py - 14 * this.dpr) / this.rowH());
    if (row < 0 || row >= this.rows.length || step < 0 || step >= this.steps) return;
    this.onToggle && this.onToggle(step, this.rows[row]);
  }
  draw() {
    const c = this.ctx, W = this.cv.width, H = this.cv.height, d = this.dpr;
    if (!W) return;
    c.clearRect(0, 0, W, H);
    const lw = this.labelW(), rh = this.rowH(), top = 14 * d, cw = this.cell * d;
    const rowOf = new Map(this.rows.map((m, i) => [m, i]));
    // rows
    this.rows.forEach((m, i) => {
      const y = top + i * rh;
      const black = [1, 3, 6, 8, 10].includes(m % 12);
      c.fillStyle = black ? '#120e0b' : '#1a1410'; c.fillRect(lw, y, W - lw, rh);
      if (rh > 9 * d) { c.fillStyle = '#b5a58f'; c.font = `${Math.min(10 * d, rh * 0.8)}px ui-monospace, monospace`; c.fillText(noteName(m), 3 * d, y + rh * 0.78); }
    });
    // beat & bar lines
    const barLen = (this.meter[0] * 16) / this.meter[1], beat = 16 / this.meter[1];
    const s0 = Math.floor(this.scroll / cw), s1 = Math.min(this.steps, Math.ceil((this.scroll + W - lw) / cw) + 1);
    for (let s = s0; s <= s1; s++) {
      const x = lw + s * cw - this.scroll;
      if (s % barLen === 0) { c.strokeStyle = '#e3b45a66'; c.lineWidth = 1.5 * d; c.fillStyle = '#e3b45a'; c.font = `${9 * d}px sans-serif`; c.fillText(String(s / barLen + 1), x + 2 * d, 10 * d); }
      else if (s % beat === 0) { c.strokeStyle = '#ffffff1c'; c.lineWidth = 1; }
      else continue;
      c.beginPath(); c.moveTo(x, top); c.lineTo(x, H); c.stroke();
    }
    // pins
    for (const p of this.placed) {
      if (p.step < s0 - 1 || p.step > s1) continue;
      const r = rowOf.get(p.midi); if (r === undefined) continue;
      const x = lw + p.step * cw - this.scroll, y = top + r * rh;
      c.fillStyle = p.how === 'sub' ? '#d9705a' : p.voice === 0 ? '#e3b45a' : '#8fc1d9';
      c.fillRect(x + 1, y + 1, Math.max(2, cw - 2), Math.max(2, rh - 2));
    }
    // playhead
    if (this.play >= 0) {
      const x = lw + this.play * cw - this.scroll;
      c.strokeStyle = '#ffffffcc'; c.lineWidth = 1.5 * d; c.beginPath(); c.moveTo(x, top); c.lineTo(x, H); c.stroke();
    }
    c.fillStyle = '#0d0a08'; c.fillRect(0, 0, lw, H);
    this.rows.forEach((m, i) => { const y = top + i * rh; if (rh > 9 * d) { c.fillStyle = '#b5a58f'; c.font = `${Math.min(10 * d, rh * 0.8)}px ui-monospace, monospace`; c.fillText(noteName(m), 3 * d, y + rh * 0.78); } });
  }
}
