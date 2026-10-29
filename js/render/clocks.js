// Clocks for the rooms, all showing the real local time.  Each builder returns { g, tick(now) }:
// g is a group whose origin sits at the middle of the clock's back (or the bottom of its back,
// for standing clocks), with the dial facing local +z.
import * as THREE from 'three';
import { woodMaterial } from './materials.js';

const brassM = () => new THREE.MeshStandardMaterial({ color: 0xd2a84e, metalness: 1, roughness: 0.22 });
const box = (g, w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

// hour and minute angles (radians, clockwise from twelve) for a Date
function angles(now) {
  const s = now.getSeconds() + now.getMilliseconds() / 1000, m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
  return { h: h / 12 * Math.PI * 2, m: m / 60 * Math.PI * 2, s: s / 60 * Math.PI * 2 };
}
// a painted dial on a canvas: style { bg, bg2, ink, font, numerals: 'roman'|'arabic', ring, text, gilt }
function dialTexture(o) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.scale(2, 2);
  const gr = x.createRadialGradient(256, 230, 40, 256, 256, 256); gr.addColorStop(0, o.bg); gr.addColorStop(1, o.bg2 || o.bg);
  x.fillStyle = gr; x.beginPath(); x.arc(256, 256, 254, 0, 7); x.fill();
  x.strokeStyle = o.ink; x.fillStyle = o.ink;
  if (o.ring !== false) { x.lineWidth = 3; x.beginPath(); x.arc(256, 256, 236, 0, 7); x.stroke(); x.beginPath(); x.arc(256, 256, 214, 0, 7); x.stroke(); }
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, r0 = i % 5 ? 224 : 214; x.lineWidth = i % 5 ? 2 : 6;
    if (o.ticks === 'dots' && i % 5) continue;
    if (o.ticks === 'minutes') { x.lineWidth = i % 5 ? 2.5 : 4; x.beginPath(); x.moveTo(256 + Math.sin(a) * 236, 256 - Math.cos(a) * 236); x.lineTo(256 + Math.sin(a) * (i % 5 ? 226 : 220), 256 - Math.cos(a) * (i % 5 ? 226 : 220)); x.stroke(); continue; }
    x.beginPath(); x.moveTo(256 + Math.sin(a) * r0, 256 - Math.cos(a) * r0); x.lineTo(256 + Math.sin(a) * 236, 256 - Math.cos(a) * 236); x.stroke();
  }
  x.font = o.font || 'bold 44px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, n = o.numerals === 'arabic' ? String(i || 12) : roman[i], r = o.numR || 176;
    x.save(); x.translate(256 + Math.sin(a) * r, 256 - Math.cos(a) * r); if (o.numerals !== 'arabic' && !o.upright) x.rotate(a); x.fillText(n, 0, 4); x.restore();
  }
  if (o.text) { x.font = o.textFont || 'italic 22px Georgia, serif'; x.fillText(o.text, 256, o.textY || 330); }
  if (o.extra) o.extra(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
// spade hands as flat shapes on pivots
function hands(g, at, z, hourL, minL, mat, style = 'spade') {
  const hand = (len, w) => {
    const sh = new THREE.Shape();
    if (style === 'baton') { sh.moveTo(-w * 0.5, -len * 0.18); sh.lineTo(w * 0.5, -len * 0.18); sh.lineTo(w * 0.4, len); sh.lineTo(-w * 0.4, len); }
    else { sh.moveTo(-w * 0.35, -len * 0.15); sh.lineTo(w * 0.35, -len * 0.15); sh.lineTo(w * 0.25, len * 0.7); sh.lineTo(w, len * 0.78); sh.lineTo(0, len); sh.lineTo(-w, len * 0.78); sh.lineTo(-w * 0.25, len * 0.7); }
    sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat); m.castShadow = true;
    const p = new THREE.Group(); p.add(m); p.position.copy(at); g.add(p); return p;
  };
  const h = hand(hourL, hourL * 0.12), m = hand(minL, minL * 0.07);
  h.position.z = at.z + z; m.position.z = at.z + z + 3;
  return { h, m };
}
function setHands(H, now) { const a = angles(now); H.h.rotation.z = -a.h; H.m.rotation.z = -a.m; return a; }
function dial(g, tex, r, at, rough = 0.35) {
  const d = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: rough }));
  d.position.copy(at); g.add(d); return d;
}

