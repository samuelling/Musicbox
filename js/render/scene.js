// three.js view of the mechanism, built from the same geometry the physics uses.
// Units: millimetres. Box coords (x along comb, y toward the comb side, z up) -> three (x, z, y),
// so the comb faces the camera and the pinned cylinder sits behind it. The mapping is a
// reflection, so a box-frame counter-clockwise rotation (y->z) is a negative three.js X rotation.
import * as THREE from 'three';
import { HamsterRig, CAGE } from './hamster-scene.js';
import { woodMaterial, boxGeo, velvetMaterial, inlayMaterial } from './materials.js';
import { makeRoom } from './rooms.js';
import { SnowGlobe } from './snowglobe.js';
import { Q } from './quality.js';
import { PostFX } from './postfx.js';
import { onTexture, pbr, metal, boxUV } from './pbr.js';
import { roundBox } from './detail.js';

// the case woods, as scanned veneers under lacquer (grain shrunk to suit a small box)
const VENEER = { maple: ['white_maple_veneer', 240], walnut: ['walnut_veneer', 320], rosewood: ['rosewood_veneer1', 420] };
const veneer = (kind, gloss = 0.6) => pbr(VENEER[kind][0], { rough: 0.85, normal: 0.5, physical: { clearcoat: gloss, clearcoatRoughness: 0.1 } });
// a slotted screw, head up (+y), radius r
function screw(r, mat, slotMat) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.62], [0.55, 0.6], [0.92, 0.42], [1, 0.12], [1, 0], [0, 0]].map(([x, y]) => new THREE.Vector2(x * r, y * r)), 20), mat); head.castShadow = true; g.add(head);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.9, r * 0.3, r * 0.28), slotMat); slot.position.y = r * 0.52; g.add(slot);
  g.rotation.y = Math.random() * Math.PI;
  return g;
}
// a spur gear blank with teeth, axis along x
function gearGeo(R, teeth, thick, bore = 0) {
  const sh = new THREE.Shape(), N = teeth * 4, h = Math.min(0.9, R * 0.08);
  for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, k = i % 4, r = k === 1 || k === 2 ? R + h : R - h * 0.4; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
  if (bore) { const p = new THREE.Path(); p.absarc(0, 0, bore, 0, Math.PI * 2, true); sh.holes.push(p); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -thick / 2); g.rotateY(Math.PI / 2);
  return g;
}
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TINE_MATERIALS, PLATE_MATERIALS, ENCLOSURES, SURFACES, PIN } from '../physics/constants.js';

const MM = 1000;
const WOOD = { walnut: 0x5a3a22, maple: 0xd9b88a, rosewood: 0x5b2a1c, abs: 0xe9e3d8, zamak: 0x9aa0a6, spruce: 0xe8cf9a, oak: 0xa77b4f, glass: 0xbfe3ea, marble: 0xe9e6e1, cherry: 0x8e4a2c, plywood: 0xd6b98c };

