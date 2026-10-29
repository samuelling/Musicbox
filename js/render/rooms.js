// The other rooms the box can play in, each built in "room space" like the hut (millimetres,
// x = room x, y = height, z = room y) so they line up with the acoustic model, and each with a
// clock of its own showing the real time.
import * as THREE from 'three';
import { woodMaterial } from './materials.js';
import { Cabin, valleyTexture, flakeTexture, stoneTexture } from './cabin.js';
import { cuckoo, mantel, longcase, chapelDial, labClock, wallMount } from './clocks.js';
import { lockedDoor, mountDoor, sealedHatch } from './doors.js';

const R = (a, b) => a + Math.random() * (b - a);
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, rep) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const noise = (x, d, amt) => { const img = x.getImageData(0, 0, x.canvas.width, x.canvas.height), a = img.data; for (let i = 0; i < a.length; i += 4) { const n = (Math.random() - 0.5) * amt; a[i] += n; a[i + 1] += n; a[i + 2] += n; } x.putImageData(img, 0, 0); };

// ---------------------------------------------------------------- surfaces
function wallpaper() {     // the nursery: pale blue with fine stripes and little stars and moons
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#c9d8e4'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(i * 64 + 4, 0, 10, 512); x.fillStyle = 'rgba(90,120,150,0.12)'; x.fillRect(i * 64 + 40, 0, 2, 512); }
  x.fillStyle = '#f2e3a8';
  const star = (cx, cy, r) => { x.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const cx = i * 128 + (j % 2) * 64 + 30, cy = j * 128 + 40;
    if ((i + j) % 3) star(cx, cy, 11); else { x.beginPath(); x.arc(cx, cy, 12, 0, 7); x.fill(); x.fillStyle = '#c9d8e4'; x.beginPath(); x.arc(cx + 6, cy - 4, 11, 0, 7); x.fill(); x.fillStyle = '#f2e3a8'; }
  }
  noise(x, 0, 8); return tex(c);
}
function plaster(col, amt = 10) { const [c, x] = canvas(512, 512); x.fillStyle = col; x.fillRect(0, 0, 512, 512); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},${R(0.01, 0.035)})`; x.beginPath(); x.ellipse(R(0, 512), R(0, 512), R(10, 60), R(8, 40), R(0, 3), 0, 7); x.fill(); } noise(x, 0, amt); return tex(c); }
function carpet() { const [c, x] = canvas(512, 512); x.fillStyle = '#d8ccb4'; x.fillRect(0, 0, 512, 512); noise(x, 0, 34); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,250,240' : '120,100,80'},0.12)`; x.fillRect(R(0, 512), R(0, 512), 2, 2); } return tex(c); }
function herringbone(light, dark) {      // chevron parquet: columns of slanted boards, alternating direction
  const [c, x] = canvas(1024, 1024);
  x.fillStyle = '#24170e'; x.fillRect(0, 0, 1024, 1024);
  const cw = 128, h = 64;
  for (let col = 0; col < 8; col++) {
    const x0 = col * cw, s = col % 2 ? 1 : -1;
    for (let k = -4; k < 1024 / h + 4; k++) {
      const y0 = k * h, q = Math.random();
      x.fillStyle = `rgb(${light[0] + (dark[0] - light[0]) * q},${light[1] + (dark[1] - light[1]) * q},${light[2] + (dark[2] - light[2]) * q})`;
      x.beginPath(); x.moveTo(x0 + 1.5, y0 + 1.5); x.lineTo(x0 + cw - 1.5, y0 + s * cw + 1.5); x.lineTo(x0 + cw - 1.5, y0 + s * cw + h - 1.5); x.lineTo(x0 + 1.5, y0 + h - 1.5); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.1)'; x.lineWidth = 1;
      for (let g = 0; g < 5; g++) { const o = R(6, h - 6); x.beginPath(); x.moveTo(x0, y0 + o); x.lineTo(x0 + cw, y0 + o + s * cw); x.stroke(); }
    }
  }
  noise(x, 0, 14); return tex(c);
}
function flagstones() { const [c, x] = canvas(1024, 1024); x.fillStyle = '#4b4740'; x.fillRect(0, 0, 1024, 1024); for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const g = R(110, 150); x.fillStyle = `rgb(${g},${g - 6},${g - 16})`; x.fillRect(i * 256 + 5 + (j % 2) * 128, j * 256 + 5, 246, 246); x.fillRect(i * 256 + 5 + (j % 2) * 128 - 1024, j * 256 + 5, 246, 246); for (let k = 0; k < 30; k++) { x.fillStyle = `rgba(0,0,0,${R(0.03, 0.1)})`; x.beginPath(); x.ellipse(i * 256 + R(0, 256) + (j % 2) * 128, j * 256 + R(0, 256), R(10, 70), R(6, 40), 0, 0, 7); x.fill(); } } noise(x, 0, 22); return tex(c); }
function ashlar() { const [c, x] = canvas(1024, 1024); x.fillStyle = '#5c574d'; x.fillRect(0, 0, 1024, 1024); for (let j = 0; j < 6; j++) { let i = -R(0, 120); while (i < 1024) { const w = R(150, 260), g = R(125, 160); x.fillStyle = `rgb(${g + 6},${g},${g - 14})`; x.fillRect(i + 4, j * 170 + 4, w - 8, 162); for (let k = 0; k < 8; k++) { x.fillStyle = `rgba(0,0,0,${R(0.02, 0.07)})`; x.beginPath(); x.ellipse(i + R(0, w), j * 170 + R(0, 170), R(10, 50), R(6, 30), 0, 0, 7); x.fill(); } i += w; } } noise(x, 0, 24); return tex(c); }
function foamTex() { const [c, x] = canvas(256, 256); x.fillStyle = '#7d8590'; x.fillRect(0, 0, 256, 256); noise(x, 0, 40); return tex(c); }
function stainedGlass(seed) {
  const [c, x] = canvas(256, 768);
  const cols = ['#1b3a7a', '#7a1b24', '#1d6a4a', '#c9a23a', '#3a2a6a', '#245a8a'];
  for (let j = 0; j < 12; j++) for (let i = 0; i < 4; i++) { x.fillStyle = cols[(i * 7 + j * 3 + seed) % cols.length]; x.beginPath(); x.moveTo(i * 64 + R(-6, 6), j * 64 + R(-6, 6)); x.lineTo((i + 1) * 64 + R(-6, 6), j * 64 + R(-6, 6)); x.lineTo((i + 1) * 64 + R(-6, 6), (j + 1) * 64 + R(-6, 6)); x.lineTo(i * 64 + R(-6, 6), (j + 1) * 64 + R(-6, 6)); x.fill(); }
  x.strokeStyle = '#111'; x.lineWidth = 6; x.beginPath(); x.arc(128, 300, 90, 0, 7); x.stroke(); x.beginPath(); x.moveTo(128, 210); x.lineTo(128, 390); x.moveTo(38, 300); x.lineTo(218, 300); x.stroke();
  for (let j = 0; j <= 12; j++) { x.lineWidth = 3; x.beginPath(); x.moveTo(0, j * 64); x.lineTo(256, j * 64); x.stroke(); }
  noise(x, 0, 30); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function pictureTex() {     // a little oil landscape for the living room wall
  const [c, x] = canvas(512, 380);
  const sky = x.createLinearGradient(0, 0, 0, 240); sky.addColorStop(0, '#6d8fb0'); sky.addColorStop(1, '#e8d6a8'); x.fillStyle = sky; x.fillRect(0, 0, 512, 380);
  x.fillStyle = '#5d6a78'; x.beginPath(); x.moveTo(0, 230); x.lineTo(120, 120); x.lineTo(210, 200); x.lineTo(320, 90); x.lineTo(512, 220); x.lineTo(512, 380); x.lineTo(0, 380); x.fill();
  x.fillStyle = '#e9eef2'; x.beginPath(); x.moveTo(320, 90); x.lineTo(290, 125); x.lineTo(350, 118); x.fill();
  x.fillStyle = '#4c6a38'; x.fillRect(0, 260, 512, 120); x.fillStyle = '#2e4426'; for (let i = 0; i < 40; i++) { const fx = R(0, 512), fy = R(250, 300); x.beginPath(); x.moveTo(fx, fy - 40); x.lineTo(fx + 12, fy); x.lineTo(fx - 12, fy); x.fill(); }
  noise(x, 0, 30); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------------------------------------------------------------- the generic room
class Room {
  constructor(dims) {
    this.dims = dims.map((v) => v * 1000);
    this.group = new THREE.Group();
    this.clocks = []; this.updaters = [];
  }
  get RX() { return this.dims[0]; } get RY() { return this.dims[1]; } get RZ() { return this.dims[2]; }
  mesh(geo, mat, x, y, z, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; this.group.add(m); return m; }
  box(w, h, d, x, y, z, mat) { return this.mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
  // floor, ceiling and four walls; holes: [{ wall:'y1', x0, x1, z0, z1 }] window openings
  shell(floorMat, wallMat, ceilMat, holes = [], wallRep = 2000) {
    const { RX, RY, RZ } = this;
    const pl = (w, h, mat, x, y, z, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; this.group.add(m); return m; };
    pl(RX, RY, floorMat, RX / 2, 0, RY / 2, -Math.PI / 2, 0);
    pl(RX, RY, ceilMat, RX / 2, RZ, RY / 2, Math.PI / 2, 0);
    const wallUV = (m, w, h, u0 = 0, v0 = 0) => { const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (u0 + uv.getX(i) * w) / wallRep, (v0 + uv.getY(i) * h) / wallRep); };
    const wall = (name, len, at, ry) => {
      const hs = holes.filter((h) => h.wall === name).sort((a, b) => a.x0 - b.x0);
      let u = 0;
      const seg = (u0, u1, z0, z1) => { if (u1 - u0 < 1 || z1 - z0 < 1) return; const m = pl(u1 - u0, z1 - z0, wallMat, 0, 0, 0, 0, ry); at(m, (u0 + u1) / 2, (z0 + z1) / 2); wallUV(m, u1 - u0, z1 - z0, u0, z0); };
      for (const h of hs) { seg(u, h.x0, 0, RZ); seg(h.x0, h.x1, 0, h.z0); seg(h.x0, h.x1, h.z1, RZ); u = h.x1; }
      seg(u, len, 0, RZ);
    };
    // u runs along +x for the y walls and along +y (room) for the x walls; seen from inside
    wall('y0', RX, (m, u, z) => m.position.set(u, z, 0), 0);
    wall('y1', RX, (m, u, z) => m.position.set(u, z, RY), Math.PI);
    wall('x0', RY, (m, u, z) => m.position.set(0, z, u), Math.PI / 2);
    wall('x1', RY, (m, u, z) => m.position.set(RX, z, u), -Math.PI / 2);
  }
  skirting(mat, h = 120) {
    const { RX, RY } = this;
    this.box(RX, h, 18, RX / 2, h / 2, 9, mat); this.box(RX, h, 18, RX / 2, h / 2, RY - 9, mat);
    this.box(18, h, RY, 9, h / 2, RY / 2, mat); this.box(18, h, RY, RX - 9, h / 2, RY / 2, mat);
  }
  // a window in the y1 wall: frame, glazing bars, the night outside with snow falling gently,
  // and (optionally) curtains drawn aside
  window(x0, x1, z0, z1, { frame, curtain, snow = true, bars = [2, 3], sky } = {}) {
    const { RY } = this, ww = x1 - x0, wh = z1 - z0, cx = (x0 + x1) / 2, cy = (z0 + z1) / 2, zf = RY + 40;
    const fm = frame || new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.6 });
    this.box(ww + 120, 70, 200, cx, z0 - 35, RY + 20, fm); this.box(ww + 120, 70, 120, cx, z1 + 35, RY + 40, fm);
    this.box(60, wh, 120, x0 - 30, cy, RY + 40, fm); this.box(60, wh, 120, x1 + 30, cy, RY + 40, fm);
    for (let i = 1; i < bars[0]; i++) this.box(30, wh, 40, x0 + ww * i / bars[0], cy, zf, fm);
    for (let i = 1; i < bars[1]; i++) this.box(ww, 30, 40, cx, z0 + wh * i / bars[1], zf, fm);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshPhysicalMaterial({ color: 0xdfe8f5, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false }));
    glass.position.set(cx, cy, zf); glass.rotation.y = Math.PI; this.group.add(glass);
    // the snowy night: a lit-from-nowhere valley and falling flakes, calmer than the hut's storm
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14000, 6200), new THREE.MeshBasicMaterial({ map: sky || valleyTexture(), fog: false, color: 0xb8c0d0 }));
    back.position.set(cx, 2000, RY + 5000); back.rotation.y = Math.PI; this.group.add(back);
    if (snow) this.snow(cx, RY);
    if (curtain) for (const s of [-1, 1]) {
      const cw = 520, chh = wh + 520, geo = new THREE.PlaneGeometry(cw, chh, 24, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, 26 * Math.sin(p.getX(i) / cw * Math.PI * 7));
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, curtain); m.position.set(s < 0 ? x0 - 180 : x1 + 180, cy + 120, RY - 90); m.rotation.y = Math.PI; m.castShadow = true; this.group.add(m);
      this.box(ww + 900, 24, 24, cx, z1 + 330, RY - 90, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, metalness: 0.4, roughness: 0.5 }));
    }
    this.moon = [cx / 1000, RY / 1000 + 3, (cy + 1500) / 1000];
  }
  snow(cx, RY) {
    const NF = 900, pos = new Float32Array(NF * 3), flakes = [];
    for (let i = 0; i < NF; i++) flakes.push({ x: R(cx - 3000, cx + 3000), y: R(-600, 4600), z: R(RY + 250, RY + 4500), v: R(350, 750), ph: R(0, 6.28), a: R(60, 200) });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 30, map: flakeTexture(), transparent: true, depthWrite: false, color: 0xdfe8ff, fog: false }));
    pts.frustumCulled = false; this.group.add(pts);
    let t = 0;
    this.updaters.push((dt) => {
      t += dt;
      for (let i = 0; i < NF; i++) { const f = flakes[i]; f.y -= f.v * dt; if (f.y < -600) f.y = 4600; const sw = Math.sin(t * 1.3 + f.ph) * f.a; pos[i * 3] = f.x + sw; pos[i * 3 + 1] = f.y; pos[i * 3 + 2] = f.z + sw * 0.3; }
      geo.attributes.position.needsUpdate = true;
    });
  }
  lamp(x, y, z, color, intensity, dist = 0) {
    const l = new THREE.PointLight(color, intensity, dist, 2); l.position.set(x, y, z); this.group.add(l); return l;
  }
  clock(c, wall, u, h) { this.clocks.push(wallMount(this.group, this.dims, c, wall, u, h)); }
  setFire() {}
  update(dt) {
    const now = new Date(), t = performance.now() / 1000;
    for (const c of this.clocks) c.tick(now, t);
    for (const f of this.updaters) f(dt);
  }
  // keep furniture clear of the table, the hamster's cage and where you sit by default
  clear(x, y, w, d, box) {
    if (!box) return true;
    const [bx, by] = box.map((v) => v * 1000);
    const kx0 = bx - 1000, kx1 = bx + 1400, ky0 = by - 1500, ky1 = by + 750;
    return x + w / 2 < kx0 || x - w / 2 > kx1 || y + d / 2 < ky0 || y - d / 2 > ky1;
  }
}

