// Shared building blocks for the realistic pass: softened timber and box shapes with real-scale UVs,
// firewood, and fire that is drawn by a shader (flames, embers, sparks) instead of glowing blobs.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Q } from './quality.js';

const R = (a, b) => a + Math.random() * (b - a);

// UVs by flat projection along each face's dominant axis, in tiles of `mm`. `grain` names the axis the
// wood grain runs along; it is mapped to v (the scans' grain runs up the image) unless grainU is set.
export function triUV(g, mm = 1000, grain = 'x', grainU = false) {
  const P = g.attributes.position, N = g.attributes.normal, uv = g.attributes.uv || new THREE.BufferAttribute(new Float32Array(P.count * 2), 2);
  const ou = Math.random() * 5, ov = Math.random() * 5, ax = { x: 0, y: 1, z: 2 }[grain];
  const p = [0, 0, 0];
  for (let i = 0; i < P.count; i++) {
    p[0] = P.getX(i); p[1] = P.getY(i); p[2] = P.getZ(i);
    const n = [Math.abs(N.getX(i)), Math.abs(N.getY(i)), Math.abs(N.getZ(i))];
    const dom = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
    const others = [0, 1, 2].filter((a) => a !== dom);
    let a = others[0], b = others[1];
    if (a === ax) { a = others[1]; b = others[0]; }            // b carries the grain axis when the face has it
    const u = p[a] / mm + ou + dom * 0.31, v = p[b] / mm + ov + dom * 0.17;
    if (grainU) uv.setXY(i, v, u); else uv.setXY(i, u, v);
  }
  g.setAttribute('uv', uv);
  return g;
}
// a box with eased edges (they catch the light, as real edges do)
export function roundBox(w, h, d, r = 4, mm = 1000, grain = 'x', seg = 2) {
  const rr = Math.min(r, w / 2 - 0.01, h / 2 - 0.01, d / 2 - 0.01);
  return triUV(new RoundedBoxGeometry(w, h, d, seg, Math.max(0.01, rr)), mm, grain);
}

