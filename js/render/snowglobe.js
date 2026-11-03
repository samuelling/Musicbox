// Snow globe mode: step out of the hut and see it whole, a tiny log cabin in a glass globe on a turned
// walnut base. Its windows glow (brighter when the fire's lit, and the chimney smokes), and the old man
// trudges round it in the snow, leaving footprints, stopping now and then to peer in at the window, or to
// turn and stare out through the glass at you. The camera holds still: drag to turn the globe on its base,
// tap it, jiggle it back and forth (or shake your phone) to stir the snow, which throws the old man about.
// Units: mm. The base's top is at y = 0; the miniature's own units are full-size mm (scaled by S).
import * as THREE from 'three';
import { oldMan, poseKit } from './oldman.js';
import { woodMaterial } from './materials.js';

const R = 100, CY = 55, YG = 22, S = 0.0105;            // globe radius and centre height, snow level, model scale
const RX = 5800, RY = 4600, LOG = 150, PITCH = 0.58;     // the hut: footprint, log radius, roof pitch
const rnd = (a, b) => a + Math.random() * (b - a);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const RG = Math.sqrt((0.99 * R) ** 2 - (YG - CY) ** 2) / S;   // the snowfield's radius (model units)

// the lie of the snow: flat round the hut, drifts and hollows beyond, down to the glass at the rim
const flat = (x, z) => Math.min(1, Math.hypot(Math.max(0, Math.abs(x) - 3700), Math.max(0, Math.abs(z) - 3100)) / 1500);
const H = (x, z) => {
  const r = Math.hypot(x, z) / RG;
  return flat(x, z) * (1 - smooth(0.86, 1, r)) * (230 + 150 * Math.sin(x * 0.0009 + 1) * Math.cos(z * 0.0011) + 90 * Math.sin(x * 0.0023 + z * 0.0017 + 2));
};

