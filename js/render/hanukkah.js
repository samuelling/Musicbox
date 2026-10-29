// Hanukkah: a hanukkiah in the window of every room (where it's traditionally set, to be seen from outside),
// with as many candles lit as nights of Hanukkah have come, the shamash above the rest; dreidels and a bowl of
// gelt; blue-and-white lights in the hut.  On by itself for the eight days (from the Hebrew calendar), and a
// toggle the rest of the year (when every candle is lit).  Add ?hanukkah to the address to see it any time.
import * as THREE from 'three';

// the night of Hanukkah it is (1-8), or 0 outside it.  Hanukkah begins on the evening of 24 Kislev, so the
// first full day is 25 Kislev; we count the day's night from 25 Kislev (and the eve itself as night 1).
export function hanukkahNight(d = new Date()) {
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long' });
    for (let back = 0; back <= 9; back++) {
      const t = new Date(d); t.setDate(d.getDate() - back);
      const parts = f.formatToParts(t), month = (parts.find((p) => p.type === 'month') || {}).value || '', day = +((parts.find((p) => p.type === 'day') || {}).value || 0);
      if (/kislev/i.test(month) && day === 25) return back + 1 <= 8 ? back + 1 : 0;
      if (/kislev/i.test(month) && day === 24 && back === 0) return 1;     // the eve: the first candle tonight
    }
  } catch (e) { /* no Hebrew calendar here */ }
  return 0;
}
export function hanukkahTime(d = new Date()) {
  try { if (/[?&]hanukkah\b/i.test(location.search)) return true; } catch (e) { /* no location */ }
  return hanukkahNight(d) > 0;
}

const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,225,160,1)'); gr.addColorStop(0.3, 'rgba(255,190,100,0.45)'); gr.addColorStop(1, 'rgba(255,170,70,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let GLOW = null;

// a brass hanukkiah, standing at the origin, its row of eight along x and the shamash raised in the middle;
// candles lit right to left (as they're added), the shamash always
export function hanukkiah(scale = 1, night = hanukkahNight() || 8) {
  const g = new THREE.Group(), brass = std(0xd0a448, 0.28, 1), colors = [0x2a5cc8, 0xf2f0ea, 0x2a5cc8, 0xf2f0ea, 0x2a5cc8, 0xf2f0ea, 0x2a5cc8, 0xf2f0ea];
  const part = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  part(new THREE.CylinderGeometry(70, 95, 26, 24), brass, 0, 13, 0);
  part(new THREE.CylinderGeometry(14, 20, 230, 12), brass, 0, 140, 0);
  part(new THREE.SphereGeometry(30, 14, 10), brass, 0, 120, 0);
  const span = 470, cups = [];
  for (let k = 0; k < 8; k++) { const x = -span / 2 + (k + (k >= 4 ? 1 : 0)) * (span / 8); cups.push(x); }
  // the arms: a bar across, with each cup on its own little post
  part(new THREE.BoxGeometry(span + 30, 14, 18), brass, 0, 250, 0);
  const flames = []; GLOW = GLOW || glowTexture();
  const candle = (x, y, col, lit) => {
    part(new THREE.CylinderGeometry(17, 13, 26, 14), brass, x, y + 13, 0);
    part(new THREE.CylinderGeometry(8, 8, 90, 10), std(col, 0.5, 0, { emissive: col, emissiveIntensity: 0.08 }), x, y + 26 + 45, 0);
    if (!lit) return;
    const f = part(new THREE.SphereGeometry(7, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }), x, y + 26 + 90 + 14, 0); f.scale.y = 2.2; f.castShadow = false;
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 })); h.position.copy(f.position); h.scale.setScalar(150); g.add(h);
    flames.push({ f, h, ph: Math.random() * 6 });
  };
  cups.forEach((x, k) => { part(new THREE.CylinderGeometry(5, 5, 20, 8), brass, x, 262, 0); candle(x, 270, colors[k], 7 - k < night); });
  // the shamash, raised in the middle
  part(new THREE.CylinderGeometry(6, 6, 90, 8), brass, 0, 300, 0); candle(0, 340, 0xe8d8a0, true);
  const l = new THREE.PointLight(0xffb060, 1.4e4 * (night + 1), 0, 2); l.position.y = 420; g.add(l);
  g.userData.flames = flames;
  g.scale.setScalar(scale);
  return g;
}
// a little wooden dreidel lying a-tilt, and a heap of foil-wrapped chocolate gelt
export function dreidel(scale = 1) {
  const g = new THREE.Group(), wood = std(0x3a6ac8, 0.5), top = std(0xf2f0ea, 0.5);
  const b = new THREE.Mesh(new THREE.BoxGeometry(60, 60, 60), wood); b.position.y = 30; g.add(b);
  const p = new THREE.Mesh(new THREE.ConeGeometry(42, 50, 4), wood); p.rotation.x = Math.PI; p.rotation.y = Math.PI / 4; p.position.y = -20; g.add(p);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 50, 8), top); h.position.y = 85; g.add(h);
  g.rotation.z = 0.5; g.position.y = 30; g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const w = new THREE.Group(); w.add(g); w.scale.setScalar(scale); return w;
}
export function gelt(n = 14) {
  const g = new THREE.Group(), gold = std(0xe0b850, 0.25, 0.8), silver = std(0xd8dce0, 0.25, 0.8);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(110, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0x2a5cc8, 0.4, 0, { side: THREE.DoubleSide })); bowl.position.y = 70; bowl.rotation.x = Math.PI; g.add(bowl);
  for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 5, 16), i % 3 ? gold : silver); const a = Math.random() * 6.28, r = Math.random() * 70; c.position.set(Math.cos(a) * r, 40 + i * 3, Math.sin(a) * r); c.rotation.set(Math.random() - 0.5, 0, Math.random() - 0.5); g.add(c); }
  return g;
}
// a Star of David cut from blue card, glowing a little, facing +z
export function starOfDavid(r = 140) {
  const g = new THREE.Group(), m = std(0x3a6ad8, 0.6, 0, { emissive: 0x1a3a90, emissiveIntensity: 0.6, side: THREE.DoubleSide });
  for (const rot of [0, Math.PI]) {
    const s = new THREE.Shape(), ri = r * 0.78;
    for (let k = 0; k <= 3; k++) { const a = rot + Math.PI / 2 + (k / 3) * Math.PI * 2; (k ? s.lineTo.bind(s) : s.moveTo.bind(s))(Math.cos(a) * r, Math.sin(a) * r); }
    const hole = new THREE.Path(); for (let k = 0; k <= 3; k++) { const a = rot + Math.PI / 2 + (k / 3) * Math.PI * 2; (k ? hole.lineTo.bind(hole) : hole.moveTo.bind(hole))(Math.cos(a) * ri, Math.sin(a) * ri); }
    s.holes.push(hole);
    const o = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 6, bevelEnabled: false }), m); o.position.z = rot ? 7 : 0; g.add(o);
  }
  return g;
}
// candle flicker for whatever Hanukkah lights a room has
export function flickerHanukkah(group, t) {
  if (!group || !group.visible) return;
  group.traverse((o) => { const fl = o.userData && o.userData.flames; if (fl) for (const c of fl) { const k = 0.85 + 0.12 * Math.sin(t * (8 + c.ph) + c.ph) + 0.05 * Math.sin(t * 21 + c.ph * 2); c.f.scale.set(1, 2.2 * k, 1); c.h.material.opacity = 0.65 * k; } });
}