// ---------------------------------------------------------------- nursery
class Nursery extends Room {
  constructor(dims, box) {
    super(dims); const { RX, RY, RZ } = this;
    const wp = wallpaper();
    const W = { x0: 650, x1: 1650, z0: 900, z1: 2050 };
    this.shell(new THREE.MeshStandardMaterial({ map: (() => { const t = carpet(); t.repeat.set(RX / 900, RY / 900); return t; })(), roughness: 1 }),
      new THREE.MeshStandardMaterial({ map: wp, roughness: 0.85 }), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.9 }), [{ wall: 'y1', ...W }], 900);
    const white = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.55 });
    this.skirting(white, 110);
    this.window(W.x0, W.x1, W.z0, W.z1, { frame: white, curtain: new THREE.MeshStandardMaterial({ color: 0xe7c9cf, roughness: 0.95, side: THREE.DoubleSide }) });
    // crib along the back wall to the right, spindles and a soft blanket
    const crib = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.5 });
    const cx = RX - 750, cz = RY - 420, cw = 1250, cd = 650;
    for (const s of [-1, 1]) { this.box(50, 950, 50, cx + s * cw / 2, 475, cz - cd / 2, crib); this.box(50, 950, 50, cx + s * cw / 2, 475, cz + cd / 2, crib); this.box(cw, 40, 40, cx, 900, cz + s * cd / 2, crib); this.box(cw, 40, 40, cx, 330, cz + s * cd / 2, crib); this.box(40, 40, cd, cx + s * cw / 2, 900, cz, crib); }
    for (let i = 1; i < 16; i++) for (const s of [-1, 1]) this.box(16, 570, 16, cx - cw / 2 + i * cw / 16, 615, cz + s * cd / 2, crib);
    this.box(cw - 60, 120, cd - 60, cx, 380, cz, new THREE.MeshStandardMaterial({ color: 0xbfd6e6, roughness: 1 }));
    const blanket = this.box(cw * 0.55, 60, cd - 90, cx + 200, 470, cz, new THREE.MeshStandardMaterial({ color: 0xf0d8a8, roughness: 1 })); blanket.rotation.z = 0.03;
    // a dresser on the left wall with a night-light, and a rocking horse
    const dz = 1700;
    this.box(480, 820, 1000, 240, 410, dz, white);
    for (let k = 0; k < 3; k++) this.box(6, 200, 900, 482, 160 + k * 240, dz, new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.6 }));
    const shade = this.mesh(new THREE.CylinderGeometry(90, 150, 170, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xffe6b8, emissive: 0xffb860, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.9 }), 240, 1060, dz + 250);
    this.mesh(new THREE.CylinderGeometry(55, 70, 150, 16), new THREE.MeshStandardMaterial({ color: 0x9ac0d8, roughness: 0.4 }), 240, 900, dz + 250);
    this.lamp(240, 1040, dz + 250, 0xffb46a, 2.2e5);
    this.rockingHorse(700, 600);
    // the cuckoo clock above the crib
    this.clock(cuckoo(), 'y1', RX - 750, 1900);
    // the door, chained, bolted and a chair wedged under the knob
    mountDoor(this.group, RX, RY, lockedDoor('nursery'), 'x1', 850);
  }
  rockingHorse(x, z) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = 0.6; this.group.add(g);
    const wood = new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: 0xb03030, roughness: 0.5 });
    const rocker = new THREE.Mesh(new THREE.TorusGeometry(700, 18, 6, 30, 0.9), red); rocker.rotation.z = Math.PI / 2 + Math.PI - 0.45; rocker.position.set(0, 720, 0);
    for (const s of [-1, 1]) { const r = rocker.clone(); r.position.z = s * 110; g.add(r); }
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(110, 380, 6, 12), wood); body.rotation.z = Math.PI / 2; body.position.y = 400; body.castShadow = true; g.add(body);
    const neck = new THREE.Mesh(new THREE.CapsuleGeometry(70, 200, 6, 10), wood); neck.position.set(240, 560, 0); neck.rotation.z = -0.6; g.add(neck);
    const head = new THREE.Mesh(new THREE.CapsuleGeometry(60, 140, 6, 10), wood); head.position.set(340, 660, 0); head.rotation.z = Math.PI / 2 - 0.2; g.add(head);
    for (const [lx, lz] of [[-180, -70], [-180, 70], [180, -70], [180, 70]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(24, 20, 260, 8), wood); l.position.set(lx, 200, lz); l.rotation.x = lz > 0 ? -0.2 : 0.2; l.rotation.z = lx > 0 ? -0.2 : 0.2; g.add(l); }
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(200, 30, 240), red); saddle.position.y = 505; g.add(saddle);
  }
}