// A hand-hewn timber lying along x: a rounded-rectangle section whose faces wander a few millimetres
// (adze work), with UVs around the section (u) and along the length (v), in tiles of `mm`.
export function hewnBeam(len, h, d, { mm = 700, r = 18, wobble = 3, step = 140, seed = Math.random() * 100 } = {}) {
  const ring = [], cs = 3;
  const hw = d / 2 - r, hh = h / 2 - r;
  for (const [cx, cy, a0] of [[hw, hh, 0], [-hw, hh, Math.PI / 2], [-hw, -hh, Math.PI], [hw, -hh, Math.PI * 1.5]])
    for (let k = 0; k <= cs; k++) { const a = a0 + (k / cs) * Math.PI / 2; ring.push([cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  const K = ring.length, Nn = Math.max(2, Math.ceil(len / step));
  const per = [0]; for (let j = 1; j <= K; j++) { const a = ring[j - 1], b = ring[j % K]; per.push(per[j - 1] + Math.hypot(a[0] - b[0], a[1] - b[1])); }
  const pos = [], uv = [], idx = [], u0 = Math.random(), v0 = Math.random() * 3;
  const wob = (x, j) => wobble * (Math.sin(x * 0.011 + j * 1.7 + seed) * 0.6 + Math.sin(x * 0.037 + j * 0.9 + seed * 2.3) * 0.4);
  for (let i = 0; i <= Nn; i++) {
    const x = -len / 2 + (i / Nn) * len;
    for (let j = 0; j <= K; j++) {
      const q = ring[j % K], w = wob(x, j % K);
      pos.push(x, q[1] + q[3] * w, q[0] + q[2] * w);
      uv.push(per[j] / mm + u0, x / mm + v0);
    }
  }
  for (let i = 0; i < Nn; i++) for (let j = 0; j < K; j++) { const a = i * (K + 1) + j, b = a + K + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---- firewood: a round or split log with bark outside and pale, ringed end grain ----
let endTex = null;
export function endGrain() {
  if (endTex) return endTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#c9a26c'; x.fillRect(0, 0, 256, 256);
  const cx = 118, cy = 134;
  for (let r = 3; r < 190; r += R(2.5, 5.5)) { x.strokeStyle = `rgba(${90 + R(0, 40)},${58 + R(0, 25)},${30},${R(0.35, 0.8)})`; x.lineWidth = R(0.8, 2.2); x.beginPath(); x.ellipse(cx, cy, r, r * R(0.94, 1.04), 0, 0, 7); x.stroke(); }
  x.strokeStyle = 'rgba(40,24,12,0.8)'; for (let k = 0; k < 5; k++) { const a = R(0, 6.3); x.lineWidth = R(1, 2.5); x.beginPath(); x.moveTo(cx + Math.cos(a) * R(4, 20), cy + Math.sin(a) * R(4, 20)); x.lineTo(cx + Math.cos(a + R(-0.1, 0.1)) * R(60, 125), cy + Math.sin(a) * R(60, 125)); x.stroke(); }
  const g = x.createRadialGradient(cx, cy, 2, cx, cy, 30); g.addColorStop(0, 'rgba(70,40,20,0.8)'); g.addColorStop(1, 'rgba(70,40,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  endTex = new THREE.CanvasTexture(c); endTex.colorSpace = THREE.SRGBColorSpace; return endTex;
}
// kind: 'round' | 'half' | 'quarter'; lies along z, centred. Returns a mesh with [bark, end, split] materials.
export function firewood(r, len, bark, { kind = 'round', endMat = null, splitMat = null } = {}) {
  const arc = kind === 'round' ? Math.PI * 2 : kind === 'half' ? Math.PI : Math.PI / 2;
  const seg = kind === 'round' ? 14 : 8, g = new THREE.CylinderGeometry(r, r * R(0.9, 1.05), len, seg, 4, false, 0, arc);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {           // not a perfect cylinder: lumps, a slight bend
    const y = P.getY(i), a = Math.atan2(P.getZ(i), P.getX(i)), k = 1 + 0.07 * Math.sin(a * 3 + r) + 0.04 * Math.sin(y * 0.02 + a * 2);
    P.setX(i, P.getX(i) * k + 0.0000012 * y * y * r); P.setZ(i, P.getZ(i) * k);
  }
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (arc * r) / 500, uv.getY(i) * len / 500);
  g.computeVertexNormals(); g.rotateX(Math.PI / 2);
  const end = endMat || new THREE.MeshStandardMaterial({ map: endGrain(), roughness: 0.85 });
  const split = splitMat || new THREE.MeshStandardMaterial({ color: 0xd2ad78, roughness: 0.8 });
  const grp = new THREE.Group();
  const m = new THREE.Mesh(g, [bark, end, end]); m.castShadow = true; m.receiveShadow = true; grp.add(m);
  if (kind !== 'round') {
    // the split faces (the half is the +x half; the quarter is the +x, -y quadrant)
    const face = (geo, x, y) => { geo.translate(x, y, 0); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * len / 400); const f = new THREE.Mesh(geo, split); f.receiveShadow = true; f.castShadow = true; grp.add(f); };
    if (kind === 'half') face(new THREE.PlaneGeometry(len, 2 * r).rotateY(-Math.PI / 2), 0, 0);
    else { face(new THREE.PlaneGeometry(len, r).rotateY(-Math.PI / 2), 0, -r / 2); face(new THREE.PlaneGeometry(r, len).rotateX(-Math.PI / 2), r / 2, 0); }
  }
  return grp;
}

// ---------------------------------------------------------------- fire
const NOISE = `
  float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }`;
const BILLBOARD = `
  uniform vec2 size; varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec3 up = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    vec3 right = normalize(cross(up, vec3(0.0, 0.0, 1.0)));
    vec3 p = c.xyz + right * (position.x * size.x) + up * (position.y * size.y);
    gl_Position = projectionMatrix * vec4(p, 1.0);
  }`;
const quad = (() => { let g = null; return () => { if (!g) { g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); } return g; }; })();

// one tongue of a wood fire: turbulence scrolling upward through a tapering body
function tongueMaterial(seed) {
  return new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, level: { value: 1 }, seed: { value: seed }, size: { value: new THREE.Vector2(300, 500) }, gain: { value: 0.42 } },
    vertexShader: BILLBOARD,
    fragmentShader: `uniform float time, level, seed, gain; varying vec2 vUv; ${NOISE}
      void main() {
        float y = vUv.y, x = (vUv.x - 0.5) * 2.0;
        float n = fbm(vec2(x * 1.6 + seed, y * 2.0 - time * 1.7 + seed * 3.0));
        float n2 = fbm(vec2(x * 3.6 - seed, y * 4.5 - time * 3.0));
        float xx = x + (n - 0.5) * 0.9 * y;
        float h = clamp(level, 0.0, 1.2) * (0.62 + 0.5 * fbm(vec2(seed * 7.0 + time * 0.9, xx * 1.3)));
        float taper = 0.8 * pow(max(0.0, 1.0 - y / max(h, 0.04)), 0.7) + 0.02;
        float body = 1.0 - smoothstep(0.35, 1.0, abs(xx) / taper);
        float f = body * (0.35 + 1.1 * n2) * smoothstep(0.0, 0.05, y) * (1.0 - smoothstep(h * 0.55, h, y) * 0.85);
        f = clamp(f * 1.5, 0.0, 1.6);
        vec3 col = mix(vec3(0.85, 0.10, 0.01), vec3(1.0, 0.42, 0.05), smoothstep(0.08, 0.5, f));
        col = mix(col, vec3(1.0, 0.74, 0.3), smoothstep(0.6, 1.3, f));
        float a = smoothstep(0.04, 0.45, f);
        gl_FragColor = vec4(col * a * gain * (0.45 + 0.55 * f), a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
}
// a candle flame: a steady teardrop, pale core, blue at the foot, see-through round the wick
export function candleFlame(height = 30, width = 12) {
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, lean: { value: 0 }, size: { value: new THREE.Vector2(width, height) }, gain: { value: 3.0 }, opacity: { value: 1 } },
    vertexShader: BILLBOARD,
    fragmentShader: `uniform float time, lean, gain, opacity; varying vec2 vUv; ${NOISE}
      void main() {
        float y = vUv.y, x = (vUv.x - 0.5) * 2.0;
        x -= lean * y * y * 1.6 + 0.05 * sin(time * 9.0 + y * 6.0) * y * y;
        float w = 1.75 * pow(y, 0.5) * pow(max(0.0, 1.0 - y), 0.9) + 0.02;
        float d = abs(x) / w;
        float body = 1.0 - smoothstep(0.55, 1.0, d);
        float core = (1.0 - smoothstep(0.0, 0.7, d)) * smoothstep(0.05, 0.3, y) * (1.0 - smoothstep(0.5, 1.0, y));
        vec3 col = mix(vec3(1.0, 0.42, 0.07), vec3(1.0, 0.9, 0.6), core);
        float blue = 1.0 - smoothstep(0.03, 0.24, y);
        col = mix(col, vec3(0.12, 0.28, 1.0), blue * 0.9);
        float a = body * mix(1.0, 0.45, blue);
        a *= 1.0 - 0.55 * (1.0 - smoothstep(0.0, 0.35, d)) * (1.0 - smoothstep(0.08, 0.3, y));
        a *= opacity;
        gl_FragColor = vec4(col * a * gain, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(quad(), m); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

function emberTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i++) {
    const px = R(0, 256), py = R(0, 256), r = R(5, 16), heat = Math.random();
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, heat > 0.75 ? 'rgba(255,225,150,1)' : heat > 0.4 ? 'rgba(255,120,30,0.95)' : 'rgba(170,35,8,0.9)'); g.addColorStop(0.7, 'rgba(120,20,4,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * R(0.6, 1), R(0, 3), 0, 7); x.fill();
  }
  // ash: grey flecks lying over the coals
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${R(20, 60)},${R(18, 50)},${R(16, 45)},${R(0.3, 0.9)})`; x.fillRect(R(0, 256), R(0, 256), R(1, 5), R(1, 4)); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function crackTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); x.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    let px = R(0, 256), py = R(0, 256); x.strokeStyle = `rgba(255,${Math.floor(R(70, 170))},${Math.floor(R(10, 50))},${R(0.5, 1)})`; x.lineWidth = R(0.8, 2.6);
    x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R(-14, 14); py += R(4, 16); x.lineTo(px, py); } x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// A wood fire on a hearth: iron firedogs, burning logs on a bed of coals, flames, sparks, its light.
// Local frame: x out into the room, y up, z along the hearth; origin on the hearth floor, mid-fire.
export class Fire {
  constructor({ width = 640, bark = null, light = 2.4e6 } = {}) {
    const g = (this.group = new THREE.Group());
    this.t = 0; this.level = 0; this.n = 0; this.base = light;
    const iron = new THREE.MeshStandardMaterial({ color: 0x18161a, metalness: 0.75, roughness: 0.6 });
    // firedogs
    for (const sz of [-1, 1]) {
      const z = sz * width * 0.3;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(330, 16, 16), iron); bar.position.set(-10, 70, z); bar.castShadow = true; g.add(bar);
      const front = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 270, 10), iron); front.position.set(150, 135, z); front.castShadow = true; g.add(front);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(26, 14, 10), iron); knob.position.set(150, 285, z); g.add(knob);
      for (const fx of [150, -160]) { const foot = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 70, 8), iron); foot.position.set(fx, 35, z); g.add(foot); }
    }
    // coals and ash
    this.emberMat = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1, emissive: 0xffffff, emissiveMap: emberTexture(), emissiveIntensity: 0 });
    const bedG = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2); bedG.scale(210, 60, width * 0.47);
    { const P = bedG.attributes.position; for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) * (0.75 + 0.5 * Math.sin(P.getX(i) * 0.05) * Math.sin(P.getZ(i) * 0.04)) + R(-3, 3)); bedG.computeVertexNormals(); }
    const bed = new THREE.Mesh(bedG, this.emberMat); bed.position.set(-10, 2, 0); g.add(bed);
    const ash = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ color: 0x6a655e, roughness: 1 })); ash.rotation.x = -Math.PI / 2; ash.scale.set(290, width * 0.55, 1); ash.position.set(0, 1, 0); ash.receiveShadow = true; g.add(ash);
    // logs: charred bark with glowing cracks, laid across the dogs and one leaning on top
    this.logMat = (bark ? bark.clone() : new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 0.95 }));
    this.logMat.color = new THREE.Color(0x4a3a30); this.logMat.emissive = new THREE.Color(0xffffff); this.logMat.emissiveMap = crackTexture(); this.logMat.emissiveIntensity = 0;
    const endM = new THREE.MeshStandardMaterial({ color: 0x1c1410, roughness: 1, emissive: 0xff5a14, emissiveIntensity: 0 }); this.endMat = endM;
    for (const [x, y, zr, len, r, ry, rz] of [[-80, 135, 0, width * 0.86, 58, 0.06, 0], [50, 128, 0, width * 0.8, 50, -0.1, 0.02], [-20, 228, 20, width * 0.7, 46, 0.22, -0.16]]) {
      const l = firewood(r, len, this.logMat, { endMat: endM }); l.position.set(x, y, zr); l.rotation.set(0, ry, rz); g.add(l);
    }
    // flames
    this.tongues = [];
    const N = 8;
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(quad(), tongueMaterial(R(0, 50))); m.frustumCulled = false; m.renderOrder = 6;
      const z = (i / (N - 1) - 0.5) * width * 0.74 + R(-25, 25), big = i % 2 === 0;
      m.position.set(R(-70, 60), big ? 90 : 150, z);
      m.material.uniforms.size.value.set(big ? R(300, 380) : R(180, 260), big ? R(560, 700) : R(380, 480));
      g.add(m); this.tongues.push({ m, k: R(0.8, 1.15), ph: R(0, 6) });
    }
    // sparks: a few bright motes carried up the chimney
    const NS = 26, sp = new Float32Array(NS * 3); this.sparks = [];
    for (let i = 0; i < NS; i++) this.sparks.push({ x: 0, y: -1, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
    this.sparkGeo = new THREE.BufferGeometry(); this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); const gr = x.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 16, 16); return new THREE.CanvasTexture(c); })();
    this.sparkPts = new THREE.Points(this.sparkGeo, new THREE.PointsMaterial({ size: 14, map: dot, color: new THREE.Color(4, 1.6, 0.4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.sparkPts.frustumCulled = false; g.add(this.sparkPts);
    // light: the main one stands a little in front of the fire (so the surround doesn't swallow it) and
    // throws the room's shadows; a second, inside, lights the firebox itself
    this.light = new THREE.PointLight(0xff8a3c, 0, 0, 2); this.light.position.set(150, 270, 0);
    if (Q.fireShadow) { this.light.castShadow = true; this.light.shadow.mapSize.set(Q.shadow / 2, Q.shadow / 2); this.light.shadow.camera.near = 30; this.light.shadow.camera.far = 12000; this.light.shadow.bias = -0.0015; this.light.shadow.normalBias = 8; this.light.shadow.radius = 4; }
    g.add(this.light);
    this.inner = new THREE.PointLight(0xff7a2c, 0, 1400, 2); this.inner.position.set(40, 330, 0); g.add(this.inner);
  }
  // level 0..1: how well it has caught
  update(dt, level) {
    this.t += dt; this.level = level;
    this.n += (Math.random() * 2 - 1 - this.n) * Math.min(1, dt * 8);
    const F = level, lvl = (1 + 0.2 * this.n + 0.07 * Math.sin(this.t * 13.7)) * F;
    this.light.intensity = this.base * lvl + this.base * 0.012;
    this.light.position.set(150 + 10 * this.n, 270 + 20 * Math.sin(this.t * 7.3) * F, 30 * Math.sin(this.t * 4.1 + this.n));
    this.inner.intensity = 0;
    this.emberMat.emissiveIntensity = (0.5 + 2.6 * F) * (1 + 0.12 * Math.sin(this.t * 2.3) + 0.1 * this.n);
    this.logMat.emissiveIntensity = 2.2 * F * (1 + 0.2 * this.n);
    this.endMat.emissiveIntensity = 0.5 * F;
    for (const f of this.tongues) {
      const u = f.m.material.uniforms; u.time.value = this.t * f.k + f.ph;
      u.level.value = Math.min(1.15, F * 1.25) * (0.86 + 0.14 * Math.sin(this.t * (2 + f.k) + f.ph));
      f.m.visible = F > 0.03;
    }
    const P = this.sparkGeo.attributes.position.array;
    for (let i = 0; i < this.sparks.length; i++) {
      const s = this.sparks[i];
      if (s.life <= 0) { if (F > 0.3 && Math.random() < dt * 0.5 * F) { s.x = R(-60, 60); s.y = R(150, 260); s.z = R(-200, 200); s.vx = R(-60, 120); s.vy = R(500, 1100); s.vz = R(-90, 90); s.life = R(0.5, 1.3); } else { P[i * 3 + 1] = -1e5; continue; } }
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vx += R(-400, 400) * dt; s.vz += R(-400, 400) * dt;
      P[i * 3] = s.x; P[i * 3 + 1] = s.life > 0 ? s.y : -1e5; P[i * 3 + 2] = s.z;
    }
    this.sparkGeo.attributes.position.needsUpdate = true;
  }
}
