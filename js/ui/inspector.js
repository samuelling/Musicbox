// Tine strip (all tines, live) and per-tine modal inspector.
const COLORS = ['#e3b45a', '#8fc1d9', '#d9705a', '#9fd98f'];

export class TineStrip {
  constructor(canvas, onPick) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.tines = []; this.amp = null; this.sel = -1; this.onPick = onPick;
    canvas.addEventListener('pointerup', (e) => {
      const r = canvas.getBoundingClientRect();
      const i = Math.floor(((e.clientX - r.left) / r.width) * this.tines.length);
      if (i >= 0 && i < this.tines.length) onPick(i);
    });
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() { const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (!r.width) return; this.cv.width = r.width * d; this.cv.height = r.height * d; this.dpr = d; this.draw(); }
  set(tines) { this.tines = tines; this.draw(); }
  draw() {
    const c = this.ctx, W = this.cv.width, H = this.cv.height; if (!W || !this.tines.length) return;
    c.clearRect(0, 0, W, H);
    const n = this.tines.length, w = W / n, Lmax = Math.max(...this.tines.map((t) => t.L));
    this.tines.forEach((t, i) => {
      const h = (t.L / Lmax) * (H - 10);
      const a = this.amp ? Math.min(1, this.amp[i] * 4000) : 0;
      c.fillStyle = i === this.sel ? '#f0c879' : `rgb(${150 + 100 * a},${155 + 80 * a},${165 - 40 * a})`;
      c.fillRect(i * w + w * 0.15, 4, w * 0.7, h);
      if (t.lead > 0) { c.fillStyle = '#55585c'; c.fillRect(i * w + w * 0.15, 4 + h - Math.min(h * 0.3, 8), w * 0.7, Math.min(h * 0.3, 8)); }
    });
  }
}

export class Inspector {
  constructor(canvas) { this.cv = canvas; this.ctx = canvas.getContext('2d'); this.t = null; this.resize(); window.addEventListener('resize', () => this.resize()); }
  resize() { const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (!r.width) return; this.cv.width = r.width * d; this.cv.height = r.height * d; this.dpr = d; this.draw(); }
  set(t) { this.t = t; this.draw(); }
  draw() {
    const c = this.ctx, W = this.cv.width, H = this.cv.height, d = this.dpr; if (!W) return;
    c.clearRect(0, 0, W, H);
    const t = this.t; if (!t) return;
    // left half: mode shapes along the tine
    const lw = W * 0.48, pad = 10 * d;
    c.strokeStyle = '#ffffff22'; c.beginPath(); c.moveTo(pad, H / 2); c.lineTo(lw - pad, H / 2); c.stroke();
    c.fillStyle = '#b5a58f'; c.font = `${10 * d}px sans-serif`; c.fillText('root', pad, H - 4 * d); c.fillText('tip', lw - pad - 14 * d, H - 4 * d);
    t.shapes.forEach((sh, k) => {
      const mx = Math.max(...sh.map(Math.abs)) || 1;
      c.strokeStyle = COLORS[k]; c.lineWidth = 2 * d; c.beginPath();
      sh.forEach((v, j) => { const x = pad + (j / (sh.length - 1)) * (lw - 2 * pad), y = H / 2 - (v / mx) * (H * 0.36); j ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
    });
    // right half: modes with T60 bars and loss breakdown
    const x0 = lw + 8 * d, bw = W - x0 - 8 * d;
    const rowH = Math.min(44 * d, (H - 8 * d) / Math.max(1, t.modes.length));
    const maxT = Math.max(...t.modes.map((m) => m.T60));
    t.modes.forEach((m, k) => {
      const y = 6 * d + k * rowH;
      c.fillStyle = COLORS[k]; c.font = `${11 * d}px ui-monospace, monospace`;
      c.fillText(`${m.f.toFixed(0)} Hz ×${m.ratio.toFixed(2)}  T60 ${m.T60.toFixed(2)} s`, x0, y + 11 * d);
      // stacked loss bar
      const parts = m.parts, total = m.eta;
      let x = x0; const by = y + 15 * d, bh = 8 * d, len = (bw * m.T60) / maxT;
      const pc = { material: '#c9a14a', ted: '#d9705a', air: '#8fc1d9', rad: '#9fd98f', support: '#b38fd9', lead: '#666' };
      for (const [k2, v] of Object.entries(parts)) { const wv = (v / total) * len; c.fillStyle = pc[k2] || '#888'; c.fillRect(x, by, wv, bh); x += wv; }
    });
    c.fillStyle = '#b5a58f'; c.font = `${9 * d}px sans-serif`;
    c.fillText('bar length = ring time; colours = share of loss: material, thermoelastic, air, radiation, support, lead', x0, H - 3 * d);
  }
}
