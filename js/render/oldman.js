// A very rare visitor: an old man with a big unkempt beard trudges up to the window through the snow, leans in,
// cups his hands to the glass and peers into the room (his breath fogs the pane), then shuffles off. Nobody
// explains him. On average he comes once every forty minutes or so of the room being open (never sooner than
// fifteen); add ?oldman to the address to have him come by in a few seconds.
import * as THREE from 'three';

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

// the man himself, built facing +z, his feet at the origin (mm)
function oldMan() {
  const g = new THREE.Group();
  // lit faintly by the room's glow from inside, so he reads against the night
  const coat = std(0x3a2c22, 0.95, { emissive: 0x120804 }), skin = std(0xc39278, 0.7, { emissive: 0x3a1c10, emissiveIntensity: 0.6 });
  const greys = [0xc9c6c2, 0xa9a6a2, 0xe2e0dc, 0x8c8986, 0xf0eeea].map((c) => std(c, 0.95, { emissive: 0x2a2a2c, emissiveIntensity: 0.5 }));
  const cap = std(0x6a2420, 0.95, { emissive: 0x1a0806 });
  const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
  // body: a heavy old coat, round shoulders, a little stooped
  const body = new THREE.Group(); g.add(body); body.rotation.x = 0.12;
  add(new THREE.CylinderGeometry(270, 310, 1250, 18), coat, 0, 700, 0, body);
  const sh = add(new THREE.SphereGeometry(250, 18, 12), coat, 0, 1330, 0, body); sh.scale.set(1.5, 0.6, 0.72);
  const collar = add(new THREE.TorusGeometry(120, 45, 8, 20), coat, 0, 1430, 20, body); collar.rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(70, 85, 120, 12), skin, 0, 1450, 30, body);      // neck, mostly hidden
  // the head on its own pivot so he can peer about
  const head = new THREE.Group(); head.position.set(0, 1540, 175); head.scale.setScalar(1.3); body.add(head);   // jutting forward from a stoop
  const skull = add(new THREE.SphereGeometry(118, 24, 18), skin, 0, 0, 0, head); skull.scale.set(0.95, 1.12, 1);
  const nose = add(new THREE.SphereGeometry(34, 14, 10), std(0xc8806a, 0.6, { emissive: 0x3a1408, emissiveIntensity: 0.6 }), 0, -12, 112, head); nose.scale.set(0.85, 1.1, 1);
  for (const sx of [-1, 1]) {
    // deep-set, glinting eyes under a shelf of brow
    add(new THREE.SphereGeometry(17, 12, 8), std(0xe8e0d0, 0.4), sx * 42, 28, 92, head).scale.z = 0.55;      // whites
    const eye = add(new THREE.SphereGeometry(10, 12, 8), std(0x2a2620, 0.2), sx * 42, 28, 100, head); eye.scale.z = 0.5;
    add(new THREE.SphereGeometry(3, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), sx * 39, 32, 105, head);
    add(new THREE.SphereGeometry(26, 10, 8), skin, sx * 108, 0, 0, head).scale.set(0.5, 1, 0.8);   // ears
  }
  // a knitted cap pulled down
  const cp = add(new THREE.SphereGeometry(128, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.4), cap, 0, 30, -6, head); cp.scale.set(1, 1.05, 1.05);
  add(new THREE.TorusGeometry(112, 22, 8, 24), cap, 0, 74, -4, head).rotation.x = Math.PI / 2 - 0.12;
  add(new THREE.SphereGeometry(40, 10, 8), cap, 0, 168, -10, head);   // the bobble
  // hair, brows, moustache and the beard: hundreds of grey tufts and strands, every which way
  const tuft = new THREE.ConeGeometry(1, 1, 5); tuft.translate(0, 0.5, 0);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const spray = (n, place, parent) => {
    const per = greys.map(() => []);
    for (let i = 0; i < n; i++) per[Math.floor(Math.random() * greys.length)].push(place(i));
    per.forEach((list, k) => {
      const im = new THREE.InstancedMesh(tuft, greys[k], list.length);
      list.forEach(([p, dir, len, w], j) => { q.setFromUnitVectors(up, dir.normalize()); M.compose(p, q, new THREE.Vector3(w, len, w)); im.setMatrixAt(j, M); });
      parent.add(im);
    });
  };
  // the beard hangs from the cheeks and chin down over the chest: long, wild, wider at the bottom
  // a mass of grey under it all, then strands
  const mass = add(new THREE.SphereGeometry(110, 16, 12), greys[1], 0, -165, 85, head); mass.scale.set(1.05, 1.55, 0.6);
  spray(950, () => {
    const a = R(-1.3, 1.3), r = R(60, 112);
    const p = new THREE.Vector3(Math.sin(a) * r, R(-150, -40) - Math.abs(Math.sin(a)) * 30, 70 + Math.cos(a) * r * 0.6);
    const dir = new THREE.Vector3(Math.sin(a) * R(0.05, 0.5) + R(-0.3, 0.3), -1, R(0.15, 0.6));
    return [p, dir, R(110, 330), R(5, 13)];
  }, head);
  spray(90, () => { const sx = Math.random() < 0.5 ? -1 : 1; return [new THREE.Vector3(sx * R(5, 55), -48, 112), new THREE.Vector3(sx * R(0.6, 1.2), -R(0.4, 1), R(0, 0.3)), R(45, 90), R(6, 12)]; }, head);   // moustache
  for (const sx of [-1, 1]) spray(40, () => [new THREE.Vector3(sx * R(20, 66), R(52, 60), R(92, 104)), new THREE.Vector3(sx * R(0.4, 1), R(0.1, 0.8), R(0.2, 0.8)), R(25, 55), R(4, 8)], head);   // wild brows
  spray(160, () => { const a = R(0.6, Math.PI - 0.6) * (Math.random() < 0.5 ? 1 : -1); return [new THREE.Vector3(Math.sin(a) * 112, R(-40, 40), Math.cos(a) * 112 - 20), new THREE.Vector3(Math.sin(a) * R(0.4, 1), R(-0.8, 0.5), Math.cos(a) * 0.5 - 0.4), R(60, 170), R(7, 14)]; }, head);   // straggling hair from under the cap
  // hands (in woollen mittens) to cup against the glass
  const hands = [];
  for (const sx of [-1, 1]) { const h = add(new THREE.SphereGeometry(55, 12, 8), std(0x4a3a2c, 0.95, { emissive: 0x100804 }), sx * 230, 900, 120, body); h.scale.set(0.8, 1.15, 0.6); hands.push(h); }
  g.userData = { body, head, hands };
  return g;
}

