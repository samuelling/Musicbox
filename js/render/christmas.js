// Christmas in the hut, from the first of December until Epiphany (6 January, when the Swiss take the tree
// down): a natural spruce in the corner, dressed the Swiss way — straw stars, red apples, gingerbread hearts,
// red bows and a few gold baubles, a straw star on top — and strung with big old C9 incandescent bulbs in red,
// green, blue, amber and warm white, glowing into the room.  A fir garland swags along the mantel.
// Add ?xmas to the address to see it any time of year.
import * as THREE from 'three';

export function christmasTime(d = new Date()) {
  try { if (/[?&](xmas|christmas)\b/i.test(location.search)) return true; } catch (e) { /* no location */ }
  return d.getMonth() === 11 || (d.getMonth() === 0 && d.getDate() <= 6);
}

const R = (a, b) => a + Math.random() * (b - a);
const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// a straw star: eight (or sixteen) flat straws crossed and tied at the centre
function strawStar(r, mat, tie) {
  const g = new THREE.Group();
  const n = 8;
  for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(r * 2, r * 0.13, 2), mat); s.rotation.z = (k / n) * Math.PI; g.add(s); }
  for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, r * 0.09, 2), mat); s.rotation.z = (k / n) * Math.PI + Math.PI / n; s.position.z = 1.5; g.add(s); }
  const knot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.12, r * 0.12, 4, 10), tie); knot.rotation.x = Math.PI / 2; knot.position.z = 3; g.add(knot);
  return g;
}
function heartShape(s) {
  const h = new THREE.Shape(); h.moveTo(0, -s);
  h.bezierCurveTo(s * 0.2, -s * 0.55, s, -s * 0.25, s, s * 0.25); h.bezierCurveTo(s, s * 0.75, s * 0.35, s * 0.85, 0, s * 0.45);
  h.bezierCurveTo(-s * 0.35, s * 0.85, -s, s * 0.75, -s, s * 0.25); h.bezierCurveTo(-s, -s * 0.25, -s * 0.2, -s * 0.55, 0, -s);
  return h;
}
export function bow(s, mat) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(s, s * 0.32, 6, 14), mat); l.scale.set(1, 0.62, 0.5); l.position.x = sx * s * 0.9; l.rotation.z = sx * 0.3; g.add(l); }
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 1.9, s * 0.15), mat); t.position.set(sx * s * 0.45, -s * 1.1, 0); t.rotation.z = sx * 0.25; g.add(t); }
  const k = new THREE.Mesh(new THREE.SphereGeometry(s * 0.38, 10, 8), mat); g.add(k);
  return g;
}