// ---------------------------------------------------------------- living room
class Living extends Room {
  constructor(dims, box) {
    super(dims); const { RX, RY, RZ } = this;
    const W = { x0: 1600, x1: 2900, z0: 850, z1: 2200 };
    const fl = herringbone([168, 120, 72], [120, 80, 46]); fl.repeat.set(RX / 1600, RY / 1600);
    this.shell(new THREE.MeshStandardMaterial({ map: fl, roughness: 0.55 }), new THREE.MeshStandardMaterial({ map: plaster('#8c9a84'), roughness: 0.92 }), new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.95 }), [{ wall: 'y1', ...W }], 1600);
    const white = new THREE.MeshStandardMaterial({ color: 0xeee8dc, roughness: 0.55 });
    this.skirting(white, 160);
    // dado rail and picture rail
    for (const h of [900, 2350]) { this.box(RX, 30, 22, RX / 2, h, 11, white); this.box(RX, 30, 22, RX / 2, h, RY - 11, white); this.box(22, 30, RY, 11, h, RY / 2, white); this.box(22, 30, RY, RX - 11, h, RY / 2, white); }
    this.window(W.x0, W.x1, W.z0, W.z1, { frame: white, curtain: new THREE.MeshStandardMaterial({ color: 0x5a2a2e, roughness: 0.95, side: THREE.DoubleSide }) });
    // a sofa along the right wall, facing into the room
    const fabric = new THREE.MeshStandardMaterial({ color: 0x3e5868, roughness: 0.95 });
    const sx = RX - 480, sz = 2000, sl = 2100;
    this.box(850, 420, sl, sx, 210, sz, fabric); this.box(220, 820, sl, RX - 160, 410, sz, fabric);
    for (const s of [-1, 1]) this.box(850, 620, 200, sx, 310, sz + s * (sl / 2 - 100), fabric);
    for (let k = 0; k < 3; k++) this.box(560, 140, sl / 3 - 30, sx - 80, 490, sz - sl / 3 + k * sl / 3, new THREE.MeshStandardMaterial({ color: 0x4a6878, roughness: 1 }));
    // a sideboard on the back wall with a lamp and the mantel clock
    const mah = woodMaterial('rosewood', { gloss: 0.6, mm: 700 });
    const bx = 4250, bz = RY - 260;
    this.box(1300, 820, 480, bx, 410, bz, mah);
    for (const s of [-1, 1]) this.box(580, 620, 6, bx + s * 320, 430, bz - 243, mah);
    const clk = mantel(); clk.g.position.set(bx - 250, 820, -(RY - 40)); const um = new THREE.Group(); um.scale.z = -1; um.add(clk.g); this.group.add(um); this.clocks.push(clk);
    this.mesh(new THREE.CylinderGeometry(70, 90, 380, 16), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.3, metalness: 0.2 }), bx + 380, 1010, bz);
    this.mesh(new THREE.CylinderGeometry(150, 230, 260, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0xf2e2c0, emissive: 0xffc070, emissiveIntensity: 0.45, side: THREE.DoubleSide, roughness: 0.9 }), bx + 380, 1300, bz);
    this.lamp(bx + 380, 1260, bz, 0xffb870, 4.5e5);
    // bookcase on the left wall, a framed picture over it
    const oak = woodMaterial('oak', { gloss: 0.4, mm: 800 });
    this.box(340, 2000, 1500, 170, 1000, 1700, oak);
    const cols = [0x6a2a22, 0x2a3a5a, 0x3a5a3a, 0x8a6a3a, 0x4a2a4a, 0x1e1e22, 0xa08050];
    for (let sh = 0; sh < 5; sh++) { this.box(330, 20, 1440, 180, 120 + sh * 400, 1700, oak); let z = 1000; while (z < 2380) { const bw = R(30, 60), bh = R(240, 340); const bk = this.box(250, bh, bw, 200, 130 + sh * 400 + bh / 2, z + bw / 2, new THREE.MeshStandardMaterial({ color: cols[Math.floor(R(0, cols.length))], roughness: 0.8 })); bk.castShadow = false; z += bw + 2; } }
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(720, 540), new THREE.MeshStandardMaterial({ map: pictureTex(), roughness: 0.6 }));
    pic.position.set(1000, 1650, RY - 30); pic.rotation.y = Math.PI; this.group.add(pic);
    const gilt = new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 0.9, roughness: 0.35 });
    for (const [w, h, x, y] of [[800, 50, 1000, 1945], [800, 50, 1000, 1355], [50, 640, 620, 1650], [50, 640, 1380, 1650]]) this.box(w, h, 40, x, y, RY - 22, gilt);
    // the door beside the bookcase: chained, double-deadbolted and bolted at the top
    mountDoor(this.group, RX, RY, lockedDoor('living'), 'x0', RY - 850);
    // a soft rug in front of the sofa
    const rug = this.mesh(new THREE.PlaneGeometry(1400, 2000), new THREE.MeshStandardMaterial({ color: 0x8a6448, roughness: 1 }), RX - 1500, 4, 2000, false); rug.rotation.x = -Math.PI / 2;
  }
}