// ---------------------------------------------------------------- the hut's regulator
// After an oak electric master clock: a plain oak case with a stepped cornice and base, a door
// glazed almost its whole height, a big white dial in a brass bezel with bold numerals and a small
// seconds dial, a toothed brass count wheel behind it that steps one tooth per beat, and a long
// pendulum with a big brass bob over a beat scale.  No driving weight: it is wound by a key.
export function regulator() {
  const g = new THREE.Group();
  const oak = woodMaterial('oak', { gloss: 0.45, mm: 700 }); oak.color = new THREE.Color(0xe6c4a0);
  const inside = new THREE.MeshStandardMaterial({ color: 0x15100b, roughness: 0.85 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xcfae62, metalness: 1, roughness: 0.32 });
  const W = 460, H = 1120, D = 170;
  const b = (w, h, d, x, y, z, m = oak) => box(g, w, h, d, x, y, z, m);
  b(W - 40, H - 40, 10, 0, 0, 5, inside);                                      // back, dark inside the case
  for (const s of [-1, 1]) b(32, H, D, s * (W / 2 - 16), 0, D / 2);            // sides
  b(W, 32, D, 0, H / 2 - 16, D / 2); b(W, 32, D, 0, -H / 2 + 16, D / 2);
  // cornice: a deep, stepped top that overhangs front and sides; and a moulded base
  b(W + 34, 26, D + 20, 0, H / 2 + 13, (D + 20) / 2);
  b(W + 76, 58, D + 44, 0, H / 2 + 55, (D + 44) / 2);
  const chamf = b(W + 76, 30, 34, 0, H / 2 + 34, D + 34); chamf.rotation.x = -0.6;
  b(W + 30, 24, D + 16, 0, -H / 2 - 12, (D + 16) / 2);
  b(W + 56, 34, D + 34, 0, -H / 2 - 41, (D + 34) / 2);
  // front: broad stiles of the case, the door's narrow frame, the glass
  const st = 62, df = 22, gw = W - 2 * st - 2 * df;
  for (const s of [-1, 1]) { b(st, H, 22, s * (W / 2 - st / 2), 0, D - 11); b(df, H - 64, 26, s * (gw / 2 + df / 2), 0, D - 9); }
  b(W - 2 * st, 32, 22, 0, H / 2 - 16, D - 11); b(W - 2 * st, 40, 26, 0, -H / 2 + 20, D - 9);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(gw, H - 72), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, transparent: true, opacity: 0.1, depthWrite: false }));
  glass.position.set(0, -4, D - 8); g.add(glass);
  const esc = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 3, 12), brass); esc.rotation.z = Math.PI / 2; esc.position.set(-W / 2 - 1, -60, D / 2 + 30); esc.scale.set(1, 1, 2.2); g.add(esc);
  const key = b(3, 3, 46, -W / 2 - 4, -60, D / 2 + 30, new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 })); key.rotation.y = 0.5;
  // the dial: white, bold black numerals, small seconds above the centre, a winding hole
  const Rd = 150, at = new THREE.Vector3(0, H / 2 - 52 - Rd, D - 38);
  const tex = dialTexture({ bg: '#f7f2e6', bg2: '#ebe4d2', ink: '#141210', numerals: 'arabic', ring: false, ticks: 'minutes',
    font: '900 74px "Futura","Avenir Next","Century Gothic","Helvetica Neue",Arial,sans-serif', numR: 184,
    extra: (x) => {
      x.lineWidth = 2; x.beginPath(); x.arc(256, 168, 36, 0, 7); x.stroke();
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r0 = i % 15 ? 31 : 27; x.lineWidth = i % 15 ? 1 : 2; x.beginPath(); x.moveTo(256 + Math.sin(a) * r0, 168 - Math.cos(a) * r0); x.lineTo(256 + Math.sin(a) * 36, 168 - Math.cos(a) * 36); x.stroke(); }
      const hx = 256 + Math.sin(2.35) * 118, hy = 256 - Math.cos(2.35) * 118;
      const gr = x.createRadialGradient(hx, hy, 2, hx, hy, 13); gr.addColorStop(0, '#000'); gr.addColorStop(0.7, '#2a2622'); gr.addColorStop(1, '#bdb5a2'); x.fillStyle = gr; x.beginPath(); x.arc(hx, hy, 13, 0, 7); x.fill();
    } });
  dial(g, tex, Rd, at, 0.3);
  const bez = new THREE.Mesh(new THREE.CylinderGeometry(Rd + 12, Rd + 14, 22, 72, 1, true), brass); bez.rotation.x = Math.PI / 2; bez.position.set(at.x, at.y, at.z + 4); g.add(bez);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(Rd + 8, 5, 10, 72), brass); lip.position.set(at.x, at.y, at.z + 15); g.add(lip);
  const Hd = hands(g, at, 8, 92, 136, new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0.5, roughness: 0.45 }));
  const boss = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 8, 16), new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0.6, roughness: 0.4 })); boss.rotation.x = Math.PI / 2; boss.position.set(at.x, at.y, at.z + 16); g.add(boss);
  const secAt = new THREE.Vector3(at.x, at.y + (256 - 168) / 256 * Rd, at.z + 2);
  const sec = new THREE.Mesh(new THREE.BoxGeometry(1.6, 22, 0.8), new THREE.MeshStandardMaterial({ color: 0x141210 })); sec.geometry.translate(0, 8, 0);
  const sp = new THREE.Group(); sp.position.copy(secAt); sp.add(sec); g.add(sp);
  // the count wheel: a brass wheel with fine teeth and six spokes, half hidden behind the dial
  const Rw = 132, NT = 120, wh = new THREE.Group(); wh.position.set(10, at.y - 172, D - 74); g.add(wh);
  const rim = new THREE.Shape();
  for (let i = 0; i <= NT * 2; i++) { const a = i / (NT * 2) * Math.PI * 2, r = i % 2 ? Rw - 4 : Rw; if (i) rim.lineTo(Math.cos(a) * r, Math.sin(a) * r); else rim.moveTo(r, 0); }
  const holeP = new THREE.Path(); holeP.absarc(0, 0, Rw - 18, 0, Math.PI * 2, true); rim.holes.push(holeP);
  const rimM = new THREE.Mesh(new THREE.ExtrudeGeometry(rim, { depth: 3, bevelEnabled: false, curveSegments: 4 }), brass); rimM.castShadow = true; wh.add(rimM);
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(Rw - 24, 11, 3), brass); s.geometry.translate((Rw - 24) / 2 + 4, 0, 1.5); s.rotation.z = k / 6 * Math.PI * 2; wh.add(s); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 10, 16), brass); hub.rotation.x = Math.PI / 2; hub.position.z = 4; wh.add(hub);
  // pendulum: flat steel rod, a big brass bob, a pointer over the beat scale
  const pivotY = at.y + 30, bobY = -H / 2 + 250, Lp = pivotY - bobY;
  const pend = new THREE.Group(); pend.position.set(0, pivotY, D - 104); g.add(pend);
  const steel = new THREE.MeshStandardMaterial({ color: 0x8c8f93, metalness: 1, roughness: 0.35 });
  const rod = new THREE.Mesh(new THREE.BoxGeometry(14, Lp, 2), steel); rod.position.y = -Lp / 2; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(116, 40, 20), brass); bob.scale.set(1, 1, 0.16); bob.position.y = -Lp; bob.castShadow = true; pend.add(bob);
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 22, 10), steel); nut.position.y = -Lp - 126; pend.add(nut);
  const ptr = new THREE.Mesh(new THREE.BoxGeometry(2.5, 70, 1.5), steel); ptr.position.set(0, -Lp - 168, 4); pend.add(ptr);
  const sc = document.createElement('canvas'); sc.width = 512; sc.height = 96; const sx = sc.getContext('2d');
  sx.fillStyle = '#f2efe6'; sx.fillRect(0, 0, 512, 96); sx.strokeStyle = sx.fillStyle = '#1a1a1a';
  for (let i = -12; i <= 12; i++) { const px = 256 + i * 19; sx.lineWidth = i % 3 ? 1.5 : 3; sx.beginPath(); sx.moveTo(px, 6); sx.lineTo(px, i % 3 ? 30 : 44); sx.stroke(); }
  sx.font = 'bold 24px Arial, sans-serif'; sx.textAlign = 'center'; for (const [v, i] of [['120°', -12], ['60°', -6], ['0', 0], ['60°', 6], ['120°', 12]]) sx.fillText(v, 256 + i * 19, 76);
  const stx = new THREE.CanvasTexture(sc); stx.colorSpace = THREE.SRGBColorSpace;
  const scale = new THREE.Mesh(new THREE.PlaneGeometry(150, 28), new THREE.MeshStandardMaterial({ map: stx, roughness: 0.6 })); scale.position.set(0, pivotY - Lp - 218, D - 100); g.add(scale);
  const pw = Math.sqrt(9.81 / (Lp / 1000 * 0.94));      // compound pendulum: the heavy bob keeps L_eff near the bob centre
  const half = Math.PI / pw;                             // seconds per beat
  return {
    g,
    tick(now, t) {
      setHands(Hd, now);
      sp.rotation.z = -Math.floor(now.getSeconds()) / 60 * Math.PI * 2;
      pend.rotation.z = 0.045 * Math.sin(pw * t);
      // the count wheel steps one tooth per beat, with a quick snap at the end of each swing
      const beats = t / half, k = Math.floor(beats), f = Math.min(1, (beats - k) / 0.08);
      wh.rotation.z = -((k + f * f * (3 - 2 * f)) % NT) / NT * Math.PI * 2;
    },
  };
}

