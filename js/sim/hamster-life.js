// A golden hamster's night in his cage: what he does, where, and for how long.
// The time budget follows observations of Syrian hamsters with a wheel (nocturnal; much of the
// active phase spent wheel-running; the rest foraging, filling the cheek pouches and hoarding
// into the nest, drinking, grooming, digging and exploring with upright "sniff" postures; naps
// in the nest).  "Wheel lover" tilts the budget heavily towards the wheel.
// Positions are in cage millimetres: x to the right, z towards the front, bedding at y = 0.
import { strideFreq, dutyFactor } from '../physics/hamster.js';

const R = (a, b) => a + Math.random() * (b - a);
const pick = (w) => { let s = 0; for (const k in w) s += w[k]; let r = Math.random() * s; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return Object.keys(w)[0]; };
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const BUDGET = {
  real:  { tier: 0.06, wheel: 0.22, eat: 0.1, hoard: 0.09, drink: 0.06, groom: 0.08, explore: 0.1, dig: 0.06, nap: 0.06, pee: 0.03, poop: 0.02, gnaw: 0.05, surf: 0.03, nest: 0.03, peek: 0.02, sand: 0.03, flank: 0.02 },
  lover: { tier: 0.02, wheel: 0.74, eat: 0.05, hoard: 0.03, drink: 0.04, groom: 0.04, explore: 0.03, dig: 0.01, nap: 0.02, pee: 0.01, poop: 0.01, gnaw: 0.01, sand: 0.01 },
};
const DESC = {
  sleep: 'Asleep, curled up in his nest', wake: 'Waking up and stretching', walk: 'Pottering about',
  eat: 'Nibbling a sunflower seed', pouch: 'Stuffing his cheek pouches', carry: 'Carrying his haul to the nest',
  empty: 'Emptying his pouches into the hoard', drink: 'Drinking from the bottle', groom: 'Washing his face',
  sniff: 'Up on his hind legs, sniffing the air', dig: 'Digging in the bedding', nap: 'Napping in his nest',
  toWheel: 'Heading for the wheel', climbIn: 'Climbing into the wheel', wheel: 'In the wheel', climbOut: 'Hopping out of the wheel',
  lifted: 'Being placed in the wheel', pee: 'Peeing in his toilet corner', poop: 'Leaving a few droppings',
  startle: 'Startled by the tap, up on his hind legs', freeze: 'Frozen stock-still, eyes wide', flee: 'Bolting for his house',
  yawn: 'A big yawn', scratch: 'Scratching behind his ear with a hind foot', gnaw: 'Gnawing his chew stick',
  surf: 'Up against the glass, pacing it on his hind legs', gather: 'Stuffing bedding into his pouches', carryNest: 'Carrying bedding home',
  arrange: 'Fluffing up his nest', peek: 'Peeking out of his house', sand: 'Rolling in his sand bath', flank: 'Rubbing his flank along the house (scent marking)',
  creep: 'Creeping forward, stretched out and cautious',
  tier: 'Up on the top deck',
};

// How awake a Syrian hamster is by local time: nocturnal, most active in the first half of the
// night, drowsy at dawn, asleep through the day with short wakings to drink and eat.
export function activityAt(h) {
  if (h >= 20 || h < 3) return 1;
  if (h >= 3 && h < 6) return 0.75;
  if (h >= 6 && h < 8) return 0.35;
  if (h >= 18 && h < 20) return 0.6 + 0.2 * (h - 18);
  return 0.1;
}
const hourNow = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };

