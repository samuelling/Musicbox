// Lit Gaussian splats, for the things polygons do badly: fur, beards, wool fuzz, moss, dust.
// Each splat is an anisotropic Gaussian: a centre, a long axis (a hair's length and direction) and a
// width. It is drawn as a quad turned about its axis to face the eye, with a Gaussian fall-off across
// it and a taper along it, and it is lit by the scene's own lights, shadows and room probe (through
// the standard material), so splats sit in the same light as the polygons they grow from.
// Coverage is resolved by the multisample buffer (alpha to coverage), so nothing needs sorting.
import * as THREE from 'three';

const quad = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);

export class Splats {
  // n: capacity. o.rough, o.metal: surface; o.taper: hairs taper to the tip (else round blobs);
  // o.sharp: how tight the Gaussian is across the splat; o.wrap: how far the shading normal turns to the eye
  constructor(n, o = {}) {
    this.n = n; this.count = 0;
    this.center = new Float32Array(n * 3); this.axis = new Float32Array(n * 4); this.color = new Float32Array(n * 3); this.normal = new Float32Array(n * 3);
    const g = (this.geometry = new THREE.InstancedBufferGeometry());
    g.setAttribute('position', new THREE.BufferAttribute(quad, 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
    g.setAttribute('iCenter', new THREE.InstancedBufferAttribute(this.center, 3));
    g.setAttribute('iAxis', new THREE.InstancedBufferAttribute(this.axis, 4));
    g.setAttribute('iColor', new THREE.InstancedBufferAttribute(this.color, 3));
    g.setAttribute('iNormal', new THREE.InstancedBufferAttribute(this.normal, 3));
    const uCam = { value: new THREE.Vector3() }, taper = o.taper !== false, sharp = (o.sharp ?? 3).toFixed(2), wrap = (o.wrap ?? 0.35).toFixed(2);
    const m = (this.material = new THREE.MeshStandardMaterial({ roughness: o.rough ?? 0.7, metalness: o.metal ?? 0, alphaToCoverage: true, side: THREE.DoubleSide, envMapIntensity: o.env ?? 0.8 }));
    m.onBeforeCompile = (sh) => {
      sh.uniforms.camLocal = uCam;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 iCenter; attribute vec4 iAxis; attribute vec3 iColor; attribute vec3 iNormal;
          uniform vec3 camLocal; varying vec2 vS; varying vec3 vSplatColor;`)
        .replace('#include <beginnormal_vertex>', `vec3 toCam = normalize(camLocal - iCenter);
          vec3 objectNormal = normalize(mix(iNormal, toCam, ${wrap}));`)
        .replace('#include <begin_vertex>', `vec3 sideV = cross(iAxis.xyz, toCam); float sl = length(sideV);
          sideV = sl > 1e-5 ? sideV / sl : normalize(cross(iAxis.xyz, vec3(0.0, 1.0, 0.0) + 1e-3));
          vec3 transformed = iCenter + iAxis.xyz * position.y + sideV * iAxis.w * position.x;
          vS = position.xy; vSplatColor = iColor;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 vS; varying vec3 vSplatColor;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            float gs = exp(-${sharp} * vS.x * vS.x);
            ${taper ? 'gs *= smoothstep(1.0, 0.1, vS.y) * smoothstep(-1.0, -0.85, vS.y);' : `gs *= exp(-${sharp} * vS.y * vS.y);`}
            // root to tip: a little darker at the root (shadowed by its neighbours)
            diffuseColor.rgb *= vSplatColor * ${taper ? '(0.72 + 0.28 * smoothstep(-1.0, 0.4, vS.y))' : '1.0'};
            diffuseColor.a *= gs;
            if (diffuseColor.a < 0.03) discard;
          }`);
    };
    m.customProgramCacheKey = () => `splat-${taper}-${sharp}-${wrap}`;
    const mesh = (this.mesh = new THREE.Mesh(g, m));
    mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true;
    const inv = new THREE.Matrix4();
    mesh.onBeforeRender = (r, s, camera) => { inv.copy(mesh.matrixWorld).invert(); uCam.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv); m.uniformsNeedUpdate = true; };
    mesh.userData.splats = this;
  }
  // centre c, half-axis a (direction × half length), half-width w, colour [r,g,b] (linear), surface normal nrm
  add(cx, cy, cz, ax, ay, az, w, r, g, b, nx, ny, nz) {
    const i = this.count; if (i >= this.n) return -1;
    this.center.set([cx, cy, cz], i * 3); this.axis.set([ax, ay, az, w], i * 4); this.color.set([r, g, b], i * 3); this.normal.set([nx, ny, nz], i * 3);
    this.count++; return i;
  }
  done() { this.geometry.instanceCount = this.count; for (const k of ['iCenter', 'iAxis', 'iColor', 'iNormal']) this.geometry.attributes[k].needsUpdate = true; return this.mesh; }
}
