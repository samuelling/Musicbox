// A cozy log cabin in the Alps: log walls, plank floor, beams, a stone fireplace with a live fire,
// a frosted window onto a moonlit, snowy valley with snow falling.  Built in "room space":
// millimetres with x = room x, y = height, z = room y (so it lines up with the acoustic room).
import * as THREE from 'three';
import { woodMaterial } from './materials.js';

const R = (a, b) => a + Math.random() * (b - a);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// --- the view out of the window: night sky, moon, snowy peaks, forest, snowfield
function valleyTexture() {
  const [c, x] = canvas(2048, 900), W = 2048, H = 900;
  // a storm sky: low, heavy cloud lit faintly from somewhere above; no stars tonight
  const sky = x.createLinearGradient(0, 0, 0, H * 0.75);
  sky.addColorStop(0, '#11161f'); sky.addColorStop(0.6, '#2a3240'); sky.addColorStop(1, '#4a5466');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${R(70, 120)},${R(80, 125)},${R(95, 140)},${R(0.04, 0.1)})`; x.beginPath(); x.ellipse(R(0, W), R(0, H * 0.6), R(120, 420), R(30, 90), 0, 0, 7); x.fill(); }
  // three ranges of mountains, nearer = darker; snow lit from the moon's side
  const range = (base, amp, rough, seed, fill, snow) => {
    const pts = []; let y = base;
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      y = base - amp * (0.55 + 0.45 * Math.sin(u * 7.1 + seed) * Math.sin(u * 2.3 + seed * 2)) - rough * Math.abs(Math.sin(u * 53 + seed * 9));
      pts.push([u * W, y]);
    }
    x.beginPath(); x.moveTo(0, H); pts.forEach(([a, b]) => x.lineTo(a, b)); x.lineTo(W, H); x.closePath();
    x.fillStyle = fill; x.fill();
    // snowcaps and moonlit faces
    x.save(); x.clip();
    for (let i = 1; i < pts.length; i++) {
      const [a0, b0] = pts[i - 1], [a1, b1] = pts[i];
      const lit = b1 < b0 ? 0.85 : 0.45;
      x.fillStyle = snow.replace('A', String(lit));
      x.beginPath(); x.moveTo(a0, b0); x.lineTo(a1, b1); x.lineTo(a1, b1 + amp * 0.35); x.lineTo(a0, b0 + amp * 0.35); x.fill();
    }
    x.restore();
  };
  range(H * 0.5, H * 0.3, 18, 1.3, '#4d5768', 'rgba(170,180,200,A)');
  range(H * 0.6, H * 0.22, 14, 4.1, '#353d4c', 'rgba(175,185,205,A)');
  range(H * 0.7, H * 0.12, 10, 7.7, '#232a36', 'rgba(170,180,200,A)');
  // snowfield
  const g = x.createLinearGradient(0, H * 0.72, 0, H); g.addColorStop(0, '#7d8798'); g.addColorStop(1, '#a6b0c0');
  x.fillStyle = g; x.fillRect(0, H * 0.74, W, H * 0.26);
  // fir forest with snow on the boughs
  for (let i = 0; i < 260; i++) {
    const fx = Math.random() * W, fy = H * (0.72 + Math.random() * 0.12), s = (fy - H * 0.65) * 0.55 + 10;
    x.fillStyle = '#0d1522';
    x.beginPath(); x.moveTo(fx, fy - s * 2.2); x.lineTo(fx + s * 0.55, fy); x.lineTo(fx - s * 0.55, fy); x.closePath(); x.fill();
    x.fillStyle = 'rgba(220,232,255,0.55)';
    for (let k = 0; k < 3; k++) { const yy = fy - s * (0.5 + k * 0.55); x.fillRect(fx - s * (0.35 - k * 0.1), yy, s * (0.5 - k * 0.12), 1.5); }
  }
  // a distant chalet with a warm window
  x.fillStyle = '#120d0a'; x.fillRect(W * 0.2, H * 0.735, 46, 22); x.beginPath(); x.moveTo(W * 0.2 - 6, H * 0.735); x.lineTo(W * 0.2 + 23, H * 0.715); x.lineTo(W * 0.2 + 52, H * 0.735); x.fill();
  x.fillStyle = '#ffb35a'; x.fillRect(W * 0.2 + 12, H * 0.742, 6, 5); x.fillRect(W * 0.2 + 28, H * 0.742, 6, 5);
  return tex(c);
}

// old floorboards: wide, worn, grey-brown, gaps between boards, nail heads, scuffed paths
function oldPlanks() {
  const W = 1024, H = 1024, [c, x] = canvas(W, H);
  let y = 0, row = 0;
  while (y < H) {
    const h = R(70, 110); let xx = -R(0, 600);
    while (xx < W) {
      const len = R(500, 1100), base = R(0.75, 1.05);
      const img = x.createImageData(Math.max(1, Math.ceil(Math.min(len, W - xx) )), Math.ceil(h)), d = img.data;
      const iw = img.width, ih = img.height, ph = R(0, 100);
      for (let j = 0; j < ih; j++) for (let i = 0; i < iw; i++) {
        const gx = i + xx, grain = Math.sin((j + 6 * Math.sin(gx * 0.006 + ph) + 3 * Math.sin(gx * 0.031 + ph)) * 0.55 + ph) * 0.5 + 0.5;
        const fib = Math.sin(gx * 0.9 + j * 7.3 + ph * 3) * 0.5 + 0.5;
        let v = (92 + 26 * grain + 10 * fib) * base;
        const wear = Math.exp(-(((j / ih) - 0.5) ** 2) * 6) * 12;      // boards cup and wear in the middle
        const k = (i * 4 + j * iw * 4);
        d[k] = v * 0.96 + wear; d[k + 1] = v * 0.8 + wear * 0.8; d[k + 2] = v * 0.62 + wear * 0.6; d[k + 3] = 255;
      }
      if (xx + iw > 0) x.putImageData(img, Math.floor(Math.max(xx, -iw)), Math.floor(y));
      // butt joint, nails at the board ends
      x.fillStyle = 'rgba(15,10,6,0.9)'; x.fillRect(xx + len - 2, y, 3, h);
      x.fillStyle = '#2a2622'; for (const f of [0.25, 0.75]) { x.beginPath(); x.arc(xx + len - 12, y + h * f, 2.6, 0, 7); x.fill(); x.beginPath(); x.arc(xx + 10, y + h * f, 2.6, 0, 7); x.fill(); }
      xx += len;
    }
    x.fillStyle = 'rgba(10,6,4,0.95)'; x.fillRect(0, y + h - 3, W, 3);          // gap between boards
    y += h; row++;
  }
  // grime in a darker overall wash, scuffs, a few knots
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(30,20,12,${R(0.03, 0.08)})`; x.beginPath(); x.ellipse(R(0, W), R(0, H), R(40, 200), R(10, 60), R(0, 3), 0, 7); x.fill(); }
  for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(45,28,16,0.7)'; x.beginPath(); x.ellipse(R(0, W), R(0, H), R(4, 9), R(3, 6), 0, 0, 7); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// square-hewn, smoke-darkened larch: adze facets across the face, long drying checks, knots
