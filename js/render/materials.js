// Procedural wood and mother-of-pearl inlay textures (canvas-generated, no image files).
import * as THREE from 'three';

// ---------------------------------------------------------------- noise
function makeNoise(seed = 1) {
  const p = new Uint8Array(512); let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const perm = [...Array(256).keys()].sort(() => r() - 0.5);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), a = p[X] + Y, b = p[X + 1] + Y;
    const l1 = grad(p[a], x, y) + u * (grad(p[b], x - 1, y) - grad(p[a], x, y));
    const l2 = grad(p[a + 1], x, y - 1) + u * (grad(p[b + 1], x - 1, y - 1) - grad(p[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  };
}
const N = makeNoise(7), N2 = makeNoise(31);
const fbm = (x, y, o = 4) => { let a = 0, f = 1, w = 0.5; for (let i = 0; i < o; i++) { a += w * N(x * f, y * f); f *= 2.03; w *= 0.5; } return a; };
const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- wood species
// light/dark: earlywood/latewood colours; ring: ring spacing (px at 1 px = 0.5 mm);
// figure: curl (maple), streak (rosewood), ray (oak), wave (walnut)
const SPECIES = {
  maple:    { light: 0xe6c79a, dark: 0xc49a66, ring: 9, figure: 'curl', rough: 0.42 },
  walnut:   { light: 0x7a5034, dark: 0x3e2414, ring: 11, figure: 'wave', rough: 0.4 },
  rosewood: { light: 0x7a3420, dark: 0x2a0d07, ring: 7, figure: 'streak', rough: 0.36 },
  spruce:   { light: 0xf0dcae, dark: 0xcfae78, ring: 5, figure: 'straight', rough: 0.5 },
  oak:      { light: 0xb48a5a, dark: 0x7c5530, ring: 14, figure: 'ray', rough: 0.55 },
  ebony:    { light: 0x2a201a, dark: 0x0c0806, ring: 6, figure: 'straight', rough: 0.3 },
};

// Paint wood into an ImageData region. Grain runs along x.
function paintWood(img, W, H, sp, opts = {}) {
  const L = hex(sp.light), D = hex(sp.dark), d = img.data;
  const planks = opts.planks || 1, seed = opts.seed || 0;
  for (let y = 0; y < H; y++) {
    const plank = Math.floor((y / H) * planks), py = (y / H) * planks - plank;
    const off = plank * 137.1 + seed;
    for (let x = 0; x < W; x++) {
      const nx = x / W * 6 + off, ny = y / H * 40 / planks + off;
      // growth rings seen on a flat-sawn board: long, nearly straight bands that drift slowly
      const warp = fbm(nx * 0.22, ny * 0.018 + off, 3) * sp.ring * 3.2 + N2(nx * 0.7, ny * 0.06) * sp.ring * 0.5;
      const ringV = (y + warp + off * 13) / sp.ring;
      let t = ringV - Math.floor(ringV); t = Math.pow(Math.sin(Math.PI * t), 8);   // narrow latewood band
      const fiber = N(x * 0.012 + off, y * 0.85) * 0.55 + N2(x * 0.04, y * 2.1) * 0.3;  // fine fibres along the grain
      let c = lerp3(L, D, 0.32 + 0.33 * t + 0.14 * fiber + 0.1 * fbm(nx * 1.5, ny * 0.35, 2));
      if (sp.figure === 'curl') { const cu = 0.5 + 0.5 * Math.sin(x * 0.11 + fbm(nx, ny * 0.3, 2) * 6); c = lerp3(c, lerp3(c, [255, 236, 200], 0.5), 0.16 * Math.pow(cu, 3)); c = lerp3(c, D, 0.08 * Math.pow(1 - cu, 4)); }
      if (sp.figure === 'streak') { const st = Math.pow(Math.max(0, N2(nx * 0.15, ny * 0.9 + 3) + 0.05), 2) * 3; c = lerp3(c, [18, 6, 3], Math.min(0.7, st)); }
      if (sp.figure === 'wave') { const wv = 0.5 + 0.5 * Math.sin((y + 18 * Math.sin(x * 0.02 + off)) * 0.05); c = lerp3(c, D, 0.18 * wv); }
      if (sp.figure === 'ray') { const ray = Math.max(0, N(nx * 2.5, ny * 9) - 0.42) * 2.2; c = lerp3(c, [205, 172, 128], Math.min(0.3, ray)); if (((x * 7 + y * 13) % 29 === 0) && t > 0.4) c = lerp3(c, D, 0.5); }
      // plank seams
      if (planks > 1 && (py < 0.004 || py > 0.996)) c = lerp3(c, [25, 15, 8], 0.8);
      const i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
  }
}

const cache = new Map();
function canvasTex(cv, srgb = true) {
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function woodTexture(kind, opts = {}) {
  const key = kind + JSON.stringify(opts);
  if (cache.has(key)) return cache.get(key);
  const sp = SPECIES[kind] || SPECIES.maple;
  const W = opts.w || 512, H = opts.h || 512;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const cx = cv.getContext('2d'), img = cx.createImageData(W, H);
  paintWood(img, W, H, sp, opts); cx.putImageData(img, 0, 0);
  const tex = canvasTex(cv);
  cache.set(key, tex);
  return tex;
}

// Lacquered wood; `mm` = how many millimetres one texture tile covers.
export function woodMaterial(kind, { gloss = 0.5, mm = 220, planks = 1, side = THREE.FrontSide } = {}) {
  const sp = SPECIES[kind] || SPECIES.maple;
  const m = new THREE.MeshPhysicalMaterial({
    map: woodTexture(kind, planks > 1 ? { planks, w: 1024, h: 1024 } : { planks }), roughness: sp.rough, metalness: 0,
    clearcoat: gloss, clearcoatRoughness: 0.18, side,
  });
  m.userData.mm = mm;
  return m;
}

// A box whose UVs are in millimetres / tile size, so grain has the same scale on every face.
export function boxGeo(w, h, d, mm = 220) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // faces: +x,-x (z×y), +y,-y (x×z), +z,-z (x×y); 4 vertices each
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f];
    for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * a / mm + f * 0.37, uv.getY(i) * b / mm + f * 0.21); }
  }
  return g;
}

