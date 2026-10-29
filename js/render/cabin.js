// A cozy log cabin in the Alps: log walls, plank floor, beams, a stone fireplace with a live fire,
// a frosted window onto a moonlit, snowy valley with snow falling.  Built in "room space":
// millimetres with x = room x, y = height, z = room y (so it lines up with the acoustic room).
import * as THREE from 'three';
import { lockedDoor, mountDoor } from './doors.js';
import { woodMaterial } from './materials.js';
import { regulator, wallMount } from './clocks.js';

const R = (a, b) => a + Math.random() * (b - a);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// --- the view out of the window: night sky, moon, snowy peaks, forest, snowfield
export function valleyTexture() {
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
export function oldPlanks() {
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

export function stoneTexture() {
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

export function frostTexture() {
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

export function flakeTexture() {
  const [c, x] = canvas(32, 32);
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return tex(c);
}

// ---- an original watercolour: a summer alp, a chalet, firs, peaks, painted in soft washes
function watercolour() {
  const W = 1024, H = 760, [c, x] = canvas(W, H);
  x.fillStyle = '#f4efe2'; x.fillRect(0, 0, W, H);                       // paper
  const wash = (fill, pts, n = 4, j = 10, a0 = 0.16) => {
    const a = Math.min(0.6, a0 * 1.7);
    for (let k = 0; k < n; k++) {
      x.fillStyle = fill.replace('A', a.toFixed(3)); x.beginPath();
      pts.forEach(([px, py], i) => (i ? x.lineTo : x.moveTo).call(x, px + R(-j, j), py + R(-j, j))); x.closePath(); x.fill();
      x.strokeStyle = fill.replace('A', (a * 0.9).toFixed(3)); x.lineWidth = R(1, 2.5); x.stroke();   // pigment gathers at the edge of a wash
    }
  };
  const ridge = (y0, amp, f, seed) => { const p = [[0, H]]; for (let i = 0; i <= 40; i++) { const u = i / 40; p.push([u * W, y0 - amp * Math.abs(Math.sin(u * f + seed)) - amp * 0.4 * Math.sin(u * f * 2.7 + seed * 3)]); } p.push([W, H]); return p; };
  // sky: a wet-in-wet blue fading to warm at the horizon, a cloud lifted out
  const sk = x.createLinearGradient(0, 0, 0, H * 0.55); sk.addColorStop(0, 'rgba(120,160,205,0.55)'); sk.addColorStop(1, 'rgba(240,220,190,0.15)');
  x.fillStyle = sk; x.fillRect(0, 0, W, H * 0.6);
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(250,248,240,0.35)'; x.beginPath(); x.ellipse(R(150, 900), R(60, 200), R(60, 140), R(18, 36), 0, 0, 7); x.fill(); }
  wash('rgba(120,135,170,A)', ridge(H * 0.42, 150, 5.5, 0.6), 5, 8, 0.12);          // far peaks
  // snow on the peaks: leave the paper, with a blue shadow side
  wash('rgba(252,250,245,A)', ridge(H * 0.30, 60, 5.5, 0.6).slice(1, -1).concat([[W, H * 0.33], [0, H * 0.33]]), 2, 5, 0.25);
  wash('rgba(95,130,110,A)', ridge(H * 0.58, 70, 3.1, 2.2), 5, 10, 0.13);            // the alp
  wash('rgba(120,165,80,A)', ridge(H * 0.70, 40, 2.3, 4.1), 5, 12, 0.15);            // meadow
  wash('rgba(150,185,90,A)', ridge(H * 0.84, 25, 1.7, 1.3), 4, 14, 0.15);
  // firs
  for (let i = 0; i < 26; i++) { const fx = R(0, W), fy = H * R(0.56, 0.7), s = R(18, 40) * (fy / H); wash('rgba(40,70,55,A)', [[fx, fy - s * 3], [fx + s, fy], [fx - s, fy]], 2, 3, 0.22); }
  // the chalet: weathered wood, a wide low roof, a white gable cross
  const cx = W * 0.62, cy = H * 0.68;
  wash('rgba(140,90,55,A)', [[cx - 70, cy], [cx + 70, cy], [cx + 70, cy - 60], [cx - 70, cy - 60]], 3, 2, 0.25);
  wash('rgba(85,60,45,A)', [[cx - 95, cy - 55], [cx, cy - 110], [cx + 95, cy - 55]], 3, 2, 0.3);
  x.fillStyle = 'rgba(250,245,235,0.8)'; x.fillRect(cx - 40, cy - 45, 18, 16); x.fillRect(cx + 20, cy - 45, 18, 16);
  x.fillStyle = 'rgba(200,60,60,0.5)'; for (let i = 0; i < 6; i++) x.fillRect(cx - 50 + i * 18, cy - 30, 10, 5);   // geraniums at the windows
  // wildflowers in the foreground: dabs
  const fl = ['rgba(240,240,250,A)', 'rgba(230,200,60,A)', 'rgba(170,110,200,A)', 'rgba(220,90,90,A)'];
  for (let i = 0; i < 260; i++) { x.fillStyle = fl[i % 4].replace('A', R(0.35, 0.7).toFixed(2)); x.beginPath(); x.arc(R(0, W), H * R(0.78, 0.98), R(1.5, 4), 0, 7); x.fill(); }
  // paper grain and a soft, uneven border where the washes stop
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4, n = (Math.random() - 0.5) * 14 + 6 * Math.sin(i * 0.9) * Math.sin(j * 1.1);
    const e = Math.min(i, W - 1 - i, j, H - 1 - j) / 40, fade = Math.min(1, Math.max(0, e + 0.15 * Math.sin(i * 0.05 + j * 0.07)));
    for (let ch = 0; ch < 3; ch++) d[k + ch] = (d[k + ch] + n) * fade + [244, 239, 226][ch] * (1 - fade);
  }
  x.putImageData(img, 0, 0);
  return tex(c);
}

// ---- a carved Swiss frame: linden wood, a running band of leaves and edelweiss in relief,
// an edelweiss rosette at each corner and a carved crest on top. Origin at the back, face +z.
function carvedTexture() {
  const [c, x] = canvas(1024, 128);
  x.fillStyle = '#808080'; x.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 16; i++) {
    const cx = i * 64 + 32;
    x.fillStyle = '#c8c8c8';
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 16, 64 + s * 10, 22, 9, s * 0.6, 0, 7); x.fill(); }
    x.fillStyle = '#f0f0f0'; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * 9, 64 + Math.sin(a) * 9, 9, 4, a, 0, 7); x.fill(); }
    x.fillStyle = '#505050'; x.beginPath(); x.arc(cx, 64, 3, 0, 7); x.fill();
  }
  x.fillStyle = '#404040'; x.fillRect(0, 0, 1024, 10); x.fillRect(0, 118, 1024, 10);
  x.fillStyle = '#d0d0d0'; x.fillRect(0, 12, 1024, 5); x.fillRect(0, 111, 1024, 5);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
}
function edelweiss(mat, r) {
  const g = new THREE.Group();
  for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6), mat); p.scale.set(1, 0.36, 0.3); p.position.set(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, 0); p.rotation.z = a; g.add(p); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.22, 8, 6), mat); b.position.set(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25, r * 0.15); g.add(b); }
  return g;
}
function framedWatercolour() {
  const g = new THREE.Group();
  const PW = 760, PH = 560, F = 95, D = 46;
  const ct = carvedTexture();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a34, roughness: 0.62, bumpMap: ct, bumpScale: 6 });
  const plain = new THREE.MeshStandardMaterial({ color: 0x6e4526, roughness: 0.55 });
  const bar = (len, horiz, x, y) => {
    const t = ct.clone(); t.needsUpdate = true; t.repeat.set(len / 380, 1);
    const m = wood.clone(); m.bumpMap = t; m.map = null;
    const geo = new THREE.BoxGeometry(horiz ? len : F, horiz ? F : len, D);
    if (!horiz) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); }
    const b = new THREE.Mesh(geo, m); b.position.set(x, y, D / 2); b.castShadow = true; g.add(b);
  };
  bar(PW + 2 * F, true, 0, PH / 2 + F / 2); bar(PW + 2 * F, true, 0, -PH / 2 - F / 2);
  bar(PH, false, -PW / 2 - F / 2, 0); bar(PH, false, PW / 2 + F / 2, 0);
  // a raised inner lip and a gilt fillet next to the paper
  const gilt = new THREE.MeshStandardMaterial({ color: 0xc9a050, metalness: 0.9, roughness: 0.35 });
  for (const [w, h, x, y] of [[PW + 24, 12, 0, PH / 2 + 6], [PW + 24, 12, 0, -PH / 2 - 6], [12, PH, -PW / 2 - 6, 0], [12, PH, PW / 2 + 6, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 16), gilt); m.position.set(x, y, D + 4); g.add(m); }
  for (const [w, h, x, y] of [[PW + 2 * F + 16, 16, 0, PH / 2 + F + 8], [PW + 2 * F + 16, 16, 0, -PH / 2 - F - 8], [16, PH + 2 * F, -PW / 2 - F - 8, 0], [16, PH + 2 * F, PW / 2 + F + 8, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, D + 14), plain); m.position.set(x, y, (D + 14) / 2); g.add(m); }
  // edelweiss rosettes at the corners, and a crest of two leaves and a flower on top
  const pale = new THREE.MeshStandardMaterial({ color: 0xa6764c, roughness: 0.6 });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const e = edelweiss(pale, 26); e.position.set(sx * (PW / 2 + F / 2), sy * (PH / 2 + F / 2), D + 10); g.add(e); }
  const crest = edelweiss(pale, 44); crest.position.set(0, PH / 2 + F + 30, D / 2 + 10); g.add(crest);
  for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.SphereGeometry(60, 12, 8), pale); l.scale.set(1.5, 0.45, 0.25); l.position.set(s * 95, PH / 2 + F + 18, D / 2 + 6); l.rotation.z = -s * 0.35; g.add(l); }
  // the painting behind glass, on a cream mat
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshStandardMaterial({ color: 0xefe8d8, roughness: 0.9 })); mat.position.z = 6; g.add(mat);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(PW - 90, PH - 80), new THREE.MeshStandardMaterial({ map: watercolour(), roughness: 0.85 })); art.position.z = 8; g.add(art);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.07, depthWrite: false })); glass.position.z = 30; g.add(glass);
  return g;
}