function hewnTimber() {
  const W = 1024, H = 256, [c, x] = canvas(W, H);
  const img = x.createImageData(W, H), d = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const grain = Math.sin((j + 9 * Math.sin(i * 0.004) + 4 * Math.sin(i * 0.023 + j * 0.01)) * 0.35) * 0.5 + 0.5;
    const adze = Math.pow(Math.abs(Math.sin(i * 0.045 + Math.sin(j * 0.05) * 0.6)), 0.5);   // scalloped tool marks
    let v = 70 + 30 * grain + 18 * adze;
    const edge = Math.min(j, H - 1 - j) / H; v *= 0.75 + 0.25 * Math.min(1, edge * 8);   // darker arrises
    const k = (j * W + i) * 4; d[k] = v * 1.0; d[k + 1] = v * 0.72; d[k + 2] = v * 0.48; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  x.strokeStyle = 'rgba(12,7,4,0.85)'; x.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) { let px = R(0, W), py = R(40, H - 40); x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 30; k++) { px += R(6, 14); py += R(-1.5, 1.5); x.lineTo(px, py); } x.stroke(); }
  for (let i = 0; i < 4; i++) { const kx = R(0, W), ky = R(50, H - 50); const g = x.createRadialGradient(kx, ky, 1, kx, ky, 14); g.addColorStop(0, 'rgba(25,12,6,0.95)'); g.addColorStop(1, 'rgba(60,35,20,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(kx, ky, 16, 10, 0, 0, 7); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function stoneTexture() {
  const [c, x] = canvas(1024, 1024);
  x.fillStyle = '#6f675c'; x.fillRect(0, 0, 1024, 1024);       // mortar
  let y = 0;
  while (y < 1024) {
    const h = R(70, 130); let xx = -R(0, 80);
    while (xx < 1024) {
      const w = R(90, 190), g = Math.floor(R(95, 160));
      x.fillStyle = `rgb(${g + 8},${g},${g - 12})`;
      x.beginPath(); x.ellipse(xx + w / 2, y + h / 2, w / 2 - 5, h / 2 - 5, R(-0.1, 0.1), 0, Math.PI * 2); x.fill();
      // lichen and shading
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.beginPath(); x.ellipse(xx + w / 2 + 6, y + h / 2 + 8, w / 2 - 10, h / 2 - 12, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(255,255,240,${R(0.04, 0.12)})`; x.beginPath(); x.ellipse(xx + w / 2 - 8, y + h / 2 - 10, w / 3, h / 4, 0, 0, Math.PI * 2); x.fill();
      xx += w;
    }
    y += h;
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function rugTexture() {
  const [c, x] = canvas(1024, 700), W = 1024, H = 700;
  x.fillStyle = '#7a1c1c'; x.fillRect(0, 0, W, H);
  const band = (i, col) => { x.strokeStyle = col; x.lineWidth = 14; x.strokeRect(20 + i * 26, 20 + i * 26, W - 40 - i * 52, H - 40 - i * 52); };
  band(0, '#2b1a14'); band(1, '#d9b46a'); band(2, '#1e3a4a'); band(3, '#d9b46a');
  // edelweiss-like stars and a central medallion
  x.fillStyle = '#f0e2c4';
  const star = (cx, cy, r) => { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.55, r * 0.45, r * 0.16, a, 0, Math.PI * 2); x.fill(); } x.fillStyle = '#d9b46a'; x.beginPath(); x.arc(cx, cy, r * 0.22, 0, Math.PI * 2); x.fill(); x.fillStyle = '#f0e2c4'; };
  star(W / 2, H / 2, 90);
  for (const [a, b] of [[0.25, 0.3], [0.75, 0.3], [0.25, 0.7], [0.75, 0.7]]) star(W * a, H * b, 40);
  x.strokeStyle = '#1e3a4a'; x.lineWidth = 6; x.beginPath(); x.moveTo(W / 2, 150); x.lineTo(W - 220, H / 2); x.lineTo(W / 2, H - 150); x.lineTo(220, H / 2); x.closePath(); x.stroke();
  // wear
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  return tex(c);
}

function frostTexture() {
  // ice ferns growing in from the edges and corners of each pane; a faint even haze elsewhere
  const [c, x] = canvas(256, 256);
  x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineCap = 'round';
  const fern = (px, py, a, len, w) => {
    if (len < 4) return;
    x.lineWidth = w; x.beginPath(); x.moveTo(px, py);
    const ex = px + Math.cos(a) * len, ey = py + Math.sin(a) * len; x.lineTo(ex, ey); x.stroke();
    for (let k = 1; k <= 3; k++) { const f = k / 4; fern(px + (ex - px) * f, py + (ey - py) * f, a + 0.9, len * 0.35, w * 0.6); fern(px + (ex - px) * f, py + (ey - py) * f, a - 0.9, len * 0.35, w * 0.6); }
  };
  for (let i = 0; i < 26; i++) {
    const side = i % 4, t = Math.random() * 256;
    const [px, py, a] = side === 0 ? [t, 0, Math.PI / 2] : side === 1 ? [t, 256, -Math.PI / 2] : side === 2 ? [0, t, 0] : [256, t, Math.PI];
    const corner = Math.min(t, 256 - t) < 60 ? 1.6 : 0.8;
    fern(px, py, a + R(-0.5, 0.5), R(14, 34) * corner, 1.4);
  }
  return tex(c, false);
}

function flakeTexture() {
  const [c, x] = canvas(32, 32);
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return tex(c);
}

export const CABIN_FEATURES = {
  window: { wall: 'y1', x0: 2.05, x1: 3.15, z0: 0.85, z1: 2.05 },
  fireplace: { wall: 'x0', y0: 1.95, y1: 3.45, depth: 0.5 },
};

export class Cabin {
  constructor(dims) {
    const [RX, RY, RZ] = dims.map((v) => v * 1000);
    const g = (this.group = new THREE.Group());
    this.dims = [RX, RY, RZ];
    const logWood = woodMaterial('walnut', { gloss: 0.04, mm: 900 });
    logWood.color = new THREE.Color(0xd9b48a);           // weathered larch: lighten the walnut grain
    const chink = new THREE.MeshStandardMaterial({ color: 0xcdbd9f, roughness: 0.95 });
    const dark = woodMaterial('walnut', { gloss: 0.1, mm: 700 });
    const W = CABIN_FEATURES.window;
    const win = { x0: W.x0 * 1000, x1: W.x1 * 1000, y0: W.z0 * 1000, y1: W.z1 * 1000 };
    this.win = win;

    // ---- floor: old wide boards ----
    const fl = oldPlanks(); fl.repeat.set(RX / 2600, RY / 2600);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(RX, RY), new THREE.MeshStandardMaterial({ map: fl, roughness: 0.88 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(RX / 2, 0, RY / 2); floor.receiveShadow = true; g.add(floor);
    // ---- ceiling boards and heavy, smoke-blackened beams ----
    const timberT = hewnTimber();
    const timber = (rep) => { const t = timberT.clone(); t.needsUpdate = true; t.repeat.set(rep, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }); };
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RX, RY), new THREE.MeshStandardMaterial({ map: (() => { const t = fl.clone(); t.needsUpdate = true; t.repeat.set(RX / 2200, RY / 2200); return t; })(), roughness: 0.9, color: 0x6a5444 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(RX / 2, RZ, RY / 2); g.add(ceil);
    const beamM = timber(RX / 1400); beamM.color = new THREE.Color(0x6a5040);
    for (let k = 1; k <= 3; k++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(RX + 300, 220, 200), beamM); beam.position.set(RX / 2, RZ - 110, (k / 4) * RY); beam.castShadow = true; g.add(beam); }

    // ---- walls: square-hewn timbers laid flat (Blockbau), dark oakum caulking between ----
    const th = 210, gap = 8, depth = 150;
    const caulk = new THREE.MeshStandardMaterial({ color: 0x1e140c, roughness: 1 });
    const mats = [0.85, 0.95, 1.05, 0.9, 1.0].map((k) => { const m = timber(1); m.color = new THREE.Color(k * 0.95, k * 0.88, k * 0.82); return m; });
    let mi = 0;
    const beamLog = (len, x, y, z, alongX) => {
      const m = mats[mi++ % mats.length].clone(); m.map = m.map.clone(); m.map.needsUpdate = true; m.map.repeat.set(len / 1300, 1); m.map.offset.set(Math.random(), 0);
      const geo = alongX ? new THREE.BoxGeometry(len, th - gap, depth) : new THREE.BoxGeometry(depth, th - gap, len);
      if (!alongX) { const uv = geo.attributes.uv; for (let q = 0; q < uv.count; q++) { const u = uv.getX(q); uv.setX(q, u); } }
      const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.receiveShadow = true; b.castShadow = true; g.add(b);
    };
    const n = Math.ceil(RZ / th);
    for (let i = 0; i < n; i++) {
      const y = th / 2 + i * th, over = i % 2 ? 220 : 0, o2 = i % 2 ? 0 : 220;   // corner joints: courses alternate past each other
      beamLog(RX + 2 * over, RX / 2, y, -depth / 2, true);
      if (y + th / 2 > win.y0 && y - th / 2 < win.y1) {
        beamLog(win.x0 + over, (win.x0 - over) / 2, y, RY + depth / 2, true);
        beamLog(RX - win.x1 + over, (win.x1 + RX + over) / 2, y, RY + depth / 2, true);
      } else beamLog(RX + 2 * over, RX / 2, y, RY + depth / 2, true);
      beamLog(RY + 2 * o2, -depth / 2, y, RY / 2, false);
      beamLog(RY + 2 * o2, RX + depth / 2, y, RY / 2, false);
    }
    const plane = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), caulk); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
    plane(RX, RZ, RX / 2, RZ / 2, -depth + 5, 0);
    plane(RY, RZ, -depth + 5, RZ / 2, RY / 2, Math.PI / 2);
    plane(RY, RZ, RX + depth - 5, RZ / 2, RY / 2, -Math.PI / 2);
    const r = depth;   // (window wall caulking sits just behind the timbers)
    // back wall chinking with the window hole
    plane(win.x0, RZ, win.x0 / 2, RZ / 2, RY + depth - 5, Math.PI);
    plane(RX - win.x1, RZ, (win.x1 + RX) / 2, RZ / 2, RY + depth - 5, Math.PI);

    // ---- the window: deep frame, six panes, frost, a sill with a little snow outside ----
    const frameM = woodMaterial('walnut', { gloss: 0.3, mm: 600 });
    const ww = win.x1 - win.x0, wh = win.y1 - win.y0, cx = (win.x0 + win.x1) / 2, cy = (win.y0 + win.y1) / 2, zf = RY + 30;
    const bx = (w, h, d, x, y, z, m = frameM) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
    bx(ww + 140, 80, 260, cx, win.y0 - 40, RY + 40); bx(ww + 140, 80, 240, cx, win.y1 + 40, RY + 40);
    bx(80, wh + 160, 240, win.x0 - 40, cy, RY + 40); bx(80, wh + 160, 240, win.x1 + 40, cy, RY + 40);
    bx(ww + 200, 40, 200, cx, win.y0 - 70, RY - 70);                          // inner sill
    bx(40, wh, 60, cx, cy, zf); for (const f of [1 / 3, 2 / 3]) bx(ww, 40, 60, cx, win.y0 + wh * f, zf);
    const frost = frostTexture();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshPhysicalMaterial({ color: 0xdfe8f5, roughness: 0.08, transparent: true, opacity: 0.12, depthWrite: false }));
    glass.position.set(cx, cy, zf); glass.rotation.y = Math.PI; g.add(glass);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(ww / 2 - 30, wh / 3 - 30), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, alphaMap: frost, transparent: true, opacity: 0.6, depthWrite: false }));
      pane.position.set(win.x0 + ww * (i + 0.5) / 2, win.y0 + wh * (j + 0.5) / 3, zf - 2); pane.rotation.y = Math.PI; g.add(pane);
    }
    const snowM = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: 0.9, emissive: 0x223355, emissiveIntensity: 0.3 });
    const drift = new THREE.Mesh(new THREE.CapsuleGeometry(45, ww - 60, 6, 12), snowM); drift.rotation.z = Math.PI / 2; drift.scale.set(1, 1, 1.6); drift.position.set(cx, win.y0 - 10, RY + 150); g.add(drift);

    // ---- outside: the valley, and snow falling past the window ----
    const back = new THREE.Mesh(new THREE.PlaneGeometry(20000, 8800), new THREE.MeshBasicMaterial({ map: valleyTexture(), fog: false }));
    back.position.set(cx, 2900, RY + 7000); back.rotation.y = Math.PI; g.add(back);
    const NF = 2600, pos = new Float32Array(NF * 3); this.flakes = [];
    for (let i = 0; i < NF; i++) {
      const f = { x: R(cx - 3500, cx + 3500), y: R(-600, 5200), z: R(RY + 220, RY + 6500), v: R(700, 1500), ph: R(0, 6.28), a: R(80, 260), w: R(0.7, 1.3) };
      this.flakes.push(f);
    }
    this.snowGeo = new THREE.BufferGeometry(); this.snowGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const snow = new THREE.Points(this.snowGeo, new THREE.PointsMaterial({ size: 38, map: flakeTexture(), transparent: true, depthWrite: false, color: 0xdfe8ff, fog: false }));
    snow.frustumCulled = false; g.add(snow);
    // blowing snow: a whiteout veil that thickens with each gust
    this.veil = new THREE.Mesh(new THREE.PlaneGeometry(14000, 8000), new THREE.MeshBasicMaterial({ color: 0xaab4c4, transparent: true, opacity: 0.35, depthWrite: false, fog: false }));
    this.veil.position.set(cx, 2500, RY + 2600); this.veil.rotation.y = Math.PI; g.add(this.veil);
    this.cx = cx; this.wind = 0; this.gust = 0;

    // ---- fireplace on the x = 0 wall: raised hearth, stone breast, mantel, logs, flames ----
    const F = CABIN_FEATURES.fireplace, fy0 = F.y0 * 1000, fy1 = F.y1 * 1000, fd = F.depth * 1000, fc = (fy0 + fy1) / 2;
    const st = stoneTexture(); st.repeat.set(2, 3);
    const stone = new THREE.MeshStandardMaterial({ map: st, roughness: 0.92 });
    const sb = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stone); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); };
    const openW = 820, openH = 640, hearthH = 300;
    sb(fd, hearthH, fy1 - fy0 + 200, fd / 2, hearthH / 2, fc);                                       // hearth
    sb(fd, RZ - hearthH - openH, fy1 - fy0, fd / 2, hearthH + openH + (RZ - hearthH - openH) / 2, fc); // breast above
    sb(fd, openH, (fy1 - fy0 - openW) / 2, fd / 2, hearthH + openH / 2, fy0 + (fy1 - fy0 - openW) / 4);
    sb(fd, openH, (fy1 - fy0 - openW) / 2, fd / 2, hearthH + openH / 2, fy1 - (fy1 - fy0 - openW) / 4);
    const soot = new THREE.Mesh(new THREE.BoxGeometry(30, openH, openW), new THREE.MeshStandardMaterial({ color: 0x120c09, roughness: 1 }));
    soot.position.set(40, hearthH + openH / 2, fc); g.add(soot);
    const mantel = new THREE.Mesh(new THREE.BoxGeometry(fd + 120, 150, fy1 - fy0 + 260), dark); mantel.position.set(fd / 2 + 40, hearthH + openH + 75, fc); mantel.castShadow = true; g.add(mantel);
    // logs, embers
    const logM = new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.9 });
    for (const [a, dz, dy] of [[0.35, -90, 0], [-0.3, 90, 0], [0.05, 0, 110]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(55, 60, 560, 12), logM); l.rotation.x = Math.PI / 2; l.rotation.y = a;
      l.position.set(fd * 0.55, hearthH + 60 + dy, fc + dz); g.add(l);
    }
    const emberM = new THREE.MeshBasicMaterial({ color: 0xff5a14 });
    this.embers = new THREE.Mesh(new THREE.BoxGeometry(fd * 0.6, 24, openW * 0.7), emberM); this.embers.position.set(fd * 0.55, hearthH + 14, fc); g.add(this.embers);
    // flames: additive teardrops that flicker
    this.flames = [];
    const flameCols = [0xffd27a, 0xff9a3a, 0xff6a1a];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: flameCols[i % 3], transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      const base = new THREE.Vector3(fd * R(0.45, 0.65), hearthH + 120, fc + R(-220, 220));
      m.position.copy(base); g.add(m);
      this.flames.push({ m, base, ph: R(0, 6.28), h: R(160, 300), w: R(45, 80) });
    }
    this.fireLight = new THREE.PointLight(0xff8a3c, 2.4e6, 0, 2);
    this.fireLight.position.set(fd + 220, hearthH + 260, fc); g.add(this.fireLight);
    this.fireN = 0; this.t = 0;

    // ---- a corner bench (the Eckbank of a farmhouse Stube) and firewood by the hearth ----
    const benchM = timber(2); benchM.color = new THREE.Color(0x9a7a60);
    const bench = (len, x, z, alongX) => {
      const seat = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 50, 420) : new THREE.BoxGeometry(420, 50, len), benchM); seat.position.set(x, 440, z); seat.castShadow = seat.receiveShadow = true; g.add(seat);
      const front = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 415, 30) : new THREE.BoxGeometry(30, 415, len), benchM);
      front.position.set(alongX ? x : x + (x < RX / 2 ? 190 : -190), 208, alongX ? z + (z < RY / 2 ? 190 : -190) : z); g.add(front);
      const back = new THREE.Mesh(alongX ? new THREE.BoxGeometry(len, 420, 40) : new THREE.BoxGeometry(40, 420, len), benchM);
      back.position.set(alongX ? x : x + (x < RX / 2 ? -190 : 190), 690, alongX ? z + (z < RY / 2 ? -190 : 190) : z); back.rotation[alongX ? 'x' : 'z'] = (alongX ? (z < RY / 2 ? -1 : 1) : (x < RX / 2 ? 1 : -1)) * 0.12; g.add(back);
    };
    bench(2200, RX - 1100, RY - 210, true); bench(1900, RX - 210, RY - 420 - 950, false);
    const woodM = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.95 }), endM = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 });
    for (let row = 0; row < 5; row++) for (let k = 0; k < 6 - (row % 2); k++) {
      const rr = R(55, 70), lg = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 420, 9), [woodM, endM, endM]);
      lg.rotation.x = Math.PI / 2; lg.position.set(130 + k * 125 + (row % 2) * 62, 70 + row * 112, fy1 + 360); lg.rotation.y = R(-0.05, 0.05); lg.castShadow = true; g.add(lg);
    }
  }

  update(dt) {
    this.t += dt;
    // snow: falling, drifting in a light wind, recycled at the bottom
    // the storm: wind in gusts (a few seconds each), snow driven sideways and swirling
    if (Math.random() < dt * 0.25) this.gust = R(0.6, 1.4);
    this.gust *= Math.exp(-dt / 3);
    const target = 2600 + 4200 * this.gust + 600 * Math.sin(this.t * 0.37);
    this.wind += (target - this.wind) * Math.min(1, dt * 1.5);
    this.veil.material.opacity = 0.28 + 0.3 * Math.min(1, this.gust);
    const p = this.snowGeo.attributes.position.array, x0 = this.cx - 3500, span = 7000;
    for (let i = 0; i < this.flakes.length; i++) {
      const f = this.flakes[i];
      f.y -= f.v * dt * (1 + 0.3 * Math.sin(this.t * 2 + f.ph)); if (f.y < -600) f.y = 5200;
      f.x += this.wind * f.w * dt; if (f.x > x0 + span) f.x -= span;
      const sway = Math.sin(this.t * 1.7 + f.ph) * f.a;
      p[i * 3] = f.x; p[i * 3 + 1] = f.y + sway * 0.6; p[i * 3 + 2] = f.z + sway * 0.4;
    }
    this.snowGeo.attributes.position.needsUpdate = true;
    // fire: a smoothed random walk drives light and flames
    this.fireN += (Math.random() * 2 - 1 - this.fireN) * Math.min(1, dt * 8);
    const lvl = 1 + 0.22 * this.fireN + 0.08 * Math.sin(this.t * 13.7);
    this.fireLight.intensity = 2.4e6 * lvl;
    this.embers.material.color.setRGB(1, 0.32 + 0.08 * lvl, 0.08);
    for (const f of this.flames) {
      const s = 0.7 + 0.3 * Math.sin(this.t * (5 + f.ph) + f.ph) + 0.15 * this.fireN;
      f.m.scale.set(f.w * 0.8, f.h * s, f.w);
      f.m.position.set(f.base.x, f.base.y + f.h * s * 0.5, f.base.z + 18 * Math.sin(this.t * 3.1 + f.ph));
    }
  }
}
