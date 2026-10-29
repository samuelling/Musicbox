// three.js view of the mechanism, built from the same geometry the physics uses.
// Units: millimetres. Box coords (x along comb, y toward the comb side, z up) -> three (x, z, y),
// so the comb faces the camera and the pinned cylinder sits behind it. The mapping is a
// reflection, so a box-frame counter-clockwise rotation (y->z) is a negative three.js X rotation.
import * as THREE from 'three';
import { HamsterRig } from './hamster-scene.js';
import { woodMaterial, boxGeo, velvetMaterial, inlayMaterial } from './materials.js';
import { Cabin } from './cabin.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TINE_MATERIALS, PLATE_MATERIALS, ENCLOSURES, SURFACES, PIN } from '../physics/constants.js';

const MM = 1000;
const WOOD = { walnut: 0x5a3a22, maple: 0xd9b88a, rosewood: 0x5b2a1c, abs: 0xe9e3d8, zamak: 0x9aa0a6, spruce: 0xe8cf9a, oak: 0xa77b4f, glass: 0xbfe3ea, marble: 0xe9e6e1, cherry: 0x8e4a2c, plywood: 0xd6b98c };

export class MusicBoxScene {
  constructor(canvas) {
    this.canvas = canvas;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    // a dim room after dark: faint ambient, cold window light, everything else from the candle
    this.scene.background = new THREE.Color(0x070504);
    this.scene.fog = this.baseFog = new THREE.Fog(0x070504, 450, 2200);
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.12;
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 30000);
    this.camera.position.set(95, 85, 120);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.target.set(0, 12, 0);
    this.dirty = 3;
    this.controls.addEventListener('change', () => { this.dirty = Math.max(this.dirty, 2); });
    this.controls.addEventListener('start', () => { this.camAnim = null; });
    this.controls.minDistance = 25; this.controls.maxDistance = 2500;
    const hemi = (this.hemi = new THREE.HemisphereLight(0x8a7a6a, 0x120c08, 0.16)); this.scene.add(hemi);
    const key = (this.keyLight = new THREE.DirectionalLight(0x9db4ff, 0.32));   // moonlight through a window
    key.position.set(160, 260, 140); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb7ff, 0.12); rim.position.set(-200, 120, -180); this.scene.add(rim);
    this.candle = null;
    // candle state survives rebuilds: lit (0..1), ignition clock, smoke clock, wick ember
    this.lit = 0; this.litTarget = 0; this.igniteT = -1; this.smokeT = -1; this.ember = 0;
    this.onCandleScreen = null;
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.smoke = this.makeSmoke(); this.scene.add(this.smoke.group);
    this.mats = {
      brass: new THREE.MeshStandardMaterial({ color: 0xcaa24e, metalness: 1, roughness: 0.28 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 1, roughness: 0.22 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2826, metalness: 0.6, roughness: 0.5 }),
      zinc: new THREE.MeshStandardMaterial({ color: 0x8f969c, metalness: 0.85, roughness: 0.45 }),
      lead: new THREE.MeshStandardMaterial({ color: 0x55585c, metalness: 0.5, roughness: 0.6 }),
      pin: new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.18 }),
    };
    this.tines = []; this.selected = -1;
    this.raycaster = new THREE.Raycaster();
    this.state = { theta: 0, omega: 0, t: 0, crankAngle: 0, fanPhase: 0, keyAngle: 0, mode: 'spring' };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.onPick = null;
    let down = null, look = null;
    this.onLook = null;
    canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, e.timeStamp]; if (this.followListener) look = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointermove', (e) => {
      if (!look || !this.followListener) return;
      const dx = e.clientX - look[0], dy = e.clientY - look[1]; look = [e.clientX, e.clientY];
      const k = (this.camera.fov * Math.PI / 180) / Math.max(200, canvas.clientHeight);
      if (this.onLook) this.onLook(dx * k);   // turning your head moves the listener's facing
      const cur = this.lookPitch ?? this.autoPitch ?? 0;
      if (Math.abs(dy) > 0) this.lookPitch = Math.max(-1.2, Math.min(1.2, cur + dy * k));
      this.dirty = Math.max(this.dirty, 2);
    });
    canvas.addEventListener('pointerup', () => { look = null; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      if (moved < 6 && e.timeStamp - down[2] < 400) {
        // a second tap close by within 320 ms is a double tap (works for mouse and touch alike)
        const t = e.timeStamp, lt = this.lastTap;
        if (lt && t - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) { this.lastTap = null; this.doubleTap(e); }
        else { this.lastTap = { t, x: e.clientX, y: e.clientY }; this.pick(e); }
      }
      down = null;
    });
    this.loop = this.loop.bind(this);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  resize() {
    this.dirty = 3;
    const w = this.canvas.clientWidth || 300, h = this.canvas.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  // double tap: zoom into the music box (or onto the hamster's cage); again to come back out
  doubleTap(e) {
    if (this.followListener) return;
    const rect = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    const hits = this.raycaster.intersectObjects(this.root.children, true).filter((h) => h.object.visible);
    const under = (o, root) => { for (let p = o; p; p = p.parent) if (p === root) return true; return false; };
    let what = 'away';
    for (const h of hits) {
      if (this.roomOuter && under(h.object, this.roomOuter)) continue;            // walls, floor
      if (this.candle && under(h.object, this.candle.g)) continue;
      if (this.hamRig && under(h.object, this.hamRig.group)) { what = 'cage'; break; }
      { const gp = h.object.geometry && h.object.geometry.parameters; if (gp && (gp.width > 1000 || gp.height > 500)) continue; }   // the table top and legs
      what = 'box'; break;
    }
    const back = this.state.mode === 'auto' ? 'rig' : 'box';
    if (what === 'box') this.frame(this.zoomed === 'closeup' ? back : 'closeup');
    else if (what === 'cage' && this.hamRig.covered) { if (this.onUncover) this.onUncover(); }
    else if (what === 'cage') this.frame(this.zoomed === 'hamster' ? back : 'hamster');
    else if (this.zoomed) this.frame(back);
  }

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
    if (this.candle && this.lit > 0.5 && this.raycaster.intersectObject(this.candle.g, true).length) { this.candle.gust = 1.3; return; }
    const hits = this.raycaster.intersectObjects(this.tines.map((t) => t.mesh), false);
    if (hits.length) { const i = hits[0].object.userData.tine; this.select(i); this.onPick && this.onPick(i); }
  }

  select(i) {
    this.dirty = 3;
    if (this.selected >= 0 && this.tines[this.selected]) this.tines[this.selected].mesh.material = this.tineMat;
    this.selected = i;
    if (i >= 0 && this.tines[i]) {
      if (!this.selMat || this.selMat.userData.base !== this.tineMat) { this.selMat = this.tineMat.clone(); this.selMat.emissive.setHex(0x664000); this.selMat.userData.base = this.tineMat; }
      this.tines[i].mesh.material = this.selMat;
    }
  }

  // Build the whole mechanism from the model report.
  build(info, patch, cfg, pinsList) {
    this.dirty = 5;
    this.root.clear(); this.candle = null; this.tines = []; this.selected = -1;
    const g = patch.geom, enc = ENCLOSURES[cfg.enclosure], surf = SURFACES[cfg.surface];
    const tm = TINE_MATERIALS[cfg.material];
    const R = g.R * MM, combLen = info.cylinder.combLen * MM;
    const axisY = info.tines[0] ? 0 : 0;
    const bedDep = 2 * g.R + 0.040, bedLen = info.cylinder.combLen + 0.022;
    // positions relative to bedplate centre on the soundboard surface
    const bedTop = 3.2;
    const axY = (-bedDep / 2 + g.R + 0.012) * MM, axZ = (g.R + 0.007) * MM + bedTop;
    this.geom = { R, axY, axZ, phiRel: g.phiRel };
    const toV = (bx, by, bz) => new THREE.Vector3(bx, bz, by);

    // ---------- table / box ----------
    const [Lx, Ly, Lz] = enc.size.map((v) => v * MM);
    const a = enc.plate.a * MM, b = enc.plate.b * MM;
    const floorCx = a / 2 - 0.52 * a, floorCy = b / 2 - 0.56 * b; // floor centre relative to bedplate centre
    const wall = enc.wall * MM;
    const floorH = enc.plate.h * MM;
    const caseCol = WOOD[enc.caseMat] ?? 0x6a4a30;
    const woodMat = (col, rough = 0.62) => new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: 0.0 });
    let bottomY = -floorH;
    if (enc.boxed) {
      const wooden = ['maple', 'walnut', 'rosewood'].includes(enc.caseMat);
      const cm = wooden ? woodMaterial(enc.caseMat, { gloss: 0.6 }) : woodMat(caseCol, enc.caseMat === 'abs' ? 0.45 : 0.55);
      const box = new THREE.Group();
      const add = (w, h, d, x, y, z, m = cm) => { const ms = new THREE.Mesh(wooden && m === cm ? boxGeo(w, h, d) : new THREE.BoxGeometry(w, h, d), m); ms.position.set(x, y, z); ms.castShadow = true; ms.receiveShadow = true; box.add(ms); return ms; };
      const cx = floorCx, cz = floorCy;
      const yb = -floorH - wall * 0.4;
      add(Lx, wall * 0.8, Ly, cx, yb, cz);                                    // bottom rim
      const sbMat = ['spruce', 'walnut', 'maple'].includes(enc.plate.mat) ? woodMaterial(enc.plate.mat, { gloss: 0.15, mm: 160 }) : woodMat(WOOD[enc.plate.mat] ?? 0xe8cf9a, 0.5);
      const sb = new THREE.Mesh(boxGeo(a, floorH, b, 160), sbMat);
      sb.position.set(cx, -floorH / 2, cz); sb.receiveShadow = true; box.add(sb); // soundboard
      const H = Lz - wall;
      // front panel is an inner glass window so the movement stays visible
      const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfeef2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false });
      add(Lx, H, wall * 0.4, cx, yb + H / 2, cz + Ly / 2 - wall / 2, glass).castShadow = false;
      add(Lx, wall * 1.2, wall, cx, yb + wall * 0.6, cz + Ly / 2 - wall / 2);   // front sill
      add(Lx, H, wall, cx, yb + H / 2, cz - Ly / 2 + wall / 2);               // back
      add(wall, H, Ly, cx - Lx / 2 + wall / 2, yb + H / 2, cz);
      add(wall, H, Ly, cx + Lx / 2 - wall / 2, yb + H / 2, cz);
      if (wooden) {
        // velvet lining on the inner walls, a moulded plinth, brass hinges and a keyhole plate
        const vel = velvetMaterial(enc.caseMat === 'maple' ? 0x1d3a2c : 0x5a0f1c);
        const vh = H - wall * 1.2, vy = yb + wall * 0.4 + vh / 2 + wall * 0.4;
        const lin = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), vel); m.position.set(x, y, z); m.receiveShadow = true; box.add(m); };
        lin(Lx - 2 * wall, vh, 0.6, cx, vy, cz - Ly / 2 + wall + 0.3);
        lin(0.6, vh, Ly - 2 * wall, cx - Lx / 2 + wall + 0.3, vy, cz);
        lin(0.6, vh, Ly - 2 * wall, cx + Lx / 2 - wall - 0.3, vy, cz);
        add(Lx + 4, wall * 0.9, Ly + 4, cx, yb - wall * 0.2, cz);             // plinth moulding
        const brassM = new THREE.MeshStandardMaterial({ color: 0xc8a050, metalness: 1, roughness: 0.28 });
        for (const sx of [-1, 1]) {
          const hg = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, Math.min(26, Lx * 0.14), 12), brassM);
          hg.rotation.z = Math.PI / 2; hg.position.set(cx + sx * Lx * 0.3, yb + H + 0.5, cz - Ly / 2 - 0.6); hg.castShadow = true; box.add(hg);
        }
        const esc = new THREE.Group(); esc.position.set(cx, yb + wall * 0.6, cz + Ly / 2 + 0.2);
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.6, 24), brassM); plate.rotation.x = Math.PI / 2; plate.scale.set(0.8, 1, 1.25); esc.add(plate);
        const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.8, 12), new THREE.MeshBasicMaterial({ color: 0x080503 })); hole.rotation.x = Math.PI / 2; hole.position.set(0, 0.8, 0.1); esc.add(hole);
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 0.8), hole.material); slot.position.set(0, -0.6, 0.1); esc.add(slot);
        if (wall * 1.2 > 8) box.add(esc);
      }
      // lid, hinged along the back top edge
      const lidPivot = new THREE.Group(); lidPivot.position.set(cx, yb + H, cz - Ly / 2);
      const lidT = (enc.lidH || 0.005) * MM;
      let lid;
      if (wooden) {
        // inlaid lid: mother-of-pearl on the top, and again on the inside panel you see when it is open
        const side = woodMaterial(enc.caseMat, { gloss: 0.6 }), inl = inlayMaterial(Math.round(Lx + 3), Math.round(Ly + 3), enc.caseMat);
        lid = new THREE.Mesh(new THREE.BoxGeometry(Lx + 3, lidT, Ly + 3), [side, side, inl, inl, side, side]);
        lid.position.set(0, lidT / 2, (Ly + 3) / 2 - 1.5);
      } else {
        const lidMat = woodMat(caseCol, 0.5);
        lid = new THREE.Mesh(new THREE.BoxGeometry(Lx, lidT, Ly), lidMat);
        lid.position.set(0, lidT / 2, Ly / 2);
        if (cfg.lid !== 'open') { lidMat.transparent = true; lidMat.opacity = 0.28; lidMat.depthWrite = false; }
      }
      lid.castShadow = true; lid.receiveShadow = true;
      lidPivot.add(lid);
      if (cfg.lid === 'open') lidPivot.rotation.x = -1.85;
      box.add(lidPivot);
      this.root.add(box);
      bottomY = yb - wall * 0.4;
      // feet
      const footMat = surf.feet === 'felt' ? woodMat(0x2c4a2c, 0.95) : cm;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const f = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 4, 16), footMat);
        f.position.set(cx + sx * (Lx / 2 - 9), bottomY - 2, cz + sz * (Ly / 2 - 9)); box.add(f);
      }
      bottomY -= 4;
    } else {
      const pl = new THREE.Mesh(new THREE.BoxGeometry(a, floorH, b), this.mats.zinc);
      pl.position.set(floorCx, -floorH / 2, floorCy); pl.castShadow = true; pl.receiveShadow = true; this.root.add(pl);
      bottomY = -floorH;
    }
    this.bottomY = bottomY;
    if (surf.plate) {
      const tp = surf.plate;
      const col = WOOD[tp.mat] ?? 0x8a6a4a;
      const tmat = tp.mat === 'glass'
        ? new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.05, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.55 })
        : tp.mat === 'oak' ? woodMaterial('oak', { gloss: 0.35, planks: 6, mm: tp.a * MM })
        : tp.mat === 'spruce' ? woodMaterial('spruce', { gloss: 0.2, mm: 300 })
        : woodMat(col, tp.mat === 'marble' ? 0.25 : 0.7);
      const top = new THREE.Mesh(boxGeo(tp.a * MM, tp.h * MM, tp.b * MM, tp.mat === 'oak' ? tp.a * MM : 300), tmat);
      top.position.set(floorCx + (0.5 - 0.3) * tp.a * MM, bottomY - (tp.h * MM) / 2, floorCy + (0.47 - 0.5) * tp.b * MM);
      top.receiveShadow = true; this.root.add(top);
      // legs and apron down to the floor
      if (surf.height) {
        const Hh = surf.height * MM, th = tp.h * MM, A = tp.a * MM, B = tp.b * MM;
        const legM = tp.mat === 'glass' ? this.mats.steel : tmat;
        const legH = Hh - th;
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(26, 20, legH, 12), legM);
          leg.position.set(top.position.x + sx * (A / 2 - 70), bottomY - th - legH / 2, top.position.z + sz * (B / 2 - 70)); leg.castShadow = true; leg.receiveShadow = true; this.root.add(leg);
        }
        if (tp.mat !== 'glass') for (const [w, d, x, z] of [[A - 120, 24, 0, B / 2 - 70], [A - 120, 24, 0, -(B / 2 - 70)], [24, B - 120, A / 2 - 70, 0], [24, B - 120, -(A / 2 - 70), 0]]) {
          const ap = new THREE.Mesh(boxGeo(w, 90, d, 600), tmat); ap.position.set(top.position.x + x, bottomY - th - 45, top.position.z + z); ap.castShadow = true; this.root.add(ap);
        }
      }
      // an old candle on the table, beside the box (inside the table's edge)
      const half = (tp.a * MM) / 2, tableCx = top.position.x;
      const cxC = Math.max(tableCx - half + 45, (enc.boxed ? floorCx - Lx / 2 : floorCx - a / 2) - 75);
      const czC = (enc.boxed ? floorCy : floorCy) - Math.min(70, (tp.b * MM) / 2 - 45) * 0.6;
      this.addCandle(new THREE.Vector3(cxC, bottomY, czC));
    }

    // ---------- bedplate ----------
    const bed = new THREE.Mesh(new THREE.BoxGeometry(bedLen * MM, bedTop, bedDep * MM), this.mats.zinc);
    bed.position.set(0, bedTop / 2, 0); bed.castShadow = true; bed.receiveShadow = true; this.root.add(bed);

    // ---------- cylinder with pins ----------
    const cyl = (this.cylinder = new THREE.Group());
    cyl.position.copy(toV(0, axY, axZ));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, combLen + 4, 64, 1), this.mats.brass);
    body.rotation.z = Math.PI / 2; body.castShadow = true; cyl.add(body);
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, combLen + 26, 12), this.mats.steel);
    arbor.rotation.z = Math.PI / 2; cyl.add(arbor);
    // drive gear at the right end
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.12, R * 1.12, 2, 48), this.mats.brass);
    gear.rotation.z = Math.PI / 2; gear.position.x = combLen / 2 + 4; cyl.add(gear);
    // index mark so rotation is visible
    const mark = new THREE.Mesh(new THREE.BoxGeometry(combLen + 4.4, 0.6, 0.9), this.mats.dark);
    mark.position.set(0, 0, R); cyl.add(mark);
    this.root.add(cyl);
    this.buildPins(info, patch, pinsList);
    // support blocks
    for (const sx of [-1, 1]) {
      const blk = new THREE.Mesh(new THREE.BoxGeometry(5, axZ + 2, 10), this.mats.zinc);
      blk.position.set(sx * (combLen / 2 + 9), (axZ + 2) / 2, axY); blk.castShadow = true; this.root.add(blk);
    }

    // ---------- comb ----------
    const tineMat = new THREE.MeshStandardMaterial({ color: tm.color, metalness: cfg.material === 'glass' ? 0 : 1, roughness: cfg.material === 'glass' ? 0.05 : 0.2, transparent: cfg.material === 'glass', opacity: cfg.material === 'glass' ? 0.75 : 1 });
    this.tineMat = tineMat;
    const [uy, uz] = [g.uy, g.uz];
    const dirY = -uy, dirZ = -uz; // root -> tip
    const alpha = Math.atan2(-dirZ, dirY);
    let maxRootY = -1e9, minRootZ = 1e9;
    info.tines.forEach((t) => { maxRootY = Math.max(maxRootY, t.rootY); minRootZ = Math.min(minRootZ, t.rootZ); });
    const baseY = maxRootY * MM + 4, baseZtop = Math.max(...info.tines.map((t) => t.rootZ)) * MM + bedTop;
    info.tines.forEach((t, i) => {
      const L = t.L * MM, w = t.w * MM, th = ((t.t0 + t.t1) / 2) * MM;
      const pivot = new THREE.Group();
      pivot.position.copy(toV(t.x * MM, t.rootY * MM, t.rootZ * MM + bedTop));
      const geo = new THREE.BoxGeometry(w, th, L); geo.translate(0, -th / 2, L / 2);
      const mesh = new THREE.Mesh(geo, tineMat);
      mesh.castShadow = true; mesh.userData.tine = i;
      const holder = new THREE.Group(); holder.rotation.x = alpha; holder.add(mesh); pivot.add(holder);
      if (t.lead > 0) {
        const ll = Math.max(1, t.leadL * MM), lh = 1.6;
        const lead = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, lh, ll), this.mats.lead);
        lead.position.set(0, -th - lh / 2, L - ll / 2); holder.add(lead);
      }
      // root extension into the comb base
      const extLen = Math.max(0.5, Math.hypot(baseY - t.rootY * MM, 0));
      const ext = new THREE.Mesh(new THREE.BoxGeometry(w + (t.i < info.tines.length - 1 ? PIN.d * 0 : 0), th * 1.2, extLen), tineMat);
      ext.position.copy(toV(t.x * MM, t.rootY * MM + extLen / 2, t.rootZ * MM + bedTop - th * 0.6)); this.root.add(ext);
      this.root.add(pivot);
      this.tines.push({ pivot: holder, mesh, base: alpha, L });
    });
    // comb base bar
    const baseBar = new THREE.Mesh(new THREE.BoxGeometry(combLen, Math.max(3, baseZtop), 9), new THREE.MeshStandardMaterial({ color: tm.color, metalness: 1, roughness: 0.3 }));
    baseBar.position.copy(toV(0, baseY + 4.5, Math.max(3, baseZtop) / 2)); baseBar.castShadow = true; this.root.add(baseBar);

    // ---------- governor & barrel ----------
    const gov = new THREE.Group();
    const gx = -combLen / 2 - 18, gz = axY * 0 + 8;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 14, 40), this.mats.brass);
    barrel.position.set(gx, axZ, -bedDep * MM / 2 + R * 0.95 + 4); barrel.rotation.z = Math.PI / 2; gov.add(barrel);
    const fanArbor = new THREE.Group(); fanArbor.position.set(gx - 4, axZ + R + 10, bedDep * MM / 2 - 8);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 26, 8), this.mats.steel); fanArbor.add(shaft);
    const worm = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 7, 12), this.mats.steel); worm.position.y = -8; fanArbor.add(worm);
    const blades = (this.fan = new THREE.Group()); blades.position.y = 10;
    const bl = new THREE.MeshStandardMaterial({ color: 0xd8c27a, metalness: 1, roughness: 0.35, side: THREE.DoubleSide });
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 0.3), bl); p.position.x = s * 9; blades.add(p); }
    fanArbor.add(blades);
    this.fanBlur = new THREE.Mesh(new THREE.CylinderGeometry(17, 17, 9, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xd8c27a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    this.fanBlur.position.y = 10; fanArbor.add(this.fanBlur);
    gov.add(fanArbor);
    // winding key on top of the barrel
    const keyG = (this.windKey = new THREE.Group());
    keyG.position.set(gx, axZ + R * 0.95 + 1, barrel.position.z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 16, 10), this.mats.brass); stem.position.y = 8; keyG.add(stem);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(6, 1.4, 10, 24), this.mats.brass); bow.position.y = 20; keyG.add(bow);
    gov.add(keyG);
    this.root.add(gov);

    // ---------- crank ----------
    const crank = (this.crank = new THREE.Group());
    crank.position.copy(toV(combLen / 2 + 22, axY, axZ));
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3, 26), this.mats.brass); arm.position.z = 13; crank.add(arm);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 11, 16), woodMat(0x3b2416, 0.4)); knob.rotation.z = Math.PI / 2; knob.position.set(6.5, 0, 25); crank.add(knob);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 4, 16), this.mats.brass); hub.rotation.z = Math.PI / 2; crank.add(hub);
    this.root.add(crank);
    // the room around it (room space -> scene), placed by placeRoom()
    this.roomOuter = new THREE.Group(); this.roomInner = new THREE.Group(); this.roomOuter.add(this.roomInner); this.root.add(this.roomOuter);
    this.cabin = null; this.boxCenterY = bottomY + Lz / 2; this.bottomYv = bottomY;
    // where a belt drive can take power off the crank shaft (used by the hamster rig)
    this.crankAnchor = { x: combLen / 2 + 22, y: axZ, z: axY, boxRight: enc.boxed ? floorCx + Lx / 2 : floorCx + a / 2, bottomY, tip: null };
    this.hamRig = null;
    this.setMode(cfg.mode || this.state.mode);
    // camera target on the pluck point
    const tip = toV(0, axY + g.Ty * MM, axZ + g.Tz * MM);
    this.controls.target.copy(tip);
    this.tipWorld = tip;
    // frame the movement: above and in front, looking down into the box
    const span = Math.max(combLen, 60);
    if (this.candle) {
      // frame the movement and the candle together (the movement a little right of centre,
      // clear of the crank pad's corner)
      const flame = this.candle.g.position.clone(); flame.y += 55;
      const tgt = tip.clone().lerp(flame, 0.36); tgt.y = tip.y - 4; tgt.z += 12;
      const d = Math.max(250, tip.distanceTo(flame) * 2.05);
      this.controls.target.copy(tgt);
      this.camera.position.copy(tgt).add(new THREE.Vector3(0.1, 0.82, 0.62).normalize().multiplyScalar(d));
    } else this.camera.position.set(tip.x + span * 0.75, tip.y + span * 1.35, tip.z + span * 1.9);
    this.homeTarget = this.controls.target.clone(); this.homeCam = this.camera.position.clone();
    this.combSpan = combLen; this.zoomed = null;
    this.controls.update();
  }

  // ---------- an old, burnt-down candle in a brass chamberstick ----------
  addCandle(pos) {
    const g = new THREE.Group(); g.position.copy(pos);
    const brass = new THREE.MeshStandardMaterial({ color: 0x8d6a2e, metalness: 1, roughness: 0.45 });
    // dish with a raised rim, and a finger ring
    const dish = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [40, 0], [42, 2.5], [40, 4], [37, 3], [15, 3.5], [14, 9], [0, 9]].map(([x, y]) => new THREE.Vector2(x, y)), 48), brass);
    dish.castShadow = true; dish.receiveShadow = true; g.add(dish);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 2, 10, 28), brass);
    ring.position.set(44, 9, 0); ring.rotation.y = Math.PI / 2; g.add(ring);
    // yellowed wax, burnt down unevenly, with a melted crater and drips
    const wax = new THREE.MeshStandardMaterial({ color: 0xc9b083, roughness: 0.6, metalness: 0, emissive: 0x6a3008, emissiveIntensity: 0.35 }); // light scattering inside the wax
    const H = 52, Rw = 12;
    const prof = [];
    for (let i = 0; i <= 12; i++) { const y = (i / 12) * H; prof.push(new THREE.Vector2(Rw * (1 + 0.035 * Math.sin(i * 2.3)), y)); }
    prof.push(new THREE.Vector2(Rw * 0.94, H + 2.5), new THREE.Vector2(Rw * 0.7, H - 1.5), new THREE.Vector2(2, H - 3), new THREE.Vector2(0, H - 3));
    const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), wax);
    // lopsided top: shear the upper rim so one side has burnt lower
    const pa = body.geometry.attributes.position;
    for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y > H - 4) pa.setY(i, y - Math.max(0, pa.getX(i)) * 0.28); }
    body.geometry.computeVertexNormals();
    body.position.y = 9; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const rnd = (k) => Math.sin(k * 12.9898) * 43758.5453 % 1;
    for (let k = 0; k < 7; k++) {
      const ang = rnd(k + 1) * Math.PI * 2, len = 8 + Math.abs(rnd(k + 7)) * 28, r = 1.0 + Math.abs(rnd(k + 3)) * 0.9;
      const drip = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), wax);
      drip.scale.set(1, 1, 0.6); drip.rotation.y = -ang;
      drip.position.set(Math.cos(ang) * (Rw + r * 0.15), 9 + H - 6 - r - len / 2 - Math.abs(rnd(k + 5)) * 5, Math.sin(ang) * (Rw + r * 0.15));
      drip.castShadow = true; g.add(drip);
    }
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(17, 18, 2.2, 32), wax); pool.position.y = 10; g.add(pool);
    // charred, curled wick
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 7, 8), new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 1 }));
    wick.position.y = 9 + H - 1; wick.rotation.z = 0.25; g.add(wick);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a0d06 }));
    tip.position.set(-0.9, 9 + H + 2.6, 0); g.add(tip);
    // flame: bright core inside a softer outer envelope, blue at the base
    const flame = new THREE.Group(); flame.position.y = 9 + H + 1.5;
    const addMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
    const outer = new THREE.Mesh(new THREE.SphereGeometry(4.2, 20, 14), addMat(0xff9a35, 0.55));
    outer.scale.set(1, 2.7, 1); outer.position.y = 8; flame.add(outer);
    const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 12), addMat(0xfff1c4, 0.95));
    core.scale.set(1, 2.4, 1); core.position.y = 6; flame.add(core);
    const blue = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), addMat(0x3a5cff, 0.35));
    blue.scale.set(1, 0.8, 1); blue.position.y = 1.5; flame.add(blue);
    // halo sprite
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const cx = cv.getContext('2d'); const grd = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,200,120,0.9)'); grd.addColorStop(0.25, 'rgba(255,150,60,0.35)'); grd.addColorStop(1, 'rgba(255,120,40,0)');
    cx.fillStyle = grd; cx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(70, 70, 1); halo.position.y = 9; flame.add(halo);
    g.add(flame);
    // the match head flaring beside the wick while it is struck
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo.material.map, color: 0xfff0d0, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
    flare.position.set(7, 9 + H + 4, 5); flare.scale.set(1, 1, 1); g.add(flare);
    // the light itself: warm, physically falling off with distance (scene units are mm)
    const light = new THREE.PointLight(0xffa04a, 34000, 0, 2);
    light.position.y = 9 + H + 16; light.castShadow = true;
    light.shadow.mapSize.set(512, 512); light.shadow.camera.near = 4; light.shadow.camera.far = 2500;
    light.shadow.bias = -0.0008; light.shadow.radius = 4;
    g.add(light);
    this.root.add(g);
    this.candle = { g, flame, outer, core, light, halo, wax, tip, flare, H, base: 34000, n1: 0, n2: 0, t: 0 };
    this.flicker(0);
  }

  // ---------- lighting and snuffing ----------
  get isLit() { return this.litTarget === 1; }
  lightCandle() {
    if (this.litTarget === 1) return;
    this.litTarget = 1; this.igniteT = 0; this.smokeT = -1;
    this.dirty = Math.max(this.dirty, 2);
  }
  snuffCandle() {
    if (this.litTarget === 0) return;
    this.litTarget = 0; this.igniteT = -1; this.smokeT = 0; this.ember = 1;
    this.dirty = Math.max(this.dirty, 2);
  }
  get candleBusy() { return this.lit > 1e-3 || this.igniteT >= 0 || this.smokeT >= 0 || this.ember > 0.01 || this.smoke.alive > 0; }

  // a thin wisp of smoke from a snuffed wick: soft sprites rising, spreading and fading
  makeSmoke() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const cx = cv.getContext('2d'); const grd = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(200,196,190,0.9)'); grd.addColorStop(0.5, 'rgba(170,166,160,0.35)'); grd.addColorStop(1, 'rgba(150,150,150,0)');
    cx.fillStyle = grd; cx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(cv);
    const group = new THREE.Group(), parts = [];
    for (let i = 0; i < 36; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xa8a29a, depthWrite: false, transparent: true, opacity: 0 }));
      sp.visible = false; group.add(sp); parts.push({ sp, age: 0, life: 1, on: false, x0: 0, y0: 0, z0: 0, ph: 0 });
    }
    return { group, parts, alive: 0, acc: 0 };
  }
  stepSmoke(dt) {
    const S = this.smoke, c = this.candle;
    if (this.smokeT >= 0 && c) {
      this.smokeT += dt;
      // a dense column at first, thinning out over a couple of seconds
      S.acc += dt * 16 * Math.exp(-this.smokeT / 0.9);
      const src = c.g.localToWorld(new THREE.Vector3(-0.9, 9 + c.H + 3, 0));
      while (S.acc >= 1) {
        S.acc -= 1;
        const p = S.parts.find((q) => !q.on); if (!p) break;
        p.on = true; p.age = 0; p.life = 2.6 + Math.random() * 1.6; p.ph = Math.random() * 6.28;
        p.x0 = src.x; p.y0 = src.y; p.z0 = src.z; p.sp.visible = true;
      }
      if (this.smokeT > 3) this.smokeT = -1;
    }
    let alive = 0;
    for (const p of S.parts) {
      if (!p.on) continue;
      p.age += dt;
      if (p.age >= p.life) { p.on = false; p.sp.visible = false; continue; }
      alive++;
      const a = p.age, u = a / p.life;
      // buoyant rise that slows as it mixes; a lazy sideways curl that grows with height
      const y = 22 * a + 9 * a * a / (1 + a);
      const sway = (2 + 7 * a) * Math.sin(1.7 * a + p.ph);
      p.sp.position.set(p.x0 + sway, p.y0 + y, p.z0 + 0.6 * sway * Math.cos(p.ph));
      const sc = 2.2 + 9 * a; p.sp.scale.set(sc, sc, 1);
      p.sp.material.opacity = 0.42 * Math.min(1, a * 5) * (1 - u) * (1 - u);
    }
    S.alive = alive;
  }

  // where the candle sits on screen (CSS px within the canvas), for the tap-to-light prompt
  candleScreen() {
    const c = this.candle; if (!c) return null;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    const toS = (y) => { const v = c.g.localToWorld(new THREE.Vector3(0, y, 0)).project(this.camera); return [(v.x + 1) * w / 2, (1 - v.y) * h / 2, v.z]; };
    const a = toS(0), b = toS(9 + c.H + 22);
    const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
    const size = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const on = a[2] < 1 && b[2] < 1 && x > 0 && x < w && y > 0 && y < h;
    return { x, y, size, on, w, h };
  }

  flicker(dt) {
    const c = this.candle; if (!c) return;
    c.t += dt;
    // ---- lighting: match strike, flare, the wick catching (with a sputter), then a steady flame
    let flare = 0;
    if (this.igniteT >= 0) {
      const t = (this.igniteT += dt);
      flare = t < 0.06 ? t / 0.06 : Math.exp(-(t - 0.06) / 0.22) * (0.75 + 0.25 * Math.random());
      const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
      const grow = sm((t - 0.3) / 1.5);
      const sputter = 1 - 0.45 * Math.exp(-(((t - 0.85) / 0.09) ** 2));
      this.lit = grow * sputter;
      if (t > 1.9) { this.igniteT = -1; this.lit = 1; flare = 0; }
    } else if (this.litTarget === 0) {
      this.lit *= Math.exp(-dt / 0.07);           // pinched out
      if (this.lit < 1e-3) this.lit = 0;
      this.ember *= Math.exp(-dt / 1.4);          // the wick glows, then dies
      if (this.ember < 0.01) { if (this.ember > 0) this.dirty = Math.max(this.dirty, 1); this.ember = 0; }
    } else this.lit = 1;
    const L = this.lit;
    c.flare.material.opacity = Math.min(1, flare);
    const fs = 4 + 34 * flare; c.flare.scale.set(fs, fs, 1);
    c.tip.material.color.setRGB(0.1 + 0.9 * Math.max(L, this.ember), 0.05 + 0.3 * Math.max(L, this.ember), 0.02 + 0.04 * Math.max(L, this.ember));
    c.flame.visible = L > 2e-3;
    // two smoothed random walks (slow breathing + quick gutter) plus an occasional draught
    const k1 = 1 - Math.exp(-dt * 3), k2 = 1 - Math.exp(-dt * 18);
    c.n1 += (Math.random() * 2 - 1 - c.n1) * k1;
    c.n2 += (Math.random() * 2 - 1 - c.n2) * k2;
    if (Math.random() < dt * 0.25) c.gust = 0.6 + Math.random() * 0.6;
    c.gust = (c.gust || 0) * Math.exp(-dt * 2.5);
    const gustWobble = c.gust * Math.sin(c.t * 23);
    const lvl = 1 + 0.16 * c.n1 + 0.09 * c.n2 - 0.25 * Math.abs(gustWobble);
    c.light.intensity = c.base * (Math.max(0.45, lvl) * Math.pow(L, 1.3) + 0.55 * flare);
    const lean = 0.06 * c.n1 + 0.25 * gustWobble;
    c.flame.rotation.z = lean; c.flame.rotation.x = 0.05 * c.n2;
    c.flame.scale.set((1 - 0.06 * c.n2) * (0.35 + 0.65 * L), Math.max(0.6, 1 + 0.14 * c.n1 + 0.08 * c.n2 - 0.2 * Math.abs(gustWobble)) * Math.pow(L, 0.8), 1);
    c.light.position.x = -lean * 12;
    c.outer.material.opacity = 0.45 + 0.12 * lvl;
    c.halo.material.opacity = (0.65 + 0.3 * (lvl - 1)) * L;
    c.wax.emissiveIntensity = 0.3 * lvl * L;
  }

  buildPins(info, patch, pinsList) {
    if (this.pinMesh) { this.cylinder.remove(this.pinMesh); this.pinMesh.geometry.dispose(); }
    const g = patch.geom, R = g.R * MM, h = PIN.h * MM;
    const total = pinsList.reduce((s, p) => s + p.length, 0);
    const geo = new THREE.CylinderGeometry(PIN.d * MM / 2, PIN.d * MM / 2, h + 0.4, 6); geo.translate(0, (h + 0.4) / 2, 0);
    const mesh = new THREE.InstancedMesh(geo, this.mats.pin, Math.max(1, total));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    let k = 0;
    pinsList.forEach((list, i) => {
      const x = info.tines[i].x * MM;
      for (const frac of list) {
        const psi = g.phiRel - frac * 2 * Math.PI; // local angle (world angle = psi + theta)
        // box (y,z) direction (cos psi, sin psi) -> three (Y,Z) = (sin psi, cos psi)
        const dirY = Math.sin(psi), dirZ = Math.cos(psi);
        q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, dirY, dirZ));
        m.compose(new THREE.Vector3(x, dirY * (R - 0.2), dirZ * (R - 0.2)), q, s);
        mesh.setMatrixAt(k++, m);
      }
    });
    mesh.count = total;
    mesh.instanceMatrix.needsUpdate = true;
    this.dirty = 3;
    this.pinMesh = mesh; this.cylinder.add(mesh);
  }

  setMode(mode) {
    const was = this.state.mode;
    this.state.mode = mode;
    if (this.crank) this.crank.visible = mode === 'crank';
    if (this.windKey) this.windKey.visible = mode === 'spring';
    if (this.hamRig) this.hamRig.setHooked(mode === 'auto');
    if (was !== mode && (was === 'auto' || mode === 'auto')) this.frame(mode === 'auto' ? 'rig' : 'box');
    this.dirty = Math.max(this.dirty, 2);
  }

  // hamster wheel rig, belted to the crank (o: R, rw, rc, surface, mass in SI)
  buildHamRig(o) {
    if (!this.crankAnchor) return;
    if (this.hamRig) { this.root.remove(this.hamRig.group); this.hamRig.group.traverse((m) => m.geometry && m.geometry.dispose()); }
    this.hamRig = new HamsterRig(this.crankAnchor, { ...o, shells: this.quality === 'eco' ? 9 : 16 });
    this.hamRig.setHooked(this.state.mode === 'auto');
    this.root.add(this.hamRig.group);
    this.dirty = 3;
  }
  hamState(h) { if (this.hamRig) this.hamRig.setState(h); }

  // ---------------------------------------------------------------- the room and you
  // r: { dims, boxPos (m, room), boxYaw, tableTop (m) or null if held, cabin }
  placeRoom(r) {
    this.roomDef = r;
    if (this.cabin && (!r.cabin || this.cabinDims !== r.dims.join())) { this.roomInner.remove(this.cabin.group); this.cabin = null; }
    if (r.cabin && !this.cabin) { this.cabin = new Cabin(r.dims); this.cabinDims = r.dims.join(); this.roomInner.add(this.cabin.group); }
    this.scene.fog = r.cabin ? null : this.baseFog;
    this.updateRoomTransform();
    if (r.cabin) {
      // moonlight comes in through the window, cold and low
      const w = this.toScene(2.6, r.dims[1] + 3, 3.6), o = this.toScene(r.boxPos ? r.boxPos[0] : 2.4, r.boxPos ? r.boxPos[1] : 1.8, 0.8);
      this.keyLight.position.copy(w.sub(o).normalize().multiplyScalar(600));
      this.hemi.intensity = 0.1;
    } else { this.keyLight.position.set(160, 260, 140); this.hemi.intensity = 0.16; }
    this.dirty = 3;
  }
  updateRoomTransform() {
    const r = this.roomDef; if (!r || !this.roomOuter) return;
    let B = r.boxPos, yaw = r.boxYaw, yRef;
    if (!B || r.held) {
      // held: the box rides 30 cm in front of your chest, turned towards you
      const L = this.listener || { x: r.dims[0] / 2, y: r.dims[1] / 2, z: 1.2, yaw: 0 };
      const fx = Math.cos(L.yaw), fy = Math.sin(L.yaw), rx = Math.sin(L.yaw), ry = -Math.cos(L.yaw);
      B = [L.x + fx * 0.3 + rx * 0.06, L.y + fy * 0.3 + ry * 0.06, L.z - 0.36]; yaw = L.yaw + Math.PI / 2;
      yRef = this.boxCenterY - B[2] * 1000;
    } else yRef = this.bottomYv - r.tableTop * 1000;
    // room (x east, y north, z up) -> scene (x, z up, -y): a proper rotation, so the 3D view is not
    // a mirror image of the room you hear (the cabin is built in (x, z, y) and flipped by the scale)
    this.roomOuter.rotation.y = yaw + Math.PI;
    this.roomInner.scale.set(1, 1, -1);
    this.roomInner.position.set(-B[0] * 1000, yRef, B[1] * 1000);
    this.roomOuter.updateMatrixWorld(true);
  }
  toScene(x, y, z) { return this.roomInner.localToWorld(new THREE.Vector3(x * 1000, z * 1000, y * 1000)); }
  setListener(L) {
    this.listener = { ...L };
    if (this.roomDef && this.roomDef.held) this.updateRoomTransform();
    this.dirty = Math.max(this.dirty, 2);
  }
  setFollow(on) {
    this.followListener = on;
    this.controls.enabled = !on;
    this.camera.fov = on ? 62 : 38; this.camera.updateProjectionMatrix();
    this.lookPitch = null;
    if (!on && this.homeCam) this.frame(this.state.mode === 'auto' ? 'rig' : 'box');
    this.dirty = 3;
  }
  // a small head where you stand, facing where you face (hidden when you look through its eyes)
  makeAvatar() {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({ color: 0xd9a988, roughness: 0.6, transparent: true, opacity: 0.85 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(85, 24, 16), skin); head.scale.set(1, 1.15, 0.92); g.add(head);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(22, 12, 8), skin); e.scale.set(0.5, 1, 0.8); e.position.set(0, 0, s * 82); g.add(e); }
    const nose = new THREE.Mesh(new THREE.ConeGeometry(16, 40, 10), skin); nose.rotation.z = -Math.PI / 2; nose.position.set(92, -6, 0); g.add(nose);
    const ring = new THREE.Mesh(new THREE.RingGeometry(150, 175, 40), new THREE.MeshBasicMaterial({ color: 0x8fc1d9, transparent: true, opacity: 0.35, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; this.avatarRing = ring;
    this.avatar = g; this.scene.add(g); this.scene.add(ring);
  }
  updateListenerView() {
    const L = this.listener; if (!L || !this.roomInner) return;
    if (!this.avatar) this.makeAvatar();
    const eye = this.toScene(L.x, L.y, L.z);
    const ahead = this.toScene(L.x + Math.cos(L.yaw), L.y + Math.sin(L.yaw), L.z).sub(eye).normalize();
    const vis = !this.followListener && this.roomDef && !this.roomDef.held;
    this.avatar.visible = vis; this.avatarRing.visible = vis;
    this.avatar.position.copy(eye);
    this.avatar.rotation.set(0, Math.atan2(-ahead.z, ahead.x), 0);
    this.avatarRing.position.set(eye.x, this.toScene(L.x, L.y, 0.005).y, eye.z);
    if (!this.followListener) return;
    // look where you face; with "face the box" on, tilt to look at it
    let pitch = this.lookPitch;
    if (pitch === null || pitch === undefined) {
      const tgt = this.tipWorld || new THREE.Vector3();
      const d = tgt.clone().sub(eye);
      pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      this.autoPitch = pitch;
    }
    const dir = ahead.clone().multiplyScalar(Math.cos(pitch)); dir.y = Math.sin(pitch);
    this.camera.position.copy(eye);
    this.camera.lookAt(eye.clone().add(dir));
  }

  // smoothly reframe the camera: the box (and candle), the hamster rig, or a close-up of her
  frame(what) {
    if (!this.tipWorld) return;
    let tgt, pos;
    if (what === 'rig' && this.hamRig) {
      // fit the movement, the candle and the wheel in view
      const box = new THREE.Box3().setFromObject(this.hamRig.group);
      box.expandByPoint(this.tipWorld);
      if (this.candle) box.expandByPoint(this.candle.g.getWorldPosition(new THREE.Vector3()));
      const sph = box.getBoundingSphere(new THREE.Sphere());
      tgt = sph.center.clone(); tgt.y -= sph.radius * 0.1;
      const fov = (this.camera.fov * Math.PI) / 180, fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect));
      const d = (sph.radius * 0.92) / Math.sin(fit / 2);
      pos = tgt.clone().add(new THREE.Vector3(0.0, 0.42, 0.91).normalize().multiplyScalar(d));
    } else if (what === 'hamster' && this.hamRig) {
      tgt = this.hamRig.focus(); tgt.y -= 15;
      pos = tgt.clone().add(new THREE.Vector3(-0.42, 0.42, 0.8).normalize().multiplyScalar(360));
      this.follow = true;
    } else if (what === 'closeup') {
      // right in on the comb and cylinder, from in front and a little above
      tgt = this.tipWorld.clone();
      pos = tgt.clone().add(new THREE.Vector3(0.12, 0.62, 0.78).normalize().multiplyScalar(Math.max(150, this.combSpan * 1.9)));
    } else { tgt = this.homeTarget.clone(); pos = this.homeCam.clone(); }
    if (what !== 'hamster') this.follow = false;
    this.zoomed = what === 'closeup' || what === 'hamster' ? what : null;
    this.camAnim = { t: 0, t0: performance.now(), fromT: this.controls.target.clone(), fromP: this.camera.position.clone(), tgt, pos };
  }

  // physics state from the worklet (~45 Hz)
  update(st, gCrank, gFan) {
    const s = this.state;
    s.theta = st.theta; s.omega = st.omega; s.t = performance.now();
    s.gCrank = gCrank; s.gFan = gFan; s.defl = st.defl; s.amp = st.amp; s.fanRpm = st.fanRpm;
    let ringing = false; for (let i = 0; i < st.amp.length; i++) if (st.amp[i] > 2e-6) { ringing = true; break; }
    if (st.omega > 1e-5 || ringing || st.contacts) this.dirty = Math.max(this.dirty, 2);
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const s = this.state;
    if (this.cylinder) {
      const th = s.theta + s.omega * Math.min(0.06, (now - s.t) / 1000);
      this.cylinder.rotation.x = -th;
      if (this.crank) this.crank.rotation.x = -th * (s.gCrank || 1);
      if (this.fan) {
        const w = (s.fanRpm || 0) * Math.PI / 30;
        s.fanPhase = (s.fanPhase + w * dt) % (Math.PI * 2);
        this.fan.rotation.y = w > 60 ? s.fanPhase * 0.137 : s.fanPhase; // visual anti-alias
        this.fanBlur.material.opacity = Math.min(0.35, w / 900);
      }
      if (this.windKey) this.windKey.rotation.y = s.keyAngle;
      if (s.defl && this.tines.length === s.defl.length) {
        const ex = 6; // visual exaggeration of tip motion
        for (let i = 0; i < this.tines.length; i++) {
          const t = this.tines[i];
          const lift = s.defl[i] * MM;
          const shimmer = (s.amp[i] || 0) * MM * Math.sin(now * 0.09 + i * 1.7);
          t.pivot.rotation.x = t.base + ((lift + shimmer * 0.6) * ex) / t.L;
        }
      }
    }
    if (this.camAnim && this.followListener) this.camAnim = null;
    if (this.camAnim) {
      const A = this.camAnim; A.t = Math.min(1, (now - A.t0) / 900);
      const e = A.t * A.t * (3 - 2 * A.t);
      this.controls.target.lerpVectors(A.fromT, A.tgt, e); this.camera.position.lerpVectors(A.fromP, A.pos, e);
      this.dirty = Math.max(this.dirty, 2);
      if (A.t >= 1) this.camAnim = null;
    }
    const rigOn = !!this.hamRig;
    if (rigOn) {
      const th = s.theta + s.omega * Math.min(0.06, (now - s.t) / 1000);
      if (this.hamLife && !this.hamRig.covered) this.hamLife.update(dt, this.hamRig.st, this.audioOn);
      this.hamRig.update(dt, th * (s.gCrank || 1), this.hamLife);
      if (this.follow && !this.camAnim) {
        // keep her centred while orbiting is still yours
        const f = this.hamRig.focus(); f.y -= 15;
        const d = f.clone().sub(this.controls.target).multiplyScalar(Math.min(1, dt * 4));
        this.controls.target.add(d); this.camera.position.add(d);
      }
    }
    if (this.controls.enabled) this.controls.update();
    this.updateListenerView();
    const cabinOn = !!this.cabin;
    if (cabinOn) this.cabin.update(dt);
    if (this.state.keyAngle !== this.lastKey) { this.lastKey = this.state.keyAngle; this.dirty = Math.max(this.dirty, 1); }
    if ((rigOn || cabinOn) && !(this.candle && this.candleBusy)) {
      // the hamster breathes, blinks and runs: always animate (every frame while she runs)
      this.candleFrame = !this.candleFrame;
      const quick = rigOn && ((this.hamRig.st && this.hamRig.st.f > 0) || (this.hamLife && this.hamLife.v > 0.02));
      if (this.dirty <= 0 && this.candleFrame && !quick) return;
    } else if (this.candle && this.candleBusy) {
      // a lit flame never stops; ~30 fps is plenty for a flicker when nothing else moves
      const quick = this.igniteT >= 0 || this.smoke.alive > 0 || (rigOn && this.hamRig.st && this.hamRig.st.f > 0);   // lighting, smoke and running get every frame
      this.flicker(dt); this.stepSmoke(dt);
      this.candleFrame = !this.candleFrame;
      if (this.dirty <= 0 && this.candleFrame && !quick) return;
    } else if (this.dirty <= 0) return;      // nothing moved: save the battery
    if (this.dirty > 0) this.dirty--;
    this.renderer.render(this.scene, this.camera);
    if (this.onCandleScreen) this.onCandleScreen(this.candleScreen());
  }
}