// ---------------------------------------------------------------- wood-panelled parlour
class Parlor extends Room {
  constructor(dims, box) {
    super(dims); const { RX, RY, RZ } = this;
    const W = { x0: 2550, x1: 4050, z0: 800, z1: 2900 };
    const fl = herringbone([150, 98, 56], [96, 58, 30]); fl.repeat.set(RX / 2000, RY / 2000);
    const oak = woodMaterial('oak', { gloss: 0.55, mm: 900 }); oak.color = new THREE.Color(0xa8805a);
    this.shell(new THREE.MeshStandardMaterial({ map: fl, roughness: 0.45 }), oak, new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 0.8 }), [{ wall: 'y1', ...W }], 2400);
    // raised panels on every wall up to the frieze, a cornice and coffered beams overhead
    const rail = woodMaterial('oak', { gloss: 0.6, mm: 600 }); rail.color = new THREE.Color(0x8a6444);
    const panels = (len, put) => { const pw = 700; for (let u = 120; u + pw < len - 60; u += pw + 120) for (const [z0, z1] of [[200, 900], [1050, 2550]]) put(u + pw / 2, (z0 + z1) / 2, pw, z1 - z0); };
    const mk = (w, h) => new THREE.BoxGeometry(w, h, 24);
    panels(RX, (u, z, w, h) => { if (u > W.x0 - 400 && u < W.x1 + 400) return; const m = new THREE.Mesh(mk(w, h), rail); m.position.set(u, z, RY - 12); m.receiveShadow = true; this.group.add(m); });
    panels(RX, (u, z, w, h) => { const m = new THREE.Mesh(mk(w, h), rail); m.position.set(u, z, 12); this.group.add(m); });
    panels(RY, (u, z, w, h) => { const m = new THREE.Mesh(mk(w, h), rail); m.rotation.y = Math.PI / 2; m.position.set(12, z, u); this.group.add(m); });
    panels(RY, (u, z, w, h) => { const m = new THREE.Mesh(mk(w, h), rail); m.rotation.y = Math.PI / 2; m.position.set(RX - 12, z, u); this.group.add(m); });
    const frieze = new THREE.MeshStandardMaterial({ map: plaster('#5a1e1e', 6), roughness: 0.9 });
    for (const [w, d, x, z] of [[RX, 4, RX / 2, 3], [RX, 4, RX / 2, RY - 3], [4, RY, 3, RY / 2], [4, RY, RX - 3, RY / 2]]) this.box(w, RZ - 2700, d, x, (RZ + 2700) / 2, z, frieze).castShadow = false;
    for (const [w, d, x, z] of [[RX, 60, RX / 2, 30], [RX, 60, RX / 2, RY - 30], [60, RY, 30, RY / 2], [60, RY, RX - 30, RY / 2]]) { this.box(w, 90, d, x, 2690, z, rail); this.box(w, 120, d * 1.6, x, RZ - 60, z, rail); }
    for (let k = 1; k < 4; k++) this.box(RX, 160, 180, RX / 2, RZ - 80, k * RY / 4, rail);
    this.window(W.x0, W.x1, W.z0, W.z1, { frame: rail, bars: [3, 4], curtain: new THREE.MeshStandardMaterial({ color: 0x3a1a20, roughness: 0.9, side: THREE.DoubleSide }) });
    // a marble fireplace (cold tonight) on the left wall, a pair of sconces lit either side
    const marble = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.25 });
    const fz = 3000;
    this.box(300, 1200, 1800, 150, 600, fz, marble).castShadow = false;
    this.box(320, 900, 1000, 165, 450, fz, new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 }));
    this.box(420, 60, 2000, 210, 1230, fz, marble);
    const brass = new THREE.MeshStandardMaterial({ color: 0xd2a84e, metalness: 1, roughness: 0.3 });
    for (const s of [-1, 1]) {
      const z = fz + s * 1200;
      this.box(60, 160, 60, 40, 1800, z, brass);
      this.mesh(new THREE.CylinderGeometry(14, 14, 150, 10), new THREE.MeshStandardMaterial({ color: 0xf2ead8, emissive: 0xffd8a0, emissiveIntensity: 0.25 }), 110, 1960, z);
      const fl2 = this.mesh(new THREE.SphereGeometry(12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }), 110, 2052, z, false); fl2.scale.y = 2;
      this.lamp(180, 2080, z, 0xffa850, 1.6e5);
    }
    // armchairs and a bookcase wall on the right
    const leather = new THREE.MeshStandardMaterial({ color: 0x4a1e14, roughness: 0.55 });
    for (const [x, z, ry] of [[1200, 1900, 0.5], [1300, 4300, -0.3]]) {
      if (!this.clear(x, z, 900, 900, box)) continue;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.group.add(g);
      const p = (w, h, d, px, py, pz) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), leather); m.position.set(px, py, pz); m.castShadow = true; g.add(m); };
      p(800, 420, 800, 0, 210, 0); p(800, 900, 180, 0, 450, -320); for (const s of [-1, 1]) p(160, 640, 800, s * 320, 320, 0);
    }
    const walnut = woodMaterial('walnut', { gloss: 0.5, mm: 900 });
    this.box(420, 2500, 3600, RX - 210, 1250, 2600, walnut);
    const cols = [0x5a1a14, 0x1e2a44, 0x2a442a, 0x6a4a22, 0x3a1a3a, 0x141414];
    for (let sh = 0; sh < 6; sh++) { let z = 900; while (z < 4320) { const bw = R(35, 70), bh = R(260, 360); this.box(300, bh, bw, RX - 240, 140 + sh * 400 + bh / 2, z + bw / 2, new THREE.MeshStandardMaterial({ color: cols[Math.floor(R(0, cols.length))], roughness: 0.75 })).castShadow = false; z += bw + 2; } }
    // the door, bolted top and bottom, the key turned and left in the lock
    mountDoor(this.group, RX, RY, lockedDoor('parlor'), 'x0', 1000);
    // the longcase clock against the back wall, right of the window
    const lc = longcase(); lc.g.position.set(5400, 0, -(RY - 20)); const um = new THREE.Group(); um.scale.z = -1; um.add(lc.g); this.group.add(um); this.clocks.push(lc);
  }
}

