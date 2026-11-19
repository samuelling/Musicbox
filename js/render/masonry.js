// Fieldstone masonry: every stone is its own lump of geometry (rounded by the glacier, chipped by the
// mason, each a different size, colour and depth), bedded in recessed mortar. A wall panel is built in
// its own plane (x across, y up, stones standing out along +z from the mortar at z = 0) and merged
// into one mesh; the scanned rock surface gives each stone its grain and pitting.
import * as THREE from 'three';
import { Q } from './quality.js';

const R = (a, b) => a + Math.random() * (b - a);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// the stones a field gives up: granite greys, warm tans, a rusty one, a blue-grey, a pale one, a dark one
const TINTS = [[0.5, 0.48, 0.45], [0.6, 0.5, 0.36], [0.5, 0.36, 0.26], [0.36, 0.41, 0.48], [0.72, 0.68, 0.6], [0.26, 0.25, 0.25], [0.56, 0.44, 0.33], [0.44, 0.45, 0.4], [0.62, 0.42, 0.3], [0.4, 0.4, 0.42]];

let template = null;
function sphere() {
  if (template) return template;
  const [su, sv] = Q.stone;
  const g = new THREE.SphereGeometry(1, su, sv);
  template = { p: g.attributes.position.array, idx: g.index.array, n: g.attributes.position.count };
  return template;
}