// the tree, its base at the origin (mm)
export function swissTree(H = 2050, Rb = 640, o = {}) {
  const { nb = 96, orn = 70, presents = true, lamps = true, turns = 7.5 } = o;
  const g = new THREE.Group(), kS = Math.max(0.42, H / 2050);
  const radius = (y) => Rb * Math.pow(Math.max(0, 1 - y / H), 0.95);
  // stand: a wooden cross, the trunk in it
  const standM = std(0x6a4a30, 0.8);
  for (const r of [0, Math.PI / 2]) { const a = new THREE.Mesh(new THREE.BoxGeometry(Rb, 70 * kS, 80 * kS), standM); a.position.y = 35 * kS; a.rotation.y = r; a.castShadow = true; g.add(a); }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(22 * kS, 48 * kS, H * 0.92, 10), std(0x5a3e2a, 0.95)); trunk.position.y = H * 0.46; trunk.castShadow = true; g.add(trunk);

  // branches: whorls of drooping fronds, each a long flattened cone with a few side twigs
  const needles = std(0x2c6a3c, 0.8, 0, { flatShading: true }), needles2 = std(0x3a7a46, 0.8, 0, { flatShading: true });
  // the layered skirts of a spruce: per whorl an open cone with a ragged, drooping hem
  const whorlsN = 13, step = (H * 0.84) / whorlsN;
  for (let w = 0; w < whorlsN; w++) {
    const y0 = H * 0.11 + w * step, r = radius(y0) + 60 * kS, h = step * 1.9 + 60 * kS, seg = 30;
    const geo = new THREE.ConeGeometry(r, h, seg, 3, true), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), rr = Math.hypot(x, z);
      if (rr < 1) continue;
      const a = Math.atan2(z, x), hem = (h / 2 - y) / h;                  // 0 at the tip, 1 at the hem
      const jag = 1 + (Math.round(a / (Math.PI * 2) * seg) % 2 ? 0.16 : -0.1) * hem + R(-0.05, 0.05) * hem;
      pos.setXYZ(i, x * jag, y - hem * hem * R(30, 90), z * jag);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, w % 2 ? needles2 : needles); m.position.y = y0 + h / 2 - 40; m.rotation.y = w * 0.9; m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  const frond = new THREE.ConeGeometry(1, 1, 5); frond.rotateZ(-Math.PI / 2); frond.translate(0.5, 0, 0);   // points along +x from 0 to 1
  const places = [];
  const whorls = 15;
  for (let w = 0; w < whorls; w++) {
    const y = H * 0.13 + (w / whorls) * (H * 0.84), r = radius(y) + 40 * kS, n = Math.max(5, Math.round(6 + r / 70));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + w * 0.7 + R(-0.15, 0.15), len = r * R(0.85, 1.08), droop = R(0.18, 0.32);
      places.push([y, a, len, droop, len * 0.16 + 18, 0]);
      for (const side of [-1, 1]) places.push([y - len * 0.25 - 20, a + side * 0.32, len * 0.62, droop + 0.1, len * 0.1 + 12, 1]);
    }
  }
  for (const pass of [0, 1]) {
    const list = places.filter((p) => p[5] === pass);
    const im = new THREE.InstancedMesh(frond, pass ? needles2 : needles, list.length);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([y, a, len, droop, wid], i) => { e.set(0, a, -droop, 'YXZ'); q.setFromEuler(e); M.compose(new THREE.Vector3(0, y, 0), q, new THREE.Vector3(len, wid * 0.7, wid * 2.2)); im.setMatrixAt(i, M); });
    im.castShadow = true; im.receiveShadow = true; g.add(im);
  }
  // a dense core so you can't see straight through
  const core = new THREE.Mesh(new THREE.ConeGeometry(Rb * 0.62, H * 0.9, 12, 1, true), std(0x1e4a2a, 0.95, 0, { side: THREE.DoubleSide })); core.position.y = 200 + H * 0.45; g.add(core);
  const top = new THREE.Mesh(new THREE.ConeGeometry(40 * kS, 260 * kS, 6), needles); top.position.y = H + 40 * kS; g.add(top);

  // a point on the tree's outer surface at height y and angle a (a little in from the tips)
  const at = (y, a, k = 0.9) => { const r = radius(y) * k + 70 * kS; return new THREE.Vector3(Math.cos(a) * r, y - r * 0.22, Math.sin(a) * r); };

  // the C9 lights: a spiral of big strawberry-shaped bulbs on a green wire, five classic colours
  const COLS = [0xff2a1a, 0x18c040, 0x2a5cff, 0xff9a10, 0xfff0c8];
  const bulbGeo = new THREE.SphereGeometry(17, 12, 10); bulbGeo.scale(1, 1.55, 1); bulbGeo.translate(0, -20, 0); bulbGeo.scale(Math.sqrt(kS), Math.sqrt(kS), Math.sqrt(kS));
  const sock = new THREE.CylinderGeometry(11, 12, 22, 8);
  const bulbs = (nb === 1 ? [COLS[0]] : COLS).map((c) => ({ c, m: new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, roughness: 0.35 }), list: [] }));
  const glowPos = [], glowCol = [], wire = [];
  for (let i = 0; i < nb; i++) {
    const t = nb > 1 ? i / nb : 0.55, y = H * 0.11 + t * (H * 0.84), a = t * turns * Math.PI * 2;
    const p = at(y, a, 1.02); wire.push(p.clone().add(new THREE.Vector3(0, 12, 0)));
    const col = bulbs[i % bulbs.length]; col.list.push(p);
    glowPos.push(p.x, p.y - 18, p.z); const cc = new THREE.Color(col.c); glowCol.push(cc.r, cc.g, cc.b);
  }
  const M = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (const b of bulbs) {
    if (!b.list.length) continue;
    const im = new THREE.InstancedMesh(bulbGeo, b.m, b.list.length), sm = new THREE.InstancedMesh(sock, std(0x1d3a20, 0.6), b.list.length);
    b.list.forEach((p, i) => {
      // each bulb hangs from its socket, tipped outward a little
      const out = new THREE.Vector3(p.x, 0, p.z).normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(out.x * 0.5, -1, out.z * 0.5).normalize());
      M.compose(p, q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, M);
      M.compose(p.clone().add(new THREE.Vector3(0, 6, 0)), q, new THREE.Vector3(1, 1, 1)); sm.setMatrixAt(i, M);
    });
    g.add(im, sm);
  }
  if (wire.length > 1) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 600, 2.5, 5, false), std(0x1d3a20, 0.6)));
  // a soft halo round every bulb (incandescent glass glows)
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(glowCol, 3));
  const halos = new THREE.Points(gg, new THREE.PointsMaterial({ size: 240 * Math.sqrt(kS), map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  g.add(halos);
  // and their light on the room: two warm, coloured lamps inside the tree
  if (lamps) for (const [y, c, k] of [[H * 0.35, 0xffa060, 2.2e5 * kS], [H * 0.7, 0xff7a70, 1.2e5 * kS]]) { const l = new THREE.PointLight(c, k, 0, 2); l.position.set(0, y, 0); g.add(l); }

  // ornaments, the Swiss way
  const straw = std(0xe8c870, 0.7), red = std(0xb01818, 0.45), apple = std(0xc8202a, 0.3, 0, { emissive: 0x200000 }), gold = std(0xe0b850, 0.3, 0.45, { emissive: 0x3a2200 });
  const ginger = std(0x8a4a20, 0.85), icing = std(0xf4efe4, 0.6);
  const thread = std(0xb01818, 0.8);
  const hang = (obj, p, a) => { obj.scale.setScalar(kS); obj.position.copy(p); obj.rotation.y = -a + Math.PI / 2; g.add(obj); const th = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 40, 4), thread); th.position.set(p.x, p.y + 45 * kS, p.z); th.scale.y = kS; g.add(th); };
  let k = 0;
  for (let i = 0; i < orn; i++) {
    const y = R(H * 0.14, H * 0.87), a = R(0, Math.PI * 2), p = at(y, a, 0.86);
    const kind = k++ % 5;
    if (kind === 0) hang(strawStar(R(45, 70), straw, red), p, a);
    else if (kind === 1) { const ap = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(32, 14, 10), apple); s.scale.y = 0.9; ap.add(s); const st = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 18, 5), ginger); st.position.y = 32; ap.add(st); hang(ap, p, a); }
    else if (kind === 2) { const hg = new THREE.Group(); const hs = heartShape(42); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 10, bevelEnabled: false }), ginger); hg.add(m); const ic = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(30)), icing); ic.position.z = 11; ic.scale.set(1, 1, 1); hg.add(ic); const in2 = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(25)), ginger); in2.position.z = 12; hg.add(in2); hang(hg, p, a); }
    else if (kind === 3) hang(bow(22, red), p, a);
    else { const b = new THREE.Mesh(new THREE.SphereGeometry(28, 14, 10), gold); hang(b, p, a); }
  }
  // a straw star on top
  const star = strawStar(120 * kS, straw, red); star.position.y = H + 170 * kS; g.add(star);
  if (lamps) { const starGlow = new THREE.PointLight(0xffd090, 3e4, 0, 2); starGlow.position.y = H + 120; g.add(starGlow); }
  // presents under it
  const papers = [0xa81c1c, 0x1e5a32, 0xe8dcc4, 0x2a3a6a], ribbonM = [std(0xd8b050, 0.3, 0.8), std(0xb01818, 0.5)];
  if (presents) for (const [x, z, w, h, d, r] of [[260, 340, 300, 200, 260, 0.3], [-360, 220, 240, 160, 240, -0.4], [120, -380, 340, 140, 220, 0.9], [-200, -330, 200, 260, 200, 0.1]]) {
    const pg = new THREE.Group(); pg.position.set(x, 0, z); pg.rotation.y = r; g.add(pg);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(papers[Math.floor(R(0, papers.length))], 0.7)); bx.position.y = h / 2; bx.castShadow = true; pg.add(bx);
    const rm = ribbonM[Math.floor(R(0, 2))];
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(w + 4, h + 4, 30), rm); r1.position.y = h / 2; pg.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(30, h + 4, d + 4), rm); r2.position.y = h / 2; pg.add(r2);
    const bw = bow(28, rm); bw.position.y = h + 20; pg.add(bw);
  }
  return g;
}