// mount a clock (origin at its back, face +z) on a wall of a room built in room space
// (x, height, room y) and mirrored into the scene: the inner group cancels that mirror.
// wall: 'y1' | 'y0' | 'x0' | 'x1'; u: position along the wall (mm); h: height of the origin (mm)
export function wallMount(parent, dims, clock, wall, u, h, standoff = 4) {
  const [RX, RY] = dims;
  const um = new THREE.Group(); um.scale.z = -1; parent.add(um);
  const m = clock.g;
  if (wall === 'y1') { m.position.set(u, h, -(RY - standoff)); m.rotation.y = 0; }
  else if (wall === 'y0') { m.position.set(u, h, -standoff); m.rotation.y = Math.PI; }
  else if (wall === 'x0') { m.position.set(standoff, h, -u); m.rotation.y = Math.PI / 2; }
  else { m.position.set(RX - standoff, h, -u); m.rotation.y = -Math.PI / 2; }
  um.add(m);
  return clock;
}

// ---------------------------------------------------------------- Black Forest cuckoo clock (the nursery)
// a little carved chalet: gabled roof, a door the bird comes out of on the hour and half hour
// (silently: the nursery is asleep), a leaf pendulum and two pine-cone weights on chains.
export function cuckoo() {
  const g = new THREE.Group();
  const wood = woodMaterial('walnut', { gloss: 0.25, mm: 300 }); wood.color = new THREE.Color(0xb08a66);
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.7 });
  const leaf = new THREE.MeshStandardMaterial({ color: 0x5a3c22, roughness: 0.6 });
  const W = 250, H = 290, D = 130;
  box(g, W, H, D, 0, 0, D / 2, wood);
  for (const s of [-1, 1]) { const r = box(g, W * 0.62, 18, D + 40, s * W * 0.27, H / 2 + 52, D / 2 + 6, dark); r.rotation.z = -s * 0.62; }
  const gable = new THREE.Shape(); gable.moveTo(-W / 2, 0); gable.lineTo(W / 2, 0); gable.lineTo(0, 95); gable.closePath();
  const gm = new THREE.Mesh(new THREE.ExtrudeGeometry(gable, { depth: D - 10, bevelEnabled: false }), wood); gm.position.set(0, H / 2, 5); g.add(gm);
  // carved leaves and a bird on the ridge
  for (let i = 0; i < 9; i++) { const a = (i / 8) * Math.PI; const l = new THREE.Mesh(new THREE.SphereGeometry(26, 10, 6), leaf); l.scale.set(1, 0.45, 0.25); l.position.set(Math.cos(a) * 150, -H / 2 + 10 - Math.sin(a) * 40, D + 6); l.rotation.z = a + Math.PI / 2; g.add(l); }
  const birdTop = new THREE.Mesh(new THREE.SphereGeometry(20, 12, 8), leaf); birdTop.scale.set(1.4, 0.8, 0.6); birdTop.position.set(0, H / 2 + 108, D / 2); g.add(birdTop);
  // door and the cuckoo behind it
  const doorAt = new THREE.Vector3(0, H / 2 - 30, D + 1);
  box(g, 58, 70, 4, 0, doorAt.y, D, dark);
  const doors = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 26, doorAt.y, D + 3); const d = box(p, 26, 64, 4, -s * 13, 0, 2, wood); d.castShadow = false; g.add(p); doors.push([p, s]); }
  const bird = new THREE.Group(); bird.position.set(0, doorAt.y - 6, D - 30); g.add(bird);
  const bm = new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(16, 12, 8), bm); body.scale.set(0.8, 0.8, 1.3); bird.add(body);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(4, 14, 6), new THREE.MeshStandardMaterial({ color: 0xd8a030 })); beak.rotation.x = Math.PI / 2; beak.position.set(0, 4, 24); bird.add(beak);
  // dial: carved bone numerals on a dark wood face
  const at = new THREE.Vector3(0, -40, D + 2);
  dial(g, dialTexture({ bg: '#3a2416', bg2: '#2a170c', ink: '#f3e8cc', numerals: 'arabic', font: 'bold 78px Georgia, serif', numR: 172, ring: false }), 72, at, 0.6);
  const Hd = hands(g, at, 3, 44, 62, new THREE.MeshStandardMaterial({ color: 0xefe2c4, roughness: 0.5 }));
  // pendulum and pine-cone weights
  const pend = new THREE.Group(); pend.position.set(0, -H / 2, D * 0.5); g.add(pend);
  const Lp = 250;
  const rod = new THREE.Mesh(new THREE.BoxGeometry(5, Lp, 2), dark); rod.position.y = -Lp / 2; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(32, 14, 8), leaf); bob.scale.set(0.9, 1.25, 0.2); bob.position.y = -Lp; pend.add(bob);
  const pw = Math.sqrt(9.81 / (Lp / 1000 * 0.9));
  const chain = new THREE.MeshBasicMaterial({ color: 0x8a7a5a });
  const coneG = new THREE.CylinderGeometry(20, 12, 120, 10, 6);
  { const p = coneG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 + 0.18 * Math.sin(y * 0.35); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } coneG.computeVertexNormals(); }
  const cones = [];
  for (const s of [-1, 1]) {
    const L = s < 0 ? 420 : 560;
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, L, 4), chain); c.position.set(s * 60, -H / 2 - L / 2, D * 0.4); g.add(c);
    const pc = new THREE.Mesh(coneG, dark); pc.position.set(s * 60, -H / 2 - L - 60, D * 0.4); pc.castShadow = true; g.add(pc); cones.push(pc);
  }
  return {
    g,
    tick(now, t) {
      setHands(Hd, now); pend.rotation.z = 0.12 * Math.sin(pw * t);
      // the bird comes out for a few seconds on the hour (and a moment on the half hour)
      const m = now.getMinutes(), s = now.getSeconds() + now.getMilliseconds() / 1000;
      const dur = m === 0 ? Math.min(12, (now.getHours() % 12 || 12) * 1.2) : m === 30 ? 1.5 : 0;
      const out = dur && s < dur + 0.6 ? Math.min(1, s / 0.3, (dur + 0.6 - s) / 0.3) * (0.75 + 0.25 * Math.abs(Math.sin(s * Math.PI / 1.2))) : 0;
      bird.position.z = D - 30 + out * 52;
      for (const [p, sg] of doors) p.rotation.y = sg * Math.min(1, out * 3) * 1.6;
    },
  };
}