export class MusicBoxScene {
  constructor(canvas) {
    this.canvas = canvas;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(Q.maxPixelRatio, window.devicePixelRatio || 1));
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    // a dim room after dark: faint ambient, cold window light, everything else from the candle
    this.scene.background = new THREE.Color(0x070504);
    this.scene.fog = this.baseFog = new THREE.Fog(0x070504, 450, 2200);
    const pm = new THREE.PMREMGenerator(r);
    this.pmrem = pm;
    this.scene.environment = this.studioEnv = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.12;
    // the room photographs itself from where the box stands (a cube probe), and everything is lit and
    // mirrored by that picture: brass shows the fire and the window, corners keep their warmth
    this.probeRT = new THREE.WebGLCubeRenderTarget(Q.probe, { type: THREE.HalfFloatType, generateMipmaps: false });
    this.probeCam = new THREE.CubeCamera(40, 40000, this.probeRT);
    this.envDirty = 0; this.envAt = 0;
    this.fx = new PostFX(r);
    onTexture(() => { this.dirty = Math.max(this.dirty, 2); this.envDirty = Math.max(this.envDirty, 1); });
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 30000);
    this.camera.position.set(95, 85, 120);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.target.set(0, 12, 0);
    this.dirty = 3;
    this.controls.addEventListener('change', () => { this.dirty = Math.max(this.dirty, 2); });
    this.controls.addEventListener('start', () => { const A = this.camAnim; this.camAnim = null; this.zoomAnim = null; if (A && A.done) A.done(); });   // a move that was taking you somewhere (into your eyes) finishes at once
    this.controls.minDistance = 25; this.controls.maxDistance = 9000;
    const hemi = (this.hemi = new THREE.HemisphereLight(0x8a7a6a, 0x120c08, 0.16)); this.scene.add(hemi);
    const key = (this.keyLight = new THREE.DirectionalLight(0x9db4ff, 0.32));   // moonlight through a window
    key.position.set(160, 260, 140); key.castShadow = true;
    key.shadow.mapSize.set(Q.shadow, Q.shadow); key.shadow.bias = -0.0004; key.shadow.normalBias = 2;
    const sc = key.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb7ff, 0.12); rim.position.set(-200, 120, -180); this.scene.add(rim);
    this.candle = null; this.gaze = 'box';
    // candle state survives rebuilds: lit (0..1), ignition clock, smoke clock, wick ember
    this.lit = 0; this.litTarget = 0; this.igniteT = -1; this.smokeT = -1; this.ember = 0;
    this.onCandleScreen = null;
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.smoke = this.makeSmoke(); this.scene.add(this.smoke.group);
    this.mats = {
      brass: metal('brass', { repeat: [1, 6], brushed: 0.55 }),
      steel: metal('steel', { repeat: [1, 4], brushed: 0.4 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2826, metalness: 0.6, roughness: 0.5 }),
      zinc: metal('zinc', { repeat: [2, 2], brushed: 0.25 }),
      lead: metal('lead', { repeat: [1, 1], brushed: 0.2 }),
      pin: new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: 0.2 }),
      slot: new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 0.9 }),
      blued: metal('blued', { repeat: [1, 1], brushed: 0.2 }),
    };
    this.tines = []; this.selected = -1;
    this.raycaster = new THREE.Raycaster();
    this.state = { theta: 0, omega: 0, t: 0, crankAngle: 0, fanPhase: 0, keyAngle: 0, mode: 'spring' };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.onPick = null;
    let down = null, look = null;
    this.onLook = null;
    // Ashland-style mouse look: once the room has hold of the mouse it turns your head, and a click acts on
    // whatever the dot in the middle of the view is on (a double click there leans you in)
    const held = () => document.pointerLockElement === canvas;
    this.mouseHeld = held;
    const centre = (e) => { const r = canvas.getBoundingClientRect(); return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, timeStamp: e.timeStamp }; };
    document.addEventListener('mousemove', (e) => {
      if (!held() || !this.followListener || this.globeOn() || (!e.movementX && !e.movementY)) return;
      const k = 0.0022 * (this.camera.fov / 62);              // slower when you've zoomed in
      if (this.onLook && e.movementX) this.onLook(e.movementX * k);
      const cur = this.lookPitch ?? this.autoPitch ?? 0;
      if (e.movementY) this.lookPitch = Math.max(-1.2, Math.min(1.2, cur - e.movementY * k));
      if (this.onLookStart) this.onLookStart();
      this.dirty = Math.max(this.dirty, 2);
    });
    // a plain click on an empty part of the room takes hold of the mouse (Esc, or Tab for the settings, lets go)
    this.grabMouse = () => { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => this.onGrabFail && this.onGrabFail()); } catch (err) { if (this.onGrabFail) this.onGrabFail(); } };
    // through your own eyes the wheel (or a trackpad's two-finger scroll or pinch) zooms
    canvas.addEventListener('wheel', (e) => {
      if (this.globeOn()) { e.preventDefault(); return; }
      if (!this.followListener) return;
      e.preventDefault();
      this.dolly(Math.exp(Math.max(-60, Math.min(60, e.deltaY)) * (e.ctrlKey ? 0.01 : 0.002)));
    }, { passive: false });
    canvas.addEventListener('pointerdown', (e) => { if (this.globeOn()) { down = [e.clientX, e.clientY, e.timeStamp]; this.gDrag = [e.clientX, e.clientY, e.timeStamp]; this.globe.grab(); try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } return; } if (held()) { const c = centre(e); down = [c.clientX, c.clientY, e.timeStamp]; return; } down = [e.clientX, e.clientY, e.timeStamp]; if (this.followListener) look = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointermove', (e) => {
      if (this.globeOn()) {
        const G = this.gDrag; if (!G) return;
        const h = Math.max(200, canvas.clientHeight);
        this.globe.drag((e.clientX - G[0]) / h, (e.clientY - G[1]) / h, (e.timeStamp - G[2]) / 1000);
        this.gDrag = [e.clientX, e.clientY, e.timeStamp]; return;
      }
      if (!look || !this.followListener || held()) return;
      const dx = e.clientX - look[0], dy = e.clientY - look[1]; look = [e.clientX, e.clientY];
      // a mouse grabs the world one-to-one; a thumb turns faster (as in Ashland): about 115° per phone-width swipe
      const k = e.pointerType === 'touch' ? 0.0052 * Math.min(1, Math.max(0.72, 900 / window.innerWidth))
        : (this.camera.fov * Math.PI / 180) / Math.max(200, canvas.clientHeight);
      if (this.onLookStart && (dx || dy)) this.onLookStart();
      if (this.onLook) this.onLook(dx * k);    // lead your view: drag right and you look right, drag up and you look up (as Ashland)
      const cur = this.lookPitch ?? this.autoPitch ?? 0;
      if (Math.abs(dy) > 0) this.lookPitch = Math.max(-1.2, Math.min(1.2, cur - dy * k));
      this.dirty = Math.max(this.dirty, 2);
    });
    canvas.addEventListener('pointerup', () => { look = null; if (this.gDrag) { this.gDrag = null; if (this.globe) this.globe.release(); } });
    canvas.addEventListener('pointercancel', () => { if (this.gDrag) { this.gDrag = null; if (this.globe) this.globe.release(); } });
    canvas.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]);
      if (this.globeOn()) { if (moved < 12 && e.timeStamp - down[2] < 500) this.globe.tap(); down = null; return; }
      if (held()) { if (e.timeStamp - down[2] < 400) this.tapAt(centre(e)); down = null; return; }
      if (moved < 6 && e.timeStamp - down[2] < 400) {
        const hit = this.tapAt(e);
        if (!hit && e.pointerType === 'mouse' && this.followListener && this.canGrab && this.canGrab()) this.grabMouse();
      }
      down = null;
    });
    this.loop = this.loop.bind(this);
    this.last = performance.now();
    requestAnimationFrame(this.loop);
  }

  // a tap (or the second of two: a double tap, within 320 ms and close by); works for mouse and touch alike
  tapAt(e) {
    const t = e.timeStamp, lt = this.lastTap;
    if (lt && t - lt.t < 320 && Math.hypot(e.clientX - lt.x, e.clientY - lt.y) < 30) { this.lastTap = null; this.doubleTap(e); return true; }
    this.lastTap = { t, x: e.clientX, y: e.clientY }; return this.pick(e);
  }

  resize() {
    this.dirty = 3;
    const w = this.canvas.clientWidth || 300, h = this.canvas.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.fx.setSize(w, h, this.renderer.getPixelRatio());
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.globe) this.globe.resize(w, h);
  }

  // double tap: zoom into the music box (or onto the hamster's cage); again to come back out
  doubleTap(e) {
    if (this.followListener) {
      // seeing through your own eyes: a double tap leans you in to the box or the cage (and back)
      this.lookPitch = null;
      const rect = this.canvas.getBoundingClientRect();
      this.raycaster.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), this.camera);
      const under = (o, root) => { for (let p = o; p; p = p.parent) if (p === root) return true; return false; };
      const hit = this.raycaster.intersectObjects(this.root.children, true).find((h) => h.object.visible && !(this.roomOuter && under(h.object, this.roomOuter)));
      const what = hit && this.hamRig && under(hit.object, this.hamRig.group) ? 'ham' : 'box';
      if (what === 'ham' && this.hamRig.covered) { if (this.onUncover) this.onUncover(); return; }
      if (this.onLean) this.onLean(what);
      return;
    }
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
    if (this.candle && this.lit > 0.5 && this.raycaster.intersectObject(this.candle.g, true).length) { this.candle.gust = 1.3; return true; }
    // a tap on the cage glass wakes him (or startles him)
    if (this.hamRig && !this.hamRig.covered && this.onTapCage) {
      const under = (o, root) => { for (let p = o; p; p = p.parent) if (p === root) return true; return false; };
      const hit = this.raycaster.intersectObjects(this.root.children, true).find((h) => h.object.visible && !(this.roomOuter && under(h.object, this.roomOuter)));
      if (hit && under(hit.object, this.hamRig.group)) { this.onTapCage(); return true; }
    }
    const hits = this.raycaster.intersectObjects(this.tines.map((t) => t.mesh), false);
    if (hits.length) { const i = hits[0].object.userData.tine; this.select(i); this.onPick && this.onPick(i); return true; }
    return false;
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
    // a rebuild (another comb, case, tune...) keeps your view: remember it relative to the pluck point
    const keep = this.tipWorld ? { d: this.tipWorld.clone(), zoomed: this.zoomed, follow: this.follow } : null;
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
      const cm = wooden ? veneer(enc.caseMat) : woodMat(caseCol, enc.caseMat === 'abs' ? 0.45 : 0.55);
      const vmm = wooden ? VENEER[enc.caseMat][1] : 220;
      const box = new THREE.Group();
      const add = (w, h, d, x, y, z, m = cm) => { const ms = new THREE.Mesh(wooden && m === cm ? roundBox(w, h, d, Math.min(1.1, wall * 0.22), vmm, w >= d ? 'x' : 'z') : new THREE.BoxGeometry(w, h, d), m); ms.position.set(x, y, z); ms.castShadow = true; ms.receiveShadow = true; box.add(ms); return ms; };
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
        const velC = enc.caseMat === 'maple' ? 0x1f4a34 : 0x6a1222;
        const vel = pbr('velour_velvet', { gray: true, color: velC, rough: 1, normal: 0.8, physical: { sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(velC).lerp(new THREE.Color(0xffffff), 0.45) } });
        const vh = H - wall * 1.2, vy = yb + wall * 0.4 + vh / 2 + wall * 0.4;
        const lin = (w, h, d, x, y, z) => { const m = new THREE.Mesh(boxUV(w, h, d, 90), vel); m.position.set(x, y, z); m.receiveShadow = true; box.add(m); };
        lin(Lx - 2 * wall, vh, 0.6, cx, vy, cz - Ly / 2 + wall + 0.3);
        lin(0.6, vh, Ly - 2 * wall, cx - Lx / 2 + wall + 0.3, vy, cz);
        lin(0.6, vh, Ly - 2 * wall, cx + Lx / 2 - wall - 0.3, vy, cz);
        add(Lx + 4, wall * 0.9, Ly + 4, cx, yb - wall * 0.2, cz);             // plinth moulding
        const brassM = this.mats.brass;
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
        const side = cm, inl = inlayMaterial(Math.round(Lx + 3), Math.round(Ly + 3), enc.caseMat);
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
        : tp.mat === 'oak' ? pbr('wood_table_worn', { color: new THREE.Color(1.7, 1.6, 1.5), rough: 0.8, normal: 1.2, physical: { clearcoat: 0.12, clearcoatRoughness: 0.5 } })
        : tp.mat === 'spruce' ? woodMaterial('spruce', { gloss: 0.2, mm: 300 })
        : woodMat(col, tp.mat === 'marble' ? 0.25 : 0.7);
      const top = new THREE.Mesh(tp.mat === 'oak' ? roundBox(tp.a * MM, tp.h * MM, tp.b * MM, 5, 560, 'x') : boxGeo(tp.a * MM, tp.h * MM, tp.b * MM, 300), tmat);
      top.castShadow = true;
      // slide the table under the box so its candle side and the hamster's cage both fit on it
      const A0 = tp.a * MM, bxR = enc.boxed ? floorCx + Lx / 2 : floorCx + a / 2, bxL = enc.boxed ? floorCx - Lx / 2 : floorCx - a / 2;
      const needR = bxR + CAGE.gap + CAGE.L + 40 - A0 / 2, maxL = bxL - 230 + A0 / 2;
      const tOff = Math.min(maxL, Math.max(floorCx + 0.2 * A0, needR));
      // and slide it back far enough that the cage (which starts just behind the crank axle and runs CAGE.D deep)
      // stands wholly on it, with a margin, while the box's front stays well inside the front edge
      const B0 = tp.b * MM, cageBack = axY + 12 + 10 + CAGE.D + 14, boxFront = enc.boxed ? floorCy - Ly / 2 : floorCy - b / 2;
      const tz = Math.min(boxFront - 60 + B0 / 2, Math.max(floorCy + (0.47 - 0.5) * B0, cageBack + 45 - B0 / 2));
      top.position.set(tOff, bottomY - (tp.h * MM) / 2, tz);
      top.receiveShadow = true; this.root.add(top);
      // legs and apron down to the floor
      if (surf.height) {
        const Hh = surf.height * MM, th = tp.h * MM, A = tp.a * MM, B = tp.b * MM;
        const legM = tp.mat === 'glass' ? this.mats.steel : tmat;
        const legH = Hh - th;
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const leg = new THREE.Mesh(tp.mat === 'oak' ? roundBox(54, legH, 54, 5, 560, 'y') : new THREE.CylinderGeometry(26, 20, legH, 12), legM);
          leg.position.set(top.position.x + sx * (A / 2 - 70), bottomY - th - legH / 2, top.position.z + sz * (B / 2 - 70)); leg.castShadow = true; leg.receiveShadow = true; this.root.add(leg);
        }
        if (tp.mat !== 'glass') for (const [w, d, x, z] of [[A - 120, 24, 0, B / 2 - 70], [A - 120, 24, 0, -(B / 2 - 70)], [24, B - 120, A / 2 - 70, 0], [24, B - 120, -(A / 2 - 70), 0]]) {
          const ap = new THREE.Mesh(tp.mat === 'oak' ? roundBox(w, 90, d, 3, 560, w > d ? 'x' : 'z') : boxGeo(w, 90, d, 600), tmat); ap.receiveShadow = true; ap.position.set(top.position.x + x, bottomY - th - 45, top.position.z + z); ap.castShadow = true; this.root.add(ap);
        }
      }
      // an old candle on the table, beside the box (inside the table's edge)
      const half = (tp.a * MM) / 2, tableCx = top.position.x;
      const cxC = Math.max(tableCx - half + 45, (enc.boxed ? floorCx - Lx / 2 : floorCx - a / 2) - 75);
      const czC = (enc.boxed ? floorCy : floorCy) - Math.min(70, (tp.b * MM) / 2 - 45) * 0.6;
      this.addCandle(new THREE.Vector3(cxC, bottomY, czC));
    }

    // ---------- bedplate ----------
    const bed = new THREE.Mesh(roundBox(bedLen * MM, bedTop, bedDep * MM, 0.6, 60), this.mats.zinc);
    bed.position.set(0, bedTop / 2, 0); bed.castShadow = true; bed.receiveShadow = true; this.root.add(bed);
    // the bedplate is screwed down to the soundboard at its corners
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const sc = screw(1.9, this.mats.steel, this.mats.slot); sc.position.set(sx * (bedLen * MM / 2 - 3.6), bedTop, sz * (bedDep * MM / 2 - 3.6)); this.root.add(sc); }

    // ---------- cylinder with pins ----------
    const cyl = (this.cylinder = new THREE.Group());
    cyl.position.copy(toV(0, axY, axZ));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, combLen + 4, 64, 1), this.mats.brass);
    body.rotation.z = Math.PI / 2; body.castShadow = true; cyl.add(body);
    const arbor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, combLen + 26, 12), this.mats.steel);
    arbor.rotation.z = Math.PI / 2; cyl.add(arbor);
    // drive gear at the right end
    const gear = new THREE.Mesh(gearGeo(R * 1.12, Math.max(24, Math.round(R * 3.4)), 2, 1.2), this.mats.brass);
    gear.position.x = combLen / 2 + 4; gear.castShadow = true; cyl.add(gear);
    // turned end caps with a raised boss, pinned to the arbor
    for (const sx of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.LatheGeometry([[1.2, 0], [R * 0.34, 0], [R * 0.36, 0.5], [R * 0.86, 0.5], [R * 0.9, 0.15], [R + 0.35, 0.15], [R + 0.35, -1.1], [1.2, -1.1]].map(([x, y]) => new THREE.Vector2(x, y)), 64), this.mats.brass);
      cap.rotation.z = -sx * Math.PI / 2; cap.position.x = sx * (combLen / 2 + 2.05); cap.castShadow = true; cyl.add(cap);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.2, 20), this.mats.steel); collar.rotation.z = Math.PI / 2; collar.position.x = sx * (combLen / 2 + 3.6); cyl.add(collar);
    }
    // index mark so rotation is visible
    const mark = new THREE.Mesh(new THREE.BoxGeometry(combLen + 4.4, 0.6, 0.9), this.mats.dark);
    mark.position.set(0, 0, R); cyl.add(mark);
    this.root.add(cyl);
    this.buildPins(info, patch, pinsList);
    // support blocks
    for (const sx of [-1, 1]) {
      const blk = new THREE.Mesh(roundBox(5, axZ + 2, 10, 0.7, 60), this.mats.zinc);
      blk.position.set(sx * (combLen / 2 + 9), (axZ + 2) / 2, axY); blk.castShadow = true; blk.receiveShadow = true; this.root.add(blk);
      const bush = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.55, 8, 20), this.mats.brass); bush.rotation.y = Math.PI / 2; bush.position.set(sx * (combLen / 2 + 9 - sx * 2.5), axZ, axY); this.root.add(bush);
    }

    // ---------- comb ----------
    const tineMat = new THREE.MeshStandardMaterial({ color: tm.color, metalness: cfg.material === 'glass' ? 0 : 1, roughness: cfg.material === 'glass' ? 0.05 : 0.24, normalMap: cfg.material === 'glass' ? null : this.mats.steel.normalMap, normalScale: new THREE.Vector2(0.35, 0.35), transparent: cfg.material === 'glass', opacity: cfg.material === 'glass' ? 0.75 : 1 });
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
      // a real tooth: flat on top, its thickness running from t0 at the root to t1 at the tip (the
      // underside is what the tuner files), and its tip narrowed where the pins catch it
      const geo = new THREE.BoxGeometry(w, th, L, 1, 1, 10); geo.translate(0, -th / 2, L / 2);
      const thAt = (u) => (t.t0 + (t.t1 - t.t0) * u) * MM;
      { const P = geo.attributes.position; for (let k = 0; k < P.count; k++) { const u = P.getZ(k) / L; if (P.getY(k) < -th / 4) P.setY(k, -thAt(u)); if (u > 0.9) P.setX(k, P.getX(k) * (1 - 0.45 * (u - 0.9) / 0.1)); } geo.computeVertexNormals(); }
      const mesh = new THREE.Mesh(geo, tineMat);
      mesh.castShadow = true; mesh.userData.tine = i;
      const holder = new THREE.Group(); holder.rotation.x = alpha; holder.add(mesh); pivot.add(holder);
      if (t.lead > 0) {
        const ll = Math.max(1, t.leadL * MM), lh = 1.6;
        const lead = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, lh, ll), this.mats.lead);
        lead.position.set(0, -thAt(1 - ll / (2 * L)) - lh / 2, L - ll / 2); holder.add(lead);
      }
      // root extension into the comb base
      const extLen = Math.max(0.5, Math.hypot(baseY - t.rootY * MM, 0));
      const ext = new THREE.Mesh(new THREE.BoxGeometry(w + (t.i < info.tines.length - 1 ? PIN.d * 0 : 0), th * 1.2, extLen), tineMat);
      ext.position.copy(toV(t.x * MM, t.rootY * MM + extLen / 2, t.rootZ * MM + bedTop - th * 0.6)); this.root.add(ext);
      this.root.add(pivot);
      this.tines.push({ pivot: holder, mesh, base: alpha, L });
    });
    // comb base bar
    const combM = metal('steel', { color: tm.color, rough: 0.3, repeat: [1, 3], brushed: 0.5 });
    const baseBar = new THREE.Mesh(roundBox(combLen, Math.max(3, baseZtop), 9, 0.5, 60), cfg.material === 'glass' ? tineMat : combM);
    baseBar.position.copy(toV(0, baseY + 4.5, Math.max(3, baseZtop) / 2)); baseBar.castShadow = true; baseBar.receiveShadow = true; this.root.add(baseBar);
    { const ns = Math.max(3, Math.round(combLen / 16)); for (let k = 0; k < ns; k++) { const sc = screw(1.7, this.mats.blued, this.mats.slot); sc.position.copy(toV(-combLen / 2 + (k + 0.5) * combLen / ns, baseY + 4.5, Math.max(3, baseZtop))); this.root.add(sc);
      const wsh = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.25, 20), this.mats.brass); wsh.position.copy(sc.position); wsh.position.y += 0.1; this.root.add(wsh); } }

    // ---------- governor & barrel ----------
    const gov = new THREE.Group();
    const gx = -combLen / 2 - 18, gz = axY * 0 + 8;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.95, R * 0.95, 14, 48), this.mats.brass);
    barrel.position.set(gx, axZ, -bedDep * MM / 2 + R * 0.95 + 4); barrel.rotation.z = Math.PI / 2; barrel.castShadow = true; gov.add(barrel);
    {
      // the spring barrel: a toothed great wheel on its inner end, a lid with turned rings, a steel
      // ratchet and click on the outer end, the arbor through the middle
      const Rb = R * 0.95, bz = barrel.position.z;
      const great = new THREE.Mesh(gearGeo(Rb + 0.9, Math.max(28, Math.round(Rb * 3.6)), 1.6, 1.4), this.mats.brass); great.position.set(gx + 7.6, axZ, bz); great.castShadow = true; gov.add(great);
      const lid = new THREE.Mesh(new THREE.LatheGeometry([[1.4, 0], [Rb * 0.3, 0], [Rb * 0.32, 0.35], [Rb * 0.6, 0.35], [Rb * 0.62, 0.1], [Rb * 0.9, 0.1], [Rb * 0.93, 0.5], [Rb, 0.5], [Rb, -0.4], [1.4, -0.4]].map(([x, y]) => new THREE.Vector2(x, y)), 48), this.mats.brass);
      lid.rotation.z = Math.PI / 2; lid.position.set(gx - 7.2, axZ, bz); gov.add(lid);
      const ratchet = new THREE.Mesh(gearGeo(Rb * 0.42, 14, 1.2, 1.2), this.mats.steel); ratchet.position.set(gx - 8.4, axZ, bz); gov.add(ratchet);
      const click = new THREE.Mesh(roundBox(1.2, Rb * 0.5, 1.6, 0.3, 60), this.mats.blued); click.position.set(gx - 8.4, axZ + Rb * 0.62, bz + Rb * 0.2); click.rotation.x = 0.5; gov.add(click);
      const clickScrew = screw(1.1, this.mats.blued, this.mats.slot); clickScrew.rotation.z = Math.PI / 2; clickScrew.position.set(gx - 8.9, axZ + Rb * 0.82, bz + Rb * 0.08); gov.add(clickScrew);
      const arbor = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 22, 14), this.mats.steel); arbor.rotation.z = Math.PI / 2; arbor.position.set(gx, axZ, bz); gov.add(arbor);
    }
    const fanArbor = new THREE.Group(); fanArbor.position.set(gx - 4, axZ + R + 10, bedDep * MM / 2 - 8);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 26, 8), this.mats.steel); fanArbor.add(shaft);
    const worm = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 7.4, 14), this.mats.steel); worm.position.y = -8; fanArbor.add(worm);
    {
      // the endless screw: a thread wound five times round the arbor
      class Helix extends THREE.Curve { getPoint(u, o = new THREE.Vector3()) { const a = u * Math.PI * 2 * 5; return o.set(Math.cos(a) * 1.75, -11.4 + u * 6.8, Math.sin(a) * 1.75); } }
      const thread = new THREE.Mesh(new THREE.TubeGeometry(new Helix(), 120, 0.42, 6, false), this.mats.steel); fanArbor.add(thread);
      // the wheel it drives, and the bridge that carries the fan's upper pivot
      const gw = (this.govWheel = new THREE.Mesh(gearGeo(6.2, 26, 1.1, 0.9), this.mats.brass)); gw.position.set(0, -8, -7.9); gw.castShadow = true; fanArbor.add(gw);
      const gwArbor = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 9, 10), this.mats.steel); gwArbor.rotation.z = Math.PI / 2; gwArbor.position.set(0, -8, -7.9); fanArbor.add(gwArbor);
      const postH = axZ + R + 10 + 1.5 - bedTop;
      for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, postH, 12), this.mats.brass); post.position.set(sx * 6.5, 1.5 - postH / 2, 0); post.castShadow = true; fanArbor.add(post); }
      const bridge = new THREE.Mesh(roundBox(16.5, 1.3, 4.2, 0.4, 60), this.mats.brass); bridge.position.set(0, 2.1, 0); bridge.castShadow = true; fanArbor.add(bridge);
      for (const sx of [-1, 1]) { const bs = screw(1.0, this.mats.blued, this.mats.slot); bs.position.set(sx * 6.5, 2.75, 0); fanArbor.add(bs); }
      const jewel = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16), new THREE.MeshPhysicalMaterial({ color: 0xa01428, roughness: 0.1, clearcoat: 1 })); jewel.position.set(0, 2.9, 0); fanArbor.add(jewel);
    }
    const blades = (this.fan = new THREE.Group()); blades.position.y = 10;
    const bl = new THREE.MeshStandardMaterial({ color: 0xd8c27a, metalness: 1, roughness: 0.35, side: THREE.DoubleSide });
    for (const s of [-1, 1]) {
      // each vane a thin brass leaf, wider at the tip, with a little weight riveted on
      const sh = new THREE.Shape(); sh.moveTo(0, -2.2); sh.lineTo(14, -4.5); sh.quadraticCurveTo(16.5, 0, 14, 4.5); sh.lineTo(0, 2.2); sh.closePath();
      const p = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: false }), bl); p.position.set(s * 1.2, 0, -0.15); if (s < 0) p.rotation.y = Math.PI; p.castShadow = true; blades.add(p);
      const wgt = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.9, 12), this.mats.brass); wgt.rotation.x = Math.PI / 2; wgt.position.set(s * 13, 0, 0.5); blades.add(wgt);
    }
    const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5.2, 12), this.mats.brass); blades.add(fanHub);
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
    this.boxCenterY = bottomY + Lz / 2; this.bottomYv = bottomY;
    if (this.roomObj) this.roomInner.add(this.roomObj.group);       // the room survives rebuilds of the box
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
    if (keep) {
      // put the camera back where it was (shifted with the pluck point), and any move in progress too
      this.controls.target.copy(this.lastTarget); this.camera.position.copy(this.lastCam);
      const d = tip.clone().sub(keep.d);
      this.controls.target.add(d); this.camera.position.add(d);
      if (this.camAnim) for (const k of ['fromT', 'fromP', 'tgt', 'pos']) this.camAnim[k].add(d);
      this.zoomed = keep.zoomed; this.follow = keep.follow;
    }
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
    const light = new THREE.PointLight(0xffa04a, 72000, 0, 2);
    light.position.y = 9 + H + 16; light.castShadow = true;
    light.shadow.mapSize.set(Q.candleShadow, Q.candleShadow); light.shadow.camera.near = 4; light.shadow.camera.far = 9000;
    light.shadow.bias = -0.0012; light.shadow.normalBias = 0.6; light.shadow.radius = 3;
    g.add(light);
    this.root.add(g);
    this.candle = { g, flame, outer, core, light, halo, wax, tip, flare, H, base: 72000, n1: 0, n2: 0, t: 0 };
    this.flicker(0);
  }

  // ---------- lighting and snuffing ----------
  get isLit() { return this.litTarget === 1; }
  lightCandle() {
    if (this.litTarget === 1) return;
    this.envDirty = 30;            // the room's light is about to change for a while (the fire catching)
    this.litTarget = 1; this.igniteT = 0; this.smokeT = -1;
    clearTimeout(this.fireTimer);
    this.fireTimer = setTimeout(() => { if (this.roomObj && this.roomObj.setFire && this.litTarget === 1) this.roomObj.setFire(true); }, 700);
    if (!this.everLit) {
      // the first light: watch the flame catch, then move in to the music box
      this.everLit = true;
      setTimeout(() => { if (!this.followListener && !(this.onFirstLight && this.onFirstLight())) { this.zoomed = 'wide'; this.frame(this.state.mode === 'auto' ? 'rig' : 'box'); } }, 1100);
    }
    this.dirty = Math.max(this.dirty, 2);
  }
  snuffCandle() {
    if (this.litTarget === 0) return;
    this.envDirty = 30;
    clearTimeout(this.fireTimer); if (this.roomObj && this.roomObj.setFire) this.roomObj.setFire(false);
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
  // snow globe mode (the hut only): the camera steps back out of the window and holds still on the globe
  globeOn() { return !!(this.globe && this.globe.active); }
  enterGlobe() {
    if (!this.globe) this.globe = new SnowGlobe(this.renderer);
    if (document.pointerLockElement) document.exitPointerLock();
    this.globePrevCtl = this.controls.enabled; this.controls.enabled = false;
    const G = this.globe;
    G.setFire(this.litTarget === 1); G.setXmas(!!this.xmas); G.setHanukkah(!!this.hanukkah);
    G.resize(this.canvas.clientWidth || 300, this.canvas.clientHeight || 300);
    G.enter();
  }
  exitGlobe(done) { if (this.globeOn()) this.globe.exit(done); else if (done) done(); }
  leaveGlobe() { if (!this.globe) return; this.globe.active = false; this.globe.anim = null; this.controls.enabled = this.globePrevCtl ?? true; this.dirty = 4; }
  shakeGlobe(k) { if (this.globeOn()) this.globe.shake(k); }
  // the light that has bounced about the room: a soft, warm fill that follows the fire and the lamps
  adaptLight(dt) {
    const room = this.roomObj; if (!room) return;
    const glow = room.fire !== undefined ? room.fire : (room.fill ?? 1);
    const want = 0.05 + 0.24 * glow;
    if (Math.abs(want - this.hemi.intensity) > 0.002) { this.hemi.intensity += (want - this.hemi.intensity) * Math.min(1, dt * 3); this.dirty = Math.max(this.dirty, 1); }
    this.hemi.color.setRGB(0.55 + 0.45 * glow, 0.5 + 0.2 * glow, 0.5 - 0.1 * glow); this.hemi.groundColor.setRGB(0.1 + 0.2 * glow, 0.07 + 0.08 * glow, 0.05 + 0.02 * glow);
  }
  // photograph the room into the probe and use the picture as the scene's environment. The box, the cage
  // and you are left out (they would only see themselves); the candle and the room are in.
  captureEnv(now = performance.now()) {
    if (!this.roomObj || !this.tipWorld) { this.envDirty = 0; return; }
    this.envDirty--; this.envAt = now;
    const hide = [];
    for (const c of this.root.children) if (c !== this.roomOuter && !(this.candle && c === this.candle.g) && c.visible) { c.visible = false; hide.push(c); }
    for (const c of [this.avatar, this.avatarRing, this.smoke.group]) if (c && c.visible) { c.visible = false; hide.push(c); }
    const env = this.scene.environment, bg = this.scene.background;
    this.scene.environment = null;            // direct light only: no feeding the last picture back in
    this.probeCam.position.copy(this.tipWorld); this.probeCam.position.y += 260;
    const xr = this.renderer.shadowMap.autoUpdate;
    this.probeCam.update(this.renderer, this.scene);
    this.renderer.shadowMap.autoUpdate = xr;
    for (const c of hide) c.visible = true;
    this.scene.background = bg;
    const tex = this.pmrem.fromCubemap(this.probeRT.texture).texture;
    if (this.roomEnv) this.roomEnv.dispose();
    this.roomEnv = tex; this.scene.environment = tex; this.scene.environmentIntensity = this.envGain ?? 1.2;
    void env;
    this.dirty = Math.max(this.dirty, 1);
  }
  // r: { dims, boxPos (m, room), boxYaw, tableTop (m) or null if held, cabin }
  // Christmas decorations (the hut has a tree and a garland)
  setXmas(on) { this.xmas = on; this.envDirty = 2; if (this.globe) this.globe.setXmas(on); if (this.roomObj && this.roomObj.setXmas) this.roomObj.setXmas(on); this.dirty = 4; }
  setHanukkah(on) { this.hanukkah = on; this.envDirty = 2; if (this.globe) this.globe.setHanukkah(on); if (this.roomObj && this.roomObj.setHanukkah) this.roomObj.setHanukkah(on); this.dirty = 4; }
  placeRoom(r) {
    this.roomDef = r;
    const key = [r.kind, r.dims.join(), r.boxPos ? r.boxPos.map((v) => v.toFixed(2)).join() : 'held'].join('|');
    if (this.roomObj && this.roomKey !== key) {
      this.roomObj.group.removeFromParent();
      this.roomObj.group.traverse((m) => { if (m.geometry) m.geometry.dispose(); });
      this.roomObj = null;
    }
    if (!this.roomObj) {
      this.roomObj = makeRoom(r.kind, r.dims, r.boxPos);
      this.roomKey = key;
      if (this.roomObj) this.roomInner.add(this.roomObj.group);
      if (this.roomObj && this.roomObj.setFire) this.roomObj.setFire(this.litTarget === 1);
      if (this.roomObj && this.roomObj.setXmas) this.roomObj.setXmas(!!this.xmas);
      if (this.roomObj && this.roomObj.setHanukkah) this.roomObj.setHanukkah(!!this.hanukkah);
    }
    this.cabin = this.roomObj;     // (the hut and the other rooms share update/setFire)
    this.scene.fog = this.roomObj ? null : this.baseFog;
    this.updateRoomTransform();
    const moon = this.roomObj && this.roomObj.moon;
    if (moon) {
      // moonlight comes in through the window, cold and low
      this.root.updateMatrixWorld(true);
      const w = this.toScene(...moon), o = this.toScene(r.boxPos ? r.boxPos[0] : 2.4, r.boxPos ? r.boxPos[1] : 1.8, 0.8);
      // (aimed at the middle of the floor, its shadow box covering the whole room, so the window wall
      // shadows everything but a cold patch the shape of the panes)
      const mid = this.toScene(r.dims[0] / 2, r.dims[1] / 2, 0.4), dir = w.sub(o).normalize(), span = Math.hypot(r.dims[0], r.dims[1], r.dims[2]) * 560;
      this.keyLight.target.position.copy(mid); if (!this.keyLight.target.parent) this.scene.add(this.keyLight.target);
      this.keyLight.position.copy(mid).addScaledVector(dir, span * 2.2);
      const sc = this.keyLight.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = span * 0.4; sc.far = span * 4; sc.updateProjectionMatrix();
      this.keyLight.shadow.normalBias = 12; this.keyLight.shadow.bias = -0.0006;
      this.keyLight.intensity = 0.9; this.hemi.intensity = 0.05;
    } else {
      this.keyLight.target.position.set(0, 0, 0);
      this.keyLight.position.set(160, 260, 140); this.keyLight.intensity = r.kind === 'anechoic' ? 0.12 : 0.32; this.hemi.intensity = 0.1;
      const sc = this.keyLight.shadow.camera; sc.left = -260; sc.right = 260; sc.top = 260; sc.bottom = -260; sc.near = 10; sc.far = 900; sc.updateProjectionMatrix();
      this.keyLight.shadow.normalBias = 2;
    }
    this.envDirty = 3;
    if (this.litTarget !== 1 && !this.everLit && !this.followListener) this.frame('wide', true);
    this.dirty = 3;
  }
  // pull the orbiting camera back inside the room (toward its target) if it has gone through a wall
  keepInRoom() {
    if (!this.roomObj || !this.roomDef) return;
    const [X, Y, Z] = this.roomDef.dims.map((v) => v * 1000), m = 180;
    const inside = (p) => { const q = this.roomInner.worldToLocal(p.clone()); return q.x > m && q.x < X - m && q.z > m && q.z < Y - m && q.y > 60 && q.y < Z - 260; };
    const c = this.camera.position, t = this.controls.target;
    if (inside(c) || !inside(t)) return;
    let lo = 0, hi = 1; const v = c.clone().sub(t);
    for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (inside(t.clone().addScaledVector(v, mid))) lo = mid; else hi = mid; }
    c.copy(t).addScaledVector(v, lo);
  }
  // a camera position for target tgt looking along dir at distance d, kept inside the room: if the
  // way back is blocked by a wall, look down more steeply, then come closer
  fitInRoom(tgt, dir, d) {
    if (!this.roomObj || !this.roomDef) return tgt.clone().addScaledVector(dir, d);
    const [X, Y, Z] = this.roomDef.dims.map((v) => v * 1000), m = 200;
    const inside = (p) => { const q = this.roomInner.worldToLocal(p.clone()); return q.x > m && q.x < X - m && q.z > m && q.z < Y - m && q.y > 60 && q.y < Z - 280; };
    const flat = new THREE.Vector3(dir.x, 0, dir.z).normalize(), el0 = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    let best = null;
    for (let el = el0; el <= 1.35; el += 0.08) {
      const dd = flat.clone().multiplyScalar(Math.cos(el)); dd.y = Math.sin(el);
      const p = tgt.clone().addScaledVector(dd, d);
      if (inside(p)) return p;
      if (!best) best = dd;
    }
    let lo = 0, hi = 1;
    for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (inside(tgt.clone().addScaledVector(best, d * mid))) lo = mid; else hi = mid; }
    return tgt.clone().addScaledVector(best, d * lo);
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
    const vis = !this.followListener && this.roomDef && !this.roomDef.held && this.zoomed !== 'wide';
    this.avatar.position.copy(eye);
    const near = this.camera.position.distanceTo(eye) < 900;      // don't fill the view with your own head
    this.avatar.visible = vis && !near; this.avatarRing.visible = vis;
    this.avatar.rotation.set(0, Math.atan2(-ahead.z, ahead.x), 0);
    this.avatarRing.position.set(eye.x, this.toScene(L.x, L.y, 0.005).y, eye.z);
    if (!this.followListener) return;
    // look where you face; with "face the box" on, tilt to look at it
    let pitch = this.lookPitch;
    if (pitch === null || pitch === undefined) {
      const tgt = this.gazeWorld();
      const d = tgt.clone().sub(eye);
      pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      this.autoPitch = pitch;
    }
    const dir = ahead.clone().multiplyScalar(Math.cos(pitch)); dir.y = Math.sin(pitch);
    this.camera.position.copy(eye);
    this.camera.lookAt(eye.clone().add(dir));
  }

  // smoothly reframe the camera: the box (and candle), the hamster rig, or a close-up of his
  frame(what, now = false) {
    if (!this.tipWorld) return;
    let tgt, pos, dur = 900, fovTo = this.followListener ? 62 : 38;
    const fov = (this.camera.fov * Math.PI) / 180, fit = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * this.camera.aspect));
    if (what === 'wide' && this.roomDef) {
      // the opening view: the table, the candle, the (covered) cage, and the room around them,
      // from a corner in front of the table, a little above eye height
      const r = this.roomDef, [X, Y, Z] = r.dims, B = r.boxPos || [X / 2, Y / 2, 0.9];
      const back = Math.min(B[1] - 0.3, Math.max(1.6, Y * 0.3));
      pos = this.toScene(B[0] + 0.1, B[1] - back, Math.min(Z - 0.4, 1.85));
      tgt = this.toScene(B[0] - 0.2, B[1] + 1.0, (r.tableTop || 0.75) + 0.12);
      fovTo = 60;
      const v = pos.clone().sub(tgt); pos = this.fitInRoom(tgt, v.clone().normalize(), v.length());
    } else if (what === 'rig' && this.hamRig) {
      // fit the movement, the candle and the wheel in view
      const box = new THREE.Box3().setFromObject(this.hamRig.group);
      box.expandByPoint(this.tipWorld);
      if (this.candle) box.expandByPoint(this.candle.g.getWorldPosition(new THREE.Vector3()));
      const sph = box.getBoundingSphere(new THREE.Sphere());
      tgt = sph.center.clone(); tgt.y -= sph.radius * 0.1;
      const d = (sph.radius * 0.92) / Math.sin(fit / 2);
      pos = this.fitInRoom(tgt, new THREE.Vector3(0.0, 0.42, 0.91).normalize(), d);
    } else if (what === 'hamster' && this.hamRig) {
      tgt = this.hamRig.focus(); tgt.y -= 15;
      pos = this.fitInRoom(tgt, new THREE.Vector3(-0.42, 0.42, 0.8).normalize(), 360);
      this.follow = true;
    } else if (what === 'closeup') {
      // right in on the comb and cylinder, from in front and a little above
      tgt = this.tipWorld.clone();
      pos = this.fitInRoom(tgt, new THREE.Vector3(0.12, 0.62, 0.78).normalize(), Math.max(150, this.combSpan * 1.9));
    } else {
      tgt = this.homeTarget.clone(); const v = this.homeCam.clone().sub(tgt); pos = this.fitInRoom(tgt, v.clone().normalize(), v.length());
    }
    if (this.zoomed === 'wide' && what !== 'wide') dur = 2600;      // from the opening view, a slow move in
    if (what !== 'hamster') this.follow = false;
    this.zoomed = what === 'closeup' || what === 'hamster' || what === 'wide' ? what : null;
    if (now) { this.camAnim = null; this.controls.target.copy(tgt); this.camera.position.copy(pos); this.camera.fov = fovTo; this.camera.updateProjectionMatrix(); this.controls.update(); this.dirty = 3; return; }
    this.camAnim = { t: 0, t0: performance.now(), dur, fromT: this.controls.target.clone(), fromP: this.camera.position.clone(), tgt, pos, fov0: this.camera.fov, fov1: fovTo };
  }
  // what your eyes settle on when you aren't steering them: the box, the hamster, or between the two
  gazeWorld(kind = this.gaze) {
    const box = this.tipWorld || new THREE.Vector3();
    if (kind === 'ham' && this.hamRig) return this.hamRig.focus();
    if (kind === 'rig' && this.hamRig) return box.clone().lerp(this.hamRig.focus(), 0.5);
    return box;
  }
  toRoom(v) { const q = this.roomInner.worldToLocal(v.clone()); return [q.x / 1000, q.z / 1000, q.y / 1000]; }
  // from the opening view, fly down into your own eyes (then the view is yours)
  flyToEyes(done) {
    const L = this.listener; if (!L || !this.roomInner) { done(); return; }
    const eye = this.toScene(L.x, L.y, L.z);
    this.zoomed = null; this.follow = false;
    this.camAnim = { t: 0, t0: performance.now(), dur: 2800, fromT: this.controls.target.clone(), fromP: this.camera.position.clone(), tgt: this.gazeWorld().clone(), pos: eye, fov0: this.camera.fov, fov1: 62, done };
  }
  // look up (+) or down (−): your eyes' pitch, or the orbiting camera's height around its target
  tilt(da) {
    if (this.followListener) { this.lookPitch = Math.max(-1.2, Math.min(1.2, (this.lookPitch ?? this.autoPitch ?? 0) + da)); this.dirty = 3; return; }
    this.camAnim = null;
    const t = this.controls.target, v = this.camera.position.clone().sub(t), r = v.length();
    const el = Math.max(-0.2, Math.min(1.45, Math.asin(v.y / r) - da)), h = Math.hypot(v.x, v.z) || 1;
    this.camera.position.set(t.x + v.x / h * r * Math.cos(el), t.y + r * Math.sin(el), t.z + v.z / h * r * Math.cos(el));
    this.dirty = 3;
  }
  // zoom buttons: dolly toward or away from what you are looking at
  dolly(k) {
    if (this.globeOn()) return;
    if (this.followListener) {
      // through your own eyes, zoom narrows or widens your field of view
      this.camera.fov = Math.max(22, Math.min(85, this.camera.fov * k)); this.camera.updateProjectionMatrix(); this.dirty = 3; return;
    }
    this.camAnim = null;
    const t = this.controls.target, v = this.camera.position.clone().sub(t);
    const d = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, v.length() * k));
    this.zoomAnim = { from: v.length(), to: d, t0: performance.now() };
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
        if (this.govWheel) this.govWheel.rotation.x = s.fanPhase / 26;
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
    if (this.zoomAnim) {
      const Z = this.zoomAnim, u = Math.min(1, (now - Z.t0) / 280), e = u * (2 - u);
      const t = this.controls.target, v = this.camera.position.clone().sub(t).normalize();
      this.camera.position.copy(t).addScaledVector(v, Z.from + (Z.to - Z.from) * e);
      this.dirty = Math.max(this.dirty, 2); if (u >= 1) this.zoomAnim = null;
    }
    if (this.camAnim) {
      const A = this.camAnim; A.t = Math.min(1, (now - A.t0) / (A.dur || 900));
      const e = A.dur > 1500 ? (A.t < 0.5 ? 4 * A.t ** 3 : 1 - (-2 * A.t + 2) ** 3 / 2) : A.t * A.t * (3 - 2 * A.t);
      this.controls.target.lerpVectors(A.fromT, A.tgt, e); this.camera.position.lerpVectors(A.fromP, A.pos, e);
      if (A.fov0 !== A.fov1) { this.camera.fov = A.fov0 + (A.fov1 - A.fov0) * e; this.camera.updateProjectionMatrix(); }
      this.dirty = Math.max(this.dirty, 2);
      if (A.t >= 1) { this.camAnim = null; if (A.done) A.done(); }
    }
    const rigOn = !!this.hamRig;
    if (rigOn) {
      const th = s.theta + s.omega * Math.min(0.06, (now - s.t) / 1000);
      if (this.hamLife && !this.hamRig.covered) this.hamLife.update(dt, this.hamRig.st, this.audioOn);
      this.hamRig.update(dt, th * (s.gCrank || 1), this.hamLife);
      if (this.follow && !this.camAnim) {
        // keep his centred while orbiting is still yours
        const f = this.hamRig.focus(); f.y -= 15;
        const d = f.clone().sub(this.controls.target).multiplyScalar(Math.min(1, dt * 4));
        this.controls.target.add(d); this.camera.position.add(d);
      }
    }
    if (this.globeOn()) {
      const cw = this.canvas.clientWidth, chh = this.canvas.clientHeight;      // the stage can change size under it (the drawer)
      if (cw && chh && (cw !== this.gw || chh !== this.gh)) { this.gw = cw; this.gh = chh; this.resize(); }
      if (this.globe.fire !== (this.litTarget === 1)) this.globe.setFire(this.litTarget === 1);
      this.globe.frame(dt); this.fx.render(this.globe.scene, this.globe.camera, dt); return;
    }
    if (this.controls.enabled) this.controls.update();
    if (!this.followListener) this.keepInRoom();
    this.lastTarget = this.controls.target.clone(); this.lastCam = this.camera.position.clone();
    this.updateListenerView();
    const cabinOn = !!this.cabin;
    if (cabinOn) this.cabin.update(dt);
    {
      // eyes adapt: wider open across a dim room than close to the flame, wider still with no flame at all
      const c = this.candle, d = c ? this.camera.position.distanceTo(c.g.getWorldPosition(this._v || (this._v = new THREE.Vector3()))) : 1200;
      const u = Math.max(0, Math.min(1, (d - 260) / 2000)), want = (1.05 + 0.7 * u * u * (3 - 2 * u)) * (1 + 0.9 * (1 - Math.min(1, this.lit * 1.4)));
      if (this.exposure === undefined) this.exposure = want;
      if (Math.abs(want - this.exposure) > 0.004) { this.exposure += (want - this.exposure) * Math.min(1, dt * 1.6); this.dirty = Math.max(this.dirty, 1); }
      this.renderer.toneMappingExposure = this.exposure;
    }
    if (this.state.keyAngle !== this.lastKey) { this.lastKey = this.state.keyAngle; this.dirty = Math.max(this.dirty, 1); }
    if ((rigOn || cabinOn) && !(this.candle && this.candleBusy)) {
      // the hamster breathes, blinks and runs: always animate (every frame while he runs)
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
    this.adaptLight(dt);
    if (this.envDirty > 0 && now - this.envAt > 400) this.captureEnv(now);
    this.fx.render(this.scene, this.camera, dt);
    if (this.onCandleScreen) this.onCandleScreen(this.candleScreen());
  }
}