// a fir garland swagged along a straight edge from a to b (mm), with red bows where it's hooked up
export function garland(a, b, swags = 3, drop = 140) {
  const g = new THREE.Group();
  const fir = std(0x234a2c, 0.85, 0, { flatShading: true }), fir2 = std(0x2e5a36, 0.85, 0, { flatShading: true }), red = std(0xb01818, 0.45);
  const tuft = new THREE.IcosahedronGeometry(1, 0);
  const pts = [];
  for (let s = 0; s < swags; s++) for (let i = 0; i < 26; i++) { const t = (s + i / 26) / swags, u = i / 26; const p = a.clone().lerp(b, t); p.y -= drop * Math.sin(Math.PI * u); pts.push(p); }
  pts.push(b.clone());
  for (const [mat, n, sz] of [[fir, 3, 34], [fir2, 2, 26]]) {
    const im = new THREE.InstancedMesh(tuft, mat, pts.length * n), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    let i = 0;
    for (const p of pts) for (let j = 0; j < n; j++) { q.setFromEuler(new THREE.Euler(R(0, 6), R(0, 6), R(0, 6))); M.compose(p.clone().add(new THREE.Vector3(R(-18, 18), R(-18, 18), R(-18, 18))), q, new THREE.Vector3(sz * R(1, 1.5), sz * R(0.4, 0.7), sz)); im.setMatrixAt(i++, M); }
    im.castShadow = true; g.add(im);
  }
  for (let s = 0; s <= swags; s++) { const bw = bow(30, red); bw.position.copy(a.clone().lerp(b, s / swags)); g.add(bw); }
  return g;
}