// ---------------------------------------------------------------- a tambour ("Napoleon hat") mantel clock (the living room)
// stands on furniture: origin at the bottom of its back
export function mantel() {
  const g = new THREE.Group();
  const mah = woodMaterial('rosewood', { gloss: 0.85, mm: 300 }), brass = brassM();
  const W = 420, H = 230, D = 120;
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, 0); sh.lineTo(-W / 2, 50);
  sh.bezierCurveTo(-W / 2 + 20, 120, -100, 90, -78, 170); sh.bezierCurveTo(-60, 240, 60, 240, 78, 170);
  sh.bezierCurveTo(100, 90, W / 2 - 20, 120, W / 2, 50); sh.lineTo(W / 2, 0); sh.closePath();
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: true, bevelThickness: 5, bevelSize: 5, bevelSegments: 3, curveSegments: 24 }), mah);
  body.position.y = 12; body.castShadow = true; g.add(body);
  box(g, W + 30, 14, D + 20, 0, 6, D / 2, mah);
  for (const s of [-1, 1]) { const ft = new THREE.Mesh(new THREE.SphereGeometry(10, 10, 6), brass); ft.position.set(s * (W / 2 - 10), 0, D / 2); ft.scale.y = 0.6; g.add(ft); }
  const at = new THREE.Vector3(0, 140, D + 8);
  dial(g, dialTexture({ bg: '#fbf7ee', bg2: '#ece3cf', ink: '#1d1815', numerals: 'arabic', font: 'bold 60px Georgia, serif', numR: 176 }), 66, at, 0.25);
  const bez = new THREE.Mesh(new THREE.TorusGeometry(70, 6, 10, 48), brass); bez.position.copy(at); bez.position.z += 1; g.add(bez);
  const Hd = hands(g, at, 2, 38, 56, new THREE.MeshStandardMaterial({ color: 0x1b1b22, metalness: 0.7, roughness: 0.4 }));
  return { g, tick(now) { setHands(Hd, now); } };
}

