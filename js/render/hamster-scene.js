// The hamster rig in 3D: a golden hamster with shell-rendered fur, running in a wire wheel
// whose hub pulley drives the music box crank through a quarter-twist O-ring belt.
// Scene units are millimetres; the wheel turns about z (it faces the camera), the crank about x.
import * as THREE from 'three';
import { GAITS } from '../physics/hamster.js';

// ---------------------------------------------------------------- signed distance helpers
const sdEll = (px, py, pz, cx, cy, cz, rx, ry, rz) => {
  const x = px - cx, y = py - cy, z = pz - cz;
  const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k0 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
};
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - (h * h * k) / 4; };
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
// cheap smooth 3D value noise for colour boundaries
function vnoise(x, y, z) {
  const h = (i, j, k) => { let n = i * 374761393 + j * 668265263 + k * 2147483647; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) & 0xffff) / 0xffff; };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++)
    r += h(xi + a, yi + b, zi + c) * (a ? u : 1 - u) * (b ? v : 1 - v) * (c ? w : 1 - w);
  return r;
}

// Mesh a star-shaped SDF: shoot a ray from `c` through every vertex of a sphere and stop at
// the surface; normals from the SDF gradient. Per-vertex colour, fur length, comb, ticking.
function starMesh(sdf, c, segU, segV, paint) {
  const g = new THREE.SphereGeometry(1, segU, segV);
  const P = g.attributes.position, n = P.count;
  const nor = new Float32Array(n * 3), col = new Float32Array(n * 3), len = new Float32Array(n), comb = new Float32Array(n * 3), tick = new Float32Array(n);
  const out = {}, e = 0.4;
  for (let i = 0; i < n; i++) {
    const dx = P.getX(i), dy = P.getY(i), dz = P.getZ(i);
    let t0 = 0, t1 = 1;
    while (sdf(c.x + dx * t1, c.y + dy * t1, c.z + dz * t1) < 0 && t1 < 200) { t0 = t1; t1 += 1.5; }
    for (let k = 0; k < 16; k++) { const tm = (t0 + t1) / 2; if (sdf(c.x + dx * tm, c.y + dy * tm, c.z + dz * tm) < 0) t0 = tm; else t1 = tm; }
    const x = c.x + dx * t0, y = c.y + dy * t0, z = c.z + dz * t0;
    P.setXYZ(i, x, y, z);
    let gx = sdf(x + e, y, z) - sdf(x - e, y, z), gy = sdf(x, y + e, z) - sdf(x, y - e, z), gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const gl = Math.hypot(gx, gy, gz) || 1; gx /= gl; gy /= gl; gz /= gl;
    nor[i * 3] = gx; nor[i * 3 + 1] = gy; nor[i * 3 + 2] = gz;
    paint(x, y, z, gx, gy, gz, out);
    col[i * 3] = out.r; col[i * 3 + 1] = out.g; col[i * 3 + 2] = out.b;
    len[i] = out.len; tick[i] = out.tick;
    // fur lies back along the body and droops a little: comb = tangent part of (back, down)
    let tx = out.cx, ty = out.cy, tz = out.cz; const d = tx * gx + ty * gy + tz * gz;
    tx -= d * gx; ty -= d * gy; tz -= d * gz;
    comb[i * 3] = tx; comb[i * 3 + 1] = ty; comb[i * 3 + 2] = tz;
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('furLen', new THREE.BufferAttribute(len, 1));
  g.setAttribute('comb', new THREE.BufferAttribute(comb, 3));
  g.setAttribute('tick', new THREE.BufferAttribute(tick, 1));
  g.computeBoundingSphere();
  return g;
}

// Shell fur: the same mesh drawn N times, each pushed out along the normal; a 3D lattice of
// jittered strands (one per 0.7 mm cell, random length, tapering) decides what each shell keeps.
// Hairs are agouti: grey base, golden shaft, dark tip on the back; ivory on the belly.
function furMaterial(t, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.8 });
  if (t > 0) m.alphaToCoverage = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.shellT = { value: t };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float furLen; attribute vec3 comb; attribute float tick;
        uniform float shellT; varying vec3 vFur; varying float vTick; varying float vLen;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vFur = position; vTick = tick; vLen = furLen;
        transformed += normal * furLen * shellT + comb * furLen * shellT * shellT * 0.9;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float shellT; varying vec3 vFur; varying float vTick; varying float vLen;
        float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        vec3 h33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float cov = 1.0;
          if (shellT > 0.0) {
            vec3 q = vFur * ${(1 / (opts.cell || 0.5)).toFixed(4)};
            vec3 c = floor(q), f = fract(q);
            vec3 j = 0.22 + 0.56 * h33(c);
            float hl = 0.62 + 0.38 * h31(c + 7.13);
            float s = shellT / hl;
            float r = 0.62 * (1.0 - s * 0.8);
            float d = length(f - j);
            cov = s < 1.0 ? 1.0 - smoothstep(r - 0.2, r, d) : 0.0;
            cov *= smoothstep(0.15, 0.6, vLen);
            if (cov < 0.02) discard;
            // agouti banding: grey-brown base, coloured shaft, dark tip on ticked (dorsal) hair
            float base = 1.0 - smoothstep(0.0, 0.35, s);
            float tip = smoothstep(0.7, 0.95, s) * vTick;
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.7, 0.66, 0.62), base * 0.5);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.42, 0.33, 0.26), tip * 0.55);
            diffuseColor.rgb *= 0.94 + 0.12 * h31(c + 3.7);
          }
          diffuseColor.rgb *= mix(0.62, 1.08, sqrt(shellT));   // light reaches deeper hair less
          diffuseColor.a = cov;
        }`);
  };
  m.customProgramCacheKey = () => 'hamfur-' + (opts.cell || 0.5);
  return m;
}

const C = (hex) => new THREE.Color(hex);
const GOLD = C(0xe0a35e), GOLD_DK = C(0xb57839), CREAM = C(0xf6efe3), FLASH = C(0x4a3b31), PINKISH = C(0xd8b39a);

// ---------------------------------------------------------------- the hamster
export class HamsterModel {
  constructor({ mass = 0.125, shells = 16 } = {}) {
    const s = Math.cbrt(mass / 0.125);
    this.scale = s;
    const root = (this.root = new THREE.Group());   // origin: on the tread between the feet; +x forward, +y up, +z his left
    const body = (this.body = new THREE.Group()); root.add(body);
    body.scale.setScalar(s);
    const sp = (this.spine = new THREE.Group()); body.add(sp);     // pivot near the hips for rearing / bounding
    sp.position.set(-30, 22, 0);
    const tor = new THREE.Group(); tor.position.set(30, -22, 0); sp.add(tor);
    this.torso = tor;

    // ----- body -----
    const bodySdf = (x, y, z) => {
      let d = sdEll(x, y, z, -15, 35, 0, 43, 32, 33);
      d = smin(d, sdEll(x, y, z, -36, 32, 0, 29, 30, 34), 11);     // broad rump
      d = smin(d, sdEll(x, y, z, 12, 32, 0, 27, 27, 27), 11);      // shoulders / chest
      d = smin(d, sdEll(x, y, z, -12, 23, 0, 41, 19, 29), 9);      // belly
      return d;
    };
    const bodyPaint = (x, y, z, nx, ny, nz, o) => {
      const nse = vnoise(x * 0.08, y * 0.08, z * 0.08) - 0.5;
      const hb = 23 + 9 * smooth(-30, 30, x) + 7 * nse;              // belly line, rising to the throat
      const belly = 1 - smooth(hb - 4, hb + 4, y);
      const dorsal = Math.max(0, ny) ** 2 * (1 - smooth(10, 40, x));
      let c = GOLD.clone().lerp(GOLD_DK, dorsal * 0.55 + 0.15 * nse);
      // dark cheek flash carried onto the shoulder, and the white crescent behind it
      const az = Math.abs(z);
      const flash = smooth(14, 22, az) * smooth(16, 26, x) * (1 - smooth(36, 46, x)) * smooth(26, 32, y) * (1 - smooth(42, 50, y));
      const cres = smooth(14, 22, az) * smooth(4, 12, x) * (1 - smooth(16, 24, x)) * smooth(24, 30, y) * (1 - smooth(46, 54, y));
      c.lerp(FLASH, flash * 0.85); c.lerp(CREAM, Math.max(belly, cres * 0.9));
      o.r = c.r; o.g = c.g; o.b = c.b;
      o.len = mix(5.6, 4.2, belly) * (1 + 0.15 * nse);
      o.tick = (1 - belly) * (1 - cres) * (0.5 + 0.5 * Math.max(0, ny));
      o.cx = -1; o.cy = -0.35 - 0.3 * Math.abs(nz); o.cz = 0;
    };
    const bodyG = starMesh(bodySdf, new THREE.Vector3(-12, 30, 0), 88, 60, bodyPaint);

    // ----- head (own pivot at the neck so he can look, groom and stabilise his gaze) -----
    const head = (this.head = new THREE.Group()); head.position.set(28, 42, 0); head.scale.setScalar(1.14); tor.add(head);
    this.pouch = 1;
    const headSdf = (x, y, z) => {
      let d = sdEll(x, y, z, 14, 3, 0, 24, 21, 21);                 // cranium
      d = smin(d, sdEll(x, y, z, 21, 10, 0, 17, 13, 15), 7);        // brow
      d = smin(d, sdEll(x, y, z, 35, -5, 0, 14, 11, 11), 8);        // muzzle
      d = smin(d, sdEll(x, y, z, 19, -8, 13, 15, 14, 12), 8);       // cheek pouches
      d = smin(d, sdEll(x, y, z, 19, -8, -13, 15, 14, 12), 8);
      d = smin(d, sdEll(x, y, z, 29, -13, 0, 12, 8, 9), 6);         // chin
      d = smin(d, sdEll(x, y, z, -4, -2, 0, 16, 18, 19), 8);        // nape, buried in the body fur
      return d;
    };
    const headPaint = (x, y, z, nx, ny, nz, o) => {
      const nse = vnoise(x * 0.12 + 9, y * 0.12, z * 0.12) - 0.5;
      const az = Math.abs(z);
      let c = GOLD.clone().lerp(GOLD_DK, Math.max(0, ny) ** 2 * 0.5 * (1 - smooth(28, 40, x)) + 0.1 * nse);
      const muzzle = smooth(30, 38, x) * (1 - smooth(2, 8, y)) + (1 - smooth(-12, -6, y)) * smooth(10, 20, x);
      const flash = smooth(9, 14, az) * smooth(6, 12, x) * (1 - smooth(22, 28, x)) * (1 - smooth(-2, 4, y + (x - 16) * 0.35)) * smooth(-16, -10, y);
      c.lerp(FLASH, flash * 0.9);
      c.lerp(CREAM, Math.min(1, muzzle) * 0.95);
      const eyeRing = Math.exp(-(((x - 26) / 6) ** 2 + ((y - 8) / 5) ** 2)) * smooth(10, 16, az);
      c.lerp(GOLD_DK.clone().multiplyScalar(0.6), eyeRing * 0.5);
      o.r = c.r; o.g = c.g; o.b = c.b;
      const nose = smooth(40, 49, x);
      o.len = mix(mix(3.0, 3.8, smooth(8, 14, az) * (1 - smooth(-2, 4, y))), 0.4, nose) * mix(1, 0.5, muzzle * 0.6);
      o.tick = (1 - Math.min(1, muzzle)) * (1 - flash) * Math.max(0, ny);
      // no fur over the eyes (and a short fringe around them), none inside the ears' bases
      const eyeD = Math.hypot(x - 27, y - 8, az - 17);
      o.len *= smooth(5.5, 10, eyeD);
      o.cx = -1; o.cy = -0.15; o.cz = 0;
    };
    const headG = starMesh(headSdf, new THREE.Vector3(14, 0, 0), 72, 52, headPaint);

    // shells
    this.furMats = [];
    const addFur = (g, parent) => {
      const base = new THREE.Mesh(g, furMaterial(0)); base.castShadow = true; base.receiveShadow = true; parent.add(base);
      for (let k = 1; k <= shells; k++) {
        const mt = furMaterial(k / shells);
        const m = new THREE.Mesh(g, mt); m.renderOrder = k; m.receiveShadow = true; parent.add(m);
        this.furMats.push(mt);
      }
    };
    addFur(bodyG, tor);
    addFur(headG, head);

    // ----- face -----
    const onSurface = (sdf, from, dir) => {
      const p = from.clone();
      for (let i = 0; i < 400 && sdf(p.x, p.y, p.z) > 0; i++) p.addScaledVector(dir, 0.25);
      return p;
    };
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x050403, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 });
    this.eyes = [];
    for (const sz of [1, -1]) {
      const p = onSurface(headSdf, new THREE.Vector3(27, 8, sz * 30), new THREE.Vector3(-0.15, 0, -sz).normalize());
      const eg = new THREE.Group(); eg.position.copy(p).add(new THREE.Vector3(0, 0, -sz * 1.4)); head.add(eg);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(5.2, 24, 16), eyeMat);
      eye.scale.set(1.05, 0.95, 0.75); eg.add(eye);
      const lid = new THREE.Mesh(new THREE.TorusGeometry(5.1, 0.9, 8, 24), new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.8 }));
      lid.position.z = sz * 1.6; eg.add(lid);
      eg.rotation.y = sz * 0.25;
      this.eyes.push(eg);
    }
    // ears: thin, rounded, nearly hairless, greyish-pink and a little cupped
    const earG = new THREE.CircleGeometry(10, 28);
    { const a = earG.attributes.position; for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i); a.setZ(i, -0.035 * (x * x + y * y)); a.setX(i, x * 0.92); } earG.computeVertexNormals(); }
    const earMat = new THREE.MeshStandardMaterial({ color: 0xb89488, roughness: 0.7, side: THREE.DoubleSide, emissive: 0x3a1a14, emissiveIntensity: 0.2 });
    this.ears = [];
    for (const sz of [1, -1]) {
      const p = onSurface(headSdf, new THREE.Vector3(2, 34, sz * 15), new THREE.Vector3(0, -1, -sz * 0.3).normalize());
      const ear = new THREE.Group(); ear.position.copy(p).add(new THREE.Vector3(-1, 4, 0)); head.add(ear);
      const m = new THREE.Mesh(earG, earMat); m.castShadow = true;
      m.rotation.set(0, Math.PI / 2 - sz * 0.75, sz * 0.35);
      ear.add(m);
      ear.rotation.z = -0.15;
      this.ears.push(ear);
    }
    // nose, nostrils, incisors
    const noseP = onSurface(headSdf, new THREE.Vector3(70, -3, 0), new THREE.Vector3(-1, 0, 0));
    const nose = new THREE.Mesh(new THREE.SphereGeometry(3.6, 18, 12), new THREE.MeshStandardMaterial({ color: 0xd98d88, roughness: 0.38 }));
    nose.scale.set(0.75, 0.75, 1.15); nose.position.copy(noseP).add(new THREE.Vector3(0.6, 0.6, 0)); head.add(nose);
    for (const sz of [1, -1]) {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3a1714 }));
      n.position.copy(nose.position).add(new THREE.Vector3(2.2, 0.3, sz * 1.5)); head.add(n);
    }
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xe0a64c, roughness: 0.35 });
    for (const sz of [1, -1]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.4, 1.0), toothMat);
      t.position.copy(noseP).add(new THREE.Vector3(-2.5, -6.2, sz * 0.6)); head.add(t);
    }
    // whiskers: two fans of tapered, drooping hairs from the whisker pads
    const wp = [], wc = [];
    for (const sz of [1, -1]) {
      for (let i = 0; i < 11; i++) {
        const row = i % 3, colI = Math.floor(i / 3);
        const o = new THREE.Vector3(noseP.x - 6 - colI * 2.2, noseP.y - 2 - row * 1.8, sz * (6 + colI * 0.8));
        const L = 22 + 12 * Math.random() - colI * 1.5;
        const yaw = sz * (0.35 + 0.22 * row + 0.1 * Math.random()), pitch = -0.18 + 0.2 * (1 - row) + 0.1 * Math.random();
        let p = o.clone(), d = new THREE.Vector3(Math.cos(pitch) * Math.cos(yaw) * -0.25 + 0.6, Math.sin(pitch), Math.sin(yaw)).normalize();
        for (let k = 0; k < 6; k++) {
          const q = p.clone().addScaledVector(d, L / 6);
          wp.push(p.x, p.y, p.z, q.x, q.y, q.z);
          const a = 1 - k / 6; wc.push(0.85 * a + 0.1, 0.83 * a + 0.1, 0.8 * a + 0.1, 0.85 * (a - 1 / 6) + 0.1, 0.83 * (a - 1 / 6) + 0.1, 0.8 * (a - 1 / 6) + 0.1);
          d.y -= 0.06; d.x -= 0.04; d.normalize(); p = q;
        }
      }
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3));
    this.whiskers = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 }));
    this.whiskerPivot = new THREE.Group(); this.whiskerPivot.position.copy(noseP).add(new THREE.Vector3(-8, -2, 0));
    this.whiskers.position.copy(this.whiskerPivot.position).negate(); this.whiskerPivot.add(this.whiskers); head.add(this.whiskerPivot);
    // a stub of a tail, just showing through the rump fur
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(2.6, 4, 4, 8), new THREE.MeshStandardMaterial({ color: 0xd9a596, roughness: 0.6 }));
    tail.position.set(-71, 30, 0); tail.rotation.z = 1.1; tor.add(tail);

    // ----- legs: two-bone limbs placed by IK, pink paws with toes -----
    const legFur = new THREE.MeshStandardMaterial({ color: 0xe6d7c0, roughness: 0.95 });
    const legGold = new THREE.MeshStandardMaterial({ color: 0xbe8546, roughness: 0.95 });
    const skin = new THREE.MeshStandardMaterial({ color: 0xe7a49c, roughness: 0.5, emissive: 0x401512, emissiveIntensity: 0.25 });
    const mkBone = (r, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 1, 10, 1), mat); m.castShadow = true; return m; };
    const mkPaw = (len, w, toes) => {
      const g = new THREE.Group();
      const sole = new THREE.Mesh(new THREE.CapsuleGeometry(w * 0.5, len - w, 4, 10), skin);
      sole.rotation.z = Math.PI / 2; sole.position.x = len / 2 - w * 0.3; sole.scale.set(0.55, 1, 1); g.add(sole);
      for (let i = 0; i < toes; i++) {
        const t = new THREE.Mesh(new THREE.SphereGeometry(w * 0.2, 8, 6), skin);
        const a = (i - (toes - 1) / 2) * 0.42;
        t.position.set(len - w * 0.15 + Math.cos(a) * 1.5, -0.4, Math.sin(a) * w * 0.55); g.add(t);
      }
      return g;
    };
    // limbs: LF, RF, LH, RH (order matches the physics)
    this.limbs = [];
    const defs = [
      { hip: [16, 22, 13], L1: 15, L2: 15, bend: -1, paw: [9, 5.5, 4], fore: true },
      { hip: [16, 22, -13], L1: 15, L2: 15, bend: -1, paw: [9, 5.5, 4], fore: true },
      { hip: [-38, 22, 18], L1: 19, L2: 20, bend: 1, paw: [20, 7, 5], fore: false },
      { hip: [-38, 22, -18], L1: 19, L2: 20, bend: 1, paw: [20, 7, 5], fore: false },
    ];
    for (const d of defs) {
      const b1 = mkBone(d.fore ? 4.2 : 6.5, d.fore ? legGold : legGold), b2 = mkBone(d.fore ? 3 : 3.6, legFur);
      const j = new THREE.Mesh(new THREE.SphereGeometry(d.fore ? 3.2 : 4, 10, 8), legFur);
      const paw = mkPaw(...d.paw);
      tor.add(b1, b2, j, paw);
      this.limbs.push({ ...d, b1, b2, j, paw, hipV: new THREE.Vector3(...d.hip), foot: new THREE.Vector3(), lift: 0 });
    }

    // animation state
    this.t = 0; this.blink = 0; this.nextBlink = 2; this.look = new THREE.Vector2(); this.lookT = new THREE.Vector2(); this.nextLook = 1;
    this.earTw = [0, 0]; this.pose = { rear: 0 };
  }

  // place a bone mesh between two points (in torso coordinates)
  static bone(m, a, b) {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(1, Math.max(0.01, L), 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  }

  // st: gait/behaviour (wheel physics report, or his life in the cage); Rin: radius of the ground
  // under him (the wheel's tread, or effectively flat); pose: what he is doing with his body
  update(dt, st, Rin, pose = {}) {
    this.t += dt;
    const t = this.t, s = this.scale;
    const running = st && st.f > 0 && Math.abs(st.v) > 0.04;
    const groundY = (x) => { const X = x * s; return (Rin - Math.sqrt(Math.max(1, Rin * Rin - X * X))) / s; };
    // ---- body ----
    let bob = 0, pitch = 0, flex = 0;
    const ph = st ? st.phase : 0;
    const groom = pose.groom || (st && st.act === 'groom' && !running);
    if (running) {
      const v = Math.abs(st.v), k = Math.min(1, v / 0.6);
      if (st.gait === 'bound') { pitch = 0.1 * Math.sin(2 * Math.PI * ph); flex = 0.07 * Math.sin(2 * Math.PI * ph + 0.6); bob = 3.2 * Math.max(0, Math.sin(2 * Math.PI * ph + 1.2)); }
      else if (st.gait === 'trot') { bob = 1.6 * k * Math.abs(Math.sin(2 * Math.PI * ph)); pitch = 0.025 * Math.sin(4 * Math.PI * ph); }
      else bob = 0.8 * Math.sin(4 * Math.PI * ph);
      this.body.position.y = bob - 4 * k;
    } else this.body.position.y = pose.curl ? -5 : pose.squat ? -4 : 0;
    const rearT = running ? 0 : (pose.rear ?? (groom ? 0.42 : 0));
    this.pose.rear += (rearT - this.pose.rear) * Math.min(1, dt * 4);
    this.pose.curl = (this.pose.curl || 0) + ((pose.curl ? 1 : 0) - (this.pose.curl || 0)) * Math.min(1, dt * 2);
    const curl = this.pose.curl, stretch = pose.stretch || (pose.yawn ? 0.5 * Math.sin(Math.PI * Math.min(1, pose.yawn)) : 0);
    const breath = Math.sin(2 * Math.PI * ((st ? st.br : 70) / 60) * t);
    this.spine.rotation.z = pitch + this.pose.rear + (pose.dig ? -0.12 : 0) - 0.12 * curl;
    this.torso.scale.set(1 + flex - (running ? 0 : 0.03) - 0.16 * curl + 0.12 * stretch,
      1 - flex * 0.6 + 0.012 * breath * (1 + curl) + (running ? -0.04 : 0.03) + 0.06 * curl - 0.06 * stretch,
      1 + 0.015 * breath + 0.06 * curl);

    // ---- head ----
    this.nextLook -= dt;
    if (this.nextLook <= 0) {
      this.nextLook = running ? 0.6 + Math.random() * 1.2 : 0.8 + Math.random() * 2.5;
      this.lookT.set((Math.random() - 0.5) * (running ? 0.15 : 0.9), (Math.random() - 0.4) * (running ? 0.1 : 0.4));
    }
    this.look.lerp(this.lookT, Math.min(1, dt * 5));
    let hp = -pitch * 0.85 - this.pose.rear * 0.5 + this.look.y, hy = this.look.x;
    if (groom) { hp = -0.55 + 0.08 * Math.sin(t * 9); hy = 0.1 * Math.sin(t * 2.3); }
    if (pose.eat) { hp = -0.15 + 0.06 * Math.sin(t * 2 * Math.PI * 5); hy = 0; }          // chewing
    if (pose.peck) { hp = -0.45 + 0.3 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.6)); hy = 0.15 * Math.sin(t * 1.3); }
    if (pose.drink) { hp = 0.35 + 0.04 * Math.sin(t * 2 * Math.PI * 6); hy = 0; }        // lapping at the spout
    if (pose.sniff) { hp = 0.25 + this.look.y * 0.5; }
    if (pose.dig) { hp = -0.35 + 0.05 * Math.sin(t * 30); }
    if (pose.empty) { hp = -0.2; }
    if (pose.gnaw) { hp = -0.5 + 0.07 * Math.sin(t * 2 * Math.PI * 9); hy = 0.12 * Math.sin(t * 1.7); }   // teeth chattering on the stick
    if (pose.yawn) { hp = 0.5 * Math.sin(Math.PI * Math.min(1, pose.yawn)); }
    if (pose.surf) { hp = 0.35 + 0.1 * Math.sin(t * 2.1); hy = 0.35 * Math.sin(t * 1.3); }
    if (stretch) hp = 0.25 * stretch;
    hp = hp * (1 - curl) - 0.75 * curl; hy *= 1 - curl;
    // a hind foot scratching behind the ear: the head tips over and jiggles
    const hr = pose.scratch ? 0.45 + 0.07 * Math.sin(t * 2 * Math.PI * 12) : 0;
    this.head.rotation.set(hr, hy, hp);
    // asleep, he twitches now and then (whiskers, a paw, a shiver)
    if (curl > 0.5) { if (Math.random() < dt * 0.12) this.twitch = 0.35; }
    if (this.twitch > 0) { this.twitch -= dt; this.body.position.y += 0.8 * Math.sin(this.twitch * 70); }
    const pch = pose.pouch || 0;
    this.head.scale.set(1.14, 1.14 * (1 + 0.07 * pch), 1.14 * (1 + 0.32 * pch));   // cheek pouches swell out to the shoulders
    const whisk = (pose.sniff || (!running && st && st.act === 'look')) ? 0.22 * Math.sin(2 * Math.PI * 8 * t) : running ? 0.06 * Math.sin(2 * Math.PI * 6 * t) : 0.03 * Math.sin(t * 3);
    this.whiskerPivot.rotation.y = whisk * (1 - curl);
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) { this.blink = 0.14; this.nextBlink = 1.5 + Math.random() * 5; }
    this.blink = Math.max(0, this.blink - dt);
    let lid = this.blink > 0 ? Math.max(0.12, Math.abs(this.blink - 0.07) / 0.07) : 1;
    lid = Math.min(lid, 1 - 0.88 * curl);                                              // asleep: eyes shut
    if (pose.yawn) lid = Math.min(lid, 0.15);
    for (const e of this.eyes) e.scale.set(1, lid, 1);
    for (let i = 0; i < 2; i++) {
      if (Math.random() < dt * 0.25) this.earTw[i] = 0.25;
      this.earTw[i] = Math.max(0, this.earTw[i] - dt);
      this.ears[i].rotation.x = (i ? -1 : 1) * (0.35 * Math.sin(this.earTw[i] * 40) * (this.earTw[i] > 0 ? 1 : 0) + (running ? -0.25 : 0) - 0.5 * curl);
    }

    // ---- limbs ----
    const off = GAITS[(st && st.gait) || 'walk'], D = st ? st.D : 0.7;
    const stride = running ? Math.min(75, (Math.abs(st.v) / Math.max(0.5, st.f)) * 1000) / s : 0;
    const handsUp = !running && (groom || pose.eat || pose.empty || pose.sniff || pose.gnaw || pose.surf || pose.scratch) && this.pose.rear > 0.1;
    for (let k = 0; k < 4; k++) {
      const L = this.limbs[k], hip = L.hipV;
      let fx, fy, pawPitch = 0, bodySpace = true;
      const neutral = hip.x + (L.fore ? 6 : 2);
      if (pose.dangle) { fx = hip.x + 4; fy = hip.y - L.L1 - L.L2 + 6; pawPitch = -0.9; bodySpace = false; }
      else if (running) {
        let u = ph - off[k]; u -= Math.floor(u);
        const reach = stride * D;
        if (u < D) { const a = u / D; fx = neutral + reach * (0.5 - a); fy = 0; pawPitch = L.fore ? 0 : -0.15 * a; }
        else { const a = (u - D) / (1 - D); fx = neutral + reach * (-0.5 + a); fy = (L.fore ? 7 : 9) * Math.sin(Math.PI * a); pawPitch = L.fore ? -0.9 * Math.sin(Math.PI * a) : -0.7 * Math.sin(Math.PI * a); }
      } else if (L.fore && handsUp) {
        // forepaws up to the muzzle: washing, nibbling a seed, pushing food out of the pouches, or held to the chest when sniffing
        const sp = pose.sniff ? 0.3 : pose.eat ? 2.5 : 8;
        fx = (pose.sniff ? 26 : 36) + 2 * Math.sin(t * sp + k); fy = (pose.sniff ? 26 : 34) + 3 * Math.cos(t * sp + k * 1.3); pawPitch = -1.2; bodySpace = false;
      } else if (L.fore && pose.dig) { const a = t * 2 * Math.PI * 7 + k * Math.PI; fx = neutral + 9 * Math.sin(a); fy = 3 * Math.max(0, Math.cos(a)); pawPitch = -0.6; }
      else if (L.fore && pose.drink) { fx = neutral + 14; fy = 22; pawPitch = -0.8; }
      else if (curl) { fx = neutral * (1 - 0.3 * curl) + (L.fore ? -6 : 8) * curl; fy = 0; }
      else { fx = neutral; fy = 0; }
      const target = new THREE.Vector3(fx, fy, L.hip[2]);
      if (bodySpace) {
        target.y += groundY(fx) - this.body.position.y / s;
        // planted feet are in body space; express them in torso space
        const pv = this.spine.position, a = this.spine.rotation.z, ca = Math.cos(-a), sa = Math.sin(-a);
        const dx = target.x - pv.x, dy = target.y - pv.y;
        target.x = (dx * ca - dy * sa - this.torso.position.x) / this.torso.scale.x;
        target.y = (dx * sa + dy * ca - this.torso.position.y) / this.torso.scale.y;
      }
      const ankle = target.clone().add(new THREE.Vector3(0, L.fore ? 3 : 4, 0));
      const dx = ankle.x - hip.x, dy = ankle.y - hip.y;
      let d = Math.hypot(dx, dy); const dmax = L.L1 + L.L2 - 0.5, dmin = Math.abs(L.L1 - L.L2) + 1;
      d = Math.max(dmin, Math.min(dmax, d));
      const a0 = Math.atan2(dy, dx), cosA = (L.L1 * L.L1 + d * d - L.L2 * L.L2) / (2 * L.L1 * d);
      const a1 = a0 + L.bend * Math.acos(Math.max(-1, Math.min(1, cosA)));
      const knee = new THREE.Vector3(hip.x + L.L1 * Math.cos(a1), hip.y + L.L1 * Math.sin(a1), hip.z);
      const end = new THREE.Vector3(hip.x + d * Math.cos(a0), hip.y + d * Math.sin(a0), hip.z);
      HamsterModel.bone(L.b1, hip, knee); HamsterModel.bone(L.b2, knee, end);
      L.j.position.copy(knee);
      L.paw.position.copy(end).add(new THREE.Vector3(L.fore ? -2 : -4, L.fore ? -2.6 : -3.4, 0));
      L.paw.rotation.set(0, 0, pawPitch - this.spine.rotation.z * 0.8);
    }
  }
}

// ---------------------------------------------------------------- wheel, stands, belt
class PolyCurve extends THREE.Curve {
  constructor(pts) { super(); this.pts = pts; const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1])); this.L = L; this.total = L[L.length - 1]; }
  getPoint(t, target = new THREE.Vector3()) {
    const s = t * this.total, L = this.L; let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const a = this.pts[i - 1], b = this.pts[i], u = (s - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    return target.copy(a).lerp(b, u);
  }
}

// a half tier over his house (back right), reached by a slatted ramp that rises to the right
export const CAGE = { L: 760, D: 440, gap: 120, tier: { x0: 470, x1: 745, z0: 15, z1: 245, h: 210 }, ramp: { x0: 170, x1: 470, z0: 190, z1: 240, up: 'x1' } };

export class HamsterRig {
  // anchor: crank shaft (x, y, z), boxRight, bottomY  (mm).  o: { R, rw, rc, surface, mass, shells }
  constructor(anchor, o) {
    const g = (this.group = new THREE.Group());
    const Rs = o.R * 1000, rw = o.rw * 1000, rc = o.rc * 1000;
    const Wd = Rs > 160 ? 92 : 80;
    const steel = new THREE.MeshStandardMaterial({ color: 0xb9bec4, metalness: 0.9, roughness: 0.32 });
    const wire = new THREE.MeshStandardMaterial({ color: 0xd2d6da, metalness: 0.85, roughness: 0.3 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xc19a4c, metalness: 1, roughness: 0.3 });
    const plastic = new THREE.MeshStandardMaterial({ color: 0x8fb8a8, roughness: 0.45, metalness: 0, transparent: true, opacity: 0.88 });
    // his cage: a glass tank on the table beside the box; the wheel stands at the back, its axle
    // passes out through the back glass to the hub pulley
    const zc = anchor.z, yc = anchor.y, zwp = zc + rc;
    // one cage for every wheel: sized for the biggest (35 cm) wheel, with room for an upper tier and its ramp
    const L = CAGE.L, D = CAGE.D, Hc = 2 * 175 + 130;
    const cx0 = anchor.boxRight + CAGE.gap, cz0 = zwp + 10, yT = anchor.bottomY, yB = yT + 40;   // inner corner; bedding top
    const xw = cx0 + 30 + Rs, yw = yB + 12 + Rs, zw = cz0 + 8 + Wd / 2;                    // wheel centre
    const xp = xw - rw;                                                                      // belt plane on the crank side
    this.dims = { Rs, rw, rc, xp, xw, yw, zw, zwp, Wd, cx0, cz0, yB, L, D, Hc };
    const cyl = (r, h, mat, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.castShadow = true; m.receiveShadow = true; return m; };

    // crank extension shaft through the box wall to a pulley, with a pillow block on a post
    const shaftLen = xp + 4 - anchor.x;
    const shaft = cyl(1.6, shaftLen, steel); shaft.rotation.z = Math.PI / 2; shaft.position.set(anchor.x + shaftLen / 2, yc, zc); g.add(shaft);
    const hub = cyl(3.6, 5, brass, 16); hub.rotation.z = Math.PI / 2; hub.position.set(anchor.x, yc, zc); g.add(hub);
    for (const x of [anchor.boxRight + 6, (anchor.boxRight + xp) / 2, xp - 16]) {
      const blk = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 12), brass); blk.position.set(x, yc, zc); blk.castShadow = true; g.add(blk);
      const post = cyl(2, yc - anchor.bottomY, steel); post.position.set(x, (yc + anchor.bottomY) / 2 - 4, zc); g.add(post);
      const foot = cyl(7, 2, steel, 20); foot.position.set(x, anchor.bottomY + 1, zc); g.add(foot);
    }
    const grooved = (r, w) => new THREE.LatheGeometry([[0, -w / 2], [r + 1.2, -w / 2], [r + 1.2, -w / 2 + 1], [r, 0], [r + 1.2, w / 2 - 1], [r + 1.2, w / 2], [0, w / 2]].map(([a, b]) => new THREE.Vector2(a, b)), 32);
    this.crankPulley = new THREE.Group(); this.crankPulley.position.set(xp, yc, zc);
    { const m = new THREE.Mesh(grooved(rc, 6), brass); m.rotation.z = Math.PI / 2; m.castShadow = true; this.crankPulley.add(m);
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(6.4, rc * 1.6, 1.4), new THREE.MeshStandardMaterial({ color: 0x5a4422 })); this.crankPulley.add(spoke); }
    g.add(this.crankPulley);

    // the wheel (turns about z)
    const wheel = (this.wheel = new THREE.Group()); wheel.position.set(xw, yw, zw); g.add(wheel);
    for (const z of [-Wd / 2, Wd / 2]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(Rs, 2.0, 8, 120), wire); rim.position.z = z; rim.castShadow = true; wheel.add(rim); }
    if (o.surface === 'rungs') {
      const N = Math.round((2 * Math.PI * Rs) / 9);
      const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.0, 1.0, Wd, 6), wire, N);
      const M = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; M.compose(new THREE.Vector3(Math.cos(a) * Rs, Math.sin(a) * Rs, 0), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, M); }
      im.castShadow = true; im.receiveShadow = true; wheel.add(im);
      this.treadR = Rs - 1;
    } else {
      const tread = new THREE.Mesh(new THREE.CylinderGeometry(Rs, Rs, Wd, 120, 1, true), new THREE.MeshStandardMaterial({ color: 0x9cc2b2, roughness: 0.55, side: THREE.DoubleSide }));
      tread.rotation.x = Math.PI / 2; tread.receiveShadow = true; tread.castShadow = true; wheel.add(tread);
      this.treadR = Rs - 0.5;
    }
    // back: spokes (wire) or a disc (plastic); hub
    if (o.surface === 'rungs') {
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const sp = cyl(1.1, Rs, wire, 6); sp.position.set(Math.cos(a) * Rs / 2, Math.sin(a) * Rs / 2, -Wd / 2); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); }
    } else { const disc = new THREE.Mesh(new THREE.CircleGeometry(Rs, 64), plastic); disc.position.z = -Wd / 2; disc.receiveShadow = true; wheel.add(disc); }
    const whub = cyl(6, 10, steel, 16); whub.rotation.x = Math.PI / 2; whub.position.z = -Wd / 2; wheel.add(whub);
    // hub pulley behind the wheel, on the same axle
    { const m = new THREE.Mesh(grooved(rw, 7), brass); m.rotation.x = Math.PI / 2; m.position.z = zwp - zw; m.castShadow = true; wheel.add(m);
      for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(1.8, rw * 1.7, 2), new THREE.MeshStandardMaterial({ color: 0x5a4422 })); sp.rotation.z = (i * Math.PI) / 3; sp.position.z = zwp - zw + 3.8; wheel.add(sp); } }
    // axle and A-frame stands
    const axleLen = zw + Wd / 2 + 12 - (zwp - 10);
    const axle = cyl(2.2, axleLen, steel); axle.rotation.x = Math.PI / 2; axle.position.set(xw, yw, zwp - 10 + axleLen / 2); g.add(axle);
    for (const [z, yf] of [[zwp - 8, yT], [zw + Wd / 2 + 9, yB]]) {
      for (const sx of [-1, 1]) {
        const a = new THREE.Vector3(xw, yw, z), b = new THREE.Vector3(xw + sx * Rs * 0.62, yf + 2, z);
        const leg = cyl(1.8, 1, wire, 8); HamsterModel.bone(leg, a, b); g.add(leg);
      }
      const base = cyl(1.8, Rs * 1.5, wire, 8); base.rotation.z = Math.PI / 2; base.position.set(xw, yf + 2, z); g.add(base);
    }
    this.buildCage({ L, D, Hc, cx0, cz0, yT, yB, xw, zw, Wd, Rs });
    // quarter-twist round belt: down the crank pulley, up to the hub pulley
    const pts = [];
    for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; pts.push(new THREE.Vector3(xp, yc - rc * Math.sin(a), zc + rc * Math.cos(a))); }  // back → under → front
    for (let i = 0; i <= 32; i++) { const b = Math.PI - (i / 32) * Math.PI; pts.push(new THREE.Vector3(xw + rw * Math.cos(b), yw + rw * Math.sin(b), zwp)); } // left → over → right
    pts.push(pts[0].clone());
    const belt = new THREE.Mesh(new THREE.TubeGeometry(new PolyCurve(pts), 220, 1.3, 8, true), new THREE.MeshStandardMaterial({ color: 0xb2402b, roughness: 0.55 }));
    belt.castShadow = true; g.add(belt); this.belt = belt;

    // the hamster: either on the tread at angle φ from the bottom, or about his business in the cage
    this.ham = new HamsterModel({ mass: o.mass, shells: o.shells });
    this.hamPivot = new THREE.Group(); this.hamPivot.position.set(xw, yw, zw); g.add(this.hamPivot);
    this.cageCarrier = new THREE.Group(); this.cageCarrier.position.set(cx0, yB, cz0); g.add(this.cageCarrier);
    this.cageCarrier.add(this.ham.root);
    this.st = null; this.stT = 0; this.thw = 0; this.phase = 0;
    // the layout his life plays out in (cage millimetres: x right, z forward, bedding at y = 0)
    const hx = L - 100, hz = 85;
    this.layout = {
      tier: { ...CAGE.tier }, ramp: { ...CAGE.ramp },
      L, D,
      wheel: { x: xw - cx0, z: zw - cz0, y: yw - this.treadR - yB, entry: { x: xw - cx0, z: zw - cz0 + Wd / 2 + 60 } },
      house: { door: { x: hx, z: hz + 115 }, bed: { x: hx, z: hz + 10 } },
      bowl: { x: this.bowlAt.x, z: this.bowlAt.z }, drink: { x: L - 80, z: this.bottleZ }, dig: { x: (xw - cx0 + Rs + hx - 75) / 2, z: 80 },
      chew: { ...this.chewAt }, sand: { ...this.sandAt },
    };
  }

  buildCage({ L, D, Hc, cx0, cz0, yT, yB, xw, zw, Wd, Rs }) {
    const g = this.group, X = (x) => cx0 + x, Z = (z) => cz0 + z;
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a7350, roughness: 0.7 });
    const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
    // floor, glass walls, wooden corner posts and rim, wire-mesh lid
    box(L + 24, 8, D + 24, X(L / 2), yT + 4, Z(D / 2), wood);
    const glassM = new THREE.MeshPhysicalMaterial({ color: 0xe8f2f2, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.5 });
    const pane = (w, h, x, z, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassM); p.position.set(x, yT + 8 + h / 2, z); p.rotation.y = ry; p.renderOrder = 5; g.add(p); };
    pane(L, Hc, X(L / 2), Z(D + 2), 0); pane(L, Hc, X(L / 2), Z(-2), 0); pane(D, Hc, X(-2), Z(D / 2), Math.PI / 2); pane(D, Hc, X(L + 2), Z(D / 2), Math.PI / 2);
    for (const [x, z] of [[-6, -6], [L + 6, -6], [L + 6, D + 6], [-6, D + 6]]) box(12, Hc, 12, X(x), yT + 8 + Hc / 2, Z(z), wood);
    for (const [w, d, x, z] of [[L + 24, 12, L / 2, -6], [L + 24, 12, L / 2, D + 6], [12, D + 24, -6, D / 2], [12, D + 24, L + 6, D / 2]]) {
      box(w, 14, d, X(x), yT + 8 + Hc, Z(z), wood); box(w, 30, d, X(x), yT + 15, Z(z), wood);
    }
    const [mc, mx] = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; return [c, c.getContext('2d')]; })();
    mx.strokeStyle = '#fff'; mx.lineWidth = 3; for (let i = 0; i <= 128; i += 16) { mx.beginPath(); mx.moveTo(i, 0); mx.lineTo(i, 128); mx.moveTo(0, i); mx.lineTo(128, i); mx.stroke(); }
    const meshT = new THREE.CanvasTexture(mc); meshT.wrapS = meshT.wrapT = THREE.RepeatWrapping; meshT.repeat.set(L / 96, D / 96);
    const lid = new THREE.Mesh(new THREE.PlaneGeometry(L, D), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.8, roughness: 0.4, alphaMap: meshT, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    lid.rotation.x = -Math.PI / 2; lid.position.set(X(L / 2), yT + 15 + Hc, Z(D / 2)); g.add(lid);
    // aspen bedding: pale shavings, with a mound where he digs
    const bc = document.createElement('canvas'); bc.width = bc.height = 512; const bx = bc.getContext('2d');
    bx.fillStyle = '#c9b48c'; bx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) { const v = 170 + Math.random() * 70; bx.fillStyle = `rgba(${v + 20},${v},${v - 40},0.8)`; bx.save(); bx.translate(Math.random() * 512, Math.random() * 512); bx.rotate(Math.random() * 6.3); bx.fillRect(-9, -2, 18 + Math.random() * 10, 3 + Math.random() * 3); bx.restore(); }
    for (let i = 0; i < 500; i++) { bx.fillStyle = 'rgba(90,70,45,0.35)'; bx.fillRect(Math.random() * 512, Math.random() * 512, 6, 2); }
    const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace; bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(L / 260, D / 260);
    const bedM = new THREE.MeshStandardMaterial({ map: bt, roughness: 1 });
    box(L, yB - yT - 8, D, X(L / 2), (yB + yT + 8) / 2, Z(D / 2), bedM);
    this.pile = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), bedM); this.pile.scale.set(60, 1, 45);
    this.pileAt = { x: (xw - cx0 + Rs + L - 175) / 2, z: 70 }; this.pile.position.set(X(this.pileAt.x + 20), yB, Z(this.pileAt.z - 15)); g.add(this.pile);
    // his house: a little wooden hut with a gabled roof and a round door, hay inside
    const hx = L - 100, hz = 85;
    const hut = new THREE.Group(); hut.position.set(X(hx), yB, Z(hz)); g.add(hut);
    const pine = new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 0.75 });
    const shell = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pine); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; hut.add(b); };
    shell(150, 110, 10, 0, 55, -55); shell(10, 110, 120, -70, 55, 0); shell(10, 110, 120, 70, 55, 0);
    // front: two jambs and a lintel around an open doorway, so you can see him inside
    shell(45, 110, 10, -52, 55, 60); shell(45, 110, 10, 52, 55, 60); shell(60, 34, 10, 0, 93, 60);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(170, 10, 100), pine); r.position.set(0, 140, s * 35); r.rotation.x = s * 0.6; r.castShadow = true; hut.add(r); }
    const hay = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xc8b060, roughness: 1 })); hay.scale.set(60, 18, 45); hay.position.set(0, 4, -5); hut.add(hay);
    this.hut = hut; this.hay = hay;
    // a half tier over his house, on four legs, with a slatted ramp rising to it from the left
    { const T = CAGE.tier, Rm = CAGE.ramp, ply = new THREE.MeshStandardMaterial({ color: 0xc9a26e, roughness: 0.8 });
      const w = T.x1 - T.x0, d = T.z1 - T.z0;
      const deck = new THREE.Mesh(new THREE.BoxGeometry(w, 10, d), ply); deck.position.set(X(T.x0 + w / 2), yB + T.h - 5, Z(T.z0 + d / 2)); deck.castShadow = deck.receiveShadow = true; g.add(deck);
      for (const [lx, lz] of [[T.x0 + 8, T.z0 + 8], [T.x1 - 8, T.z0 + 8], [T.x0 + 8, T.z1 - 8], [T.x1 - 8, T.z1 - 8]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, T.h - 10, 8), ply); leg.position.set(X(lx), yB + (T.h - 10) / 2, Z(lz)); leg.castShadow = true; g.add(leg); }
      // a lip along the open front edge (left clear where the ramp arrives)
      const lip = new THREE.Mesh(new THREE.BoxGeometry(w - 70, 16, 6), ply); lip.position.set(X(T.x0 + 70 + (w - 70) / 2), yB + T.h + 6, Z(T.z1 - 3)); g.add(lip);
      const run = Rm.x1 - Rm.x0, len = Math.hypot(run, T.h), ang = Math.atan2(T.h, run), rw2 = Rm.z1 - Rm.z0;
      const ramp = new THREE.Group(); ramp.position.set(X(Rm.x0 + run / 2), yB + T.h / 2, Z(Rm.z0 + rw2 / 2)); ramp.rotation.z = Rm.up === 'x1' ? ang : -ang; g.add(ramp);
      const board = new THREE.Mesh(new THREE.BoxGeometry(len, 6, rw2), ply); board.position.y = -3; board.castShadow = board.receiveShadow = true; ramp.add(board);
      for (let k = -len / 2 + 14; k < len / 2 - 8; k += 22) { const slat = new THREE.Mesh(new THREE.BoxGeometry(4, 4, rw2 - 6), ply); slat.position.set(k, 2, 0); ramp.add(slat); }
      // a little dish of chinchilla sand up on the deck
      this.sandAt = { x: T.x1 - 75, z: T.z0 + 85 };
      const dish = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [44, 0], [49, 13], [46, 15], [41, 4], [0, 4]].map(([a, b]) => new THREE.Vector2(a, b)), 32), new THREE.MeshStandardMaterial({ color: 0x8fa9b8, roughness: 0.35 }));
      dish.position.set(X(this.sandAt.x), yB + T.h, Z(this.sandAt.z)); dish.castShadow = dish.receiveShadow = true; g.add(dish);
      const sand = new THREE.Mesh(new THREE.CircleGeometry(41, 28), new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(X(this.sandAt.x), yB + T.h + 8, Z(this.sandAt.z)); g.add(sand);
    }
    // an apple-wood chew stick lying in the bedding
    this.chewAt = { x: 560, z: 255 };
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, 95, 10), new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.85 }));
    stick.rotation.set(0, 0.5, Math.PI / 2); stick.position.set(X(this.chewAt.x), yB + 8, Z(this.chewAt.z)); stick.castShadow = true; g.add(stick);
    for (const s2 of [-1, 1]) { const end = new THREE.Mesh(new THREE.CircleGeometry(8.5, 10), new THREE.MeshStandardMaterial({ color: 0xc9a476, roughness: 0.9 })); end.position.set(s2 * 47.6, 0, 0); end.rotation.y = s2 * Math.PI / 2; stick.add(end); end.rotation.x = Math.PI / 2; }

    // ceramic bowl with seeds; water bottle clipped to the right-hand glass
    this.bowlAt = { x: 545, z: D - 70 };
    const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [38, 0], [46, 22], [42, 24], [33, 6], [0, 6]].map(([a, b]) => new THREE.Vector2(a, b)), 32), new THREE.MeshStandardMaterial({ color: 0x5f7d9a, roughness: 0.25 }));
    bowl.position.set(X(this.bowlAt.x), yB, Z(this.bowlAt.z)); bowl.castShadow = true; g.add(bowl);
    const seedG = new THREE.SphereGeometry(1, 6, 4), seedM = [new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.6 }), new THREE.MeshStandardMaterial({ color: 0xd6c08a, roughness: 0.8 })];
    for (let i = 0; i < 46; i++) { const a = Math.random() * 6.28, r = Math.random() * 30; const sd = new THREE.Mesh(seedG, seedM[i % 3 === 0 ? 1 : 0]); sd.scale.set(5.5, 1.6, 2.6); sd.rotation.y = Math.random() * 6; sd.position.set(X(this.bowlAt.x) + Math.cos(a) * r, yB + 8 + Math.random() * 6, Z(this.bowlAt.z) + Math.sin(a) * r); g.add(sd); }
    this.bottleZ = 255;
    const bottle = new THREE.Group(); bottle.position.set(X(L - 26), yB, Z(this.bottleZ)); g.add(bottle);
    const plas = new THREE.MeshPhysicalMaterial({ color: 0xeaf4f8, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 150, 20), plas); body.position.y = 170; bottle.add(body);
    const water = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 110, 20), new THREE.MeshPhysicalMaterial({ color: 0x9cc8dc, roughness: 0.05, transparent: true, opacity: 0.45, depthWrite: false })); water.position.y = 150; bottle.add(water);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(14, 22, 18, 20), new THREE.MeshStandardMaterial({ color: 0x3a6a4a, roughness: 0.5 })); cap.position.y = 88; bottle.add(cap);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 50, 10), new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 0.9, roughness: 0.25 }));
    spout.position.set(-14, 66, 0); spout.rotation.z = 0.75; bottle.add(spout);
    this.bubble = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); this.bubble.visible = false; bottle.add(this.bubble);
  }

  setState(st) { this.st = st; this.stT = performance.now(); this.thw = st.thw; this.phase = st.phase; }

  update(dt, crankAngle, life) {
    const st = this.st;
    if (st) {
      const age = Math.min(0.08, (performance.now() - this.stT) / 1000);
      this.wheel.rotation.z = -(st.thw + st.ww * age);
      this.view = { ...st, phase: (st.phase + st.f * age) % 1 };
    }
    this.crankPulley.rotation.x = -crankAngle;
    const inWheel = life && life.where === 'wheel' && st && st.inWheel;
    const root = this.ham.root;
    root.visible = !this.covered;
    if (this.covered) return;
    if (inWheel) {
      if (root.parent !== this.hamPivot) this.hamPivot.add(root);
      root.position.set(0, -this.treadR, 0); root.rotation.set(0, 0, 0);
      this.hamPivot.rotation.z = st.phi;
      this.ham.update(dt, this.view, this.treadR);
    } else {
      if (root.parent !== this.cageCarrier) this.cageCarrier.add(root);
      const L = life || { x: this.layout.house.bed.x, z: this.layout.house.bed.z, y: 0, h: Math.PI, pose: { curl: 1 }, gaitState: () => ({ f: 0, v: 0, phase: 0, D: 0.7, gait: 'walk', act: 'sit', br: 45 }) };
      root.position.set(L.x, L.y, L.z); root.rotation.order = 'YXZ'; root.rotation.set(L.pose.roll || 0, -L.h, 0);
      this.ham.update(dt, L.gaitState(), 1e6, L.pose);
    }
    if (life) {
      // pee spots and droppings in the bedding (the damp spots dry out over a few minutes)
      if (!this.marks) { this.marks = []; this.markG = { pee: new THREE.CircleGeometry(1, 20), poop: new THREE.CapsuleGeometry(2.2, 5, 3, 6) }; this.markM = { poop: new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.8 }) }; }
      while (this.marks.length > life.marks.length) this.cageCarrier.remove(this.marks.shift().mesh);
      for (let i = 0; i < life.marks.length; i++) {
        const m = life.marks[i];
        if (this.marks[i] && this.marks[i].src === m) continue;
        if (this.marks[i]) { this.cageCarrier.remove(this.marks[i].mesh); }
        let mesh;
        if (m.type === 'pee') { mesh = new THREE.Mesh(this.markG.pee, new THREE.MeshStandardMaterial({ color: 0x7a6a3e, roughness: 0.4, transparent: true, opacity: 0.5, depthWrite: false })); mesh.rotation.x = -Math.PI / 2; mesh.scale.setScalar(m.r); mesh.position.set(m.x, 1.2, m.z); }
        else { mesh = new THREE.Mesh(this.markG.poop, this.markM.poop); mesh.rotation.set(Math.PI / 2, 0, m.a); mesh.position.set(m.x, 2.2, m.z); mesh.castShadow = true; }
        this.cageCarrier.add(mesh); this.marks[i] = { src: m, mesh };
      }
      const now = performance.now();
      for (const k of this.marks) if (k.src.type === 'pee') k.mesh.material.opacity = 0.5 * Math.max(0, 1 - (now - k.src.t) / 240000);
      const nest = 1 + 0.6 * (life.nest || 0); this.hay.scale.set(60 * Math.min(1.15, nest), 18 * nest, 45 * Math.min(1.2, nest));
      const p = Math.min(1, 0.15 + life.digPile * 0.85); this.pile.scale.set(60 * (0.6 + 0.4 * p), 2 + 26 * p, 45 * (0.6 + 0.4 * p));
      // the bottle's ball valve lets a bubble up while he drinks
      if (life.act === 'drink') { this.bubble.visible = true; this.bubbleY = ((this.bubbleY || 95) + dt * 140); if (this.bubbleY > 205) this.bubbleY = 95; this.bubble.position.set(Math.sin(this.bubbleY) * 4, this.bubbleY, 0); }
      else this.bubble.visible = false;
    }
  }
  setHooked(on) { this.belt.visible = on; }

  // a heavy wool blanket draped over the whole cage: flat on the lid, folding over the edges and
  // hanging in loose folds down the sides
  makeCover() {
    const { L, D, Hc, cx0, cz0 } = this.dims, yTop = this.dims.yB - 40 + 15 + Hc + 4;
    const hang = Hc * 0.72, pad = 30;
    const W = L + 2 * (hang + pad), Dd = D + 2 * (hang + pad), NX = 90, NZ = 70;
    const g = new THREE.PlaneGeometry(W, Dd, NX, NZ); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, hx = L / 2 + 14, hz = D / 2 + 14;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i);
      const ox = Math.max(0, Math.abs(x) - hx), oz = Math.max(0, Math.abs(z) - hz);
      const o = Math.hypot(ox, oz);
      let X = x, Y = 0, Z = z;
      // over the edge: the excess becomes drop, the cloth bowing slightly outwards in folds
      const along = ox > oz ? z : x;
      const fold = Math.sin(along * 0.045 + (ox > oz ? 1.3 : 0)) * 0.6 + Math.sin(along * 0.11) * 0.4;
      if (o > 0) {
        const r = Math.min(o, 18);                                  // rolls over the rim
        const drop = Math.max(0, o - 12);
        const out = 10 + 14 * Math.sin(Math.min(1, drop / 120) * 1.4) + fold * (6 + drop * 0.08);
        const k = out / o;
        X = Math.sign(x) * (Math.min(Math.abs(x), hx) + ox * k * (ox / o));
        Z = Math.sign(z) * (Math.min(Math.abs(z), hz) + oz * k * (oz / o));
        Y = -r * 0.4 - drop + (ox > 0 && oz > 0 ? Math.min(ox, oz) * 0.5 : 0);   // corners hang a little shorter
      } else Y = 2 * Math.sin(x * 0.02) * Math.sin(z * 0.03) - 1.5;           // a slight sag on the mesh lid
      P.setXYZ(i, X, Y, Z);
    }
    g.computeVertexNormals();
    // loden-red wool with a dark green and black check, slightly fuzzy (sheen)
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#7a1e1c'; x.fillRect(0, 0, 256, 256);
    x.globalAlpha = 0.55; x.fillStyle = '#1f3a2a'; for (let k = 0; k < 256; k += 64) { x.fillRect(k + 20, 0, 22, 256); x.fillRect(0, k + 20, 256, 22); }
    x.globalAlpha = 0.5; x.fillStyle = '#0d0b0a'; for (let k = 0; k < 256; k += 64) { x.fillRect(k + 28, 0, 6, 256); x.fillRect(0, k + 28, 256, 6); }
    x.globalAlpha = 0.35; x.fillStyle = '#d8b46a'; for (let k = 0; k < 256; k += 64) { x.fillRect(k + 52, 0, 2, 256); x.fillRect(0, k + 52, 256, 2); }
    x.globalAlpha = 1;
    const img = x.getImageData(0, 0, 256, 256), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / 260, Dd / 260); t.anisotropy = 8;
    const m = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.95, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xc87060), side: THREE.DoubleSide });
    const cover = new THREE.Mesh(g, m); cover.castShadow = true; cover.receiveShadow = true;
    cover.position.set(cx0 + L / 2, yTop, cz0 + D / 2);
    this.cover = cover; this.group.add(cover);
  }
  setCovered(on) {
    if (on && !this.cover) this.makeCover();
    if (this.cover) this.cover.visible = on;
    this.covered = on;
  }

  // world position of the hamster's head, for a close-up camera
  focus() { const v = new THREE.Vector3(); this.ham.head.getWorldPosition(v); return v; }
  center() { return new THREE.Vector3(this.dims.xw, this.dims.yw, this.dims.zw); }
}