export class HamsterLife {
  // cage: { L, D, wheel: {x, z, entry: {x, z}}, house: {door: {x, z}, bed: {x, z}}, bowl: {x, z}, drink: {x, z, h}, dig: {x, z} }
  constructor(cage) {
    this.cage = cage;
    this.mode = 'real';
    this.x = cage.house.bed.x; this.z = cage.house.bed.z; this.h = Math.PI; this.y = 0;
    this.act = 'sleep'; this.timer = 1e9; this.plan = []; this.where = 'cage';
    this.v = 0; this.phase = 0; this.pouch = 0; this.hoard = 0; this.digPile = 0;
    this.wheelT = 0; this.onWheel = null; this.awake = false;
    this.pose = {};
    this.marks = [];      // pee spots and droppings left in the bedding
    this.roused = 0;      // seconds left of being woken by a tap on the glass
    this.nest = 0;        // how much bedding he has carried into his nest
    this.level = 'floor'; // 'floor' or 'tier' (the upper deck, reached by the ramp)
  }
  // ---- the upper tier and its ramp ----
  inTier(p) { const T = this.cage.tier; return T && p.x >= T.x0 && p.x <= T.x1 && p.z >= T.z0 && p.z <= T.z1; }
  heightAt(x, z) {
    const T = this.cage.tier, Rm = this.cage.ramp; if (!T) return 0;
    if (this.level === 'tier' && this.inTier({ x, z })) return T.h;
    if (Rm && z >= Rm.z0 && z <= Rm.z1 && x >= Rm.x0 && x <= Rm.x1) return T.h * (Rm.up === 'x1' ? (x - Rm.x0) : (Rm.x1 - x)) / (Rm.x1 - Rm.x0);
    return 0;
  }
  tierSpot() { const T = this.cage.tier; return { x: R(T.x0 + 40, T.x1 - 40), z: R(T.z0 + 30, T.z1 - 30) }; }
  // Syrian hamsters keep a toilet corner well away from their nest and food
  get toilet() {
    const c = this.cage, z0 = c.wheel.entry.z + 20;
    const corners = [{ x: 40, z: z0 }, { x: c.L - 40, z: z0 }, { x: 40, z: c.D - 35 }, { x: c.L - 40, z: c.D - 35 }];
    const score = (p) => Math.min(Math.hypot(p.x - c.house.bed.x, p.z - c.house.bed.z), Math.hypot(p.x - c.bowl.x, p.z - c.bowl.z) * 1.2, Math.hypot(p.x - c.drink.x, p.z - c.drink.z));
    return corners.reduce((a, b) => (score(b) > score(a) ? b : a));
  }

  setCage(cage) { const fx = this.x / this.cage.L, fz = this.z / this.cage.D; this.cage = cage; if (this.where === 'cage') { this.x = fx * cage.L; this.z = fz * cage.D; } }
  get desc() { return DESC[this.act] || ''; }

  get activity() { return Math.min(1, Math.max(this.roused > 0 ? 0.9 : 0, activityAt(hourNow()) + (this.mode === 'lover' ? 0.25 : 0))); }
  wakeUp() {
    if (this.awake) return;
    this.awake = true; this.plan = [];
    // in the daytime he sleeps on; otherwise he wakes and stretches
    if (this.activity < 0.35) { this.act = 'sleep'; this.timer = R(90, 600); }
    else { this.act = 'wake'; this.timer = 2.2; }
  }

  // "place hamster in wheel": a hand lifts him over and sets him on the tread
  placeInWheel() {
    if (this.where === 'wheel' || this.act === 'lifted' || this.act === 'climbIn') return;
    this.awake = true;
    this.lift = { x0: this.x, z0: this.z, y0: this.y, t: 0 };
    this.act = 'lifted'; this.plan = []; this.timer = 1.1; this.where = 'cage'; this.level = 'floor';
  }