// ---------------------------------------------------------------- longcase clock (the parlour)
// standing: origin at the floor under the back. A painted arch dial with the real phase of the
// moon in the arch, a seconds hand, and a one-metre seconds pendulum seen through the trunk window.
function moonPhase(now) {
  const days = (now.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  return ((days / 29.530588853) % 1 + 1) % 1;              // 0 new, 0.5 full
}
export function longcase() {
  const g = new THREE.Group();
  const oak = woodMaterial('walnut', { gloss: 0.6, mm: 700 }), brass = brassM();
  const D = 260, bw = 520, tw = 420, hw = 500;
  box(g, bw, 520, D, 0, 260, D / 2, oak);                             // plinth
  box(g, bw + 30, 30, D + 30, 0, 15, D / 2 + 5, oak); box(g, bw + 20, 30, D + 20, 0, 530, D / 2 + 5, oak);
  box(g, tw, 1060, D - 40, 0, 545 + 530, (D - 40) / 2, oak);          // trunk
  box(g, hw + 30, 30, D + 30, 0, 1620, D / 2 + 5, oak);
  box(g, hw, 600, D + 10, 0, 1635 + 300, (D + 10) / 2, oak);          // hood
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(hw / 2, hw / 2, D + 10, 32, 1, false, -Math.PI / 2, Math.PI), oak);
  arch.rotation.x = Math.PI / 2; arch.position.set(0, 2235, (D + 10) / 2); arch.scale.set(1, 1, 0.5); g.add(arch);
  for (const s of [-1, 0, 1]) { const fi = new THREE.Mesh(new THREE.SphereGeometry(s ? 18 : 24, 12, 8), brass); fi.scale.y = 1.6; fi.position.set(s * (hw / 2 - 10), s ? 2260 : 2510, D / 2); g.add(fi); }
  // trunk door with a glass window onto the pendulum
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false });
  const winBack = box(g, 220, 700, 4, 0, 1100, 30, new THREE.MeshStandardMaterial({ color: 0x1a120c, roughness: 0.9 })); winBack.castShadow = false;
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(220, 700), glassM); gl.position.set(0, 1100, D - 38); g.add(gl);
  // cut the trunk front away behind the window: draw a frame on top of a transparent face
  g.children.find((c) => c.geometry && c.geometry.parameters && c.geometry.parameters.height === 1060).material = [oak, oak, oak, oak, new THREE.MeshStandardMaterial({ visible: false }), oak];
  for (const [w, h, x, y] of [[tw, 180, 0, 655], [tw, 180, 0, 1515], [100, 1060, -tw / 2 + 50, 1075], [100, 1060, tw / 2 - 50, 1075]]) box(g, w, h, 22, x, y, D - 40 - 11, oak);
  const pend = new THREE.Group(); pend.position.set(0, 1600, 90); g.add(pend);
  const Lp = 994;      // the seconds pendulum: a two-second period
  const rod = new THREE.Mesh(new THREE.BoxGeometry(10, Lp - 60, 3), new THREE.MeshStandardMaterial({ color: 0x3b2a1a })); rod.position.y = -(Lp - 60) / 2; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(70, 32, 16), brass); bob.scale.set(1, 1, 0.22); bob.position.y = -Lp + 40; pend.add(bob);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 260, 20), brass); w.position.set(s * 110, 1300 + s * 60, 90); g.add(w); }
  // the arch dial: brass with a silvered chapter ring, painted moon disc showing in the arch
  const at = new THREE.Vector3(0, 1900, D + 12);
  const tex = dialTexture({ bg: '#e8e4da', bg2: '#c9c3b5', ink: '#1a1612', font: 'bold 50px Georgia, serif', numR: 180,
    extra: (x) => { x.beginPath(); x.arc(256, 340, 40, 0, 7); x.strokeStyle = '#1a1612'; x.lineWidth = 2; x.stroke(); x.font = '16px Georgia'; for (let i = 0; i < 60; i += 10) { const a = i / 60 * Math.PI * 2; x.fillText(String(i || 60), 256 + Math.sin(a) * 30, 340 - Math.cos(a) * 30); } } });
  const plate = box(g, hw - 50, 560, 6, 0, 1960, D + 6, brass); plate.castShadow = false;
  dial(g, tex, 190, at, 0.3);
  // moon: a disc with two painted moons, turning behind a fixed arch aperture (the two humps)
  const mc = document.createElement('canvas'); mc.width = mc.height = 512; const mx = mc.getContext('2d');
  mx.fillStyle = '#1c2c5a'; mx.beginPath(); mx.arc(256, 256, 256, 0, 7); mx.fill();
  mx.fillStyle = '#fff6d8'; for (let i = 0; i < 70; i++) { const a = Math.random() * 7, r = 120 + Math.random() * 120; mx.fillRect(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, 3, 3); }
  for (const a of [0, Math.PI]) { const cx = 256 + Math.sin(a) * 170, cy = 256 - Math.cos(a) * 170; const gr = mx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, 62); gr.addColorStop(0, '#fff7da'); gr.addColorStop(1, '#d9c27a'); mx.fillStyle = gr; mx.beginPath(); mx.arc(cx, cy, 62, 0, 7); mx.fill(); mx.fillStyle = '#8a7a50'; mx.beginPath(); mx.arc(cx - 16, cy - 6, 9, 0, 7); mx.arc(cx + 14, cy + 18, 7, 0, 7); mx.fill(); }
  const mt = new THREE.CanvasTexture(mc); mt.colorSpace = THREE.SRGBColorSpace;
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(230, 64), new THREE.MeshStandardMaterial({ map: mt, roughness: 0.4 }));
  moonDisc.position.set(0, 1925, D + 9); g.add(moonDisc);
  // the arch aperture: brass covering all but a half-moon window above the dial
  const ap = new THREE.Shape(); ap.moveTo(-230, 2100); ap.lineTo(230, 2100); ap.lineTo(230, 2240); ap.lineTo(-230, 2240); ap.closePath();
  const hole = new THREE.Path(); hole.absarc(0, 2100, 140, 0, Math.PI, false); ap.holes.push(hole);
  const cover = new THREE.Mesh(new THREE.ShapeGeometry(ap, 24), brass); cover.position.z = D + 11; g.add(cover);
  for (const s of [-1, 1]) { const hump = new THREE.Mesh(new THREE.CircleGeometry(62, 24, 0, Math.PI), brass); hump.position.set(s * 140, 2100, D + 12); g.add(hump); }
  const Hd = hands(g, at, 6, 110, 160, new THREE.MeshStandardMaterial({ color: 0x15130f, metalness: 0.7, roughness: 0.4 }));
  const secAt = new THREE.Vector3(0, 1900 + (340 - 256) / 256 * -190, D + 16);
  const sec = new THREE.Mesh(new THREE.BoxGeometry(2.5, 34, 1), new THREE.MeshStandardMaterial({ color: 0x15130f }));
  sec.geometry.translate(0, 13, 0); const sp = new THREE.Group(); sp.position.copy(secAt); sp.add(sec); g.add(sp);
  const glassH = new THREE.Mesh(new THREE.PlaneGeometry(hw - 40, 560), glassM); glassH.position.set(0, 1960, D + 18); g.add(glassH);
  return {
    g,
    tick(now, t) {
      setHands(Hd, now);
      // the seconds hand steps once a second, with the pendulum's beat
      sp.rotation.z = -now.getSeconds() / 60 * Math.PI * 2;
      const ph = (now.getSeconds() + now.getMilliseconds() / 1000) * Math.PI;
      pend.rotation.z = 0.05 * Math.cos(ph);
      // half a turn of the moon disc per lunation: full moon centred at 0.5
      moonDisc.rotation.z = -(moonPhase(now) - 0.5) * Math.PI;
    },
  };
}