function radial(stops, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d');
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) g.addColorStop(o, col);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// glass: no real refraction, just what the eye reads as glass, a bright rim and two sharp highlights
function glassMaterial(side, k) {
  return new THREE.ShaderMaterial({
    side, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { k: { value: k } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float k; varying vec3 vN; varying vec3 vV;
      void main() {
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float f = pow(1.0 - abs(dot(n, vV)), 2.6);
        vec3 r = reflect(-vV, n);
        float s1 = pow(max(dot(r, normalize(vec3(-0.75, 0.55, 0.6))), 0.0), 140.0);
        float s2 = pow(max(dot(r, normalize(vec3(0.8, 0.5, -0.5))), 0.0), 60.0);
        vec3 c = vec3(0.62, 0.72, 0.85) * f * 0.5 + vec3(1.0, 0.86, 0.66) * s1 * 1.6 + vec3(0.6, 0.72, 1.0) * s2 * 0.5;
        gl_FragColor = vec4(c * k, 1.0);
      }`,
  });
}

function pine(h) {
  const g = new THREE.Group();
  const bark = std(0x3a2618, 0.95), needles = std(0x1d3a29, 0.9, { emissive: 0x04100a }), snow = std(0xf1f5fb, 0.85, { emissive: 0x1c2232, emissiveIntensity: 0.5 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.025, h * 0.035, h * 0.25, 7), bark); trunk.position.y = h * 0.12; g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const r = h * 0.3 * (1 - i * 0.2), th = h * 0.36, y = h * 0.2 + i * h * 0.17;
    const c = new THREE.Mesh(new THREE.ConeGeometry(r, th, 9), needles); c.position.y = y + th / 2; c.rotation.y = i; g.add(c);
    const sc = new THREE.Mesh(new THREE.ConeGeometry(r * 0.82, th * 0.55, 9), snow); sc.position.y = y + th * 0.74; sc.rotation.y = i + 0.3; g.add(sc);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // where a strand of lights wound round it would sit: on the outside of the boughs, spiralling up
  g.userData.lights = (n) => {
    const out = [];
    for (let j = 0; j < n; j++) {
      const u = j / n, y = h * (0.24 + 0.68 * u);
      let r = 0;
      for (let i = 0; i < 4; i++) { const y0 = h * 0.2 + i * h * 0.17, th = h * 0.36; if (y >= y0 && y <= y0 + th) r = Math.max(r, h * 0.3 * (1 - i * 0.2) * (1 - (y - y0) / th)); }
      const a = u * Math.PI * 2 * 5.5;
      out.push([Math.cos(a) * (r * 1.06 + 60), y, Math.sin(a) * (r * 1.06 + 60)]);
    }
    return out;
  };
  return g;
}

export class SnowGlobe {
  constructor(renderer) {
    this.renderer = renderer;
    this.active = false; this.fire = false; this.xmas = false; this.hanukkah = false;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070504);
    this.scene.fog = new THREE.Fog(0x070504, 700, 2600);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.5, 8000);
    this.agit = 0; this.wob = { x: 0, z: 0, vx: 0, vz: 0 }; this.t = 0;
    this.spin = { y: 0, vy: 0, tilt: 0.12, held: false, last: 0, sign: 0, flips: [] };
    this.build();
  }

  build() {
    const sc = this.scene;
    sc.add(new THREE.HemisphereLight(0x8c9bc0, 0x24160c, 0.55));
    // your candle, warm, from the front left; the moon, cold, from behind
    const key = (this.key = new THREE.DirectionalLight(0xffc488, 1.7)); key.position.set(-260, 260, 300); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 50, far: 900 }); key.shadow.bias = -0.0008;
    sc.add(key);
    const moon = new THREE.DirectionalLight(0x9fb4ff, 0.55); moon.position.set(300, 200, -300); sc.add(moon);

    // the table it stands on, and a soft shadow under the base
    const table = new THREE.Mesh(new THREE.CircleGeometry(2400, 64), std(0x2a1a10, 0.55)); table.rotation.x = -Math.PI / 2; table.position.y = -46; table.receiveShadow = true; sc.add(table);
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
    shade.rotation.x = -Math.PI / 2; shade.position.y = -45.7; sc.add(shade);

    // everything that rocks when it's shaken
    const g = (this.root = new THREE.Group()); sc.add(g);
    // the base: turned walnut, a brass ring where the glass sits, a little engraved plaque
    let wood; try { wood = woodMaterial('walnut', { gloss: 0.7 }); } catch (e) { wood = std(0x5a3a22, 0.45); }
    const prof = [[0, -46], [118, -46], [121, -43], [118, -39], [108, -33], [103, -27], [102, -10], [106, -7], [109, -4], [104, -1.5], [92, 0], [0, 0]].map(([x, y]) => new THREE.Vector2(x, y));
    const base = new THREE.Mesh(new THREE.LatheGeometry(prof, 72), wood); base.castShadow = true; base.receiveShadow = true; g.add(base);
    const brass = new THREE.MeshStandardMaterial({ color: 0xcaa24e, metalness: 1, roughness: 0.3 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(85, 3.2, 10, 72), brass); ring.rotation.x = Math.PI / 2; ring.position.y = 1; g.add(ring);
    {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, '#e2c27a'); gr.addColorStop(0.5, '#b8913f'); gr.addColorStop(1, '#8a6a2a');
      x.fillStyle = gr; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#5a4218'; x.lineWidth = 6; x.strokeRect(8, 8, 496, 112);
      x.fillStyle = '#3a2a10'; x.font = 'italic 700 72px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Frisky', 256, 68);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(44, 11), new THREE.MeshStandardMaterial({ map: t, metalness: 0.6, roughness: 0.4, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.35 }));
      pl.position.set(0, -18.5, 103.6); g.add(pl);
    }
    // the snow inside: a band of packed snow against the glass below the snowfield, and the field itself
    const t1 = Math.acos((YG - CY) / (0.99 * R)), t2 = Math.acos((0.5 - CY) / (0.99 * R));
    const snowMat = std(0xeef2f8, 0.85, { emissive: 0x1a2232, emissiveIntensity: 0.55 });
    const band = new THREE.Mesh(new THREE.SphereGeometry(0.99 * R, 72, 8, 0, Math.PI * 2, t1, t2 - t1), snowMat); band.position.y = CY; g.add(band);

    const mini = (this.mini = new THREE.Group()); mini.position.y = YG; mini.scale.setScalar(S); g.add(mini);
    const field = new THREE.RingGeometry(1, RG, 128, 44); field.rotateX(-Math.PI / 2);
    const fp = field.attributes.position;
    for (let i = 0; i < fp.count; i++) fp.setY(i, H(fp.getX(i), fp.getZ(i)));
    field.computeVertexNormals();
    const ground = new THREE.Mesh(field, snowMat); ground.receiveShadow = true; mini.add(ground);

    this.buildHut(mini);
    const treeLights = [];
    // pines round about, keeping clear of the path and of the view in through the front window
    for (const [a, r, h] of [[-0.45, 6500, 5600], [-1.25, 6900, 6300], [-2.1, 6400, 4700], [2.75, 7000, 6100], [3.45, 6200, 4300], [0.35, 6900, 4900], [-2.75, 7600, 3600]]) {
      const x = Math.cos(a) * r, z = Math.sin(a) * r, t = pine(h); t.position.set(x, H(x, z) - 80, z); t.rotation.y = a * 3; mini.add(t);
      t.updateMatrix(); for (const q of t.userData.lights(Math.round(h / 120))) treeLights.push(new THREE.Vector3(...q).applyMatrix4(t.matrix));
    }
    // Christmas: strands of old-fashioned coloured bulbs on the pines (and a glow on the hut's eave bulbs)
    {
      const cols = [0xff3a2a, 0x2ad04a, 0x3a6aff, 0xffa020, 0xfff2d0, 0xd040ff].map((c) => new THREE.Color(c));
      const pos = [...treeLights, ...this.bulbs.map((b) => b.position.clone())];
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos.flatMap((v) => [v.x, v.y, v.z]), 3));
      const base = new Float32Array(pos.length * 3), col = new Float32Array(pos.length * 3);
      pos.forEach((_, i) => { const c = i < treeLights.length ? cols[(i * 7 + (i >> 3)) % cols.length] : this.bulbs[i - treeLights.length].material.color; base.set([c.r, c.g, c.b], i * 3); });
      col.set(base); geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
      const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.75)'], [0.45, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]);
      const glow = new THREE.Points(geo, new THREE.PointsMaterial({ size: 16, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
      const core = new THREE.Points(geo, new THREE.PointsMaterial({ size: 3.4, map: radial([[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], 16), vertexColors: true, transparent: true, alphaTest: 0.3, toneMapped: false }));
      const xl = (this.xmasLights = new THREE.Group()); xl.add(glow, core); xl.visible = false; glow.frustumCulled = core.frustumCulled = false; glow.renderOrder = 9; mini.add(xl);
      this.xmasCol = { base, col, attr: geo.attributes.color, n: pos.length, ph: Float32Array.from(pos, () => rnd(0, 100)) };
    }
    // the woodpile against the back wall, and a chopping stump (his axe stands in it when he's not carrying it)
    const logMat = std(0x6b4a2e, 0.9), endMat = std(0xc49a68, 0.8), snowCap = std(0xf1f5fb, 0.85, { emissive: 0x1c2232, emissiveIntensity: 0.5 });
    for (let k = 0; k < 4; k++) for (let i = 0; i < 5 - k; i++) {
      const lg = new THREE.Mesh(new THREE.CylinderGeometry(115, 115, 800, 9), [logMat, endMat, endMat]); lg.rotation.x = Math.PI / 2;
      lg.position.set(-900 + (i - (4 - k) / 2) * 240, 115 + k * 205, -RY / 2 - LOG - 470); lg.castShadow = true; mini.add(lg);
    }
    const pileSnow = new THREE.Mesh(new THREE.BoxGeometry(520, 110, 820), snowCap); pileSnow.position.set(-900, 820, -RY / 2 - LOG - 470); mini.add(pileSnow);
    const stump = new THREE.Group(); stump.position.set(2300, H(2300, -4700) - 40, -4700); mini.add(stump);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(300, 360, 520, 12), [std(0x4a3220, 0.95), std(0xb08a5c, 0.8), std(0xb08a5c, 0.8)]); st.position.y = 260; st.castShadow = true; stump.add(st);
    const stSnow = new THREE.Mesh(new THREE.CylinderGeometry(290, 300, 70, 12), snowCap); stSnow.position.y = 545; stump.add(stSnow);

    // the old man (his own axe; a twin of it waits in the stump)
    const man = (this.man = oldMan()); mini.add(man);
    this.kit = poseKit(man);
    const { axe } = man.userData;
    const stAxe = (this.stumpAxe = axe.clone()); stAxe.visible = true; stAxe.position.set(-60, 1000, 0); stAxe.rotation.set(0, 0, Math.PI - 0.25); stump.add(stAxe);
    man.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    man.position.set(0, 0, 0); man.rotation.y = Math.PI; man.updateMatrixWorld(true);
    this.front0 = this.kit.reach(0); this.front1 = this.kit.reach(1);
    this.ell = { rx: 4400, rz: 3800, rzF: 5300 };    // his round keeps well back from the front of the hut
    this.walker = { phi: -Math.PI / 2, dir: 1, mode: 'walk', t: 0, next: rnd(6, 14), heading: Math.PI / 2, x: 0, z: -3800, cool: 0, nerve: 0, need: rnd(90, 200) };

    // footprints: pressed into the snow, slowly filling back in
    const fpG = new THREE.CircleGeometry(1, 10); fpG.rotateX(-Math.PI / 2);
    const fpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    this.prints = new THREE.InstancedMesh(fpG, fpMat, 160); this.prints.count = 0; this.prints.receiveShadow = true;
    this.prints.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.printAge = new Float32Array(160).fill(1e9); this.printN = 0; this.stepT = 0; this.stepSide = 1;
    for (let i = 0; i < 160; i++) this.prints.setColorAt(i, new THREE.Color(0xeef2f8));
    mini.add(this.prints);

    // the glass: an outer and an inner face
    const sg = new THREE.SphereGeometry(R, 72, 48);
    const back = new THREE.Mesh(sg, glassMaterial(THREE.BackSide, 0.5)); back.position.y = CY; back.renderOrder = 8; g.add(back);
    const front = new THREE.Mesh(sg, glassMaterial(THREE.FrontSide, 1)); front.position.y = CY; front.renderOrder = 12; g.add(front);

    this.buildSnow(g);
  }

  buildHut(mini) {
    const hut = new THREE.Group(); mini.add(hut);
    const logMat = std(0x6e4a2c, 0.85, { emissive: 0x0e0704 }), endMat = std(0xb38858, 0.8), dark = std(0x140d08, 1);
    const dl = LOG * 1.8, nLog = Math.floor((2500 - 2 * LOG) / dl) + 1;
    const WT = (this.WT = LOG + (nLog - 1) * dl + LOG + dl / 2);
    const lgX = new THREE.CylinderGeometry(LOG, LOG, RX + 600, 10); lgX.rotateZ(Math.PI / 2);
    const lgZ = new THREE.CylinderGeometry(LOG, LOG, RY + 600, 10); lgZ.rotateX(Math.PI / 2);
    for (let k = 0; k < nLog; k++) {
      for (const sz of [-1, 1]) { const m = new THREE.Mesh(lgX, [logMat, endMat, endMat]); m.position.set(0, LOG + k * dl, sz * RY / 2); hut.add(m); }
      for (const sx of [-1, 1]) { const m = new THREE.Mesh(lgZ, [logMat, endMat, endMat]); m.position.set(sx * RX / 2, LOG + k * dl + dl / 2, 0); hut.add(m); }
    }
    const core = new THREE.Mesh(new THREE.BoxGeometry(RX - LOG, WT, RY - LOG), dark); core.position.y = WT / 2; hut.add(core);
    // gables (vertical boards) and a roof of boards under a thick quilt of snow
    const rise = (RY / 2) * Math.tan(PITCH), ridge = (this.ridge = WT + rise);
    const tri = new THREE.Shape(); tri.moveTo(-RY / 2 - LOG, 0); tri.lineTo(RY / 2 + LOG, 0); tri.lineTo(0, rise + LOG * Math.tan(PITCH)); tri.closePath();
    const gableG = new THREE.ExtrudeGeometry(tri, { depth: 2 * LOG, bevelEnabled: false }); gableG.translate(0, 0, -LOG); gableG.rotateY(Math.PI / 2);
    const boards = std(0x5a3c24, 0.9, { emissive: 0x0a0503 });
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(gableG, boards); m.position.set(sx * RX / 2, WT, 0); hut.add(m); }
    const hs = RY / 2 + 520, L = hs / Math.cos(PITCH);
    const roofMat = std(0x3a2a1e, 0.9), snowMat = std(0xf3f6fb, 0.8, { emissive: 0x1c2232, emissiveIntensity: 0.55 });
    for (const sz of [-1, 1]) {
      const pv = new THREE.Group(); pv.position.set(0, ridge, 0); pv.rotation.x = sz * PITCH; hut.add(pv);
      const slab = new THREE.Mesh(new THREE.BoxGeometry(RX + 1000, 160, L), roofMat); slab.position.set(0, 80, sz * L / 2); pv.add(slab);
      const sn = new THREE.Mesh(new THREE.BoxGeometry(RX + 1060, 230, L + 40), snowMat); sn.position.set(0, 160 + 115, sz * (L / 2 + 10)); pv.add(sn);
      // a lip of snow curling over the eave
      const lip = new THREE.Mesh(new THREE.CylinderGeometry(120, 120, RX + 1060, 8), snowMat); lip.rotation.z = Math.PI / 2; lip.position.set(0, 230, sz * (L + 20)); pv.add(lip);
    }
    const ridgeCap = new THREE.Mesh(new THREE.CylinderGeometry(190, 190, RX + 1060, 10), snowMat); ridgeCap.rotation.z = Math.PI / 2; ridgeCap.position.y = ridge + 330; hut.add(ridgeCap);
    this.roofTop = (zr) => WT + (RY / 2 - Math.abs(zr)) * Math.tan(PITCH) + 390 / Math.cos(PITCH);
    this.roofHalf = { x: RX / 2 + 530, z: hs };
    // the chimney, stone, up the end where the hearth is
    const stone = std(0x6c6660, 0.95, { emissive: 0x080706 });
    const chH = ridge + 900, cx = -(RX / 2 + LOG + 300);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(600, chH, 1000), stone); ch.position.set(cx, chH / 2, 0); hut.add(ch);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(700, 120, 1100), stone); cap.position.set(cx, chH + 60, 0); hut.add(cap);
    const chSnow = new THREE.Mesh(new THREE.BoxGeometry(690, 90, 1090), snowMat); chSnow.position.set(cx, chH + 165, 0); hut.add(chSnow);
    this.chimneyTop = new THREE.Vector3(cx, chH + 200, 0);
    // windows: warm light from inside (the hearth when it's lit)
    this.panes = [];
    const frameMat = std(0x3a2618, 0.8), paneMat = (this.paneMat = new THREE.MeshBasicMaterial({ color: 0xffa850 }));
    const win = (w, h, x, y, z, ry) => {
      const wg = new THREE.Group(); wg.position.set(x, y, z); wg.rotation.y = ry; hut.add(wg);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paneMat); wg.add(p);
      const bar = (bw, bh, bx, by) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 70), frameMat); b.position.set(bx, by, 20); wg.add(b); };
      bar(w + 220, 110, 0, h / 2 + 55); bar(w + 220, 110, 0, -h / 2 - 55); bar(110, h, -w / 2 - 55, 0); bar(110, h, w / 2 + 55, 0);
      bar(w, 50, 0, 0); bar(50, h, 0, 0);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 300, 70, 140), snowMat); sill.position.set(0, -h / 2 - 140, 60); wg.add(sill);
      return wg;
    };
    this.win = { x: -300, y: 1450, z: RY / 2 + LOG + 12 };
    this.winGroup = win(1100, 1200, this.win.x, this.win.y, this.win.z, 0);
    win(800, 800, 600, 1500, -(RY / 2 + LOG + 12), Math.PI);
    // the glow on the snow in front of each window
    const glowTex = radial([[0, 'rgba(255,170,90,0.55)'], [0.5, 'rgba(255,140,60,0.18)'], [1, 'rgba(255,120,40,0)']]);
    this.glows = [];
    for (const [x, z, w] of [[-300, RY / 2 + LOG + 900, 2600], [600, -(RY / 2 + LOG + 800), 2000]]) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.8), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.rotation.x = -Math.PI / 2; gl.position.set(x, 20, z); hut.add(gl); this.glows.push(gl);
    }
    const lamp = (this.lamp = new THREE.PointLight(0xffa860, 300, 90, 2)); lamp.position.set(-300 * S, YG + 1500 * S, (RY / 2 + 900) * S);
    this.root.add(lamp);
    // the door, in the gable end, with a step swept clear
    const door = new THREE.Group(); door.position.set(RX / 2 + LOG + 10, 0, 700); door.rotation.y = Math.PI / 2; hut.add(door);
    const dm = new THREE.Mesh(new THREE.BoxGeometry(950, 1950, 60), std(0x4a2f1b, 0.85, { emissive: 0x0a0503 })); dm.position.y = 975 + 120; door.add(dm);
    for (const yy of [500, 1650]) { const b = new THREE.Mesh(new THREE.BoxGeometry(980, 110, 40), frameMat); b.position.set(0, yy, 50); door.add(b); }
    const knob = new THREE.Mesh(new THREE.SphereGeometry(45, 8, 6), new THREE.MeshStandardMaterial({ color: 0xcaa24e, metalness: 1, roughness: 0.3 })); knob.position.set(330, 1100, 70); door.add(knob);
    const step = new THREE.Mesh(new THREE.BoxGeometry(1300, 120, 600), std(0x5a4030, 0.9)); step.position.set(0, 60, 320); door.add(step);
    this.doorGroup = door;
    hut.traverse((o) => { if (o.isMesh && o.material !== paneMat && !this.glows.includes(o)) { o.castShadow = true; o.receiveShadow = true; } });

    // holiday touches: C9 bulbs along the front and back eaves and a wreath on the door; a hanukkiah in the window
    const hol = (this.xmasG = new THREE.Group()); hol.visible = false; hut.add(hol);
    const cols = [0xff3a2a, 0x2ad04a, 0x3a6aff, 0xffa020, 0xfff2d0];
    const eaveY = ridge - hs * Math.tan(PITCH) + 40;
    this.bulbs = [];
    for (const sz of [-1, 1]) for (let i = 0, x = -RX / 2 - 400; x <= RX / 2 + 400; x += 420, i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(75, 8, 6), new THREE.MeshBasicMaterial({ color: cols[i % 5] })); b.scale.y = 1.4;
      b.position.set(x, eaveY - 60, sz * (hs + 30)); hol.add(b); this.bulbs.push(b);
    }
    const wreath = new THREE.Mesh(new THREE.TorusGeometry(260, 80, 8, 18), std(0x1d4a2a, 0.9, { emissive: 0x041208 })); wreath.position.set(0, 1500, 80); this.doorGroup.add(wreath);
    const bow = new THREE.Mesh(new THREE.SphereGeometry(90, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd02a20 })); bow.position.set(0, 1270, 140); this.doorGroup.add(bow);
    this.wreath = [wreath, bow]; wreath.visible = bow.visible = false;
    const han = (this.hanG = new THREE.Group()); han.visible = false; this.winGroup.add(han);
    for (let i = 0; i < 9; i++) {
      const x = (i - 4) * 110, f = new THREE.Mesh(new THREE.SphereGeometry(i === 4 ? 34 : 28, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe9a0 }));
      f.scale.y = 1.6; f.position.set(x, -460 + (i === 4 ? 120 : 0), 40); han.add(f);
    }
    const holder = new THREE.Mesh(new THREE.BoxGeometry(980, 40, 60), new THREE.MeshStandardMaterial({ color: 0xcaa24e, metalness: 1, roughness: 0.35 })); holder.position.set(0, -540, 40); han.add(holder);

    // smoke from the chimney when the fire's going
    const smokeTex = radial([[0, 'rgba(200,200,205,0.55)'], [0.6, 'rgba(170,170,180,0.2)'], [1, 'rgba(160,160,170,0)']]);
    this.puffs = [];
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
      sp.userData.age = i / 14 * 7; mini.add(sp); this.puffs.push(sp);
    }
  }

  buildSnow(g) {
    const N = (this.N = 1800);
    this.p = new Float32Array(N * 3); this.v = new Float32Array(N * 3); this.rest = new Uint8Array(N); this.fall = new Float32Array(N); this.ph = new Float32Array(N);
    for (let i = 0; i < N; i++) { this.fall[i] = rnd(3.5, 9); this.ph[i] = rnd(0, 100); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage));
    const flake = radial([[0, 'rgba(255,255,255,1)'], [0.45, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']], 32);
    const pts = (this.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 2.2, map: flake, transparent: true, depthWrite: false, color: 0xf4f8ff })));
    pts.frustumCulled = false; pts.renderOrder = 10; g.add(pts);
    this.scatter(true);
  }

  // the surface a flake comes to rest on (globe units): the snowfield, or the roof
  groundAt(x, z) {
    const xr = x / S, zr = z / S;
    if (Math.abs(xr) < this.roofHalf.x && Math.abs(zr) < this.roofHalf.z) return YG + S * this.roofTop(zr);
    return YG + S * H(xr, zr);
  }

  // just shaken: every flake in the air
  scatter(all) {
    const { p, v, rest } = this;
    for (let i = 0; i < this.N; i++) {
      if (!all && !rest[i] && Math.random() < 0.5) continue;
      let x, y, z;
      do { x = rnd(-R, R); y = rnd(CY - R, CY + R); z = rnd(-R, R); } while (Math.hypot(x, y - CY, z) > 0.93 * R || y < this.groundAt(x, z) + 2);
      p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z;
      v[i * 3] = rnd(-25, 25); v[i * 3 + 1] = rnd(-10, 30); v[i * 3 + 2] = rnd(-25, 25); rest[i] = 0;
    }
  }

  shake(k = 1) {
    this.agit = Math.min(1.5, this.agit + k);
    const { p, v, rest } = this;
    for (let i = 0; i < this.N; i++) {
      if (rest[i] && Math.random() < 0.85 * k) { rest[i] = 0; p[i * 3 + 1] += 1.5; v[i * 3] = rnd(-30, 30) * k; v[i * 3 + 1] = rnd(20, 70) * k; v[i * 3 + 2] = rnd(-30, 30) * k; }
      else if (!rest[i]) { v[i * 3] += rnd(-30, 30) * k; v[i * 3 + 1] += rnd(0, 40) * k; v[i * 3 + 2] += rnd(-30, 30) * k; }
    }
    this.swirl = Math.random() < 0.5 ? -1 : 1;
    this.tossMan(k);
    this.wob.vx += rnd(-1, 1) * 0.5 * k; this.wob.vz += rnd(-1, 1) * 0.5 * k;
  }

  // a shake throws him up into the swirl: he tumbles, comes down in a heap, and is not pleased about it
  tossMan(k) {
    const W = this.walker; if (!W || k < 0.3) return;
    const a = rnd(0, Math.PI * 2), h = rnd(900, 2200) * k;
    if (W.mode === 'tossed') { const T = this.toss; T.vx += Math.cos(a) * h * 0.6; T.vz += Math.sin(a) * h * 0.6; T.vy = Math.min(5200, T.vy + rnd(1500, 2800) * k); T.vrx += rnd(-5, 5); T.vrz += rnd(-5, 5);
      const hv = Math.hypot(T.vx, T.vz); if (hv > 3500) { T.vx *= 3500 / hv; T.vz *= 3500 / hv; } return; }
    this.toss = { y: this.man.position.y - H(W.x, W.z), vx: Math.cos(a) * h, vz: Math.sin(a) * h, vy: rnd(3600, 5600) * k, rx: 0, rz: 0, vrx: rnd(-9, 9) * k, vrz: rnd(-9, 9) * k, vh: rnd(-6, 6), bounces: 0 };
    W.mode = 'tossed'; W.t = 0;
  }

  setFire(on) { this.fire = on; }
  setXmas(on) { this.xmas = on; this.xmasG.visible = on; this.xmasLights.visible = on; for (const w of this.wreath) w.visible = on; }
  setHanukkah(on) { this.hanukkah = on; this.hanG.visible = on; }

  resize(w, h) {
    this.camera.aspect = w / h;
    // fit the whole globe and its base, portrait or landscape
    const vf = 34 * Math.PI / 360, hf = Math.atan(Math.tan(vf) * this.camera.aspect);
    this.fit = 150 / Math.sin(Math.min(vf, hf));
    this.camera.updateProjectionMatrix();
    if (this.active && !this.anim) this.place(1);
  }

  // the camera's two stops: nose to the little window (0), and stood back taking in the whole globe (1)
  pose(u) {
    const w = this.win;
    const tgt0 = new THREE.Vector3(w.x * S, YG + w.y * S, w.z * S), pos0 = tgt0.clone().add(new THREE.Vector3(0, 0.6, 9));
    const tgt1 = new THREE.Vector3(0, 46, 0), pos1 = tgt1.clone().add(new THREE.Vector3(0.12, 0.3, 1).normalize().multiplyScalar(this.fit || 560));
    const e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
    // pull straight back first, then rise
    const ep = Math.pow(e, 0.85);
    return { tgt: tgt0.lerp(tgt1, e), pos: pos0.lerp(pos1, ep), fov: 58 + (34 - 58) * e };
  }
  place(u) {
    const P = this.pose(u);
    this.camera.position.copy(P.pos); this.camera.fov = P.fov; this.camera.updateProjectionMatrix(); this.camera.lookAt(P.tgt);
  }

  enter() {
    this.active = true; this.agit = 0.9; this.scatter(true);
    this.anim = { t0: performance.now(), dur: 3400, from: 0, to: 1 };
    this.place(0);
  }
  exit(done) { this.anim = { t0: performance.now(), dur: 1900, from: 1, to: 0, done }; }

  // a tap anywhere stirs it
  tap() { this.shake(0.9); }
  // dragging turns the globe (sideways spins it on its base, up and down tips it toward you or away);
  // a quick back-and-forth is a shake. dx, dy in fractions of the view, dt in seconds
  grab() { const P = this.spin; P.held = true; P.vy = 0; P.flips = []; P.sign = 0; }
  drag(dx, dy, dt) {
    const P = this.spin, w = dx * Math.PI * 1.6;
    P.y += w; P.tilt = Math.max(-0.3, Math.min(0.55, P.tilt + dy * 1.4));
    const v = dt > 0 ? w / dt : 0; P.vy = P.vy * 0.5 + v * 0.5;
    // the snow lags behind the glass as it turns
    this.agit = Math.min(1.2, this.agit + Math.min(0.08, Math.abs(w) * 0.25)); if (Math.abs(w) > 0.002) this.swirl = -Math.sign(w);
    const sg = Math.sign(dx), now = performance.now();
    if (sg && Math.abs(v) > 3 && sg !== P.sign) { if (P.sign) P.flips.push(now); P.sign = sg; }
    P.flips = P.flips.filter((t) => now - t < 700);
    if (P.flips.length >= 2) { P.flips = []; this.shake(0.8); }
  }
  release() { this.spin.held = false; }

  footprint(x, z, heading) {
    const i = this.printN % 160; this.printN++;
    const side = (this.stepSide = -this.stepSide), ox = Math.cos(heading) * 110 * side, oz = -Math.sin(heading) * 110 * side;
    const px = x + ox, pz = z + oz, y = H(px, pz) + 4;
    const e = 25, nx = (H(px - e, pz) - H(px + e, pz)) / (2 * e), nz = (H(px, pz - e) - H(px, pz + e)) / (2 * e);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(nx, 1, nz).normalize());
    q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading));
    this.prints.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(px, y, pz), q, new THREE.Vector3(85, 1, 150)));
    this.printAge[i] = 0; this.prints.count = Math.min(160, this.printN);
    this.prints.instanceMatrix.needsUpdate = true;
  }

  // the old man's round: about the hut, now and then to the window, now and then a long stare out at you
  stepMan(dt) {
    const W = this.walker, man = this.man, { head, axe } = man.userData, kit = this.kit, { rx, rz } = this.ell;
    W.t += dt; W.cool -= dt;
    const ease = (u) => u * u * (3 - 2 * u);
    let lean = 0, peer = 0, bob = 0, stare = 0, walking = false, want = W.heading, glance = null;
    // he's a lurker: it takes him minutes to work up the nerve to look in
    if (W.mode === 'walk' || W.mode === 'pause' || W.mode === 'lurk' || W.mode === 'falter') W.nerve += dt;
    const lookAtWin = () => { const a = Math.atan2(this.win.x - W.x, this.win.z - W.z) - W.heading; return Math.atan2(Math.sin(a), Math.cos(a)); };
    const rzF = this.ell.rzF, rzAt = (phi) => (Math.sin(phi) > 0 ? rzF : rz);
    const ellAt = (phi) => [rx * Math.cos(phi), rzAt(phi) * Math.sin(phi)];
    const winPhi = Math.acos(this.win.x / rx);   // where the path passes the front window
    const zGlass = this.win.z + 60, clear = 10;
    const stand = [this.win.x, zGlass + clear + this.front0 + 260];
    const cornerPhi = [1, -1].map((sx) => Math.atan2((RY / 2 + LOG) / this.ell.rzF, sx * (RX / 2 + LOG) / rx));
    if (W.mode === 'tossed') {
      // up in the snow, slowed by the water, tumbling; he bounces off the hut and off the glass
      const T = this.toss, g = 3400, drag = Math.exp(-dt * 0.7);
      T.vy -= g * dt; T.vx *= drag; T.vz *= drag;
      W.x += T.vx * dt; W.z += T.vz * dt; T.y += T.vy * dt;
      const hx = RX / 2 + 1100, hz = RY / 2 + 900;
      if (Math.abs(W.x) < hx && Math.abs(W.z) < hz) {
        if (hx - Math.abs(W.x) < hz - Math.abs(W.z)) { W.x = Math.sign(W.x) * hx; T.vx = -T.vx * 0.5; } else { W.z = Math.sign(W.z) * hz; T.vz = -T.vz * 0.5; }
      }
      const rr = Math.hypot(W.x, W.z), rmax = RG * 0.82;
      if (rr > rmax) { W.x *= rmax / rr; W.z *= rmax / rr; const vn = (T.vx * W.x + T.vz * W.z) / rmax; if (vn > 0) { T.vx -= 1.6 * vn * W.x / rmax; T.vz -= 1.6 * vn * W.z / rmax; } }
      T.rx += T.vrx * dt; T.rz += T.vrz * dt; W.heading += T.vh * dt;
      // the glass: his middle (wherever the tumble has put it) stays far enough inside that no part of him pokes through
      {
        const cy = (CY - YG) / S, room = 0.95 * R / S - 1350;
        const o = new THREE.Vector3(0, 1100, 0).applyEuler(new THREE.Euler(T.rx, W.heading, T.rz));
        const fy = H(W.x, W.z) + T.y, px = W.x + o.x, py = fy + o.y - cy, pz = W.z + o.z, d = Math.hypot(px, py, pz);
        if (d > room) {
          const nx = px / d, ny = py / d, nz = pz / d, over = d - room;
          W.x -= nx * over; W.z -= nz * over; T.y -= ny * over;
          const vn = T.vx * nx + T.vy * ny + T.vz * nz;
          if (vn > 0) { T.vx -= 1.5 * vn * nx; T.vy -= 1.5 * vn * ny; T.vz -= 1.5 * vn * nz; }
        }
      }
      if (T.y <= 0 && T.vy < 0) {
        if (T.vy < -1800 && T.bounces < 2) { T.vy = -T.vy * 0.35; T.vrx *= 0.6; T.vrz *= 0.6; T.bounces++; T.y = 0; this.footprint(W.x, W.z, W.heading); this.footprint(W.x, W.z, W.heading); }
        else { T.y = 0; W.mode = 'flustered'; W.t = 0; W.len = rnd(2.8, 4.2); this.footprint(W.x, W.z, W.heading); this.footprint(W.x, W.z, W.heading);
          W.landRx = Math.atan2(Math.sin(T.rx), Math.cos(T.rx)); W.landRz = Math.atan2(Math.sin(T.rz), Math.cos(T.rz)); }
      }
      man.position.set(W.x, H(W.x, W.z) + T.y, W.z);
      man.rotation.set(T.rx, W.heading, T.rz);
      kit.setLean(0);
      man.userData.hands.forEach((hd, i) => hd.position.set((i ? 1 : -1) * 300, 1300 + 250 * Math.sin(this.t * 13 + i * 3), 150));   // arms flung out
      head.rotation.set(0.3 * Math.sin(this.t * 7), 0.4 * Math.sin(this.t * 5), 0);
      return;
    }
    const goTo = (tx, tz, speed) => {
      const dx = tx - W.x, dz = tz - W.z, d = Math.hypot(dx, dz);
      if (d < 30) return true;
      const st = Math.min(d, speed * dt); W.x += dx / d * st; W.z += dz / d * st; want = Math.atan2(dx, dz); walking = true; return false;
    };
    if (W.mode === 'walk') {
      const v = 650, [ex, ez] = [-rx * Math.sin(W.phi), rzAt(W.phi) * Math.cos(W.phi)], sp = Math.hypot(ex, ez);
      const before = Math.sin(W.phi - winPhi);
      W.phi += W.dir * v / sp * dt;
      [W.x, W.z] = ellAt(W.phi); want = Math.atan2(W.dir * ex, W.dir * ez); walking = true;
      // round the back of the hut he sometimes picks up (or leaves) the axe at the stump
      if (Math.sin(W.phi) < -0.97 && W.cool < -10) { W.cool = 0; const take = Math.random() < 0.4; kit.withAxe = take; axe.visible = take; this.stumpAxe.visible = !take; }
      const crossed = (p0) => Math.sign(Math.sin(W.phi - W.dir * v / sp * dt - p0)) !== Math.sign(Math.sin(W.phi - p0)) && Math.cos(W.phi - p0) > 0;
      const front = Math.sin(W.phi) > 0.55;
      // along the front he sidles past, eyes on the window, not quite looking in
      if (front) glance = Math.max(-1.1, Math.min(1.1, lookAtWin())) * 0.8;
      void before;
      if (crossed(winPhi)) {
        if (W.nerve >= W.need) { W.mode = 'toWin'; W.t = 0; W.nerve = 0; W.need = rnd(150, 330); }
        else if (Math.random() < 0.12 + 0.4 * W.nerve / W.need) {
          // nearly: a few steps toward the glass, a stop, and he thinks better of it
          W.mode = 'falter'; W.t = 0; W.back = [W.x, W.z]; W.to = [W.x + (stand[0] - W.x) * rnd(0.3, 0.55), W.z + (stand[1] - W.z) * rnd(0.3, 0.55)]; W.len = rnd(1.2, 2.6);
        }
      } else if ((crossed(cornerPhi[0]) || crossed(cornerPhi[1])) && Math.random() < 0.3) {
        // hanging about at the corner of the hut, peering round it at the window
        W.mode = 'lurk'; W.t = 0; W.len = rnd(4, 9);
      } else if (W.t > W.next) { W.mode = 'pause'; W.t = 0; W.len = rnd(2.5, 5); W.stare = Math.random() < 0.25; }
    } else if (W.mode === 'pause') {
      if (W.stare && W.t > 0.6) {
        // he turns and looks straight out at you
        const c = this.mini.worldToLocal(this.camera.position.clone());
        want = Math.atan2(c.x - W.x, c.z - W.z); stare = Math.min(1, (W.t - 0.6) / 0.8);
        W.stareUp = Math.atan2(c.y - 1600, Math.hypot(c.x - W.x, c.z - W.z));
      }
      if (W.t > W.len + (W.stare ? 2 : 0)) { W.mode = 'walk'; W.t = 0; W.next = rnd(8, 20); if (Math.random() < 0.3) W.dir = -W.dir; }
    } else if (W.mode === 'lurk') {
      // half hidden by the corner, turned toward the window, leaning out a little to see; then he slinks off
      want = W.heading + Math.max(-0.7, Math.min(0.7, lookAtWin())) * Math.min(1, W.t);
      glance = Math.max(-1.1, Math.min(1.1, lookAtWin()));
      lean = 0.3 * Math.min(1, W.t / 1.5) * (W.t < W.len - 1 ? 1 : Math.max(0, W.len - W.t));
      if (W.t > W.len) { W.mode = 'walk'; W.t = 0; W.next = rnd(8, 20); if (Math.random() < 0.4) W.dir = -W.dir; }
    } else if (W.mode === 'falter') {
      if (W.stage !== 'back') {
        if (goTo(W.to[0], W.to[1], 380)) { want = W.heading + lookAtWin(); glance = 0.15 * Math.sin(this.t * 3); if ((W.hold = (W.hold || 0) + dt) > W.len) { W.stage = 'back'; W.hold = 0; } }
      } else if (goTo(W.back[0], W.back[1], 720)) { W.mode = 'walk'; W.t = 0; W.stage = null; W.next = rnd(8, 20); }
    } else if (W.mode === 'flustered') {
      // picks himself up, flails, shakes his head, stamps about in a little circle
      if (W.t > 0.7) { want = W.heading + Math.sin(W.t * 2.3) * 1.2; if (Math.sin(W.t * 9) > 0.92) { this.stepT += 0.2; } }
      if (W.t > W.len) { W.mode = 'brush'; W.t = 0; }
    } else if (W.mode === 'brush') {
      if (W.t > 1.4) { W.mode = 'rejoin'; W.t = 0; W.phi = Math.atan2(W.z / (W.z > 0 ? rzF : rz), W.x / rx); }
    } else if (W.mode === 'rejoin') {
      const [tx, tz] = ellAt(W.phi);
      if (goTo(tx, tz, 750)) { W.mode = 'walk'; W.t = 0; W.next = rnd(8, 20); }
    } else if (W.mode === 'toWin') {
      if (goTo(stand[0], stand[1], 600)) { W.mode = 'lean'; W.t = 0; }
    } else if (W.mode === 'lean') { want = Math.PI; lean = ease(Math.min(1, W.t / 1.6)); if (W.t > 1.6) { W.mode = 'peer'; W.t = 0; } }
    else if (W.mode === 'peer') { want = Math.PI; lean = 1; peer = 1; if (W.t > 6.5) { W.mode = 'back'; W.t = 0; } }
    else if (W.mode === 'back') { want = Math.PI; lean = 1 - ease(Math.min(1, W.t / 1.4)); if (W.t > 1.4) { W.mode = 'leave'; W.t = 0; } }
    else if (W.mode === 'leave') {
      const [tx, tz] = ellAt(winPhi + W.dir * 0.25);
      if (goTo(tx, tz, 600)) { W.mode = 'walk'; W.t = 0; W.phi = winPhi + W.dir * 0.25; W.next = rnd(8, 20); W.cool = 25; }
    }
    // turn toward where he's going, not instantly
    let dh = want - W.heading; dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    W.heading += dh * Math.min(1, dt * (walking ? 3 : 2));
    if (walking) {
      bob = Math.abs(Math.sin(this.t * 4.4)) * 35;
      this.stepT += dt; if (this.stepT > 0.36) { this.stepT = 0; this.footprint(W.x, W.z, W.heading); }
    }
    // at the window he stands so his frontmost point stays outside the glass
    let z = W.z;
    if (lean > 0) { const zMin = zGlass + clear + this.front0 + (this.front1 - this.front0) * lean; z = Math.max(zMin, stand[1] - lean * (stand[1] - zMin)); }
    man.position.set(W.x, H(W.x, z) + bob, z);
    man.rotation.x = 0; man.rotation.y = W.heading; man.rotation.z = walking ? Math.sin(this.t * 2.2) * 0.04 : 0;
    kit.setLean(lean);
    const tP = this.t, hands = man.userData.hands;
    if (W.mode === 'flustered') {
      // righting himself from however he landed
      const u = Math.min(1, W.t / 0.6), k = 1 - u * u * (3 - 2 * u);
      man.rotation.x = (W.landRx || 0) * k; man.rotation.z = (W.landRz || 0) * k + Math.sin(W.t * 11) * 0.06 * u;
      man.position.y = H(W.x, W.z) + Math.max(0, Math.sin(W.t * 9)) * 90 * u;      // indignant little stamps
      hands.forEach((hd, i) => { if (i && kit.withAxe) return; const sx = i ? 1 : -1; hd.position.set(sx * (280 + 90 * Math.sin(tP * 12 + i)), 1150 + 380 * Math.sin(tP * 10 + i * 2.5), 160 + 60 * Math.cos(tP * 9)); });
      head.rotation.set(0.15 * Math.sin(tP * 6), 0.55 * Math.sin(tP * 14), 0.2 * Math.sin(tP * 7));
      if (Math.sin(W.t * 9) > 0.97 && this.stepT > 0.15) { this.stepT = 0; this.footprint(W.x, W.z, W.heading); }
      return;
    }
    if (W.mode === 'brush') {
      // brushing the snow off his coat, a last glare about
      hands.forEach((hd, i) => { if (i && kit.withAxe) return; const sx = i ? 1 : -1; hd.position.set(sx * 120, 900 + 260 * Math.abs(Math.sin(tP * 8 + i * 1.6)), 300); });
      head.rotation.set(0.25, 0.4 * Math.sin(tP * 1.5), 0);
      return;
    }
    head.rotation.set(
      -0.1 * lean + (peer ? 0.08 * Math.sin(tP * 0.7) : 0) - stare * Math.max(-0.4, Math.min(0.5, W.stareUp || 0)),
      peer ? 0.5 * Math.sin(tP * 0.45) + 0.15 * Math.sin(tP * 1.7) : glance !== null ? (W.glance = (W.glance || 0) + (glance - (W.glance || 0)) * Math.min(1, dt * 2.5)) : (W.glance = (W.glance || 0) * 0.9) + (walking ? 0.25 * Math.sin(tP * 0.5) : 0),
      peer ? 0.12 * Math.sin(tP * 0.33) : stare * 0.15);
  }

  stepSnow(dt) {
    const { p, v, rest, fall, ph, N } = this;
    this.agit *= Math.exp(-dt / 3.2);
    const A = this.agit, sw = (this.swirl || 1) * 55 * A, t = this.t, Rw = 0.955 * R;
    for (let i = 0; i < N; i++) {
      if (rest[i]) continue;
      const k = i * 3;
      let x = p[k], y = p[k + 1], z = p[k + 2];
      const r = Math.hypot(x, z) + 1e-3, rr = r / R;
      // a swirl round the middle, rising in the centre and sinking by the glass, then falling at its own pace
      const tx = -z / r * sw + Math.sin(t * 1.3 + ph[i]) * (2 + 20 * A), tz = x / r * sw + Math.cos(t * 1.1 + ph[i]) * (2 + 20 * A);
      const ty = A * 45 * (1 - 2 * rr * rr) - fall[i] + Math.sin(t * 0.9 + ph[i] * 2) * 1.5;
      const c = Math.min(1, dt * 1.6);
      v[k] += (tx - v[k]) * c; v[k + 1] += (ty - v[k + 1]) * c; v[k + 2] += (tz - v[k + 2]) * c;
      x += v[k] * dt; y += v[k + 1] * dt; z += v[k + 2] * dt;
      // the glass
      const dy = y - CY, d = Math.hypot(x, dy, z);
      if (d > Rw) {
        const nx = x / d, ny = dy / d, nz = z / d, vn = v[k] * nx + v[k + 1] * ny + v[k + 2] * nz;
        x = nx * Rw; y = CY + ny * Rw; z = nz * Rw;
        if (vn > 0) { v[k] -= 1.5 * vn * nx; v[k + 1] -= 1.5 * vn * ny; v[k + 2] -= 1.5 * vn * nz; }
      }
      // the snowfield (or the roof)
      const gy = this.groundAt(x, z);
      if (y < gy + 0.3) {
        if (A < 0.3 && v[k + 1] < 0) { y = gy + 0.3; rest[i] = 1; }
        else { y = gy + 0.3; v[k + 1] = Math.abs(v[k + 1]) * 0.4; }
      }
      p[k] = x; p[k + 1] = y; p[k + 2] = z;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
  }

  frame(dt) {
    this.t += dt;
    const now = performance.now();
    if (this.anim) {
      const A = this.anim, u = Math.min(1, (now - A.t0) / A.dur);
      this.place(A.from + (A.to - A.from) * u);
      if (u >= 1) { this.anim = null; if (A.done) A.done(); }
    }
    // rocking after a shake, settling back upright
    const W = this.wob, kk = 38, damp = 3.2;
    W.vx += (-kk * W.x - damp * W.vx) * dt; W.vz += (-kk * W.z - damp * W.vz) * dt; W.x += W.vx * dt; W.z += W.vz * dt;
    // turning it on its base (with a little coast after you let go)
    const P = this.spin;
    if (!P.held) { P.y += P.vy * dt; P.vy *= Math.exp(-dt * 1.6); }
    this.root.rotation.set(P.tilt + W.x * 0.12, P.y, W.z * 0.12);
    this.stepSnow(dt);
    this.stepMan(dt);
    // footprints fill in over a minute or so
    if ((this.fpT = (this.fpT || 0) + dt) > 0.5) {
      const col = new THREE.Color(), fresh = new THREE.Color(0x8592a8), snow = new THREE.Color(0xeef2f8);
      for (let i = 0; i < Math.min(160, this.printN); i++) { this.printAge[i] += this.fpT; this.prints.setColorAt(i, col.copy(fresh).lerp(snow, Math.min(1, this.printAge[i] / 70))); }
      this.prints.instanceColor.needsUpdate = true; this.fpT = 0;
    }
    // the windows: a soft lamp glow, a lively flicker when the fire's going
    const fl = this.fire ? 0.85 + 0.15 * Math.sin(this.t * 9) * Math.sin(this.t * 5.3 + 1) + 0.08 * Math.sin(this.t * 23) : 0.55;
    this.paneMat.color.setRGB(1.0 * fl + 0.1, 0.62 * fl + 0.05, 0.28 * fl);
    this.lamp.intensity = 300 * fl;
    for (const gl of this.glows) gl.material.opacity = fl;
    if (this.xmas) {
      // a slow, uneven twinkle, the way old bulbs do
      const X = this.xmasCol;
      for (let i = 0; i < X.n; i++) { const f = 0.75 + 0.25 * Math.sin(this.t * (0.7 + (i % 5) * 0.23) + X.ph[i]) * Math.sin(this.t * 1.9 + X.ph[i] * 0.5); for (let c = 0; c < 3; c++) X.col[i * 3 + c] = X.base[i * 3 + c] * f; }
      X.attr.needsUpdate = true;
    }
    if (this.xmas) this.bulbs.forEach((b, i) => { b.scale.setScalar(1 + 0.05 * Math.sin(this.t * 2 + i)); b.scale.y *= 1.4; });
    if (this.hanukkah) this.hanG.children.forEach((f, i) => { if (i < 9) f.scale.set(1, 1.6 + 0.25 * Math.sin(this.t * 11 + i * 2.1), 1); });
    // chimney smoke
    for (const sp of this.puffs) {
      const a = (sp.userData.age += dt), life = 7;
      if (a > life) sp.userData.age -= life;
      const u = sp.userData.age / life;
      sp.position.set(this.chimneyTop.x + u * 900 + Math.sin(u * 6 + this.t * 0.5) * 150, this.chimneyTop.y + u * 2800, this.chimneyTop.z + Math.sin(u * 4) * 200);
      sp.scale.setScalar(450 + u * 1500);
      sp.material.opacity = this.fire ? 0.5 * Math.sin(Math.PI * u) : 0;
    }
  }
}
