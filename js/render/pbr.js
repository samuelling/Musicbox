// Scanned PBR surfaces (Poly Haven, CC0): colour, normal and a packed AO/roughness map for each.
// Materials start in the surface's average colour and take their maps as the images arrive, so a
// slow connection sees plain shapes first rather than black ones.
import * as THREE from 'three';

const BASE = new URL('../../assets/tex/', import.meta.url).href;
// average colour of each surface's colour map (what it looks like before the image arrives)
const AVG = {
  brown_leather: 0x512e10, castle_wall_slates: 0x8a7e66, dirty_carpet: 0x352f25, herringbone_parquet: 0x93704d,
  knitted_fleece: 0x554b3f, medieval_blocks_05: 0xa18361, old_wood_floor: 0x56493e, painted_plaster_wall: 0xaba2a0,
  pine_bark: 0x675340, poly_wool_herringbone: 0x797671, rectangular_parquet: 0x785c33, rosewood_veneer1: 0x6d3210,
  rough_wood: 0x6a6257, slate_floor_02: 0x6e513a, velour_velvet: 0xae2d47, walnut_veneer: 0x8b6951,
  white_maple_veneer: 0xe3d4b9, rock_boulder_dry: 0xa89b8c, rock_surface: 0x6f6051, wood_chips: 0x50381b, wood_table_worn: 0x532f15, wooden_panels: 0x4e2213,
};
const loader = new THREE.TextureLoader();
const cache = new Map();
let notify = null;
export function onTexture(fn) { notify = fn; }       // called whenever an image has arrived (redraw, re-probe)

function base(name, kind) {
  const key = `${name}_${kind}`;
  let t = cache.get(key);
  if (t) return t;
  t = new THREE.Texture(); t.userData.ready = false; t.userData.waiting = [];
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (kind === 'diff') t.colorSpace = THREE.SRGBColorSpace;
  loader.load(BASE + key + '.jpg', (src) => {
    t.image = src.image; t.needsUpdate = true; t.userData.ready = true;
    for (const fn of t.userData.waiting) fn();
    t.userData.waiting = null;
    if (notify) notify();
  }, undefined, () => { t.userData.waiting = null; });
  cache.set(key, t);
  return t;
}
const whenReady = (t, fn) => { if (t.userData.ready) fn(); else if (t.userData.waiting) t.userData.waiting.push(fn); };
// the same image with its own tiling (a clone shares the upload)
function variant(t, repeat, rotation) {
  if (!repeat && !rotation) return t;
  const c = t.clone(); c.userData = {};
  if (repeat) c.repeat.set(repeat[0], repeat[1]);
  if (rotation) { c.rotation = rotation; c.center.set(0.5, 0.5); }
  whenReady(t, () => { c.image = t.image; c.needsUpdate = true; });
  return c;
}
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

// A material for one of the scanned surfaces.
//   repeat [u, v]   tiling for geometry with 0..1 UVs (geometry with UVs in tiles needs none)
//   color           tint (multiplies the scan); with gray: true the scan gives only light and dark,
//                   and the colour is yours (a red velvet scan becomes green velvet, say)
//   rough, normal, ao   strengths; physical: extra MeshPhysicalMaterial parameters (clearcoat, sheen...)
export function pbr(name, { repeat = null, rotation = 0, color = 0xffffff, gray = false, rough = 1, normal = 1, ao = 1, physical = null, maps = 'dna', ...rest } = {}) {
  const avg = new THREE.Color(AVG[name] ?? 0x808080), tint = new THREE.Color(color);
  const m = physical ? new THREE.MeshPhysicalMaterial({ roughness: 0.8 * rough, metalness: 0, ...physical, ...rest }) : new THREE.MeshStandardMaterial({ roughness: 0.8 * rough, metalness: 0, ...rest });
  m.color.copy(gray ? tint : avg.clone().multiply(tint));
  m.userData.pbr = name;
  const d = maps.includes('d') ? base(name, 'diff') : null, n = maps.includes('n') ? base(name, 'nor') : null, a = maps.includes('a') ? base(name, 'arm') : null;
  let left = [d, n, a].filter(Boolean).length;
  const done = () => {
    if (--left > 0) return;
    if (d) { m.map = variant(d, repeat, rotation); m.color.copy(tint); }
    if (n) { m.normalMap = variant(n, repeat, rotation); m.normalScale.set(normal, normal); }
    if (a) { const t = variant(a, repeat, rotation); m.roughnessMap = t; m.roughness = rough; m.aoMap = t; m.aoMapIntensity = ao; }
    m.needsUpdate = true;
    if (notify) notify();
  };
  for (const t of [d, n, a]) if (t) whenReady(t, done);
  if (gray && d) {
    // keep only the scan's light and dark (normalised to its average), so `color` sets the hue
    const L = 0.2126 * lin(avg.r) + 0.7152 * lin(avg.g) + 0.0722 * lin(avg.b);
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        sampledDiffuseColor.rgb = vec3( dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) / ${L.toFixed(4)} );
        diffuseColor *= sampledDiffuseColor;
      #endif`);
    };
    m.customProgramCacheKey = () => 'pbrgray' + L.toFixed(4);
  }
  return m;
}