  // a tap on the glass: asleep, he wakes (and stays up a while); awake, he startles and rears up.
  // Then he does whatever he likes: maybe the wheel, maybe not. Returns what he chose.
  tap() {
    // irritated awake: he stays up and busy for a while (longer if you keep tapping)
    this.irritation = Math.min(3, (this.irritation || 0) + 1);
    this.roused = 90 + 60 * this.irritation; this.awake = true;
    if (['lifted', 'climbIn', 'climbOut'].includes(this.act)) return { what: 'busy' };
    if (this.where === 'wheel') {
      if (Math.random() < 0.5) return { what: 'ignore' };
      // he hops out to see what that was
      this.wheelCap = 0; this.where = 'cage'; this.act = 'climbOut'; this.onWheel && this.onWheel(false);
      this.climb = { t: 0 }; const c = this.cage; this.x = c.wheel.x; this.z = c.wheel.z; this.y = c.wheel.y; this.h = 0;
      this.plan = [{ act: 'startle', dur: 1.2 }, ...this.planFor(pick({ explore: 0.5, groom: 0.3, eat: 0.2 }))];
      return { what: 'hopOut' };
    }
    const asleep = this.act === 'sleep' || this.act === 'nap';
    const w = this.mode === 'lover' ? { wheel: 0.7, eat: 0.1, groom: 0.05, pee: 0.05, poop: 0.05, explore: 0.05 } : { wheel: 0.3, pee: 0.14, poop: 0.12, eat: 0.16, groom: 0.1, explore: 0.1, drink: 0.08 };
    const choice = pick(w), c = this.cage, atNest = Math.hypot(this.x - c.house.bed.x, this.z - c.house.bed.z) < 30;
    // a grumpy first thing, then a couple more (unless it's the wheel, which he stays on a while)
    const then = choice === 'wheel' ? [] : this.planFor(pick({ explore: 0.35, groom: 0.25, eat: 0.2, dig: 0.2 }));
    this.plan = [...(asleep && atNest ? [{ act: 'walk', to: c.house.door }] : []), ...this.planFor(choice), ...then];
    if (!asleep && Math.random() < 0.4) {
      // frozen to the spot, then a dash for home and a cautious peek out of the door
      this.plan = [{ act: 'flee', to: c.house.door }, { act: 'walk', to: c.house.bed }, { act: 'walk', to: { x: c.house.door.x, z: c.house.door.z - 32 } }, { act: 'peek', dur: R(4, 8), face: { x: c.house.door.x, z: c.D } }, ...this.planFor(choice)];
      this.start({ act: 'freeze', dur: R(1.8, 3.5) });
      return { what: 'freeze' };
    }
    this.start(asleep ? { act: 'wake', dur: 1.6 } : { act: 'startle', dur: 1.3 });
    return { what: choice, asleep };
  }

