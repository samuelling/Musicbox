// A very rare visitor: an old man with a big unkempt beard trudges up to the window through the snow, leans in,
// cups his hands to the glass and peers into the room (his breath fogs the pane), then shuffles off. Nobody
// explains him. On average he comes once every forty minutes or so of the room being open (never sooner than
// fifteen); add ?oldman to the address to have him come by in a few seconds.
import * as THREE from 'three';
import { Q } from './quality.js';
import { pbr } from './pbr.js';
import { Splats } from './splats.js';
import { starMesh, sdEll, smin } from './hamster-scene.js';

const R = (a, b) => a + Math.random() * (b - a);
const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });

function fogTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(235,240,245,0.85)'); g.addColorStop(0.55, 'rgba(225,232,240,0.45)'); g.addColorStop(1, 'rgba(220,228,236,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// the twelve days leading up to Christmas (Dec 13 through Christmas Day), when he turns up in a Santa suit.
// ?santa in the address forces it, for a look out of season
export function santaSeason(d = new Date()) {
  try { if (/[?&]santa\b/.test(location.search)) return true; } catch (e) { /* no location */ }
  const m = d.getMonth(), day = d.getDate();
  return m === 11 && day >= 13 && day <= 25;
}

// the man himself, built facing +z, his feet at the origin (mm)
export function oldMan({ santa = santaSeason() } = {}) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  // cloth: a heavy herringbone wool overcoat (or, in season, a cheap Santa suit of worn red velvet)
  const coat = santa ? pbr('velour_velvet', { gray: true, color: 0x8e1a14, rough: 1, normal: 1.2, repeat: [5, 6], emissive: 0x1a0302 })
    : pbr('poly_wool_herringbone', { gray: true, color: 0x40342a, rough: 1, normal: 1.6, repeat: [9, 8], emissive: 0x0c0705 });
  const knit = (c, rep = [4, 3]) => pbr('knitted_fleece', { gray: true, color: c, rough: 1, normal: 1.8, repeat: rep, emissive: new THREE.Color(c).multiplyScalar(0.06) });
  const cap = knit(santa ? 0x9a1c16 : 0x6a2420), fur = knit(0xe6e0d4, [3, 2]);
  const leather = pbr('brown_leather', { color: new THREE.Color(0.7, 0.6, 0.5), rough: 0.9, repeat: [2, 2] });

  // ---- body: the coat hangs from sloping shoulders, a little stooped ----
  const body = new THREE.Group(); g.add(body); body.rotation.x = 0.12;
  const prof = [[0, 40], [296, 40], [306, 70], [292, 320], [276, 720], [266, 1010], [252, 1210], [214, 1335], [150, 1400], [104, 1436], [0, 1440]].map(([x, y]) => new THREE.Vector2(x, y));
  const coatG = new THREE.LatheGeometry(prof, 40); coatG.scale(1.18, 1, 0.84);
  { // hanging cloth: shallow vertical folds that deepen toward the hem
    const P = coatG.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), a = Math.atan2(z, x), k = 1 + 0.035 * Math.sin(a * 9 + 1.3) * Math.max(0, 1 - y / 1100); P.setX(i, x * k); P.setZ(i, z * k); } coatG.computeVertexNormals(); }
  const coatM = add(coatG, coat, 0, 0, 0, body);
  // the coat's front edge, horn buttons, a turned-up collar
  add(new THREE.BoxGeometry(14, 1180, 10), santa ? fur : coat, 26, 760, 252, body).rotation.x = -0.033;
  const horn = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 0.35 });
  if (!santa) for (let k = 0; k < 4; k++) { const b = add(new THREE.CylinderGeometry(21, 21, 9, 18), horn, -8, 640 + k * 190, 262 - k * 5, body); b.rotation.x = Math.PI / 2 - 0.03; }
  const collar = add(new THREE.TorusGeometry(santa ? 135 : 124, santa ? 60 : 44, 10, 28), santa ? fur : coat, 0, 1425, 14, body); collar.rotation.x = Math.PI / 2 - 0.1; collar.scale.set(1.12, 1, 1);
  if (!santa) { // a knitted scarf wound once round, one end hanging
    const scarf = knit(0x7a6226, [6, 1.5]);
    const wrap = add(new THREE.TorusGeometry(112, 40, 10, 28), scarf, 0, 1462, 24, body); wrap.rotation.x = Math.PI / 2 - 0.16;
    const end = add(new THREE.BoxGeometry(92, 330, 26), scarf, -62, 1290, 236, body); end.rotation.set(-0.06, 0, 0.05);
  }
  // boots under the hem
  for (const sx of [-1, 1]) { const b = add(new THREE.SphereGeometry(1, 16, 12), leather, sx * 105, 42, 70, body); b.scale.set(78, 48, 150); }

  // ---- head: sculpted (brow, sockets, cheekbones, a bulbous nose), weathered skin ----
  const head = new THREE.Group(); head.position.set(0, 1540, 175); head.scale.setScalar(1.3); body.add(head);   // jutting forward from a stoop
  const smax = (a, b, k) => -smin(-a, -b, k);
  const headSdf = (x, y, z) => {
    const ax = Math.abs(x);
    let d = sdEll(x, y, z, 0, 12, -6, 112, 128, 118);                      // cranium
    d = smin(d, sdEll(x, y, z, 0, -52, 22, 92, 92, 96), 30);              // jaw and lower face
    d = smin(d, sdEll(ax, y, z, 0, 44, 92, 80, 17, 26), 16);              // brow ridge
    d = smin(d, sdEll(ax, y, z, 60, -8, 76, 34, 28, 30), 18);             // cheekbones
    d = smax(d, -sdEll(ax, y, z, 42, 22, 112, 23, 13, 20), 10);           // eye sockets
    d = smin(d, sdEll(x, y, z, 0, 8, 110, 15, 34, 18), 9);                // bridge of the nose
    d = smin(d, sdEll(x, y, z, 0, -24, 126, 25, 21, 25), 9);              // its bulb
    d = smin(d, sdEll(ax, y, z, 20, -30, 113, 14, 11, 14), 7);            // nostril wings
    d = smin(d, sdEll(ax, y, z, 48, -4, 92, 20, 12, 12), 8);              // bags under the eyes
    return d;
  };
  const SK = [0.6, 0.39, 0.3], mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const headPaint = (x, y, z, nx, ny, nz, o) => {
    const ax = Math.abs(x);
    let c = SK;
    const nose = Math.exp(-(((x) / 30) ** 2 + ((y + 22) / 26) ** 2)) * sstep(95, 120, z);
    const cheek = Math.exp(-(((ax - 60) / 30) ** 2 + ((y + 10) / 26) ** 2)) * sstep(40, 80, z);
    c = mixc(c, [0.78, 0.3, 0.26], Math.min(1, nose * 0.85 + cheek * 0.55));                         // cold has got at his nose and cheeks
    const socket = Math.exp(-(((ax - 42) / 24) ** 2 + ((y - 20) / 16) ** 2)) * sstep(60, 95, z);
    c = mixc(c, [0.4, 0.24, 0.22], socket * 0.7);
    const lines = 0.5 + 0.5 * Math.sin(y * 0.55 + Math.sin(x * 0.05) * 2);                             // forehead furrows, crow's feet
    const furrow = sstep(50, 75, y) * sstep(60, 95, z) * Math.pow(lines, 6) + Math.exp(-(((ax - 74) / 12) ** 2 + ((y - 22) / 14) ** 2)) * Math.pow(0.5 + 0.5 * Math.sin(y * 1.1 + ax * 0.4), 4);
    c = mixc(c, [0.42, 0.26, 0.2], Math.min(0.6, furrow * 0.6));
    const blotch = 0.92 + 0.16 * Math.sin(x * 0.13 + 1.7) * Math.sin(y * 0.11) * Math.sin(z * 0.09 + 0.4);
    o.r = c[0] * blotch; o.g = c[1] * blotch; o.b = c[2] * blotch; o.len = 0; o.tick = 0; o.cx = 0; o.cy = 0; o.cz = 0;
  };
  const skinM = pbr('brown_leather', { maps: 'na', vertexColors: true, rough: 0.8, normal: 0.9, repeat: [7, 5], emissive: 0x2a120a, emissiveIntensity: 0.5 });
  const skull = new THREE.Mesh(starMesh(headSdf, new THREE.Vector3(0, 0, 0), Q.sculpt[0], Q.sculpt[1], headPaint), skinM); skull.castShadow = true; skull.receiveShadow = true; head.add(skull);
  const earM = new THREE.MeshStandardMaterial({ color: 0xb8705c, roughness: 0.6, emissive: 0x2a120a, emissiveIntensity: 0.5 });
  for (const sx of [-1, 1]) { const e = add(new THREE.SphereGeometry(1, 14, 10), earM, sx * 113, -4, -8, head); e.scale.set(11, 35, 23); e.rotation.set(0, sx * 0.35, sx * -0.12); }
  // eyes: pale, watery, hooded
  const irisT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#e9e2d6'; x.fillRect(0, 0, 128, 128);
    for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(190,60,50,${R(0.08, 0.3)})`; x.lineWidth = R(0.4, 1); const a = R(0, 6.3); x.beginPath(); x.moveTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62); x.quadraticCurveTo(64 + Math.cos(a + 0.3) * 45, 64 + Math.sin(a + 0.3) * 45, 64 + Math.cos(a) * R(26, 36), 64 + Math.sin(a) * R(26, 36)); x.stroke(); }
    const gr = x.createRadialGradient(64, 64, 4, 64, 64, 25); gr.addColorStop(0, '#5e7884'); gr.addColorStop(0.75, '#8aa2ad'); gr.addColorStop(1, '#3c4c56'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 25, 0, 7); x.fill();
    for (let k = 0; k < 60; k++) { const a = R(0, 6.3); x.strokeStyle = `rgba(230,240,245,${R(0.1, 0.35)})`; x.lineWidth = 0.6; x.beginPath(); x.moveTo(64 + Math.cos(a) * 9, 64 + Math.sin(a) * 9); x.lineTo(64 + Math.cos(a) * 24, 64 + Math.sin(a) * 24); x.stroke(); }
    x.fillStyle = '#0a0806'; x.beginPath(); x.arc(64, 64, 9.5, 0, 7); x.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const eyeM = new THREE.MeshPhysicalMaterial({ map: irisT, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, emissive: 0x2a2622, emissiveIntensity: 0.25 });
  const lidM = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.62, 0.42, 0.34), roughness: 0.65, emissive: 0x2a120a, emissiveIntensity: 0.4, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const eg = new THREE.SphereGeometry(13.5, 24, 18); eg.rotateY(-Math.PI / 2);          // the iris (texture centre) looks along +z
    { const uv = eg.attributes.uv, P = eg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + P.getX(i) / 27 * 1.0, 0.5 + P.getY(i) / 27 * 1.0); }
    const eye = add(eg, new THREE.MeshPhysicalMaterial({ color: 0xe6ded2, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04, emissive: 0x2a2622, emissiveIntensity: 0.25 }), sx * 42, 22, 87, head); eye.castShadow = false;
    const iris = add(new THREE.CircleGeometry(6.4, 24), new THREE.MeshPhysicalMaterial({ map: irisT, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03 }), 0, -2.5, 13.3, eye); iris.rotation.x = 0.18; iris.castShadow = false;
    { const uv = iris.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * 0.4, 0.5 + (uv.getY(i) - 0.5) * 0.4); }
    const lid = add(new THREE.SphereGeometry(14.6, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.4), lidM, sx * 42, 22, 87, head); lid.rotation.x = 0.3; lid.castShadow = false;
    const low = add(new THREE.SphereGeometry(14.4, 20, 8, 0, Math.PI * 2, Math.PI * 0.7, Math.PI * 0.3), lidM, sx * 42, 22, 87, head); low.rotation.x = -0.42; low.castShadow = false;
  }
  // a knitted cap pulled down (or, in season, a Santa hat with a fur brim and a grubby pompom)
  const cp = add(new THREE.SphereGeometry(131, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), cap, 0, 26, -6, head); cp.scale.set(1, 1.06, 1.06);
  if (!santa) {
    add(new THREE.TorusGeometry(116, 24, 10, 32), cap, 0, 70, -4, head).rotation.x = Math.PI / 2 - 0.12;
    add(new THREE.SphereGeometry(42, 14, 10), cap, 0, 170, -10, head);   // the bobble
  } else {
    add(new THREE.TorusGeometry(120, 34, 10, 28), fur, 0, 70, -4, head).rotation.x = Math.PI / 2 - 0.12;
    const flop = new THREE.Group(); flop.position.set(0, 120, -10); flop.rotation.set(-0.5, 0, 0.35); head.add(flop);
    add(new THREE.CylinderGeometry(70, 110, 170, 16), cap, 0, 70, 0, flop);
    const bend = new THREE.Group(); bend.position.set(0, 150, 0); bend.rotation.set(-0.9, 0, 0.5); flop.add(bend);
    add(new THREE.ConeGeometry(70, 230, 14), cap, 0, 110, 0, bend);
    add(new THREE.SphereGeometry(48, 12, 10), fur, 0, 230, 0, bend);
  }
  // ---- hair: a big unkempt beard, moustache, wild brows and straggling locks, one Gaussian splat per strand ----
  const greys = [[0.72, 0.71, 0.69], [0.52, 0.51, 0.5], [0.88, 0.87, 0.85], [0.38, 0.37, 0.36], [0.8, 0.78, 0.72]];
  const nBeard = Q.beard;
  const hair = new Splats(nBeard * 2 + 2400, { rough: 0.5, sharp: 2.4, wrap: 0.4, env: 0.9 });
  const strand = (px, py, pz, dx, dy, dz, len, w, nrm, curl = 0.3, yellow = 0) => {
    // two overlapping splats per strand, the second veering off: enough to read as a curl
    let l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
    const c = greys[Math.floor(Math.random() * greys.length)], k = R(0.8, 1.1), col = [c[0] * k, c[1] * k * (1 - 0.08 * yellow), c[2] * k * (1 - 0.3 * yellow)];
    const l1 = len * 0.55;
    hair.add(px + dx * l1 / 2, py + dy * l1 / 2, pz + dz * l1 / 2, dx * l1 / 2, dy * l1 / 2, dz * l1 / 2, w, col[0], col[1], col[2], nrm[0], nrm[1], nrm[2]);
    const qx = px + dx * l1 * 0.72, qy = py + dy * l1 * 0.72, qz = pz + dz * l1 * 0.72;
    let ex = dx + R(-curl, curl), ey = dy - 0.15, ez = dz + R(-curl, curl * 0.6); l = Math.hypot(ex, ey, ez); ex /= l; ey /= l; ez /= l;
    const l2 = len * 0.6;
    hair.add(qx + ex * l2 / 2, qy + ey * l2 / 2, qz + ez * l2 / 2, ex * l2 / 2, ey * l2 / 2, ez * l2 / 2, w * 0.85, col[0], col[1], col[2], nrm[0], nrm[1], nrm[2]);
  };
  for (let i = 0; i < nBeard; i++) {          // beard: from cheek to cheek and under the jaw, longest at the chin
    const a = R(-1.4, 1.4), u = Math.random(), sa = Math.sin(a), ca = Math.cos(a);
    strand(sa * 90, -34 - u * 78, ca * 86 + 20 - Math.abs(sa) * 22, sa * 0.5 + R(-0.25, 0.25), -1, ca * 0.5 + R(0, 0.3), R(110, 250) * (1 - 0.45 * Math.abs(sa)), R(0.8, 1.7), [sa, 0.2, ca], 0.38, Math.abs(a) < 0.45 && u < 0.35 ? 1 : 0);
  }
  for (let i = 0; i < 300; i++) { const sx = Math.random() < 0.5 ? -1 : 1; strand(sx * R(3, 40), -44 + R(-4, 4), 108 + R(-4, 6), sx * R(0.7, 1.2), -R(0.35, 0.9), R(0, 0.3), R(55, 100), R(1.2, 2.2), [sx * 0.4, 0, 1], 0.2, 0.8); }   // moustache
  for (let i = 0; i < 240; i++) { const sx = i % 2 ? -1 : 1; strand(sx * R(16, 68), R(38, 48), R(102, 112), sx * R(0.4, 1), R(0.1, 0.8), R(0.3, 0.9), R(24, 56), R(0.8, 1.5), [0, 0.5, 1], 0.25); }   // wild brows
  for (let i = 0; i < 520; i++) { const a = R(0.65, Math.PI - 0.5) * (Math.random() < 0.5 ? 1 : -1); strand(Math.sin(a) * 114, R(-45, 38), Math.cos(a) * 114 - 18, Math.sin(a) * R(0.4, 0.9), -1, Math.cos(a) * 0.5 - 0.3, R(70, 190), R(1.2, 2.4), [Math.sin(a), 0, Math.cos(a)], 0.35); }   // locks from under the cap
  const hm = hair.done(); hm.renderOrder = 3; head.add(hm);
  // (a soft dark mass under the beard so the room never shows through it)
  const mass = add(new THREE.SphereGeometry(100, 18, 12), new THREE.MeshStandardMaterial({ color: 0x8c8a86, roughness: 1 }), 0, -140, 62, head); mass.scale.set(0.95, 1.35, 0.5);
  // ---- arms in the coat's sleeves, mittened hands ----
  const hands = [], arms = [];
  const mitt = santa ? new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.8 }) : knit(0x4a3a2c, [2, 2]);
  const seg = (r0, r1) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, 1, 14, 1), coat); m.castShadow = true; m.receiveShadow = true; body.add(m); return m; };
  for (const sx of [-1, 1]) {
    const h = add(new THREE.SphereGeometry(68, 14, 10), mitt, sx * 230, 900, 120, body); h.scale.set(0.8, 1.15, 0.6); hands.push(h);
    const thumb = add(new THREE.SphereGeometry(20, 10, 8), mitt, -sx * 46, 14, 20, h); thumb.scale.set(1, 1.5, 1);
    const cuff = add(new THREE.TorusGeometry(50, santa ? 24 : 15, 8, 16), santa ? fur : mitt, 0, 50, 0, h); cuff.rotation.x = Math.PI / 2; cuff.scale.set(1 / 0.8, 1 / 0.6, 1 / 1.15);
    const elbow = add(new THREE.SphereGeometry(70, 14, 10), coat, 0, 0, 0, body), shoulder = add(new THREE.SphereGeometry(88, 16, 12), coat, sx * 236, 1318, 0, body);
    arms.push({ sx, h, up: seg(72, 84), fore: seg(60, 72), elbow, shoulder });
  }
  const yAxis = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Vector3(), D = new THREE.Vector3();
  const place = (m, a, b) => { D.subVectors(b, a); const L = D.length(); m.position.copy(a).addScaledVector(D, 0.5); m.scale.set(1, Math.max(1, L), 1); m.quaternion.setFromUnitVectors(yAxis, D.normalize()); };
  const poseArms = () => {
    for (const a of arms) {
      A.set(a.sx * 236, 1318, 0); B.copy(a.h.position); B.y += 40;
      // two bones of 340 mm: the elbow goes out and back from the straight line between shoulder and wrist
      const d = Math.min(660, A.distanceTo(B)), hgt = Math.sqrt(Math.max(0, 340 * 340 - d * d / 4));
      E.addVectors(A, B).multiplyScalar(0.5); E.x += a.sx * hgt * 0.75; E.z -= hgt * 0.6; E.y -= hgt * 0.25;
      place(a.up, A, E); place(a.fore, E, B); a.elbow.position.copy(E);
    }
  };
  poseArms(); coatM.onBeforeRender = poseArms;
  // an old felling axe, held behind his back (on some visits): a worn ash haft, the head peeking over his shoulder
  const axe = new THREE.Group(); axe.visible = false; body.add(axe);
  const haft = std(0x6a4a2c, 0.7, { emissive: 0x140a04 }), steel = new THREE.MeshStandardMaterial({ color: 0x8a8e94, metalness: 0.85, roughness: 0.38, emissive: 0x101214 });
  const h = add(new THREE.CylinderGeometry(15, 19, 1050, 10), haft, 0, 0, 0, axe);
  const head2 = new THREE.Group(); head2.position.y = 500; axe.add(head2);
  add(new THREE.BoxGeometry(70, 95, 42), steel, 0, 0, 0, head2);                                  // eye and poll
  const blade = new THREE.Shape(); blade.moveTo(0, -40); blade.lineTo(150, -85); blade.quadraticCurveTo(178, 0, 150, 85); blade.lineTo(0, 40);
  const bl = add(new THREE.ExtrudeGeometry(blade, { depth: 14, bevelEnabled: true, bevelThickness: 6, bevelSize: 3, bevelSegments: 1 }), steel, 30, 0, -7, head2);
  const edge = add(new THREE.BoxGeometry(6, 160, 4), new THREE.MeshStandardMaterial({ color: 0xd8dce2, metalness: 1, roughness: 0.15 }), 186, 0, 0, head2); edge.scale.y = 1.02;
  void h; void bl;
  // held in his right hand at the small of his back, slanting up so the head clears his right shoulder
  axe.position.set(205, 1060, -292); axe.rotation.set(0.1, 0, -0.22);
  g.userData = { body, head, hands, axe, poseArms };
  return g;
}

// at a window in the y1 wall (x0..x1 along it, sill height y0, top y1, glass at zGlass, the outside beyond),
// returns an update(dt) to call every frame
// his posing kit: setLean (0 standing .. 1 nose to the glass) and reach, how far in front of his feet
// his frontmost part gets (in his own units), over every way his head turns while he peers
export function poseKit(man) {
  const { body, head, hands } = man.userData;
  const kit = { withAxe: false };
  kit.setLean = (lean) => {
    body.rotation.x = 0.12 + 0.12 * lean;
    for (const [i, h] of hands.entries()) {
      const sx = i ? 1 : -1;
      if (kit.withAxe && i) h.position.set(185, 700, -300);                       // gripping the haft behind his back
      else h.position.set(sx * (230 - 90 * lean), 900 + 650 * lean, 120 + 120 * lean);
    }
    if (man.userData.poseArms) man.userData.poseArms();
  };
  kit.reach = (lean) => {
    const p0 = man.position.clone(), r0 = man.rotation.y;
    let front = 0; const b = new THREE.Box3(), v = new THREE.Vector3();
    const heads = lean ? [-0.19, 0.0, 0.09].flatMap((hx) => [-0.66, 0, 0.66].flatMap((hy) => [-0.13, 0.13].map((hz) => [hx, hy, hz]))) : [[0, 0, 0]];
    for (const hr of heads) {
      kit.setLean(lean); head.rotation.set(...hr); man.updateMatrixWorld(true);
      const inv = new THREE.Matrix4().copy(man.matrixWorld).invert();
      man.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        if (o.isInstancedMesh) { if (!o.boundingBox) o.computeBoundingBox(); b.copy(o.boundingBox); } else { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.copy(o.geometry.boundingBox); }
        for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld).applyMatrix4(inv); front = Math.max(front, v.z); }
      });
    }
    head.rotation.set(0, 0, 0); man.position.copy(p0); man.rotation.y = r0;
    return front;
  };
  return kit;
}

export function addOldMan(parent, { x0, x1, y0, zGlass }) {
  const man = oldMan(), { head, axe } = man.userData;
  let withAxe = false;
  man.rotation.y = Math.PI;                // facing into the room (-z)
  man.visible = false; parent.add(man);
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fogTexture(), transparent: true, opacity: 0, depthWrite: false }));
  fog.rotation.y = Math.PI; parent.add(fog);
  const cx = (x0 + x1) / 2;
  const kit = poseKit(man), setLean = kit.setLean;
  man.rotation.y = Math.PI;
  const reach = (lean) => { man.position.set(0, 0, 0); man.updateMatrixWorld(true); return kit.reach(lean); };
  const front0 = reach(0), front1 = reach(1), clear = 12;      // and a little air between him and the pane
  man.rotation.y = Math.PI;
  const q = (() => { try { return location.search; } catch (e) { return ''; } })();
  const params = /[?&]oldman\b/i.test(q), forceAxe = /[?&]oldman=axe\b/i.test(q);
  let wait = params ? 6 : R(900, 3600), t = 0, phase = 'away', side = 1;
  const z0 = zGlass + clear + front0 + 250;   // standing back from the house, outside
  // so he stands at the window from the waist up whatever the sill height (a little rise of snow outside)
  const lift = Math.max(0, y0 - 650);
  return (dt) => {
    if (phase === 'away') {
      if (document.hidden) return;
      wait -= dt; if (wait > 0) return;
      phase = 'walkIn'; t = 0; side = Math.random() < 0.5 ? -1 : 1; man.visible = true;
      withAxe = forceAxe || Math.random() < 0.35; axe.visible = withAxe; kit.withAxe = withAxe;      // some visits, he's brought the axe
    }
    t += dt;
    const ease = (u) => u * u * (3 - 2 * u);
    let x = cx, z = z0, lean = 0, bob = 0, peer = 0;
    if (phase === 'walkIn') { const u = Math.min(1, t / 5); x = cx + side * 1900 * (1 - ease(u)); bob = Math.abs(Math.sin(t * 4.2)) * 30; man.rotation.y = Math.PI - side * 0.9 * (1 - ease(Math.min(1, u * 1.3))); if (u >= 1) { phase = 'lean'; t = 0; } }
    else if (phase === 'lean') { const u = Math.min(1, t / 1.8); lean = ease(u); if (u >= 1) { phase = 'peer'; t = 0; } }
    else if (phase === 'peer') { lean = 1; peer = 1; if (t > 7.5) { phase = 'back'; t = 0; } }
    else if (phase === 'back') { const u = Math.min(1, t / 1.5); lean = 1 - ease(u); if (u >= 1) { phase = 'walkOut'; t = 0; } }
    else if (phase === 'walkOut') { const u = Math.min(1, t / 5); x = cx - side * 1900 * ease(u); bob = Math.abs(Math.sin(t * 4.2)) * 30; man.rotation.y = Math.PI + side * 0.9 * ease(Math.min(1, u * 2)); if (u >= 1) { phase = 'away'; man.visible = false; wait = R(1800, 4200); } }
    if (phase === 'lean' || phase === 'peer' || phase === 'back') man.rotation.y = Math.PI;
    // leaning in until his nose is nearly on the glass, hands cupped either side of his face
    // never nearer than his frontmost point allows: the glass stays between him and the room
    const zMin = zGlass + clear + front0 + (front1 - front0) * lean;
    man.position.set(x, lift + bob, Math.max(zMin, z - lean * (z - zMin)));
    setLean(lean);
    // peering: slow, suspicious looks round the room, a tilt of the head
    head.rotation.set(-0.1 * lean + (peer ? 0.08 * Math.sin(t * 0.7) : 0), peer ? 0.5 * Math.sin(t * 0.45) + 0.15 * Math.sin(t * 1.7) : 0, peer ? 0.12 * Math.sin(t * 0.33) : 0);
    // his breath on the cold pane
    const breathe = peer ? 0.35 + 0.25 * Math.max(0, Math.sin(t * 1.6)) : 0;
    fog.material.opacity += (breathe - fog.material.opacity) * Math.min(1, dt * (breathe > fog.material.opacity ? 3 : 0.4));
    fog.position.set(x, lift + 1450, zGlass + 6); fog.scale.setScalar(320);
  };
}