// ---- geometry with UVs measured in tiles (one tile = `mm` millimetres), so a scan keeps its real scale ----
export function boxUV(w, h, d, mm = 1000, seg = [1, 1, 1]) {
  const g = new THREE.BoxGeometry(w, h, d, ...seg), uv = g.attributes.uv, nor = g.attributes.normal;
  const off = Math.random() * 7;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
    const [a, b] = nx > 0.5 ? [d, h] : ny > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, uv.getX(i) * a / mm + off, uv.getY(i) * b / mm + off * 0.37);
  }
  return g;
}
export function planeUV(w, h, mm = 1000, seg = [1, 1]) {
  const g = new THREE.PlaneGeometry(w, h, ...seg), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / mm, uv.getY(i) * h / mm);
  return g;
}
// rescale an existing geometry's 0..1 UVs to tiles (u spans `lu` mm, v spans `lv` mm)
export function scaleUV(g, lu, lv, mm = 1000) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * lu / mm, uv.getY(i) * lv / mm);
  return g;
}

// ---- small procedural maps for metal: lathe-turned / brushed grain, and a smudged roughness ----
function noiseCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
let brushedN = null, smudge = null;
// fine parallel scratches along u (as left by a lathe tool or a brush), as a normal map
export function brushedNormal() {
  if (brushedN) return brushedN;
  const W = 512, H = 512;
  const c = noiseCanvas(W, H, (x) => {
    const img = x.createImageData(W, H), d = img.data, row = new Float32Array(H);
    let v = 0; for (let j = 0; j < H; j++) { v = v * 0.55 + (Math.random() - 0.5); row[j] = v; }
    for (let j = 0; j < H; j++) {
      const dy = (row[(j + 1) % H] - row[(j + H - 1) % H]) * 0.5;
      for (let i = 0; i < W; i++) {
        const k = (j * W + i) * 4, jit = (Math.random() - 0.5) * 0.12;
        d[k] = 128; d[k + 1] = Math.max(0, Math.min(255, 128 + (dy + jit) * 150)); d[k + 2] = 255; d[k + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
  });
  brushedN = new THREE.CanvasTexture(c); brushedN.wrapS = brushedN.wrapT = THREE.RepeatWrapping; brushedN.anisotropy = 8;
  return brushedN;
}
// handled metal: cloudy patches a little rougher than the polish, faint fingerprints, specks (G = roughness)
export function smudgeRoughness() {
  if (smudge) return smudge;
  const W = 512, H = 512;
  const c = noiseCanvas(W, H, (x) => {
    x.fillStyle = 'rgb(0,150,0)'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 1), a = 0.05 + Math.random() * 0.12, up = Math.random() < 0.6;
      g.addColorStop(0, up ? `rgba(0,255,0,${a})` : `rgba(0,60,0,${a})`); g.addColorStop(1, 'rgba(0,150,0,0)');
      x.save(); x.translate(Math.random() * W, Math.random() * H); x.rotate(Math.random() * 3); x.scale(20 + Math.random() * 90, 10 + Math.random() * 40);
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore();
    }
    x.strokeStyle = 'rgba(0,235,0,0.10)'; x.lineWidth = 1;
    for (let f = 0; f < 7; f++) {            // fingerprints: nested, slightly wobbly ovals
      const cx = Math.random() * W, cy = Math.random() * H, r0 = 16 + Math.random() * 10, rot = Math.random() * 3;
      for (let r = 3; r < r0; r += 2.2) { x.beginPath(); x.ellipse(cx, cy, r * 0.8, r * 1.25, rot, 0, 7); x.stroke(); }
    }
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,${Math.random() < 0.5 ? 255 : 90},0,${0.15 + Math.random() * 0.3})`; x.fillRect(Math.random() * W, Math.random() * H, 1, 1); }
  });
  smudge = new THREE.CanvasTexture(c); smudge.wrapS = smudge.wrapT = THREE.RepeatWrapping; smudge.anisotropy = 4;
  return smudge;
}
// polished or brushed metal with those maps. kind: 'brass' | 'steel' | 'zinc' | 'iron' | 'gilt'
export function metal(kind = 'brass', { rough = null, brushed = 0.5, repeat = [1, 8], color = null, ...rest } = {}) {
  const P = { brass: [0xd4a94e, 0.3], steel: [0xc9ced4, 0.26], zinc: [0x8f969c, 0.5], iron: [0x2a2826, 0.62], gilt: [0xd9b25a, 0.34], lead: [0x5c5f63, 0.7], blued: [0x3a4658, 0.3] }[kind] || [0xd4a94e, 0.3];
  const n = brushedNormal().clone(); n.repeat.set(repeat[0], repeat[1]); n.needsUpdate = true;
  const r = smudgeRoughness().clone(); r.repeat.set(Math.max(1, repeat[0]), Math.max(1, repeat[0])); r.needsUpdate = true;
  return new THREE.MeshStandardMaterial({ color: color ?? P[0], metalness: 1, roughness: ((rough ?? P[1]) / 0.59), roughnessMap: r, normalMap: n, normalScale: new THREE.Vector2(brushed, brushed), ...rest });
}
