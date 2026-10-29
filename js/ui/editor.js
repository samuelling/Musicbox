// Pin-roll editor: rows are the comb's distinct pitches, columns are 16ths.
// Tap a cell to add/remove a pin; drag to pan in both directions.
import { noteName } from '../physics/constants.js';

const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export class PinRoll {
  constructor(canvas, onToggle) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.onToggle = onToggle;
    this.rows = []; this.allRows = []; this.scale = null; this.root = 0; this.degFn = null; this.off = new Set(); this.steps = 64; this.placed = []; this.play = -1; this.meter = [4, 4];
    this.sx = 0; this.sy = 0; this.dpr = Math.min(2, devicePixelRatio || 1);
    this.drag = null; this.lastUser = 0; this.flash = null;
    canvas.addEventListener('pointerdown', (e) => {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      this.drag = { x: e.clientX, y: e.clientY, sx: this.sx, sy: this.sy, moved: false };
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      if (Math.hypot(dx, dy) > (coarse ? 10 : 6)) this.drag.moved = true;
      if (this.drag.moved) {
        this.sx = this.clampX(this.drag.sx - dx * this.dpr);
        this.sy = this.clampY(this.drag.sy - dy * this.dpr);
        this.lastUser = performance.now(); this.draw();
      }
    });
    const end = (e) => { if (this.drag && !this.drag.moved && e.type === 'pointerup') this.tap(e); this.drag = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', (e) => {
      this.sx = this.clampX(this.sx + (e.shiftKey ? e.deltaY : e.deltaX) * this.dpr);
      if (!e.shiftKey) this.sy = this.clampY(this.sy + e.deltaY * this.dpr);
      this.lastUser = performance.now(); this.draw(); e.preventDefault();
    }, { passive: false });
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  // geometry, all in device pixels
  get top() { return 16 * this.dpr; }
  get lw() { return 54 * this.dpr; }
  cellW() { return (coarse ? 22 : 14) * this.dpr; }
  rowH() {
    const fit = (this.cv.height - this.top) / Math.max(1, this.rows.length);
    return Math.max((coarse ? 24 : 14) * this.dpr, fit);
  }
  maxX() { return Math.max(0, this.steps * this.cellW() - (this.cv.width - this.lw)); }
  maxY() { return Math.max(0, this.rows.length * this.rowH() - (this.cv.height - this.top)); }
  clampX(v) { return Number.isFinite(v) ? Math.max(0, Math.min(this.maxX(), v)) : 0; }
  clampY(v) { return Number.isFinite(v) ? Math.max(0, Math.min(this.maxY(), v)) : 0; }
  resize() {
    const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (!r.width || !r.height) return;          // hidden tab: keep the last good size
    this.cv.width = Math.round(r.width * d); this.cv.height = Math.round(r.height * d); this.dpr = d;
    this.sx = this.clampX(this.sx); this.sy = this.clampY(this.sy);
    this.draw();
  }
  set(rows, steps, placed, meter) {
    const firstRows = this.allRows.length === 0;
    this.allRows = rows; this.steps = steps; this.placed = placed; this.meter = meter;
    this.filter();
    this.sx = this.clampX(this.sx);
    // start scrolled to the middle of the comb (where the melody usually lives)
    this.sy = firstRows ? this.clampY(this.maxY() / 2) : this.clampY(this.sy);
    this.draw();
  }
  // Quantise to a scale: only in-scale rows are shown (rows outside it stay, dimmed, while they
  // still hold pins, so nothing in the tune disappears). set: pitch classes, or null = chromatic.
  setScale(set, root, degFn) {
    // keep the pitch at the middle of the view in view
    const rh = this.rowH(), mid = this.rows[Math.floor((this.sy + (this.cv.height - this.top) / 2) / rh)];
    this.scale = set; this.root = root; this.degFn = degFn;
    this.filter();
    if (mid !== undefined && this.rows.length) {
      let best = 0; for (let i = 0; i < this.rows.length; i++) if (Math.abs(this.rows[i] - mid) < Math.abs(this.rows[best] - mid)) best = i;
      this.sy = this.clampY(best * this.rowH() - (this.cv.height - this.top) / 2);
    } else this.sy = this.clampY(this.sy);
    this.draw();
  }
  filter() {
    const pc = (m) => ((m % 12) + 12) % 12, set = this.scale;
    const used = new Set(this.placed.map((p) => p.midi));
    this.rows = this.allRows.filter((m) => !set || set.has(pc(m)) || used.has(m));
    this.off = new Set(set ? this.rows.filter((m) => !set.has(pc(m))) : []);
  }
  setPlayhead(step) {
    this.play = step;
    const x = step * this.cellW(), vis = this.cv.width - this.lw;
    if (performance.now() - this.lastUser > 2500 && (x < this.sx || x > this.sx + vis * 0.85)) this.sx = this.clampX(x - vis * 0.15);
    this.draw();
  }
  cellAt(e) {
    const r = this.cv.getBoundingClientRect();
    const px = (e.clientX - r.left) * this.dpr, py = (e.clientY - r.top) * this.dpr;
    if (px < this.lw || py < this.top) return null;
    const step = Math.floor((px - this.lw + this.sx) / this.cellW());
    const row = Math.floor((py - this.top + this.sy) / this.rowH());
    if (!Number.isFinite(step) || !Number.isFinite(row) || row < 0 || row >= this.rows.length || step < 0 || step >= this.steps) return null;
    return { step, row };
  }
  tap(e) {
    const c = this.cellAt(e);
    if (!c) return;
    this.flash = { ...c, t: performance.now() };
    this.onToggle && this.onToggle(c.step, this.rows[c.row]);
    this.draw();
  }
  draw() {
    const c = this.ctx, W = this.cv.width, H = this.cv.height, d = this.dpr;
    if (!W || !H) return;
    c.clearRect(0, 0, W, H);
    const lw = this.lw, rh = this.rowH(), top = this.top, cw = this.cellW();
    const rowOf = new Map(this.rows.map((m, i) => [m, i]));
    const r0 = Math.max(0, Math.floor(this.sy / rh)), r1 = Math.min(this.rows.length - 1, Math.ceil((this.sy + H - top) / rh));
    const yOf = (i) => top + i * rh - this.sy;
    c.save(); c.beginPath(); c.rect(lw, top, W - lw, H - top); c.clip();
    for (let i = r0; i <= r1; i++) {
      const pcI = ((this.rows[i] % 12) + 12) % 12, black = [1, 3, 6, 8, 10].includes(pcI);
      const isRoot = this.scale && pcI === this.root, isOff = this.off.has(this.rows[i]);
      c.fillStyle = isOff ? '#241010' : isRoot ? '#2a2013' : this.scale ? (i % 2 ? '#17120e' : '#1b1511') : black ? '#120e0b' : '#1a1410';
      c.fillRect(lw, yOf(i), W - lw, rh);
      if (isRoot) { c.fillStyle = '#e3b45a33'; c.fillRect(lw, yOf(i), W - lw, 1.5 * d); }
      c.fillStyle = '#ffffff08'; c.fillRect(lw, yOf(i) + rh - 1, W - lw, 1);
    }
    const barLen = (this.meter[0] * 16) / this.meter[1], beat = 16 / this.meter[1];
    const s0 = Math.max(0, Math.floor(this.sx / cw)), s1 = Math.min(this.steps, Math.ceil((this.sx + W - lw) / cw) + 1);
    for (let s = s0; s <= s1; s++) {
      const x = lw + s * cw - this.sx;
      if (s % barLen === 0) { c.strokeStyle = '#e3b45a66'; c.lineWidth = 1.5 * d; }
      else if (s % beat === 0) { c.strokeStyle = '#ffffff22'; c.lineWidth = 1; }
      else { c.strokeStyle = '#ffffff0a'; c.lineWidth = 1; }
      c.beginPath(); c.moveTo(x, top); c.lineTo(x, H); c.stroke();
    }
    for (const p of this.placed) {
      if (p.step < s0 - 1 || p.step > s1) continue;
      const r = rowOf.get(p.midi); if (r === undefined || r < r0 - 1 || r > r1 + 1) continue;
      const x = lw + p.step * cw - this.sx, y = yOf(r);
      c.fillStyle = p.how === 'sub' ? '#d9705a' : p.voice === 0 ? '#e3b45a' : '#8fc1d9';
      const pad = Math.min(3 * d, cw * 0.15);
      c.beginPath(); c.roundRect ? c.roundRect(x + pad, y + pad, cw - 2 * pad, rh - 2 * pad, 3 * d) : c.rect(x + pad, y + pad, cw - 2 * pad, rh - 2 * pad); c.fill();
    }
    if (this.flash && performance.now() - this.flash.t < 300) {
      const x = lw + this.flash.step * cw - this.sx, y = yOf(this.flash.row);
      c.strokeStyle = '#ffffffaa'; c.lineWidth = 2 * d; c.strokeRect(x + 1, y + 1, cw - 2, rh - 2);
      setTimeout(() => this.draw(), 320);
    }
    if (this.play >= 0) {
      const x = lw + this.play * cw - this.sx;
      c.strokeStyle = '#ffffffcc'; c.lineWidth = 1.5 * d; c.beginPath(); c.moveTo(x, top); c.lineTo(x, H); c.stroke();
    }
    c.restore();
    // header: bar numbers
    c.fillStyle = '#0d0a08'; c.fillRect(0, 0, W, top);
    c.fillStyle = '#e3b45a'; c.font = `${10 * d}px sans-serif`;
    for (let s = Math.ceil(s0 / barLen) * barLen; s <= s1; s += barLen) { const x = lw + s * cw - this.sx; if (x >= lw) c.fillText(String(s / barLen + 1), x + 3 * d, 12 * d); }
    // note-name gutter
    c.fillStyle = '#0d0a08'; c.fillRect(0, top, lw, H - top);
    c.save(); c.beginPath(); c.rect(0, top, lw, H - top); c.clip();
    c.font = `${Math.min(11 * d, rh * 0.6)}px ui-monospace, monospace`;
    for (let i = r0; i <= r1; i++) {
      const m = this.rows[i], isRoot = this.scale && (((m % 12) + 12) % 12) === this.root, isOff = this.off.has(m);
      c.fillStyle = isOff ? '#a0574a' : isRoot ? '#e3b45a' : '#b5a58f';
      c.fillText(noteName(m), 4 * d, yOf(i) + rh * 0.68);
      if (this.scale && this.degFn) {
        const dg = this.degFn(m);
        c.fillStyle = isOff ? '#a0574a' : '#b5a58f88';
        c.fillText(isOff ? '×' : String(dg), lw - 12 * d, yOf(i) + rh * 0.68);
      }
    }
    c.restore();
    // scroll hints
    if (this.maxY() > 0) {
      const frac = this.sy / this.maxY(), hgt = Math.max(20 * d, (H - top) * (H - top) / (this.rows.length * rh));
      c.fillStyle = '#ffffff30'; c.fillRect(W - 4 * d, top + frac * (H - top - hgt), 3 * d, hgt);
    }
  }
}
