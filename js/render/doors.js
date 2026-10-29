// A door for every room — and every one of them locked from the inside, visibly: the hut's door is barred
// with a timber beam in iron brackets; the nursery's has a chain, a deadbolt and a chair wedged under the
// knob; the living room's a chain, two deadbolts and a slide bolt; the parlour's brass barrel bolts, the key
// left in the lock and a hook-and-eye; the chapel's great doors a beam and a padlocked chain through the ring
// pulls; the anechoic chamber's freezer latches and a padlocked hasp.  Nobody is coming in.
//
// Built in a door's own frame (mm): the wall is the plane z = 0, the door faces +z into the room, the floor
// is y = 0 and the opening is centred on x = 0.  mountDoor() stands it on one of a room's walls.
import * as THREE from 'three';
import { woodMaterial } from './materials.js';

const std = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const IRON = () => std(0x1c1b1a, 0.55, 0.7), BRASS = () => std(0xc9a04a, 0.3, 1), STEEL = () => std(0xb4b8be, 0.35, 0.9);

function kit(g) {
  const box = (w, h, d, x, y, z, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const cyl = (r0, r1, h, x, y, z, m, axis = 'y', seg = 16) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), m); o.position.set(x, y, z);
    if (axis === 'z') o.rotation.x = Math.PI / 2; else if (axis === 'x') o.rotation.z = Math.PI / 2;
    o.castShadow = true; g.add(o); return o;
  };
  const ball = (r, x, y, z, m) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  // a chain of links between two points, sagging a little
  const chain = (a, b, m, r = 9, sag = 60) => {
    const n = Math.max(4, Math.round(a.distanceTo(b) / (r * 2.6)));
    const geo = new THREE.TorusGeometry(r, r * 0.28, 6, 12);
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = a.clone().lerp(b, t); p.y -= sag * 4 * t * (1 - t);
      const q = a.clone().lerp(b, Math.min(1, t + 1 / n)); q.y -= sag * 4 * Math.min(1, t + 1 / n) * (1 - Math.min(1, t + 1 / n));
      const l = new THREE.Mesh(geo, m); l.position.copy(p); l.lookAt(q); l.rotateY(Math.PI / 2); if (i % 2) l.rotateX(Math.PI / 2); l.scale.set(1.35, 1, 1); g.add(l);
    }
  };
  const padlock = (x, y, z, m = BRASS(), s = 1) => {
    box(52 * s, 46 * s, 22 * s, x, y, z, m);
    const sh = new THREE.Mesh(new THREE.TorusGeometry(17 * s, 4.5 * s, 8, 16, Math.PI), STEEL()); sh.position.set(x, y + 23 * s, z); g.add(sh);
    for (const sx of [-1, 1]) cyl(4.5 * s, 4.5 * s, 8 * s, x + sx * 17 * s, y + 23 * s, z, STEEL());
    cyl(6 * s, 6 * s, 3, x, y - 6 * s, z + 11.5 * s, std(0x2a2a2a, 0.5, 0.6), 'z');
  };
  return { box, cyl, ball, chain, padlock };
}

// a casing (architrave) around the opening and a leaf in it; returns the leaf's front face z
function frameAndLeaf(g, W, H, frameM, leafM, { casing = 80, leafT = 44 } = {}) {
  const { box } = kit(g);
  box(casing, H + casing, 30, -W / 2 - casing / 2, (H + casing) / 2, 15, frameM);
  box(casing, H + casing, 30, W / 2 + casing / 2, (H + casing) / 2, 15, frameM);
  box(W + 2 * casing, casing, 30, 0, H + casing / 2, 15, frameM);
  box(W, H, leafT, 0, H / 2, leafT / 2 - 14, leafM);
  return leafT - 14;
}
// raised panels on a leaf: rows of [h, ...] in a column count
function panels(g, W, H, zf, m, rows, cols = 2) {
  const { box } = kit(g);
  const stile = 110, rail = 120, cw = (W - stile * 2 - (cols - 1) * 90) / cols;
  let y = H - rail;
  for (const h of rows) {
    for (let c = 0; c < cols; c++) box(cw - 30, h - 30, 14, -W / 2 + stile + cw / 2 + c * (cw + 90), y - h / 2, zf + 4, m);
    y -= h + rail;
  }
}