export function velvetMaterial(color = 0x5a0f1c) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xd06070) });
}

// ---------------------------------------------------------------- mother-of-pearl inlay
// Returns a lacquered, iridescent material for a lid of w × d millimetres: a border of the case
// wood, pearl and boxwood stringing, a dark rosewood field with a pearl rosette, scrolling vines,
// corner fans and a dotted cartouche.  Pearl areas carry iridescence and are polished smoother.
export function inlayMaterial(w, d, caseWood = 'maple') {
  const key = `inlay${w}x${d}${caseWood}`;
  if (cache.has(key)) return cache.get(key);
  const ppm = Math.min(6, 1600 / Math.max(w, d));
  const W = Math.round(w * ppm), H = Math.round(d * ppm);
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return [c, c.getContext('2d')]; };
  const [cc, col] = mk(), [mc, msk] = mk(), [rc, rgh] = mk();

  // wood: border in the case wood, field in rosewood
  const border = Math.min(W, H) * 0.075;
  { const img = col.createImageData(W, H); paintWood(img, W, H, SPECIES[caseWood] || SPECIES.maple, { seed: 3 }); col.putImageData(img, 0, 0); }
  { const fc = document.createElement('canvas'); fc.width = W; fc.height = H; const f = fc.getContext('2d'); const img = f.createImageData(W, H); paintWood(img, W, H, caseWood === 'rosewood' ? SPECIES.ebony : SPECIES.rosewood, { seed: 11 }); f.putImageData(img, 0, 0);
    col.save(); col.beginPath(); roundRect(col, border, border, W - 2 * border, H - 2 * border, border * 0.35); col.clip(); col.drawImage(fc, 0, 0); col.restore(); }

  // ---- build the pearl shapes as one path ----
  const pearl = new Path2D(), wire = new Path2D(), engr = new Path2D();
  const s = Math.min(W, H);
  // stringing: a pearl line just inside the border, a boxwood line inside that
  const ring = (inset, t) => { const p = new Path2D(); roundRectP(p, inset, inset, W - 2 * inset, H - 2 * inset, border * 0.35); roundRectP(p, inset + t, inset + t, W - 2 * (inset + t), H - 2 * (inset + t), border * 0.3); return p; };
  const pearlString = ring(border * 1.18, s * 0.011);
  const boxwood = ring(border * 1.55, s * 0.006);
  // central rosette
  const cx0 = W / 2, cy0 = H / 2, R = s * 0.2;
  const petal = (p, cx, cy, a, r0, r1, wd) => {
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
    const x0 = cx + ca * r0, y0 = cy + sa * r0, x1 = cx + ca * r1, y1 = cy + sa * r1, xm = cx + ca * (r0 + r1) * 0.5, ym = cy + sa * (r0 + r1) * 0.5;
    p.moveTo(x0, y0);
    p.bezierCurveTo(xm + px * wd, ym + py * wd, x1 + px * wd * 0.35 - ca * wd * 0.2, y1 + py * wd * 0.35 - sa * wd * 0.2, x1, y1);
    p.bezierCurveTo(x1 - px * wd * 0.35 - ca * wd * 0.2, y1 - py * wd * 0.35 - sa * wd * 0.2, xm - px * wd, ym - py * wd, x0, y0);
    p.closePath();
    engr.moveTo(cx + ca * (r0 + (r1 - r0) * 0.15), cy + sa * (r0 + (r1 - r0) * 0.15)); engr.lineTo(cx + ca * (r0 + (r1 - r0) * 0.8), cy + sa * (r0 + (r1 - r0) * 0.8));
  };
  const disc = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); p.closePath(); };
  for (let k = 0; k < 8; k++) petal(pearl, cx0, cy0, (k / 8) * Math.PI * 2, R * 0.3, R, R * 0.26);
  for (let k = 0; k < 8; k++) petal(pearl, cx0, cy0, ((k + 0.5) / 8) * Math.PI * 2, R * 0.32, R * 0.68, R * 0.15);
  disc(pearl, cx0, cy0, R * 0.2);
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; disc(pearl, cx0 + Math.cos(a) * R * 1.17, cy0 + Math.sin(a) * R * 1.17, R * 0.035); }
  // dotted oval cartouche around it
  const ex = (W - 2 * border) * 0.36, ey = (H - 2 * border) * 0.36;
  for (let k = 0; k < 64; k++) { const a = (k / 64) * Math.PI * 2; disc(pearl, cx0 + Math.cos(a) * ex, cy0 + Math.sin(a) * ey, s * 0.0065); }
  // scrolling vines to left and right: a fine silver wire stem with pearl leaves and flowers
  const leaf = (x, y, a, L, wd) => {
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, x1 = x + ca * L, y1 = y + sa * L;
    pearl.moveTo(x, y);
    pearl.quadraticCurveTo(x + ca * L * 0.45 + px * wd, y + sa * L * 0.45 + py * wd, x1, y1);
    pearl.quadraticCurveTo(x + ca * L * 0.45 - px * wd * 0.6, y + sa * L * 0.45 - py * wd * 0.6, x, y);
    pearl.closePath();
    engr.moveTo(x + ca * L * 0.1, y + sa * L * 0.1); engr.lineTo(x + ca * L * 0.75, y + sa * L * 0.75);
  };
  const flower = (x, y, r) => { for (let k = 0; k < 5; k++) petal(pearl, x, y, (k / 5) * Math.PI * 2 - Math.PI / 2, r * 0.25, r, r * 0.5); disc(pearl, x, y, r * 0.22); };
  for (const side of [-1, 1]) {
    for (const vy of [-1, 1]) {
      let x = cx0 + side * R * 1.32, y = cy0 + vy * R * 0.25;
      const len = (W / 2 - border * 2.1 - R * 1.32), steps = 60;
      wire.moveTo(x, y);
      let px = x, py = y;
      for (let i = 1; i <= steps; i++) {
        const u = i / steps;
        const nx = cx0 + side * (R * 1.32 + len * u), ny = cy0 + vy * (R * 0.25 + (H * 0.16) * Math.sin(u * Math.PI * 1.6) * (0.6 + 0.4 * u));
        wire.lineTo(nx, ny);
        if (i % 9 === 4) { const a = Math.atan2(ny - py, nx - px); leaf(nx, ny, a + vy * side * 1.0, s * 0.07, s * 0.022); leaf(nx, ny, a - vy * side * 0.9 + Math.PI * 0.08, s * 0.05, s * 0.017); }
        px = nx; py = ny;
      }
      flower(px, py, s * 0.045);
      // a curling tendril off the end
      const t0 = Math.atan2(py - cy0, px - cx0);
      wire.moveTo(px, py);
      for (let i = 1; i <= 24; i++) { const a = t0 + vy * i * 0.3, r = s * 0.05 * (1 - i / 30); wire.lineTo(px + Math.cos(a) * r - Math.cos(t0) * s * 0.05, py + Math.sin(a) * r - Math.sin(t0) * s * 0.05); }
    }
  }
  // corner fans
  const fx = border * 1.75, fy = border * 1.75;
  for (const [x, y, a0] of [[fx, fy, 0], [W - fx, fy, Math.PI / 2], [W - fx, H - fy, Math.PI], [fx, H - fy, -Math.PI / 2]]) {
    for (let k = 0; k < 5; k++) petal(pearl, x, y, a0 + (k + 0.5) / 5 * (Math.PI / 2), s * 0.02, s * 0.1, s * 0.03);
    disc(pearl, x, y, s * 0.02);
  }

  // ---- colour: nacre inside the pearl shapes ----
  const nacre = (ctx, path, rule = 'nonzero') => {
    ctx.save(); ctx.clip(path, rule);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fdf8ee'); g.addColorStop(0.3, '#f7f1f6'); g.addColorStop(0.55, '#f0f8f2'); g.addColorStop(0.8, '#fdf0e6'); g.addColorStop(1, '#fbf6ec');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // the "flame" of nacre: soft, wavy translucent bands of pink, aqua and lilac
    const hues = ['rgba(245,205,215,0.14)', 'rgba(195,235,222,0.15)', 'rgba(225,215,245,0.12)', 'rgba(255,248,230,0.3)'];
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = hues[i % 4]; ctx.lineWidth = 2 + (i % 7);
      ctx.beginPath(); const y0 = (i / 260) * H * 1.3 - H * 0.15;
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, y0 + Math.sin(x * 0.013 + i) * 18 + N(x * 0.01, i * 0.3) * 30);
      ctx.stroke();
    }
    ctx.restore();
  };
  nacre(col, pearl); nacre(col, pearlString, 'evenodd');
  col.save(); col.fillStyle = '#e8d6a8'; col.fill(boxwood, 'evenodd'); col.restore();
  col.save(); col.strokeStyle = '#cfd3d6'; col.lineWidth = Math.max(1.4, s * 0.0045); col.lineCap = 'round'; col.lineJoin = 'round'; col.stroke(wire); col.restore();
  col.save(); col.strokeStyle = 'rgba(60,40,30,0.55)'; col.lineWidth = Math.max(1, s * 0.0022); col.stroke(engr); col.restore();
  // a hairline of dark mastic around every inlaid piece
  col.save(); col.strokeStyle = 'rgba(20,10,6,0.6)'; col.lineWidth = 1; col.stroke(pearl); col.restore();

  // ---- masks: iridescence (pearl, a little on the wire) and roughness (G channel) ----
  msk.fillStyle = '#000'; msk.fillRect(0, 0, W, H);
  msk.fillStyle = '#fff'; msk.fill(pearl); msk.fill(pearlString, 'evenodd');
  msk.strokeStyle = '#555'; msk.lineWidth = Math.max(1.4, s * 0.0045); msk.stroke(wire);
  rgh.fillStyle = 'rgb(0,120,0)'; rgh.fillRect(0, 0, W, H);
  rgh.fillStyle = 'rgb(0,40,0)'; rgh.fill(pearl); rgh.fill(pearlString, 'evenodd');
  rgh.strokeStyle = 'rgb(0,60,0)'; rgh.lineWidth = Math.max(1.4, s * 0.0045); rgh.stroke(wire);

  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const m = new THREE.MeshPhysicalMaterial({
    map: tex(cc, true), roughness: 1, roughnessMap: tex(rc, false), metalness: 0,
    iridescence: 0.75, iridescenceMap: tex(mc, false), iridescenceIOR: 1.55, iridescenceThicknessRange: [220, 680],
    clearcoat: 0.85, clearcoatRoughness: 0.08, specularIntensity: 0.9,
  });
  cache.set(key, m);
  return m;
}
function roundRect(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const roundRectP = roundRect;