// ---------------------------------------------------------------- stone chapel
class Chapel extends Room {
  constructor(dims, box) {
    super(dims); const { RX, RY, RZ } = this;
    const fl = flagstones(); fl.repeat.set(RX / 2400, RY / 2400);
    const wt = ashlar(); const wallM = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.92 });
    // tall lancet windows down both long walls
    const lancets = []; for (let k = 0; k < 5; k++) { const x = 2600 + k * 4200; lancets.push({ wall: 'y1', x0: x - 500, x1: x + 500, z0: 2600, z1: 6800 }, { wall: 'y0', x0: x - 500, x1: x + 500, z0: 2600, z1: 6800 }); }
    // keep the window behind the box clear for the great clock
    const bx = box ? box[0] * 1000 : RX / 2;
    const lan = lancets.filter((l) => l.wall !== 'y1' || Math.abs((l.x0 + l.x1) / 2 - bx) > 1300);
    this.shell(new THREE.MeshStandardMaterial({ map: fl, roughness: 0.8 }), wallM, new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 }), lan, 2400);
    for (const [i, l] of lan.entries()) {
      const w = l.x1 - l.x0, h = l.z1 - l.z0, z = l.wall === 'y1' ? RY + 80 : -80;
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: stainedGlass(i), color: 0x4a5878, fog: false }));
      sg.position.set((l.x0 + l.x1) / 2, (l.z0 + l.z1) / 2, z); sg.rotation.y = l.wall === 'y1' ? Math.PI : 0; this.group.add(sg);
      const stone = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9 });
      const zz = l.wall === 'y1' ? RY + 40 : -40;
      this.box(140, h, 160, l.x0 - 70, (l.z0 + l.z1) / 2, zz, stone); this.box(140, h, 160, l.x1 + 70, (l.z0 + l.z1) / 2, zz, stone);
      this.box(w + 280, 200, 260, (l.x0 + l.x1) / 2, l.z0 - 100, zz, stone);
      const arch = this.mesh(new THREE.CylinderGeometry(w / 2 + 140, w / 2 + 140, 160, 24, 1, false, -Math.PI / 2, Math.PI), stone, (l.x0 + l.x1) / 2, l.z1, zz); arch.rotation.x = Math.PI / 2;
    }
    this.moon = [bx / 1000, RY / 1000 + 4, 6];
    // pews in two banks either side of the aisle, facing the altar at the east end (x = RX)
    const oak = woodMaterial('oak', { gloss: 0.4, mm: 900 }); oak.color = new THREE.Color(0x8a6444);
    const aisle0 = RY / 2 - 700, aisle1 = RY / 2 + 700;
    for (let x = 3000; x < RX - 4200; x += 1050) for (const [y0, y1] of [[700, aisle0], [aisle1, RY - 700]]) {
      const len = y1 - y0, cz = (y0 + y1) / 2;
      if (!this.clear(x, cz, 700, len, box)) {
        // shorten the pew rather than lose it
        const by = box[1] * 1000, ky0 = by - 1500, ky1 = by + 750, bxx = box[0] * 1000;
        if (x > bxx - 1000 - 350 && x < bxx + 1400 + 350) { const a = [y0, Math.min(y1, ky0)], b = [Math.max(y0, ky1), y1]; for (const [p, q] of [a, b]) if (q - p > 900) this.pew(x, p, q, oak); continue; }
      }
      this.pew(x, y0, y1, oak);
    }
    // the altar on a step, two candles and a cross, lit warm
    const step = new THREE.MeshStandardMaterial({ map: fl, roughness: 0.7 });
    this.box(3000, 180, RY - 1200, RX - 1500, 90, RY / 2, step);
    this.box(900, 1000, 2400, RX - 1100, 680, RY / 2, new THREE.MeshStandardMaterial({ map: wt, roughness: 0.9 }));
    this.box(950, 20, 2500, RX - 1100, 1190, RY / 2, new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.9 }));
    const gold = new THREE.MeshStandardMaterial({ color: 0xd8b060, metalness: 1, roughness: 0.3 });
    this.box(60, 900, 60, RX - 1100, 1650, RY / 2, gold); this.box(60, 60, 500, RX - 1100, 1850, RY / 2, gold);
    for (const s of [-1, 1]) {
      const z = RY / 2 + s * 900;
      this.mesh(new THREE.CylinderGeometry(40, 70, 300, 12), gold, RX - 1100, 1350, z);
      this.mesh(new THREE.CylinderGeometry(30, 30, 420, 12), new THREE.MeshStandardMaterial({ color: 0xf2ead8, emissive: 0xffd8a0, emissiveIntensity: 0.2 }), RX - 1100, 1710, z);
      const f = this.mesh(new THREE.SphereGeometry(16, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }), RX - 1100, 1945, z, false); f.scale.y = 2.2;
    }
    this.lamp(RX - 1500, 2100, RY / 2, 0xffa850, 2.8e6);
    // roof: dark timber trusses
    const truss = new THREE.MeshStandardMaterial({ color: 0x2a1c12, roughness: 0.85 });
    for (let x = 1500; x < RX; x += 3000) { this.box(300, 300, RY, x, RZ - 150, RY / 2, truss); this.box(200, 1600, 200, x, RZ - 800, RY / 2, truss); }
    // the great west doors, barred and chained
    mountDoor(this.group, RX, RY, lockedDoor('chapel'), 'x0', RY / 2);
    // the great clock high on the north wall, over the box
    this.clock(chapelDial(), 'y1', bx, 5600);
  }
  pew(x, y0, y1, m) {
    const len = y1 - y0, cz = (y0 + y1) / 2;
    this.box(420, 50, len, x, 450, cz, m); this.box(40, 520, len, x + 220, 700, cz, m).rotation.z = -0.1;
    for (const y of [y0 + 30, y1 - 30]) this.box(480, 900, 50, x + 20, 450, y, m);
    this.box(60, 220, len, x - 240, 160, cz, m);
  }
}