export function lockedDoor(style) {
  const g = new THREE.Group(); const K = kit(g);
  if (style === 'cabin') {
    // a ledged-and-braced plank door, strap hinges and a thumb latch, barred with a beam in two iron brackets
    const W = 900, H = 1950;
    const plankM = woodMaterial('walnut', { gloss: 0.05, mm: 700 }); plankM.color = new THREE.Color(0xa88466);
    const frameM = woodMaterial('walnut', { gloss: 0.08, mm: 900 }); frameM.color = new THREE.Color(0x8a6a50);
    K.box(130, H + 130, 60, -W / 2 - 65, (H + 130) / 2, 30, frameM); K.box(130, H + 130, 60, W / 2 + 65, (H + 130) / 2, 30, frameM); K.box(W + 260, 130, 60, 0, H + 65, 30, frameM);
    for (let i = 0; i < 6; i++) K.box(W / 6 - 6, H, 40, -W / 2 + (i + 0.5) * W / 6, H / 2, 6, plankM);
    for (const y of [300, H - 300]) K.box(W - 60, 140, 34, 0, y, 43, plankM);
    const brace = K.box(Math.hypot(W - 160, H - 740), 120, 30, 0, H / 2, 40, plankM); brace.rotation.z = Math.atan2(H - 740, W - 160);
    const iron = IRON();
    for (const y of [300, H - 300]) { K.box(620, 46, 8, -W / 2 + 310, y, 64, iron); K.cyl(16, 16, 60, -W / 2 - 10, y, 30, iron); }
    K.box(16, 120, 10, W / 2 - 90, 1040, 64, iron); K.cyl(9, 9, 80, W / 2 - 90, 1100, 74, iron, 'x');
    // the bar: a rough-hewn beam across the whole door, dropped into brackets on the frame
    const barM = woodMaterial('oak', { gloss: 0.05, mm: 600 }); barM.color = new THREE.Color(0x7a5a3e);
    const bar = K.box(W + 520, 120, 100, 0, 1150, 118, barM); bar.rotation.z = 0.012;
    for (const s of [-1, 1]) {
      const x = s * (W / 2 + 80);
      K.box(150, 230, 12, x, 1150, 64, iron);            // back plate on the frame
      K.box(150, 16, 130, x, 1082, 128, iron);           // the bar rests on this arm
      K.box(150, 150, 14, x, 1150, 190, iron);           // and the lip keeps it in
      for (const dy of [-80, 80]) K.ball(10, x, 1150 + dy, 72, iron);
    }
    return { g, W, H };
  }
  if (style === 'nursery' || style === 'living') {
    const W = 820, H = 2040, white = std(style === 'nursery' ? 0xf4efe6 : 0xf0ebe0, 0.45), brass = BRASS();
    const zf = frameAndLeaf(g, W, H, white, white);
    panels(g, W, H, zf, white, style === 'nursery' ? [520, 1050] : [360, 640, 640], 2);
    const kx = W / 2 - 75;
    K.cyl(32, 32, 10, kx, 1000, zf + 5, brass, 'z'); K.ball(30, kx, 1000, zf + 52, brass); K.cyl(12, 12, 40, kx, 1000, zf + 28, brass, 'z');
    K.box(60, 110, 6, kx, 1000, zf + 2, brass);
    // a chain lock: its track on the leaf, its chain across to the keeper on the casing
    const cy = 1520;
    K.box(150, 26, 12, W / 2 - 150, cy, zf + 6, brass); K.box(40, 60, 16, W / 2 + 40, cy, 38, brass);
    K.chain(new THREE.Vector3(W / 2 - 210, cy, zf + 16), new THREE.Vector3(W / 2 + 40, cy, 48), STEEL(), 8, 45);
    // deadbolts: a thumb-turn rose with its turn set across (thrown)
    for (const y of style === 'nursery' ? [1240] : [1240, 1380]) { K.cyl(30, 30, 10, kx, y, zf + 5, brass, 'z'); K.box(14, 52, 18, kx, y, zf + 18, brass).rotation.z = Math.PI / 2; }
    if (style === 'living') {
      // and a slide bolt shot into its keeper at the top
      K.box(140, 40, 10, W / 2 - 110, H - 160, zf + 5, brass); K.cyl(9, 9, 150, W / 2 - 40, H - 160, zf + 14, STEEL(), 'x'); K.box(40, 44, 22, W / 2 + 40, H - 160, 40, brass);
    }
    if (style === 'nursery') {
      // a little ladder-back chair, tipped back so its top rail is wedged up under the knob
      const ch = new THREE.Group(), cm = std(0xe2c8a0, 0.6), C = kit(ch), th = 0.26, post = 990;
      for (const sx of [-1, 1]) { C.box(34, post, 34, sx * 190, post / 2, 0, cm); C.box(32, 450, 32, sx * 190, 225, 400, cm); }
      C.box(420, 34, 430, 0, 450, 200, std(0xc89a6a, 0.8));
      for (const y of [600, 760, post - 30]) C.box(380, 50, 22, 0, y, 0, cm);
      for (const sx of [-1, 1]) C.box(26, 26, 400, sx * 190, 160, 200, cm);
      ch.rotation.x = -th; ch.position.set(kx - 20, 0, zf + 18 + post * Math.sin(th)); g.add(ch);
    }
    return { g, W, H };
  }
  if (style === 'parlor') {
    const W = 920, H = 2250, oak = woodMaterial('oak', { gloss: 0.55, mm: 900 }); oak.color = new THREE.Color(0x9a7050);
    const rail = woodMaterial('oak', { gloss: 0.6, mm: 600 }); rail.color = new THREE.Color(0x7a5434);
    const brass = BRASS();
    const zf = frameAndLeaf(g, W, H, rail, oak, { casing: 110 });
    panels(g, W, H, zf, rail, [420, 700, 700], 2);
    K.box(W + 320, 70, 70, 0, H + 145, 40, rail); K.box(W + 260, 40, 50, 0, H + 95, 30, rail);
    const kx = W / 2 - 85;
    K.box(70, 200, 8, kx, 1000, zf + 4, brass); K.ball(32, kx, 1040, zf + 50, brass); K.cyl(12, 12, 40, kx, 1040, zf + 26, brass, 'z');
    // the key left in the lock, its bow turned, a tassel hanging from it
    K.cyl(5, 5, 50, kx, 950, zf + 30, brass, 'z'); const bow = new THREE.Mesh(new THREE.TorusGeometry(16, 4, 8, 16), brass); bow.position.set(kx, 950, zf + 60); bow.rotation.y = Math.PI / 2; g.add(bow);
    K.cyl(2, 2, 90, kx, 895, zf + 60, std(0x8a1a1a, 0.9)); K.cyl(9, 3, 40, kx, 835, zf + 60, std(0x8a1a1a, 0.9));
    // brass barrel bolts shot top and bottom
    for (const [y, dir] of [[H - 140, 1], [140, -1]]) {
      K.box(60, 170, 10, W / 2 - 70, y, zf + 5, brass); K.cyl(11, 11, 230, W / 2 - 70, y + dir * 40, zf + 20, brass);
      K.cyl(6, 6, 50, W / 2 - 46, y, zf + 20, brass, 'x'); K.ball(9, W / 2 - 22, y, zf + 20, brass);
    }
    // and a hook-and-eye from the casing
    K.cyl(4, 4, 140, W / 2 + 10, 1500, zf + 26, brass, 'x').rotation.y = 0.05;
    const eye = new THREE.Mesh(new THREE.TorusGeometry(12, 3, 6, 12), brass); eye.position.set(W / 2 + 85, 1500, 46); g.add(eye);
    return { g, W, H };
  }
  if (style === 'chapel') {
    // great arched double doors in a stone surround, nail-studded and ring-pulled: barred and chained
    const W = 2000, H = 2700, R = W / 2, T = 90;
    const oak = woodMaterial('oak', { gloss: 0.15, mm: 700 }); oak.color = new THREE.Color(0x6a4a30);
    const stone = std(0x8a8478, 0.9), iron = IRON();
    const shape = new THREE.Shape(); shape.moveTo(-R, 0); shape.lineTo(R, 0); shape.lineTo(R, H); shape.absarc(0, H, R, 0, Math.PI, false); shape.lineTo(-R, 0);
    const leaf = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 32 }), oak); leaf.position.z = -30; leaf.castShadow = leaf.receiveShadow = true; g.add(leaf);
    const sur = new THREE.Shape(); sur.moveTo(-R - 260, 0); sur.lineTo(R + 260, 0); sur.lineTo(R + 260, H); sur.absarc(0, H, R + 260, 0, Math.PI, false); sur.lineTo(-R - 260, 0);
    const hole = new THREE.Path(); hole.moveTo(-R, 0); hole.lineTo(R, 0); hole.lineTo(R, H); hole.absarc(0, H, R, 0, Math.PI, false); hole.lineTo(-R, 0); sur.holes.push(hole);
    const s = new THREE.Mesh(new THREE.ExtrudeGeometry(sur, { depth: 120, bevelEnabled: false, curveSegments: 32 }), stone); s.position.z = -40; s.receiveShadow = true; g.add(s);
    const zf = T - 30;
    K.box(24, H + R, 10, 0, (H + R) / 2, zf + 4, std(0x1a120c, 1));          // the meeting line of the two leaves
    for (let y = 300; y < H + R - 300; y += 220) for (let x = -R + 140; x < R; x += 220) { if (Math.abs(x) < 60) continue; if (y > H && Math.hypot(x, y - H) > R - 120) continue; K.ball(14, x, y, zf + 4, iron); }
    for (const y of [500, H - 300]) for (const sx of [-1, 1]) K.box(R - 120, 70, 10, sx * (R / 2 + 30), y, zf + 6, iron);
    // ring pulls, a chain wound through both and a padlock
    for (const sx of [-1, 1]) { K.cyl(40, 40, 16, sx * 170, 1250, zf + 8, iron, 'z'); const ring = new THREE.Mesh(new THREE.TorusGeometry(75, 11, 8, 24), iron); ring.position.set(sx * 170, 1180, zf + 26); g.add(ring); }
    K.chain(new THREE.Vector3(-170, 1110, zf + 34), new THREE.Vector3(170, 1110, zf + 34), STEEL(), 13, 90);
    K.chain(new THREE.Vector3(-150, 1170, zf + 44), new THREE.Vector3(150, 1150, zf + 44), STEEL(), 13, 120);
    K.padlock(0, 980, zf + 50, iron, 2.2);
    // the beam: a great squared timber across both leaves, in iron hoops on the surround
    const beamM = woodMaterial('oak', { gloss: 0.05, mm: 600 }); beamM.color = new THREE.Color(0x5a3e28);
    K.box(W + 900, 220, 180, 0, 1600, zf + 210, beamM);
    for (const sx of [-1, 1]) { const x = sx * (R + 170); K.box(200, 380, 20, x, 1600, 90, iron); K.box(200, 24, 250, x, 1478, 200, iron); K.box(200, 260, 24, x, 1600, 330, iron); }
    return { g, W, H: H + R };
  }
  if (style === 'anechoic') {
    // a heavy steel door with a seal frame and a lever, freezer-style latches clamped and a padlocked hasp
    const W = 1000, H = 2100, steelM = std(0x5a6068, 0.5, 0.5), grey = std(0x3a3e44, 0.6, 0.5), chrome = STEEL(), yellow = std(0xd8b020, 0.5);
    K.box(160, H + 160, 120, -W / 2 - 80, (H + 160) / 2, 60, grey); K.box(160, H + 160, 120, W / 2 + 80, (H + 160) / 2, 60, grey); K.box(W + 320, 160, 120, 0, H + 80, 60, grey);
    K.box(W, H, 110, 0, H / 2, 55, steelM);
    const zf = 110;
    K.box(W - 140, H - 140, 8, 0, H / 2, zf + 4, std(0x666c74, 0.45, 0.5));
    for (const y of [400, H / 2, H - 400]) K.cyl(26, 26, 160, -W / 2 - 10, y, zf - 20, chrome);
    const kx = W / 2 - 110;
    K.cyl(30, 30, 30, kx, 1050, zf + 15, chrome, 'z'); K.box(220, 30, 30, kx - 90, 1050, zf + 40, chrome);
    // two latches clamped shut, their levers down
    for (const y of [600, 1500]) {
      K.box(80, 140, 30, W / 2 + 70, y, 136, chrome);
      const lev = K.box(40, 220, 26, W / 2 - 40, y - 70, zf + 30, chrome); lev.rotation.z = -0.2;
      K.box(60, 50, 36, W / 2 - 60, y + 20, zf + 18, chrome);
    }
    // the hasp: a staple on the frame, a strap over it, a padlock through it
    K.box(70, 90, 30, W / 2 + 80, 1250, 136, chrome); K.box(240, 50, 10, W / 2 - 40, 1250, 150, chrome);
    K.padlock(W / 2 + 80, 1196, 168, yellow, 1.3);
    K.box(W - 300, 70, 6, 0, H - 150, zf + 8, std(0xd8b020, 0.5)).castShadow = false;
    return { g, W, H };
  }
  return null;
}

