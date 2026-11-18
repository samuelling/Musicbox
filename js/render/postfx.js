// The finishing chain: the scene is drawn into a multisampled HDR buffer, then
//   ambient occlusion (high only) → bloom on whatever is brighter than white (flames, embers, bulbs)
//   → tone mapping → a gentle lens finish (vignette, a breath of grain).
// On the 'low' tier none of this exists and the scene is drawn straight to the screen, as before.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Q } from './quality.js';

const Finish = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, vignette: { value: 0.32 }, grain: { value: 0.018 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, vignette, grain; varying vec2 vUv;
    float h(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = vUv - 0.5; float v = smoothstep(0.25, 0.95, dot(d, d) * 2.0);
      c.rgb *= 1.0 - vignette * v;
      c.rgb += (h(gl_FragCoord.xy + fract(time) * 437.0) - 0.5) * grain;
      gl_FragColor = c;
    }`,
};

export class PostFX {
  constructor(renderer) {
    this.renderer = renderer; this.on = Q.post;
    if (!this.on) return;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    const c = (this.composer = new EffectComposer(renderer, rt));
    this.pass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    c.addPass(this.pass);
    if (Q.ao) {
      const ao = (this.ao = new GTAOPass(this.pass.scene, this.pass.camera, size.x, size.y));
      // scene units are millimetres: occlusion gathered within a few centimetres, falling off by a hand's width
      ao.updateGtaoMaterial({ radius: 55, distanceExponent: 1.4, thickness: 4, scale: 1.25, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
      ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
      ao.blendIntensity = 0.9;
      // glass, flames, glows and other see-through things must not occlude (or be occluded as if solid)
      const vis = ao.overrideVisibility.bind(ao), cacheKey = '_fxHidden';
      ao.overrideVisibility = function () {
        vis();
        const hidden = (this[cacheKey] = []);
        this.scene.traverse((o) => {
          if (!o.visible) return;
          const m = o.material;
          const see = o.isSprite || (m && !Array.isArray(m) && (m.transparent || m.blending === THREE.AdditiveBlending || m.userData.noAO));
          if (see) { o.visible = false; hidden.push(o); }
        });
      };
      const rest = ao.restoreVisibility.bind(ao);
      ao.restoreVisibility = function () { for (const o of this[cacheKey] || []) o.visible = true; this[cacheKey] = null; rest(); };
      c.addPass(ao);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.3, 0.5, 1.2);
    c.addPass(this.bloom);
    c.addPass(new OutputPass());
    this.finish = new ShaderPass(Finish); c.addPass(this.finish);
  }
  setSize(w, h, pr) { if (!this.on) return; this.composer.setPixelRatio(pr); this.composer.setSize(w, h); }
  render(scene, camera, dt = 0.016) {
    if (!this.on) { this.renderer.render(scene, camera); return; }
    this.pass.scene = scene; this.pass.camera = camera;
    if (this.ao) { this.ao.scene = scene; this.ao.camera = camera; }
    this.finish.uniforms.time.value += dt;
    this.composer.render(dt);
  }
}
