// Top-down room map: drag the listener's head, twist with two fingers.
export class ListenerMap {
  constructor(canvas, onChange) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.onChange = onChange;
    this.room = null; this.box = null; this.held = false; this.listener = { x: 2, y: 1.5, z: 1.2, yaw: Math.PI / 2 };
    this.faceBox = true; this.pointers = new Map(); this.spl = null;
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    this.resize(); window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const r = this.cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (!r.width) return;
    this.cv.width = r.width * d; this.cv.height = r.height * d; this.dpr = d;
    if (this.room) this.computeView();   // the room may have been set while this tab was hidden
    this.draw();
  }
  setRoom(room, boxPos, tableSize, held) {
    this.room = room; this.box = boxPos; this.table = tableSize; this.held = held;
    this.listener.x = Math.min(Math.max(this.listener.x, 0.2), room.dims[0] - 0.2);
    this.listener.y = Math.min(Math.max(this.listener.y, 0.2), room.dims[1] - 0.2);
    this.computeView(); this.draw();
  }
  computeView() {
    const [X, Y] = this.room.dims;
    if (this.room.walls) this.view = { x0: 0, y0: 0, x1: X, y1: Y };
    else { const c = this.box || [X / 2, Y / 2]; this.view = { x0: c[0] - 3.5, y0: c[1] - 2.6, x1: c[0] + 3.5, y1: c[1] + 2.6 }; }
    const W = this.cv.width, H = this.cv.height, pad = 14 * (this.dpr || 1);
    const sx = (W - 2 * pad) / (this.view.x1 - this.view.x0), sy = (H - 2 * pad) / (this.view.y1 - this.view.y0);
    this.s = Math.min(sx, sy);
    this.ox = (W - this.s * (this.view.x1 - this.view.x0)) / 2; this.oy = (H - this.s * (this.view.y1 - this.view.y0)) / 2;
  }
  toScreen(x, y) { return [this.ox + (x - this.view.x0) * this.s, this.cv.height - (this.oy + (y - this.view.y0) * this.s)]; }
  toRoom(px, py) { return [(px - this.ox) / this.s + this.view.x0, (this.cv.height - py - this.oy) / this.s + this.view.y0]; }
  evPos(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) * this.dpr, (e.clientY - r.top) * this.dpr]; }
  down(e) { try { this.cv.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ } this.pointers.set(e.pointerId, this.evPos(e)); if (this.pointers.size === 1) this.place(this.evPos(e)); else this.twist0 = this.twistAngle(); }
  twistAngle() { const p = [...this.pointers.values()]; return Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]); }
  move(e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, this.evPos(e));
    if (this.pointers.size === 1) this.place(this.evPos(e));
    else if (this.pointers.size === 2) {
      const a = this.twistAngle(); let d = a - this.twist0; this.twist0 = a;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      this.faceBox = false; this.listener.yaw -= d; this.emit();
    }
  }
  up(e) { this.pointers.delete(e.pointerId); }
  place([px, py]) {
    let [x, y] = this.toRoom(px, py);
    const [X, Y] = this.room.dims;
    x = Math.min(Math.max(x, 0.15), X - 0.15); y = Math.min(Math.max(y, 0.15), Y - 0.15);
    if (this.box && !this.held) {
      const d = Math.hypot(x - this.box[0], y - this.box[1]);
      if (d < 0.12) { const k = 0.12 / (d || 1); x = this.box[0] + (x - this.box[0]) * k; y = this.box[1] + (y - this.box[1]) * k; }
    }
    this.listener.x = x; this.listener.y = y; this.emit();
  }
  emit() {
    if (this.faceBox && this.box && !this.held) this.listener.yaw = Math.atan2(this.box[1] - this.listener.y, this.box[0] - this.listener.x);
    this.draw(); this.onChange && this.onChange(this.listener);
  }
  draw() {
    if (!this.room || !this.s) return;
    const c = this.ctx, W = this.cv.width, H = this.cv.height, d = this.dpr;
    c.clearRect(0, 0, W, H);
    // floor + grid
    const [x0, y0] = this.toScreen(this.view.x0, this.view.y1), [x1, y1] = this.toScreen(this.view.x1, this.view.y0);
    c.fillStyle = this.room.walls ? '#2a2018' : '#16210f'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = '#ffffff10'; c.lineWidth = 1;
    for (let gx = Math.ceil(this.view.x0); gx <= this.view.x1; gx++) { const [sx] = this.toScreen(gx, 0); c.beginPath(); c.moveTo(sx, y0); c.lineTo(sx, y1); c.stroke(); }
    for (let gy = Math.ceil(this.view.y0); gy <= this.view.y1; gy++) { const [, sy] = this.toScreen(0, gy); c.beginPath(); c.moveTo(x0, sy); c.lineTo(x1, sy); c.stroke(); }
    if (this.room.walls) { c.strokeStyle = '#c9a77a'; c.lineWidth = 3 * d; c.strokeRect(x0, y0, x1 - x0, y1 - y0); }
    // table + box
    const L = this.listener;
    let box = this.box;
    if (this.held) box = [L.x + Math.cos(L.yaw) * 0.3, L.y + Math.sin(L.yaw) * 0.3];
    if (box && this.table && !this.held) {
      const [tx, ty] = this.toScreen(box[0] - this.table[0] / 2, box[1] + this.table[1] / 2);
      c.fillStyle = '#6b4a2e'; c.fillRect(tx, ty, this.table[0] * this.s, this.table[1] * this.s);
    }
    if (box) {
      const [bx, by] = this.toScreen(box[0], box[1]);
      const bw = Math.max(10 * d, 0.2 * this.s), bh = Math.max(7 * d, 0.14 * this.s);
      c.fillStyle = '#e3b45a'; c.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
      // sound rings
      c.strokeStyle = '#e3b45a33';
      for (let r = 1; r <= 3; r++) { c.beginPath(); c.arc(bx, by, r * 0.5 * this.s, 0, Math.PI * 2); c.stroke(); }
    }
    // listener head
    const [hx, hy] = this.toScreen(L.x, L.y);
    const hr = Math.max(9 * d, 0.0875 * this.s);
    c.save(); c.translate(hx, hy); c.rotate(-L.yaw);
    c.fillStyle = '#8fc1d9'; c.beginPath(); c.arc(0, 0, hr, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(hr * 1.55, 0); c.lineTo(hr * 0.75, -hr * 0.45); c.lineTo(hr * 0.75, hr * 0.45); c.closePath(); c.fill();
    c.fillStyle = '#2b5566'; c.beginPath(); c.arc(0, -hr, hr * 0.32, 0, Math.PI * 2); c.arc(0, hr, hr * 0.32, 0, Math.PI * 2); c.fill();
    c.restore();
    c.fillStyle = '#ffffffaa'; c.font = `${11 * d}px -apple-system, sans-serif`;
    c.fillText(this.room.name, 8 * d, 16 * d);
    if (box) {
      const dist = Math.hypot(L.x - box[0], L.y - box[1], L.z - (this.boxZ || 0.8));
      c.fillText(`${dist.toFixed(2)} m from the box`, 8 * d, H - 8 * d);
    }
  }
}