// stand a door on a room wall: wall 'y0' | 'y1' | 'x0' | 'x1', u along the wall (room x for the y walls,
// room y for the x walls), mm; RX, RY the room's plan
export function mountDoor(parent, RX, RY, door, wall, u) {
  const g = door.g;
  if (wall === 'y0') { g.position.set(u, 0, 0); g.rotation.y = 0; }
  else if (wall === 'y1') { g.position.set(u, 0, RY); g.rotation.y = Math.PI; }
  else if (wall === 'x0') { g.position.set(0, 0, u); g.rotation.y = Math.PI / 2; }
  else { g.position.set(RX, 0, u); g.rotation.y = -Math.PI / 2; }
  parent.add(g);
  return g;
}

// the anechoic chamber has no door at all: a steel ladder up the wall to a round hatch in the ceiling,
// its hand wheel spun shut, its dogs clamped down, and the wheel chained and padlocked to the ladder.
// Built in room space (mm): x along the wall, the ladder standing off the y0 wall, the ceiling at RZ.
export function sealedHatch(x, RZ) {
  const g = new THREE.Group(); const K = kit(g);
  const steel = std(0x6a7078, 0.45, 0.7), chrome = STEEL(), yellow = std(0xd8b020, 0.5), black = std(0x1a1a1a, 0.6);
  const lz = 220, hz = 720, rr = 460;
  // the ladder: two rails, rungs every 280 mm, stand-off brackets to the wall, bowed out at the top to the hatch
  for (const sx of [-1, 1]) {
    K.box(50, RZ - 420, 18, x + sx * 230, (RZ - 420) / 2, lz, steel);
    const top = K.box(50, 560, 18, x + sx * 230, RZ - 420 + 200, lz + 180, steel); top.rotation.x = -0.72;
    for (const y of [600, 2400, 4200]) K.box(40, 30, lz, x + sx * 230, y, lz / 2, steel);
  }
  for (let y = 280; y < RZ - 420; y += 280) K.cyl(16, 16, 460, x, y, lz, chrome, 'x');
  // the hatch collar up through the ceiling foam, and the hatch: a dished steel lid with six dogs, a hand wheel
  K.cyl(rr + 60, rr + 60, 1100, x, RZ + 300, hz, steel, 'y', 40).material = std(0x4a4e54, 0.6, 0.6);
  const lid = K.cyl(rr, rr, 60, x, RZ - 270, hz, steel, 'y', 40);
  K.cyl(rr + 70, rr + 70, 40, x, RZ - 230, hz, std(0x4a4e54, 0.6, 0.6), 'y', 40);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2, px = x + Math.cos(a) * (rr + 30), pz = hz + Math.sin(a) * (rr + 30);
    const dog = K.box(110, 50, 60, px, RZ - 310, pz, chrome); dog.rotation.y = -a;
  }
  // stripes round the rim, so you can't miss it
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; const s = K.box(150, 10, 40, x + Math.cos(a) * (rr - 60), RZ - 302, hz + Math.sin(a) * (rr - 60), k % 2 ? yellow : black); s.rotation.y = -a; s.castShadow = false; }
  // the hand wheel under the lid, on its spindle
  K.cyl(30, 30, 160, x, RZ - 380, hz, chrome);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(240, 18, 10, 40), std(0xb03020, 0.45, 0.4)); wheel.rotation.x = Math.PI / 2; wheel.position.set(x, RZ - 460, hz); wheel.castShadow = true; g.add(wheel);
  for (let k = 0; k < 3; k++) { const sp = K.box(480, 24, 24, x, RZ - 460, hz, chrome); sp.rotation.y = (k / 3) * Math.PI; }
  // chained to the ladder's top rung and padlocked
  K.chain(new THREE.Vector3(x + 150, RZ - 470, hz - 180), new THREE.Vector3(x + 120, RZ - 640, lz + 30), STEEL(), 11, 40);
  K.chain(new THREE.Vector3(x - 160, RZ - 470, hz - 170), new THREE.Vector3(x - 120, RZ - 640, lz + 30), STEEL(), 11, 40);
  K.padlock(x, RZ - 700, lz + 40, yellow, 1.4);
  void lid;
  return g;
}