// ---- an alphorn, propped in the corner: a long conical spruce tube wrapped with cane bindings,
// the bell upturned on the floor, the mouthpiece up near the ceiling.  Local +x runs out of the corner.
function alphorn() {
  const g = new THREE.Group();
  const top = new THREE.Vector3(30, 2330, 0), N = 90;
  const path = new THREE.CatmullRomCurve3([top, new THREE.Vector3(420, 1600, 0), new THREE.Vector3(980, 560, 0), new THREE.Vector3(1300, 150, 0), new THREE.Vector3(1520, 80, 0), new THREE.Vector3(1700, 150, 0), new THREE.Vector3(1790, 300, 0)]);
  const radius = (u) => 13 + 32 * u + (u > 0.78 ? Math.pow((u - 0.78) / 0.22, 2.6) * 95 : 0);
  const frames = path.computeFrenetFrames(N, false), seg = 18, pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, p = path.getPointAt(u), n = frames.normals[i], b = frames.binormals[i], r = radius(u);
    for (let k = 0; k <= seg; k++) { const a = k / seg * Math.PI * 2; pos.push(p.x + r * (Math.cos(a) * n.x + Math.sin(a) * b.x), p.y + r * (Math.cos(a) * n.y + Math.sin(a) * b.y), p.z + r * (Math.cos(a) * n.z + Math.sin(a) * b.z)); uv.push(u * 8, k / seg); }
  }
  for (let i = 0; i < N; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, c = a + seg + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const spruce = woodMaterial('spruce', { gloss: 0.55, mm: 500, side: THREE.DoubleSide }); spruce.color = new THREE.Color(0xd09a62);   // varnished, honey-coloured
  const tube = new THREE.Mesh(geo, spruce); tube.castShadow = true; tube.receiveShadow = true; g.add(tube);
  // cane bindings, a painted band of edelweiss at the bell, and the hardwood mouthpiece
  const cane = new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.6 });
  for (const u of [0.12, 0.24, 0.36, 0.48, 0.6, 0.7]) {
    const p = path.getPointAt(u), t = path.getTangentAt(u);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius(u) + 2, 3.5, 6, 20), cane); ring.position.copy(p);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t); g.add(ring);
  }
  const band = new THREE.MeshStandardMaterial({ color: 0x2a3a6a, roughness: 0.5 });
  { const u = 0.86, p = path.getPointAt(u), t = path.getTangentAt(u); const r = new THREE.Mesh(new THREE.TorusGeometry(radius(u) + 1, 9, 8, 28), band); r.position.copy(p); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), t); g.add(r); }
  const mp = new THREE.Mesh(new THREE.CylinderGeometry(16, 10, 70, 14), new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: 0.4 }));
  const t0 = path.getTangentAt(0); mp.position.copy(top).addScaledVector(t0, -30); mp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), t0.clone().negate()); g.add(mp);
  return g;
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
    this.fireN = 0; this.t = 0; this.fire = 0; this.fireTarget = 0;   // the fire is laid but unlit until you light the candle
    this.moon = [2.6, RY / 1000 + 3, 3.6];
    this.clock = wallMount(g, [RX, RY], regulator(), 'y1', 1150, 1460);
    // an Alpine watercolour over the mantel, in a carved Swiss frame; the alphorn in the corner
    wallMount(g, [RX, RY], { g: framedWatercolour() }, 'x0', fc, hearthH + openH + 640, fd + 2);
    const horn = alphorn(); horn.position.set(110, 0, RY - 110); horn.rotation.y = Math.PI / 4; g.add(horn);

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
    // the door, barred with a beam
    mountDoor(g, RX, RY, lockedDoor('cabin'), 'x1', 1150);
    const woodM = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.95 }), endM = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 });
    for (let row = 0; row < 5; row++) for (let k = 0; k < 6 - (row % 2); k++) {
      const rr = R(55, 70), lg = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 420, 9), [woodM, endM, endM]);
      lg.rotation.x = Math.PI / 2; lg.position.set(130 + k * 125 + (row % 2) * 62, 70 + row * 112, fy1 + 360); lg.rotation.y = R(-0.05, 0.05); lg.castShadow = true; g.add(lg);
    }
  }

  setFire(on) { this.fireTarget = on ? 1 : 0.06; }
  update(dt) {
    this.t += dt;
    this.clock.tick(new Date(), performance.now() / 1000);
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
    // catching: kindling first (a few seconds), then the logs; banked back to embers when snuffed
    this.fire += (this.fireTarget - this.fire) * Math.min(1, dt * (this.fireTarget > this.fire ? 0.45 : 0.25));
    const F = this.fire, lvl = (1 + 0.22 * this.fireN + 0.08 * Math.sin(this.t * 13.7)) * F;
    this.fireLight.intensity = 2.4e6 * lvl + 4e4;
    this.embers.material.color.setRGB(0.25 + 0.75 * F, 0.06 + 0.3 * F + 0.08 * lvl, 0.02 + 0.06 * F);
    for (const f of this.flames) {
      const s = (0.7 + 0.3 * Math.sin(this.t * (5 + f.ph) + f.ph) + 0.15 * this.fireN) * Math.min(1, F * 1.4) + 1e-3;
      f.m.visible = F > 0.02;
      f.m.scale.set(f.w * 0.8 * Math.min(1, 0.4 + F), f.h * s, f.w * Math.min(1, 0.4 + F));
      f.m.position.set(f.base.x, f.base.y + f.h * s * 0.5, f.base.z + 18 * Math.sin(this.t * 3.1 + f.ph));
    }
  }
}