// at a window in the y1 wall (x0..x1 along it, sill height y0, top y1, glass at zGlass, the outside beyond),
// returns an update(dt) to call every frame
export function addOldMan(parent, { x0, x1, y0, zGlass }) {
  const man = oldMan(), { body, head, hands } = man.userData;
  man.rotation.y = Math.PI;                // facing into the room (-z)
  man.visible = false; parent.add(man);
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: fogTexture(), transparent: true, opacity: 0, depthWrite: false }));
  fog.rotation.y = Math.PI; parent.add(fog);
  const cx = (x0 + x1) / 2;
  const params = (() => { try { return /[?&]oldman\b/i.test(location.search); } catch (e) { return false; } })();
  let wait = params ? 6 : R(900, 3600), t = 0, phase = 'away', side = 1;
  const z0 = zGlass + 700;                 // standing back from the house, outside
  // so he stands at the window from the waist up whatever the sill height (a little rise of snow outside)
  const lift = Math.max(0, y0 - 650);
  return (dt) => {
    if (phase === 'away') {
      if (document.hidden) return;
      wait -= dt; if (wait > 0) return;
      phase = 'walkIn'; t = 0; side = Math.random() < 0.5 ? -1 : 1; man.visible = true;
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
    man.position.set(x, lift + bob, z - lean * 150);
    body.rotation.x = 0.12 + 0.12 * lean;
    for (const [i, h] of hands.entries()) { const sx = i ? 1 : -1; h.position.set(sx * (230 - 90 * lean), 900 + 650 * lean, 120 + 120 * lean); }
    // peering: slow, suspicious looks round the room, a tilt of the head
    head.rotation.set(-0.1 * lean + (peer ? 0.08 * Math.sin(t * 0.7) : 0), peer ? 0.5 * Math.sin(t * 0.45) + 0.15 * Math.sin(t * 1.7) : 0, peer ? 0.12 * Math.sin(t * 0.33) : 0);
    // his breath on the cold pane
    const breathe = peer ? 0.35 + 0.25 * Math.max(0, Math.sin(t * 1.6)) : 0;
    fog.material.opacity += (breathe - fog.material.opacity) * Math.min(1, dt * (breathe > fog.material.opacity ? 3 : 0.4));
    fog.position.set(x, lift + 1450, zGlass + 6); fog.scale.setScalar(320);
  };
}