// ---------------------------------------------------------------- the chapel's great dial
// a deep blue painted face with gilt numerals and hands in a carved stone roundel
export function chapelDial() {
  const g = new THREE.Group();
  const gilt = new THREE.MeshStandardMaterial({ color: 0xe0b45a, metalness: 1, roughness: 0.3 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a9284, roughness: 0.9 });
  const R = 520;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 40, 60, 16, 64), stone); ring.position.z = 40; ring.scale.z = 0.6; ring.castShadow = true; g.add(ring);
  const at = new THREE.Vector3(0, 0, 50);
  const tex = dialTexture({ bg: '#1d2f66', bg2: '#101a3d', ink: '#e7c070', font: 'bold 60px Georgia, serif', numR: 180, text: 'TEMPUS FUGIT', textFont: '24px Georgia, serif', textY: 340,
    extra: (x) => { x.fillStyle = '#e7c070'; for (let i = 0; i < 40; i++) { const a = Math.random() * 7, r = Math.random() * 120; x.beginPath(); x.arc(256 + Math.cos(a) * r, 230 + Math.sin(a) * r * 0.5, 1.6, 0, 7); x.fill(); } } });
  dial(g, tex, R, at, 0.5);
  const bez = new THREE.Mesh(new THREE.TorusGeometry(R + 4, 10, 10, 96), gilt); bez.position.z = 52; g.add(bez);
  const Hd = hands(g, at, 6, 290, 420, gilt);
  const boss = new THREE.Mesh(new THREE.SphereGeometry(26, 16, 10), gilt); boss.position.set(0, 0, 66); g.add(boss);
  return { g, tick(now) { setHands(Hd, now); } };
}