class Builder {
  constructor() { this.pos = []; this.col = []; this.idx = []; this.off = []; this.count = 0; }
  // one stone filling a w × h cell centred at (cx, cy), its face `bulge` proud of the mortar
  stone(cx, cy, w, h, bulge, { tint = null, soot = 0, flat = 0 } = {}) {
    const T = sphere(), base = this.count;
    const n = R(2.6, 4.6) + flat * 3, a = w / 2, b = h / 2, bury = 34, c = (bulge + bury) / 2, cz = (bulge - bury) / 2;
    const rot = R(-0.07, 0.07), cr = Math.cos(rot), sr = Math.sin(rot);
    const tx = R(-0.16, 0.16) * (1 - flat), ty = R(-0.16, 0.16) * (1 - flat), amp = R(0.05, 0.12) * (1 - 0.7 * flat);
    const ph = [R(0, 6.3), R(0, 6.3), R(0, 6.3), R(0, 6.3)], fr = [R(1.4, 2.2), R(2.4, 3.6), R(4, 6), R(7, 10)];
    const dirs = [0, 1, 2, 3].map(() => new THREE.Vector3(R(-1, 1), R(-1, 1), R(-1, 1)).normalize());
    // a chip or two: flat fracture faces where a corner was knocked off
    const chips = []; for (let k = 0; k < (Math.random() < 0.55 ? 1 : Math.random() < 0.5 ? 2 : 0); k++) chips.push([new THREE.Vector3(R(-1, 1), R(-1, 1), R(0.25, 1)).normalize(), R(0.62, 0.86)]);
    const tb = tint || TINTS[Math.floor(Math.random() * TINTS.length)], br = R(0.7, 1.15) * (1 - 0.72 * soot);
    const u0 = R(0, 9), v0 = R(0, 9);
    const v = new THREE.Vector3();
    for (let i = 0; i < T.n; i++) {
      // sphere (x, y, z) -> stone (z, y, x): the sphere's seam goes to the back
      v.set(T.p[i * 3 + 2], T.p[i * 3 + 1], T.p[i * 3]);
      const s = Math.pow(Math.abs(v.x) ** n + Math.abs(v.y) ** n + Math.abs(v.z) ** n, -1 / n);
      v.multiplyScalar(s);
      let d = 1; for (let k = 0; k < 4; k++) d += amp * [1, 0.55, 0.3, 0.16][k] * Math.sin(v.dot(dirs[k]) * fr[k] + ph[k]);
      v.multiplyScalar(d);
      for (const [cn, ct] of chips) { const e = v.dot(cn) - ct; if (e > 0) v.addScaledVector(cn, -e); }
      let x = v.x * a, y = v.y * b, z = v.z * c + cz;
      z += (v.z > 0 ? 1 : 0.3) * (v.x * tx + v.y * ty) * c;           // the face is never square to the wall
      const X = cx + x * cr - y * sr, Y = cy + x * sr + y * cr;
      this.pos.push(X, Y, z);
      // shade baked into the stone: dark where it sinks into the joint, a little dust on what faces up
      const sh = (0.16 + 0.84 * smooth(-6, bulge * 0.6, z)) * (1 + 0.07 * v.y) * br;
      this.col.push(tb[0] * sh, tb[1] * sh * (1 - 0.06 * soot), tb[2] * sh * (1 - 0.12 * soot));
      this.off.push(u0, v0);
    }
    for (let i = 0; i < T.idx.length; i += 3) this.idx.push(base + T.idx[i], base + T.idx[i + 2], base + T.idx[i + 1]);   // (the axis swap mirrors the winding)
    this.count += T.n;
  }
  // rows of stones over a w × h panel. holes: [{x0,x1,y0,y1}] left open; over: [left, right, bottom, top]
  // how far the end stones run past the panel (so two panels meeting at a corner fill it)
  wall(w, h, { cell = [185, 120], bulge = [24, 76], joint = 11, holes = [], over = [0, 0, 0, 0], soot = 0, tint = null, flat = 0 } = {}) {
    const ys = new Set([-over[2], h + over[3]]); for (const o of holes) { if (o.y0 > 0) ys.add(o.y0); if (o.y1 < h) ys.add(o.y1); }
    const brk = [...ys].sort((p, q) => p - q);
    for (let s = 0; s < brk.length - 1; s++) {
      const y0 = brk[s], y1 = brk[s + 1], nrow = Math.max(1, Math.round((y1 - y0) / cell[1]));
      // uneven courses that still add up
      const hs = Array.from({ length: nrow }, () => R(0.7, 1.4)), tot = hs.reduce((p, q) => p + q, 0);
      let y = y0;
      for (const hk of hs) {
        const rh = (y1 - y0) * hk / tot, ym = y + rh / 2;
        // the stretches of this course that are wall (not opening)
        let spans = [[-over[0], w + over[1]]];
        for (const o of holes) if (ym > o.y0 && ym < o.y1) spans = spans.flatMap(([p, q]) => (o.x1 <= p || o.x0 >= q ? [[p, q]] : [[p, o.x0], [o.x1, q]].filter(([e, f]) => f - e > 30)));
        for (const [p, q] of spans) {
          let x = p;
          while (x < q - 1) {
            let cw = cell[0] * R(0.6, 1.75) * (rh > cell[1] * 1.15 ? 1.15 : 1);
            if (q - (x + cw) < cell[0] * 0.55) cw = q - x;
            const bg = R(bulge[0], bulge[1]) * (Math.random() < 0.12 ? 0.55 : 1);
            this.stone(x + cw / 2, ym + R(-5, 5), cw - joint * R(0.7, 1.3), rh - joint * R(0.7, 1.3), bg, { soot, tint, flat });
            x += cw;
          }
        }
        y += rh;
      }
    }
    return this;
  }
  geometry(mm = 520) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const ax = Math.abs(N.getX(i)), ay = Math.abs(N.getY(i)), az = Math.abs(N.getZ(i));
      const [a, b] = az >= ax && az >= ay ? [P.getX(i), P.getY(i)] : ax >= ay ? [P.getZ(i), P.getY(i)] : [P.getX(i), P.getZ(i)];
      uv[i * 2] = a / mm + this.off[i * 2]; uv[i * 2 + 1] = b / mm + this.off[i * 2 + 1];
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }
}
export function fieldstone(w, h, opts) { return new Builder().wall(w, h, opts).geometry(); }
// a single dressed stone (a lintel, a hearthstone): w × h on the face, standing `bulge` proud
export function stoneBlock(w, h, bulge, opts = {}) { const b = new Builder(); b.stone(w / 2, h / 2, w, h, bulge, { flat: 0.6, ...opts }); return b.geometry(); }
