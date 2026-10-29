// Circular gesture pad: draw circles to turn the crank or wind the key.
// Clockwise on screen is "forward" (atan2 with y pointing down grows clockwise).
const TAU = Math.PI * 2;
const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

export class CrankPad {
  constructor(el, canvas, { onStart, onTurn, onRelease }) {
    this.el = el; this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.onStart = onStart; this.onTurn = onTurn; this.onRelease = onRelease;
    this.active = false; this.total = 0; this.prev = 0; this.fingerAngle = 0; this.showAngle = -Math.PI / 2;
    this.mode = 'crank'; this.teeth = 16; this.radius = 0.6;
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e));
    this.resize(); window.addEventListener('resize', () => this.resize());
    // the pad is hidden in hamster mode and the stage changes size with the layout: keep the
    // canvas matched to the pad whenever it is shown or resized (a 0×0 canvas draws nothing)
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => this.resize()).observe(el);
  }
  resize() {
    const r = this.el.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (!r.width || !r.height) return;           // hidden: keep the last good size
    const w = Math.round(r.width * d), h = Math.round(r.height * d);
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.dpr = d; this.draw(true);
  }
  angleOf(e) {
    const r = this.el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { a: Math.atan2(y, x), rad: Math.hypot(x, y) / (r.width / 2) };
  }
  down(e) {
    try { this.el.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    const { a } = this.angleOf(e);
    this.prev = a; this.fingerAngle = a; this.active = true;
    this.onStart && this.onStart();
    this.onTurn && this.onTurn({ delta: 0, total: this.total, active: true, reset: false });
    this.draw();
  }
  move(e) {
    if (!this.active) return;
    const { a, rad } = this.angleOf(e);
    if (rad < 0.12) { this.prev = a; return; } // too close to the centre to know the angle
    const d = wrap(a - this.prev);
    this.prev = a; this.total += d; this.fingerAngle = a;
    this.onTurn && this.onTurn({ delta: d, total: this.total, active: true });
    this.draw();
  }
  up() {
    if (!this.active) return;
    this.active = false;
    this.onRelease && this.onRelease({ total: this.total });
    this.draw();
  }
  setShown(angle) { if (!this.active && Number.isFinite(angle)) { this.showAngle = angle; this.draw(); } }
  draw(sized) {
    if (!sized && (!this.cv.width || !this.dpr)) { this.resize(); return; }
    const c = this.ctx, W = this.cv.width, H = this.cv.height, R = Math.min(W, H) / 2;
    if (!W || !H) return;
    c.clearRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H / 2);
    // ratchet teeth ring
    c.strokeStyle = '#6b5640'; c.lineWidth = 1.5 * this.dpr;
    const n = this.mode === 'crank' ? 12 : 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      c.beginPath(); c.moveTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); c.lineTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94); c.stroke();
    }
    let ang = this.active ? this.fingerAngle : this.showAngle;
    if (!Number.isFinite(ang)) ang = -Math.PI / 2;
    const hr = R * this.radius;
    if (this.mode === 'crank') {
      // crank arm + knob
      c.strokeStyle = '#c9a14a'; c.lineWidth = 7 * this.dpr; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ang) * hr, Math.sin(ang) * hr); c.stroke();
      c.fillStyle = '#c9a14a'; c.beginPath(); c.arc(0, 0, 8 * this.dpr, 0, TAU); c.fill();
      c.fillStyle = this.active ? '#f0c879' : '#5a3a22';
      c.beginPath(); c.arc(Math.cos(ang) * hr, Math.sin(ang) * hr, 13 * this.dpr, 0, TAU); c.fill();
      c.strokeStyle = '#2a1a10'; c.lineWidth = 2 * this.dpr; c.stroke();
    } else {
      // butterfly key
      c.rotate(ang);
      c.fillStyle = this.active ? '#f0c879' : '#c9a14a';
      for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * R * 0.32, 0, R * 0.26, R * 0.17, 0, 0, TAU); c.fill(); }
      c.fillRect(-R * 0.1, -R * 0.07, R * 0.2, R * 0.14);
      c.fillStyle = '#2a1a10'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * R * 0.36, 0, R * 0.07, 0, TAU); c.fill(); }
    }
    c.restore();
    // direction arrow
    c.strokeStyle = '#e3b45a88'; c.lineWidth = 2 * this.dpr;
    c.beginPath(); c.arc(W / 2, H / 2, R * 0.78, -2.4, -0.9); c.stroke();
    const ax = W / 2 + Math.cos(-0.9) * R * 0.78, ay = H / 2 + Math.sin(-0.9) * R * 0.78;
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax - 9 * this.dpr, ay - 3 * this.dpr); c.lineTo(ax - 3 * this.dpr, ay - 10 * this.dpr); c.closePath(); c.fillStyle = '#e3b45a88'; c.fill();
  }
}