// ---------------------------------------------------------------- lab clock (the anechoic chamber)
// a red seven-segment display in a black case on a stand: origin at the floor
export function labClock() {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.5, metalness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.3 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 1500, 12), steel); pole.position.y = 750; g.add(pole);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const leg = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 420, 8), steel); leg.position.set(Math.cos(a) * 170, 120, Math.sin(a) * 170); leg.rotation.set(Math.sin(a) * 0.95, 0, -Math.cos(a) * 0.95); g.add(leg); }
  box(g, 520, 170, 90, 0, 1570, 0, black);
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(480, 150), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  face.position.set(0, 1570, 46); g.add(face);
  const glow = new THREE.PointLight(0xff2a10, 2.0e4, 1800, 2); glow.position.set(0, 1570, 200); g.add(glow);
  // seven segments: a b c d e f g
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  const digit = (d, ox, w, h) => {
    const t = w * 0.16, segs = { a: [t, 0, w - 2 * t, t], b: [w - t, t, t, h / 2 - 1.5 * t], c: [w - t, h / 2 + t / 2, t, h / 2 - 1.5 * t], d: [t, h - t, w - 2 * t, t], e: [0, h / 2 + t / 2, t, h / 2 - 1.5 * t], f: [0, t, t, h / 2 - 1.5 * t], g: [t, h / 2 - t / 2, w - 2 * t, t] };
    for (const k in segs) { const [sx, sy, sw, sh] = segs[k]; x.fillStyle = SEG[d].includes(k) ? '#ff3a1a' : 'rgba(255,40,20,0.07)'; x.fillRect(ox + sx, 22 + sy, sw, sh); }
  };
  let last = -1;
  const draw = (now) => {
    const s = now.getSeconds(); if (s === last) return; last = s;
    x.fillStyle = '#0a0606'; x.fillRect(0, 0, 512, 160);
    const str = [now.getHours(), now.getMinutes(), s].map((v) => String(v).padStart(2, '0')).join('');
    let ox = 18;
    for (let i = 0; i < 6; i++) {
      digit(+str[i], ox, i < 4 ? 66 : 52, i < 4 ? 116 : 90); ox += i < 4 ? 80 : 64;
      if (i === 1 || i === 3) { x.fillStyle = s % 2 ? '#ff3a1a' : 'rgba(255,40,20,0.15)'; x.fillRect(ox + 2, 55, 9, 9); x.fillRect(ox + 2, 95, 9, 9); ox += 22; }
    }
    tex.needsUpdate = true;
  };
  return { g, tick(now) { draw(now); } };
}