  // ---- planning ----
  next() {
    if (this.plan.length) { const s = this.plan.shift(); this.start(s); return; }
    const c = this.cage, b = BUDGET[this.mode];
    // the clock: the less active the hour, the more likely he goes back to sleep in his nest
    const A = this.activity;
    if (Math.random() > A) {
      const dur = A < 0.2 ? R(600, 1800) : A < 0.5 ? R(120, 480) : R(30, 90);
      const atNest = Math.hypot(this.x - c.house.bed.x, this.z - c.house.bed.z) < 30;
      this.plan = [...(atNest ? [] : [{ act: 'walk', to: c.house.door }, { act: 'walk', to: c.house.bed }]), { act: 'sleep', dur }];
      if (!atNest) this.plan.push({ act: 'walk', to: c.house.door });
      this.next(); return;
    }
    this.plan = this.planFor(pick(b));
    this.next();
  }
  planFor(what) {
    const c = this.cage;
    const go = (p, fast = false) => ({ act: 'walk', to: p, fast });
    const near = (p, r = 25) => ({ x: p.x + R(-r, r), z: p.z + R(-r, r) });
    switch (what) {
      case 'tier': {   // up the ramp to the top deck: a look around from up high, maybe a wash or a doze
        const p1 = this.tierSpot(), p2 = this.tierSpot(), after = pick({ groom: 0.4, nap: 0.2, none: 0.4 });
        return [{ act: 'walk', to: p1, tier: true }, { act: 'sniff', dur: R(2, 4) }, { act: 'walk', to: p2, tier: true }, { act: 'sniff', dur: R(1.5, 3) },
          ...(after === 'groom' ? [{ act: 'groom', dur: R(4, 8) }] : after === 'nap' ? [{ act: 'nap', dur: R(15, 40) }] : [])];
      }
      case 'gnaw': return [go({ x: c.chew.x - 40, z: c.chew.z }), { act: 'gnaw', dur: R(5, 14), face: c.chew }];
      case 'surf': { const x = R(80, c.L - 120); return [go({ x, z: c.D - 28 }, true), { act: 'surf', dur: R(4, 9), x0: x }]; }
      case 'nest': return [go({ x: c.dig.x + R(-25, 25), z: c.dig.z + R(10, 40) }), { act: 'gather', dur: R(3, 5), face: c.dig }, { act: 'carryNest', to: c.house.door, fast: true }, { act: 'walk', to: c.house.bed }, { act: 'arrange', dur: R(3, 6) }];
      case 'peek': return [go(c.house.door), { act: 'walk', to: c.house.bed }, { act: 'walk', to: { x: c.house.door.x, z: c.house.door.z - 32 } }, { act: 'peek', dur: R(4, 9), face: { x: c.house.door.x, z: c.D } }];
      case 'sand': return [go(c.sand), { act: 'sand', dur: R(4, 8) }, { act: 'groom', dur: R(3, 6) }];
      case 'flank': { const y0 = c.house.door.z - 20, xL = c.house.bed.x - 90; return [go({ x: xL, z: y0 }), { act: 'flank', to: { x: xL, z: y0 - 90 } }, { act: 'flank', to: { x: xL, z: y0 } }]; }
      case 'pee': return [go({ x: this.toilet.x + R(-8, 8), z: this.toilet.z + R(-8, 8) }), { act: 'pee', dur: R(2.5, 4) }];
      case 'poop': return [go({ x: this.toilet.x + R(-20, 20), z: this.toilet.z + R(-20, 20) }), { act: 'poop', dur: R(2, 3.5) }];
      case 'wheel': return [{ ...go(c.wheel.entry, true), act: 'toWheel' }, { act: 'climbIn', dur: 0.8 }];
      case 'eat': return [go(near(c.bowl)), { act: 'eat', dur: R(7, 18), face: c.bowl }];
      case 'hoard': return [go(near(c.bowl)), { act: 'pouch', dur: R(4, 8), face: c.bowl }, { act: 'carry', to: c.house.door, fast: true }, { act: 'walk', to: c.house.bed }, { act: 'empty', dur: R(3, 5) }];
      case 'drink': return [go({ x: c.drink.x, z: c.drink.z }), { act: 'drink', dur: R(3, 8), face: { x: c.drink.x + 100, z: c.drink.z } }];
      case 'groom': return Math.random() < 0.4 ? [{ act: 'scratch', dur: R(1.2, 2.6) }, { act: 'groom', dur: R(4, 9) }] : [{ act: 'groom', dur: R(5, 12) }];
      case 'dig': return [go(near(c.dig, 30)), { act: 'dig', dur: R(4, 10) }];
      case 'nap': return [go(c.house.door), { act: 'walk', to: c.house.bed }, { act: 'nap', dur: this.mode === 'lover' ? R(6, 12) : R(20, 50) }, { act: 'walk', to: c.house.door }];
      default: {
        const pts = [];
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
          pts.push(Math.random() < 0.3 ? { act: 'creep', to: this.freeSpot() } : go(this.freeSpot()), { act: 'sniff', dur: R(1.2, 3) });
        }
        return pts;
      }
    }
  }
  freeSpot() {
    const c = this.cage;
    for (let k = 0; k < 20; k++) {
      const p = { x: R(50, c.L - 50), z: R(c.wheel.entry.z - 10, c.D - 45) };
      if (Math.hypot(p.x - c.bowl.x, p.z - c.bowl.z) > 70) return p;
    }
    return { x: c.L / 2, z: c.D - 80 };
  }
  start(s) {
    const WALKS = ['walk', 'toWheel', 'carry', 'carryNest', 'creep', 'flee', 'flank'];
    if (s.to && WALKS.includes(s.act) && this.cage.tier && !s.via) {
      const want = s.tier ? 'tier' : 'floor', Rm = this.cage.ramp, zc = (Rm.z0 + Rm.z1) / 2;
      if (want !== this.level) {
        const up1 = Rm.up === 'x1', bottom = { x: up1 ? Rm.x0 - 25 : Rm.x1 + 25, z: zc }, top = { x: up1 ? Rm.x1 + 15 : Rm.x0 - 15, z: zc };
        const legs = want === 'tier' ? [{ act: 'walk', to: bottom, via: 1 }, { act: 'walk', to: top, via: 1, setLevel: 'tier' }] : [{ act: 'walk', to: top, via: 1 }, { act: 'walk', to: bottom, via: 1, setLevel: 'floor' }];
        this.plan.unshift({ ...s, via: 1 });
        this.plan.unshift(...legs.slice(1));
        s = legs[0];
      }
    }
    this.arriveLevel = s.setLevel || null;
    this.act = s.act; this.target = s.to || null; this.fast = !!s.fast; this.face = s.face || null;
    this.timer = s.dur || 1e9; this.x0 = s.x0; this.t0 = 0;
    if (s.act === 'climbIn') { this.climb = { x0: this.x, z0: this.z, t: 0 }; }
  }

  // ---- per frame ----
  // ham: the wheel physics report (or null before the sound starts)
  update(dt, ham, audioOn) {
    const c = this.cage;
    if (!audioOn && !this.awake) { this.pose = { curl: 1 }; this.v = 0; return; }
    if (audioOn && !this.awake) this.wakeUp();
    this.timer -= dt; if (this.roused > 0) this.roused -= dt; else this.irritation = 0;
    this.pose = {};
    this.v = 0;
    switch (this.act) {
      case 'wake': this.pose = { stretch: Math.max(0, Math.sin(Math.PI * (1 - this.timer / 2.2))) }; if (this.timer <= 0) { if (Math.random() < 0.7) this.plan.unshift({ act: 'yawn', dur: 1.3 }); this.next(); } break;
      case 'yawn': this.pose = { yawn: 1 - this.timer / 1.3, rear: 0.15 }; if (this.timer <= 0) this.next(); break;
      case 'walk': case 'toWheel': case 'carry': case 'carryNest': case 'creep': case 'flee': case 'flank': {
        const t = this.target, dx = t.x - this.x, dz = t.z - this.z, d = Math.hypot(dx, dz);
        const want = Math.atan2(dz, dx), turn = ang(want - this.h);
        this.h += Math.max(-dt * 5, Math.min(dt * 5, turn));
        const vmax = this.act === 'flee' ? 0.4 : this.act === 'creep' ? 0.05 : this.act === 'flank' ? 0.04 : this.fast ? 0.3 : 0.14;
        this.v = d < 4 ? 0 : vmax * Math.max(0.2, Math.cos(turn)) * Math.min(1, d / 40);
        const step = Math.min(d, this.v * 1000 * dt);
        this.x += Math.cos(this.h) * step; this.z += Math.sin(this.h) * step;
        if (this.act === 'carry' || this.act === 'carryNest') this.pose.pouch = 1;
        if (this.act === 'creep') this.pose.stretch = 0.7;
        if (this.act === 'flank') { this.pose.roll = -0.28; this.pose.squat = 1; }
        if (d < 5) { if (this.arriveLevel) this.level = this.arriveLevel; this.next(); }
        break;
      }
      case 'climbIn': {
        const C = this.climb; C.t += dt / 0.8; const u = Math.min(1, C.t);
        this.x = C.x0 + (c.wheel.x - C.x0) * u; this.z = C.z0 + (c.wheel.z - C.z0) * u; this.y = c.wheel.y * u + 22 * Math.sin(Math.PI * u);
        this.h += ang(0 - this.h) * Math.min(1, dt * 6);
        if (u >= 1) { this.where = 'wheel'; this.act = 'wheel'; this.wheelT = 0; this.onWheel && this.onWheel(true); }
        break;
      }
      case 'lifted': {
        const L = this.lift; L.t += dt / 1.1; const u = Math.min(1, L.t), e = u * u * (3 - 2 * u);
        this.x = L.x0 + (c.wheel.x - L.x0) * e; this.z = L.z0 + (c.wheel.z - L.z0) * e;
        this.y = L.y0 + (c.wheel.y - L.y0) * e + 240 * Math.sin(Math.PI * u);   // lifted clear over the roof of his house
        this.h += ang(0 - this.h) * Math.min(1, dt * 4);
        this.pose = { dangle: 1 };
        if (u >= 1) { this.where = 'wheel'; this.act = 'wheel'; this.wheelT = 0; this.motivated = true; this.onWheel && this.onWheel(true, true); }
        break;
      }
      case 'wheel': {
        this.wheelT += dt;
        // he leaves after a pause in his running, sooner if he is not a wheel lover
        const lover = this.mode === 'lover';
        if (!this.wheelCap) this.wheelCap = lover ? R(240, 600) : R(90, 240);
        if (ham && ham.state === 'rest' && ham.restT > (lover ? 3 : 2)) {
          const p = lover ? 0.05 : 0.3;
          if (Math.random() < p * dt || this.wheelT > this.wheelCap) {
            this.wheelCap = 0;
            this.where = 'cage'; this.act = 'climbOut'; this.onWheel && this.onWheel(false);
            this.climb = { t: 0 }; this.x = c.wheel.x; this.z = c.wheel.z; this.y = c.wheel.y; this.h = 0;
          }
        }
        break;
      }
      case 'climbOut': {
        const C = this.climb; C.t += dt / 0.7; const u = Math.min(1, C.t);
        this.h += ang(Math.PI / 2 - this.h) * Math.min(1, dt * 6);
        this.x = c.wheel.x + (c.wheel.entry.x - c.wheel.x) * u; this.z = c.wheel.z + (c.wheel.entry.z - c.wheel.z) * u;
        this.y = c.wheel.y * (1 - u) + 20 * Math.sin(Math.PI * u);
        if (u >= 1) { this.y = 0; this.next(); }
        break;
      }
      case 'eat': this.faceTo(dt); this.pose = { rear: 0.32, eat: 1 }; if (this.timer <= 0) this.next(); break;
      case 'pouch': this.faceTo(dt); this.pouch = Math.min(1, this.pouch + dt / 5); this.pose = { pouch: this.pouch, peck: 1 }; if (this.timer <= 0) this.next(); break;
      case 'empty': this.pouch = Math.max(0, this.pouch - dt / 3); this.pose = { rear: 0.3, empty: 1, pouch: this.pouch }; if (this.timer <= 0) { this.pouch = 0; this.hoard = Math.min(1, this.hoard + 0.25); this.next(); } break;
      case 'drink': this.faceTo(dt); this.pose = { rear: 0.55, drink: 1 }; if (this.timer <= 0) this.next(); break;
      case 'groom': this.pose = { rear: 0.42, groom: 1 }; if (this.timer <= 0) this.next(); break;
      case 'scratch': this.pose = { rear: 0.3, scratch: 1 }; if (this.timer <= 0) this.next(); break;
      case 'gnaw': this.faceTo(dt); this.pose = { rear: 0.12, gnaw: 1 }; if (this.timer <= 0) this.next(); break;
      case 'surf': {   // up on his hind legs against the glass, shuffling along it and back
        this.t0 += dt; this.h += ang(Math.PI / 2 - this.h) * Math.min(1, dt * 6);
        this.x = Math.max(60, Math.min(c.L - 60, this.x0 + 70 * Math.sin(this.t0 * 0.9)));
        this.pose = { rear: 0.95, surf: 1 }; if (this.timer <= 0) this.next(); break;
      }
      case 'gather': this.faceTo(dt); this.pouch = Math.min(1, this.pouch + dt / 4); this.pose = { pouch: this.pouch, peck: 1 }; this.digPile = Math.max(0, this.digPile - dt / 200); if (this.timer <= 0) this.next(); break;
      case 'arrange': this.pouch = Math.max(0, this.pouch - dt / 2); this.pose = { dig: 1, pouch: this.pouch }; if (this.timer <= 0) { this.pouch = 0; this.nest = Math.min(1, this.nest + 0.25); this.next(); } break;
      case 'peek': this.faceTo(dt); this.pose = { rear: 0.18, sniff: 1 }; if (this.timer <= 0) this.next(); break;
      case 'freeze': this.pose = { rear: 0.05 }; if (this.timer <= 0) this.next(); break;
      case 'sand': { this.t0 += dt; const k = Math.min(1, this.t0 / 0.6, this.timer / 0.6); this.pose = { squat: 1, roll: k * 1.1 * Math.sin(this.t0 * 5.5), stretch: 0.3 }; if (this.timer <= 0) this.next(); break; }
      case 'sniff': case 'startle': this.pose = { rear: this.act === 'startle' ? 0.75 : 0.62, sniff: 1 }; if (this.timer <= 0) this.next(); break;
      case 'pee': case 'poop':
        this.pose = { squat: 1, rear: 0.12 };
        if (this.timer <= 0) {
          const bx = this.x - Math.cos(this.h) * 26, bz = this.z - Math.sin(this.h) * 26;
          if (this.act === 'pee') this.marks.push({ type: 'pee', x: bx, z: bz, r: R(10, 16), t: performance.now() });
          else for (let k = 0, n = 1 + Math.floor(Math.random() * 3); k < n; k++) this.marks.push({ type: 'poop', x: bx + R(-8, 8), z: bz + R(-8, 8), a: R(0, 6.28), t: performance.now() });
          if (this.marks.length > 60) this.marks.splice(0, this.marks.length - 60);
          this.next();
        }
        break;
      case 'dig': this.pose = { dig: 1 }; this.digPile = Math.min(1, this.digPile + dt / 40); if (this.timer <= 0) this.next(); break;
      case 'nap': case 'sleep': this.pose = { curl: 1 }; if (this.timer <= 0) this.next(); break;
      default: this.next();
    }
    if (this.where === 'cage' && this.act !== 'climbIn' && this.act !== 'lifted' && this.act !== 'climbOut') this.y = this.heightAt(this.x, this.z);
    // stride clock for walking
    if (this.v > 0.02) { this.phase = (this.phase + strideFreq(this.v) * dt) % 1; }
    if (this.pouch > 0 && !['pouch', 'carry', 'empty', 'walk', 'gather', 'carryNest', 'arrange'].includes(this.act)) this.pose.pouch = this.pouch;
    if (this.act === 'walk' && this.pouch > 0) this.pose.pouch = this.pouch;
  }
  faceTo(dt) { if (!this.face) return; const want = Math.atan2(this.face.z - this.z, this.face.x - this.x); this.h += ang(want - this.h) * Math.min(1, dt * 5); }

  // what the renderer needs for walking in the cage
  gaitState() {
    const v = this.v;
    return { f: v > 0.02 ? strideFreq(v) : 0, v, phase: this.phase, D: dutyFactor(v), gait: v > 0.24 ? 'trot' : 'walk', act: this.pose.groom ? 'groom' : this.pose.sniff ? 'look' : 'sit', br: this.act === 'sleep' || this.act === 'nap' ? 45 : 90 };
  }
}