// ---------------------------------------------------------------- anechoic chamber
// wedges of grey foam on every surface (behind the room's acoustic boundaries), a wire-rope
// floor you stand on above the floor wedges, one work light, and a lab clock on a stand
class Anechoic extends Room {
  constructor(dims, box) {
    super(dims); const { RX, RY, RZ } = this;
    const foam = new THREE.MeshStandardMaterial({ map: foamTex(), roughness: 1, color: 0x9aa2ac });
    const wedge = new THREE.ConeGeometry(1, 1, 4, 1); wedge.rotateY(Math.PI / 4);
    const P = 400, L = 700;
    const placements = [];
    const face = (nx, ny, nz, u0, u1, v0, v1, at) => { for (let u = u0 + P / 2; u < u1; u += P) for (let v = v0 + P / 2; v < v1; v += P) placements.push([at(u, v), [nx, ny, nz]]); };
    face(0, 0, -1, 0, RX, 0, RZ, (u, v) => [u, v, RY + L / 2 + 50]);
    face(0, 0, 1, 0, RX, 0, RZ, (u, v) => [u, v, -L / 2 - 50]);
    face(1, 0, 0, 0, RY, 0, RZ, (u, v) => [-L / 2 - 50, v, u]);
    face(-1, 0, 0, 0, RY, 0, RZ, (u, v) => [RX + L / 2 + 50, v, u]);
    face(0, -1, 0, 0, RX, 0, RY, (u, v) => [u, RZ + L / 2 + 50, v]);
    face(0, 1, 0, 0, RX, 0, RY, (u, v) => [u, -L / 2 - 400, v]);
    const im = new THREE.InstancedMesh(wedge, foam, placements.length);
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), M = new THREE.Matrix4();
    placements.forEach(([p, n], i) => { q.setFromUnitVectors(up, new THREE.Vector3(...n)); M.compose(new THREE.Vector3(...p), q, new THREE.Vector3(P * 0.7, L, P * 0.7)); im.setMatrixAt(i, M); });
    im.receiveShadow = true; this.group.add(im);
    // the wire-rope floor
    const wire = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.4 });
    for (let x = 0; x <= RX; x += 60) this.box(4, 4, RY, x, 0, RY / 2, wire).castShadow = false;
    for (let y = 0; y <= RY; y += 60) this.box(RX, 4, 4, RX / 2, 0, y, wire).castShadow = false;
    // no door: a ladder up to a sealed hatch in the ceiling; the work light and a measuring microphone on a boom
    this.group.add(sealedHatch(900, RZ));
    this.mesh(new THREE.CylinderGeometry(140, 180, 90, 20), new THREE.MeshStandardMaterial({ color: 0xf4f6ff, emissive: 0xdde6ff, emissiveIntensity: 0.6 }), RX / 2, RZ - 45, RY / 2, false);
    this.lamp(RX / 2, RZ - 200, RY / 2, 0xe8eeff, 2.2e6);
    const bx = box ? box[0] * 1000 : RX / 2, by = box ? box[1] * 1000 : RY / 2;
    const steel = new THREE.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.8, roughness: 0.4 });
    this.mesh(new THREE.CylinderGeometry(12, 12, 1500, 8), steel, bx - 1400, 750, by + 300);
    const boom = this.mesh(new THREE.CylinderGeometry(8, 8, 900, 8), steel, bx - 1000, 1500, by + 300); boom.rotation.z = Math.PI / 2;
    const mic = this.mesh(new THREE.CylinderGeometry(9, 9, 160, 12), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 1, roughness: 0.25 }), bx - 560, 1500, by + 300); mic.rotation.z = Math.PI / 2;
    // the clock: a lab clock on a stand, behind and right of the box, facing you
    const lc = labClock(); lc.g.position.set(bx + 1500, 0, -(by + 1800)); lc.g.rotation.y = -0.35; const um = new THREE.Group(); um.scale.z = -1; um.add(lc.g); this.group.add(um); this.clocks.push(lc);
    this.moon = null;
  }
}

// one room per acoustic room: the hut is its own builder
export function makeRoom(kind, dims, box) {
  switch (kind) {
    case 'cabin': return new Cabin(dims);
    case 'nursery': return new Nursery(dims, box);
    case 'living': return new Living(dims, box);
    case 'parlor': return new Parlor(dims, box);
    case 'chapel': return new Chapel(dims, box);
    case 'anechoic': return new Anechoic(dims, box);
    default: return null;
  }
}
