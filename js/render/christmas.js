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
function bow(s, mat) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(s, s * 0.32, 6, 14), mat); l.scale.set(1, 0.62, 0.5); l.position.x = sx * s * 0.9; l.rotation.z = sx * 0.3; g.add(l); }
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.BoxGeometry(s * 0.5, s * 1.9, s * 0.15), mat); t.position.set(sx * s * 0.45, -s * 1.1, 0); t.rotation.z = sx * 0.25; g.add(t); }
  const k = new THREE.Mesh(new THREE.SphereGeometry(s * 0.38, 10, 8), mat); g.add(k);
  return g;
}

// the tree, its base at the origin (mm)
export function swissTree(H = 2050, Rb = 640) {
  const g = new THREE.Group();
  const radius = (y) => Rb * Math.pow(Math.max(0, 1 - y / H), 0.95);
  // stand: a wooden cross, the trunk in it
  const standM = std(0x6a4a30, 0.8);
  for (const r of [0, Math.PI / 2]) { const a = new THREE.Mesh(new THREE.BoxGeometry(620, 70, 80), standM); a.position.y = 35; a.rotation.y = r; a.castShadow = true; g.add(a); }
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(22, 48, H * 0.92, 10), std(0x5a3e2a, 0.95)); trunk.position.y = H * 0.46; trunk.castShadow = true; g.add(trunk);

  // branches: whorls of drooping fronds, each a long flattened cone with a few side twigs
  const needles = std(0x2c6a3c, 0.8, 0, { flatShading: true }), needles2 = std(0x3a7a46, 0.8, 0, { flatShading: true });
  // the layered skirts of a spruce: per whorl an open cone with a ragged, drooping hem
  const whorlsN = 13, step = (H - 330) / whorlsN;
  for (let w = 0; w < whorlsN; w++) {
    const y0 = 230 + w * step, r = radius(y0) + 60, h = step * 1.9 + 60, seg = 30;
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
    const y = 260 + (w / whorls) * (H - 330), r = radius(y) + 40, n = Math.max(5, Math.round(6 + r / 70));
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
  const top = new THREE.Mesh(new THREE.ConeGeometry(40, 260, 6), needles); top.position.y = H + 40; g.add(top);

  // a point on the tree's outer surface at height y and angle a (a little in from the tips)
  const at = (y, a, k = 0.9) => { const r = radius(y) * k + 70; return new THREE.Vector3(Math.cos(a) * r, y - r * 0.22, Math.sin(a) * r); };

  // the C9 lights: a spiral of big strawberry-shaped bulbs on a green wire, five classic colours
  const COLS = [0xff2a1a, 0x18c040, 0x2a5cff, 0xff9a10, 0xfff0c8];
  const bulbGeo = new THREE.SphereGeometry(17, 12, 10); bulbGeo.scale(1, 1.55, 1); bulbGeo.translate(0, -20, 0);
  const sock = new THREE.CylinderGeometry(11, 12, 22, 8);
  const bulbs = COLS.map((c) => ({ c, m: new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.4, roughness: 0.35 }), list: [] }));
  const glowPos = [], glowCol = [], wire = [];
  const turns = 7.5, nb = 96;
  for (let i = 0; i < nb; i++) {
    const t = i / nb, y = 230 + t * (H - 330), a = t * turns * Math.PI * 2;
    const p = at(y, a, 1.02); wire.push(p.clone().add(new THREE.Vector3(0, 12, 0)));
    const col = bulbs[i % COLS.length]; col.list.push(p);
    glowPos.push(p.x, p.y - 18, p.z); const cc = new THREE.Color(col.c); glowCol.push(cc.r, cc.g, cc.b);
  }
  const M = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (const b of bulbs) {
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
  const wireCurve = new THREE.CatmullRomCurve3(wire);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 600, 2.5, 5, false), std(0x1d3a20, 0.6)));
  // a soft halo round every bulb (incandescent glass glows)
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(glowCol, 3));
  const halos = new THREE.Points(gg, new THREE.PointsMaterial({ size: 240, map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  g.add(halos);
  // and their light on the room: two warm, coloured lamps inside the tree
  for (const [y, c, k] of [[H * 0.35, 0xffa060, 2.2e5], [H * 0.7, 0xff7a70, 1.2e5]]) { const l = new THREE.PointLight(c, k, 0, 2); l.position.set(0, y, 0); g.add(l); }

  // ornaments, the Swiss way
  const straw = std(0xe8c870, 0.7), red = std(0xb01818, 0.45), apple = std(0xc8202a, 0.3, 0, { emissive: 0x200000 }), gold = std(0xe0b850, 0.3, 0.45, { emissive: 0x3a2200 });
  const ginger = std(0x8a4a20, 0.85), icing = std(0xf4efe4, 0.6);
  const thread = std(0xb01818, 0.8);
  const hang = (obj, p, a) => { obj.position.copy(p); obj.rotation.y = -a + Math.PI / 2; g.add(obj); const th = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 40, 4), thread); th.position.set(p.x, p.y + 45, p.z); g.add(th); };
  let k = 0;
  for (let i = 0; i < 70; i++) {
    const y = R(280, H - 260), a = R(0, Math.PI * 2), p = at(y, a, 0.86);
    const kind = k++ % 5;
    if (kind === 0) hang(strawStar(R(45, 70), straw, red), p, a);
    else if (kind === 1) { const ap = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(32, 14, 10), apple); s.scale.y = 0.9; ap.add(s); const st = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 18, 5), ginger); st.position.y = 32; ap.add(st); hang(ap, p, a); }
    else if (kind === 2) { const hg = new THREE.Group(); const hs = heartShape(42); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: 10, bevelEnabled: false }), ginger); hg.add(m); const ic = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(30)), icing); ic.position.z = 11; ic.scale.set(1, 1, 1); hg.add(ic); const in2 = new THREE.Mesh(new THREE.ShapeGeometry(heartShape(25)), ginger); in2.position.z = 12; hg.add(in2); hang(hg, p, a); }
    else if (kind === 3) hang(bow(22, red), p, a);
    else { const b = new THREE.Mesh(new THREE.SphereGeometry(28, 14, 10), gold); hang(b, p, a); }
  }
  // a straw star on top
  const star = strawStar(120, straw, red); star.position.y = H + 170; g.add(star);
  const starGlow = new THREE.PointLight(0xffd090, 3e4, 0, 2); starGlow.position.y = H + 120; g.add(starGlow);
  // presents under it
  const papers = [0xa81c1c, 0x1e5a32, 0xe8dcc4, 0x2a3a6a], ribbonM = [std(0xd8b050, 0.3, 0.8), std(0xb01818, 0.5)];
  for (const [x, z, w, h, d, r] of [[260, 340, 300, 200, 260, 0.3], [-360, 220, 240, 160, 240, -0.4], [120, -380, 340, 140, 220, 0.9], [-200, -330, 200, 260, 200, 0.1]]) {
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