// ---------------------------------------------------------------- the smaller pieces
// everything below is built facing +z in its own XY plane, origin at its hanging point (mm)

// a fir wreath with a red bow (and optionally berries)
export function wreath(r = 260, { berries = true } = {}) {
  const g = new THREE.Group();
  const fir = std(0x2a5a34, 0.85, 0, { flatShading: true }), fir2 = std(0x3a7040, 0.85, 0, { flatShading: true }), red = std(0xb01818, 0.45);
  const tuft = new THREE.IcosahedronGeometry(1, 0), n = Math.round(r / 4);
  for (const [mat, k, sz] of [[fir, 1, r * 0.17], [fir2, 0.7, r * 0.13]]) {
    const im = new THREE.InstancedMesh(tuft, mat, Math.round(n * k)), M = new THREE.Matrix4(), q = new THREE.Quaternion();
    for (let i = 0; i < im.count; i++) { const a = (i / im.count) * Math.PI * 2 + R(-0.05, 0.05), rr = r + R(-r * 0.12, r * 0.12); q.setFromEuler(new THREE.Euler(R(0, 6), R(0, 6), a)); M.compose(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, R(-r * 0.05, r * 0.12)), q, new THREE.Vector3(sz * 1.6, sz * 0.55, sz)); im.setMatrixAt(i, M); }
    im.castShadow = true; g.add(im);
  }
  if (berries) { const bm = std(0xd01020, 0.3); for (let i = 0; i < 18; i++) { const a = R(0, Math.PI * 2), b = new THREE.Mesh(new THREE.SphereGeometry(r * 0.035, 8, 6), bm); b.position.set(Math.cos(a) * r * R(0.9, 1.1), Math.sin(a) * r * R(0.9, 1.1), r * 0.12); g.add(b); } }
  const bw = bow(r * 0.18, red); bw.position.set(0, -r, r * 0.15); g.add(bw);
  return g;
}
// a knitted stocking hanging from a loop at the origin, toe to the side
export function stocking(col = 0xb01818, scale = 1) {
  const g = new THREE.Group(), m = std(col, 0.95), cuff = std(0xf2ede2, 1);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(70, 75, 300, 14), m); leg.position.y = -190; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(72, 120, 6, 12), m); foot.rotation.z = Math.PI / 2; foot.position.set(70, -350, 0); g.add(foot);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(84, 84, 90, 16), cuff); c.position.y = -45; g.add(c);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(18, 4, 6, 12), cuff); loop.position.y = 10; g.add(loop);
  for (const y of [-150, -240]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(76, 76, 16, 14), cuff); st.position.y = y; g.add(st); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.scale.setScalar(scale); return g;
}
// a poinsettia in a pot, standing at the origin
export function poinsettia(scale = 1) {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(120, 90, 200, 16), std(0xb8482a, 0.8)); pot.position.y = 100; g.add(pot);
  const foil = new THREE.Mesh(new THREE.CylinderGeometry(132, 118, 70, 16), std(0xd8b050, 0.3, 0.8)); foil.position.y = 175; g.add(foil);
  const leaf = new THREE.SphereGeometry(1, 8, 6); leaf.scale(1, 0.12, 0.42); leaf.translate(1, 0, 0);
  const redM = std(0xc0141e, 0.6), greenM = std(0x2a5a2a, 0.7);
  for (const [mat, n, len, y, tilt] of [[greenM, 9, 170, 230, 0.35], [redM, 11, 150, 300, 0.25], [redM, 8, 110, 350, 0.1], [redM, 5, 70, 385, -0.1]]) {
    for (let i = 0; i < n; i++) { const l = new THREE.Mesh(leaf, mat), a = (i / n) * Math.PI * 2 + R(-0.2, 0.2); l.scale.setScalar(len); l.position.y = y; l.rotation.set(0, a, -tilt); l.castShadow = true; g.add(l); }
  }
  const yel = std(0xe0c020, 0.5); for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(7, 6, 5), yel); b.position.set(R(-14, 14), 392, R(-14, 14)); g.add(b); }
  g.scale.setScalar(scale); return g;
}
// a string of little warm lights along points (a fairy string) or big C9s; with halos
export function lightString(pts, { c9 = false, cols = null, sag = 0 } = {}) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(pts), n = Math.round(curve.getLength() / (c9 ? 140 : 60));
  const COLS = cols || (c9 ? [0xff2a1a, 0x18c040, 0x2a5cff, 0xff9a10, 0xfff0c8] : [0xffd8a0]);
  const geo = c9 ? (() => { const b = new THREE.SphereGeometry(17, 10, 8); b.scale(1, 1.55, 1); b.translate(0, -20, 0); return b; })() : new THREE.SphereGeometry(7, 8, 6);
  const mats = COLS.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: c9 ? 1.4 : 2, roughness: 0.3 }));
  const per = COLS.map(() => []), gp = [], gc = [];
  for (let i = 0; i <= n; i++) { const t = i / n, p = curve.getPoint(t); p.y -= sag * Math.sin(Math.PI * t); per[i % COLS.length].push(p); gp.push(p.x, p.y - (c9 ? 18 : 0), p.z); const cc = new THREE.Color(COLS[i % COLS.length]); gc.push(cc.r, cc.g, cc.b); }
  per.forEach((list, k) => { const im = new THREE.InstancedMesh(geo, mats[k], list.length), M = new THREE.Matrix4(); list.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); im.setMatrixAt(i, M); }); g.add(im); });
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, c9 ? 2.5 : 1.2, 5, false), std(c9 ? 0x1d3a20 : 0x2a2a2a, 0.6)));
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(gc, 3));
  g.add(new THREE.Points(gg, new THREE.PointsMaterial({ size: c9 ? 240 : 110, map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })));
  return g;
}
// a Herrnhut (Moravian) star: 26 glowing points, hanging from its cord at the origin
export function moravianStar(r = 170) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc870, emissiveIntensity: 1.3, roughness: 0.7, transparent: true, opacity: 0.95 });
  const body = new THREE.Group(); body.position.y = -r * 1.6; g.add(body);
  const cone = new THREE.ConeGeometry(r * 0.32, r, 4); cone.translate(0, r * 0.5 + r * 0.3, 0);
  const dirs = [];
  for (const v of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) dirs.push(v);
  for (const a of [-1, 1]) for (const b of [-1, 1]) { dirs.push([a, b, 0]); dirs.push([a, 0, b]); dirs.push([0, a, b]); }
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) dirs.push([a, b, c]);
  for (const d of dirs) { if (d[1] === 1 && d[0] === 0 && d[2] === 0) continue; const o = new THREE.Mesh(cone, m); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d).normalize()); body.add(o); }
  body.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.42, 12, 10), m));
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, r * 1.2, 4), std(0x8a1a1a, 0.9)); cord.position.y = -r * 0.6; g.add(cord);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffc070, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(r * 6); halo.position.y = -r * 1.6; g.add(halo);
  const l = new THREE.PointLight(0xffb860, 6e4, 0, 2); l.position.y = -r * 1.6; g.add(l);
  return g;
}
// an Advent wreath lying flat with four candles, as many lit as Advent Sundays have come (all four out of season)
export function adventWreath(r = 190, now = new Date()) {
  const g = new THREE.Group();
  const w = wreath(r, { berries: true }); w.rotation.x = -Math.PI / 2; w.children.filter((c) => !c.isInstancedMesh && c.type === 'Group').forEach((b) => b.removeFromParent()); g.add(w);
  const xmas = new Date(now.getFullYear(), 11, 25), first = new Date(xmas); first.setDate(25 - (xmas.getDay() || 7) - 21);
  let lit = 4;
  if (now.getMonth() === 11 && now < xmas) lit = Math.max(0, Math.min(4, Math.floor((now - first) / (7 * 864e5)) + 1));
  const wax = std(0xb01818, 0.6), flameM = new THREE.MeshBasicMaterial({ color: 0xffd27a });
  const flames = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4, c = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 160 - k * 15, 14), wax);
    c.position.set(Math.cos(a) * r, 80 - k * 7.5, Math.sin(a) * r); c.castShadow = true; g.add(c);
    if (k < lit) { const f = new THREE.Mesh(new THREE.SphereGeometry(9, 8, 6), flameM); f.scale.y = 2.2; f.position.set(c.position.x, 160 - k * 15 + 22, c.position.z); g.add(f); flames.push(f); }
  }
  if (lit) { const l = new THREE.PointLight(0xffa850, 4e4 * lit, 0, 2); l.position.y = 260; g.add(l); }
  g.userData.flames = flames;
  return g;
}
// a paper snowflake (flat, six-fold) to stick on a window
export function snowflake(r = 90) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  for (let k = 0; k < 6; k++) {
    const arm = new THREE.Group(); arm.rotation.z = (k / 6) * Math.PI * 2; g.add(arm);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(r, r * 0.09), m); s.position.x = r / 2; arm.add(s);
    for (const [x, l] of [[0.45, 0.32], [0.72, 0.22]]) for (const sd of [-1, 1]) { const b = new THREE.Mesh(new THREE.PlaneGeometry(r * l, r * 0.07), m); b.position.set(r * x + r * l * 0.35, sd * r * l * 0.35, 0); b.rotation.z = sd * 0.8; arm.add(b); }
  }
  return g;
}
// face a flat piece onto a room wall: 'y0' faces +z, 'y1' -z, 'x0' +x, 'x1' -x
export function onWall(obj, wall) { obj.rotation.y = { y0: 0, y1: Math.PI, x0: Math.PI / 2, x1: -Math.PI / 2 }[wall]; return obj; }
