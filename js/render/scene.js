// three.js view of the mechanism, built from the same geometry the physics uses.
// Units: millimetres. Box coords (x along comb, y toward the comb side, z up) -> three (x, z, y),
// so the comb faces the camera and the pinned cylinder sits behind it. The mapping is a
// reflection, so a box-frame counter-clockwise rotation (y->z) is a negative three.js X rotation.
import * as THREE from '../../vendor/three.module.min.js';
import { OrbitControls } from '../../vendor/OrbitControls.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { TINE_MATERIALS, PLATE_MATERIALS, ENCLOSURES, SURFACES, PIN } from '../physics/constants.js';

const MM = 1000;
const WOOD = { walnut: 0x5a3a22, maple: 0xd9b88a, rosewood: 0x5b2a1c, abs: 0xe9e3d8, zamak: 0x9aa0a6, spruce: 0xe8cf9a, oak: 0xa77b4f, glass: 0xbfe3ea, marble: 0xe9e6e1, cherry: 0x8e4a2c, plywood: 0xd6b98c };

export class MusicBoxScene {
  constructor(canvas) {
    this.canvas = canvas;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x15110e);
    const pm = new THREE.PMREMGenerator(r);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 30000);
    this.camera.position.set(95, 85, 120);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.target.set(0, 12, 0);
    this.dirty = 3;
    this.controls.addEventListener('change', () => { this.dirty = Math.max(this.dirty, 2); });
    this.controls.minDistance = 25; this.controls.maxDistance = 2500;
    const hemi = new THREE.HemisphereLight(0xfff1dc, 0x241a12, 0.55); this.scene.add(hemi);
    const key = (this.keyLight = new THREE.DirectionalLight(0xffe6c4, 2.2));
    key.position.set(160, 260, 140); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const sc = key.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb7ff, 0.6); rim.position.set(-200, 120, -180); this.scene.add(rim);
    this.root = new THREE.Group(); this.scene.add(this.root);
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
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, performance.now()]; });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      if (moved < 6 && performance.now() - down[2] < 400) this.pick(e);
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

  pick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
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
    this.root.clear(); this.tines = []; this.selected = -1;
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
      const cm = woodMat(caseCol, enc.caseMat === 'abs' ? 0.45 : 0.55);
      const box = new THREE.Group();
      const add = (w, h, d, x, y, z, m = cm) => { const ms = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); ms.position.set(x, y, z); ms.castShadow = true; ms.receiveShadow = true; box.add(ms); return ms; };
      const cx = floorCx, cz = floorCy;
      const yb = -floorH - wall * 0.4;
      add(Lx, wall * 0.8, Ly, cx, yb, cz);                                    // bottom rim
      const sb = new THREE.Mesh(new THREE.BoxGeometry(a, floorH, b), woodMat(WOOD[enc.plate.mat] ?? 0xe8cf9a, 0.5));
      sb.position.set(cx, -floorH / 2, cz); sb.receiveShadow = true; box.add(sb); // soundboard
      const H = Lz - wall;
      // front panel is an inner glass window so the movement stays visible
      const glass = new THREE.MeshPhysicalMaterial({ color: 0xdfeef2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false });
      add(Lx, H, wall * 0.4, cx, yb + H / 2, cz + Ly / 2 - wall / 2, glass).castShadow = false;
      add(Lx, wall * 1.2, wall, cx, yb + wall * 0.6, cz + Ly / 2 - wall / 2);   // front sill
      add(Lx, H, wall, cx, yb + H / 2, cz - Ly / 2 + wall / 2);               // back
      add(wall, H, Ly, cx - Lx / 2 + wall / 2, yb + H / 2, cz);
      add(wall, H, Ly, cx + Lx / 2 - wall / 2, yb + H / 2, cz);
      // lid, hinged along the back top edge
      const lidPivot = new THREE.Group(); lidPivot.position.set(cx, yb + H, cz - Ly / 2);
      const lidMat = woodMat(caseCol, 0.5);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(Lx, (enc.lidH || 0.005) * MM, Ly), lidMat);
      lid.position.set(0, ((enc.lidH || 0.005) * MM) / 2, Ly / 2); lid.castShadow = true;
      lidPivot.add(lid);
      if (cfg.lid === 'open') lidPivot.rotation.x = -1.85;
      else { lidMat.transparent = true; lidMat.opacity = 0.28; lidMat.depthWrite = false; }
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
        : woodMat(col, tp.mat === 'marble' ? 0.25 : 0.7);
      const top = new THREE.Mesh(new THREE.BoxGeometry(tp.a * MM, tp.h * MM, tp.b * MM), tmat);
      top.position.set(floorCx + (0.5 - 0.43) * tp.a * MM, bottomY - (tp.h * MM) / 2, floorCy + (0.47 - 0.5) * tp.b * MM);
      top.receiveShadow = true; this.root.add(top);
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
    this.setMode(cfg.mode || this.state.mode);
    // camera target on the pluck point
    const tip = toV(0, axY + g.Ty * MM, axZ + g.Tz * MM);
    this.controls.target.copy(tip);
    this.tipWorld = tip;
    // frame the movement: above and in front, looking down into the box
    const span = Math.max(combLen, 60);
    this.camera.position.set(tip.x + span * 0.75, tip.y + span * 1.35, tip.z + span * 1.9);
    this.controls.update();
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
    this.state.mode = mode;
    if (this.crank) this.crank.visible = mode === 'crank';
    if (this.windKey) this.windKey.visible = mode !== 'crank';
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
    this.controls.update();
    if (this.state.keyAngle !== this.lastKey) { this.lastKey = this.state.keyAngle; this.dirty = Math.max(this.dirty, 1); }
    if (this.dirty <= 0) return;      // nothing moved: save the battery
    this.dirty--;
    this.renderer.render(this.scene, this.camera);
  }
}
