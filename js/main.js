import { Engine } from './audio/engine.js';
import { strikeMatch } from './audio/match.js';
import { christmasTime } from './render/christmas.js';
import { hanukkahTime } from './render/hanukkah.js';
import { WHEELS, SURFACES_H, AXLES, GAITS, pulleyRadii, vo2maxW } from './physics/hamster.js';
import { HamsterLife } from './sim/hamster-life.js';
import { MusicBoxScene } from './render/scene.js';
import { CrankPad } from './ui/crank.js';
import { ListenerMap } from './ui/listener-map.js';
import { PinRoll } from './ui/editor.js';
import { TineStrip, Inspector } from './ui/inspector.js';
import { SONGS, CATEGORIES } from './melody/songs.js';
import { compileSong, detectKey } from './melody/notation.js';
import { SCALE_GROUPS, SCALES, ROOTS, scaleSet, degreeOf, snapToScale } from './melody/scales.js';
import { arrange } from './melody/arranger.js';
import { parseMidi } from './melody/midi.js';
import { DEFAULT_CONFIG } from './physics/model.js';
import { COMBS, TINE_MATERIALS, ENCLOSURES, SURFACES, ROOMS, FEET, PLATE_MATERIALS, BOX_PRESETS, PIN, noteName } from './physics/constants.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ state
const cfg = { ...DEFAULT_CONFIG, ham: { mass: 0.125, wheel: 'd28', surface: 'rungs', axle: 'bearing', gear: 0.75, lover: false, diurnal: false, nature: 'real', covered: true, vol: 1 }, mode: 'crank', comb: 'c30', enclosure: 'classic', surface: 'oak', room: 'cabin' };
let song = null;            // compiled tune (onsets)
let songId = 'brahms';
let built = null;           // last build result (info, arrangement, combNotes, geom, drive, room)
let lastState = null;
let selectedTine = -1;
const engine = new Engine();
let started = false;

// ------------------------------------------------------------------ worker
let worker = null, reqId = 0, mainThreadBuild = null;
try {
  worker = new Worker(new URL('./physics/build-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (e) => onBuilt(e.data);
  worker.onerror = () => { worker = null; };
} catch (e) { worker = null; }

let buildTimer = null;
function requestBuild(delay = 120) {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(doBuild, delay);
}
async function doBuild() {
  $('busy').classList.remove('hidden');
  const id = ++reqId;
  const msg = { id, cfg: { ...cfg }, song, combOverride: null };
  if (worker) worker.postMessage(msg);
  else {
    if (!mainThreadBuild) mainThreadBuild = (await import('./physics/build-worker.js')).buildAll;
    try {
      const res = mainThreadBuild(msg.cfg, msg.song);
      res.pinsCopy = res.patch.tines.pins.map((p) => Array.from(p));
      onBuilt({ id, ok: true, ...res });
    } catch (err) { onBuilt({ id, ok: false, error: String(err) }); }
  }
}

function collectBuffers(o, out = []) {
  if (!o || typeof o !== 'object') return out;
  if (ArrayBuffer.isView(o)) { if (!out.includes(o.buffer)) out.push(o.buffer); return out; }
  for (const k in o) collectBuffers(o[k], out);
  return out;
}

function onBuilt(res) {
  if (res.id !== reqId) return;
  $('busy').classList.add('hidden');
  if (!res.ok) { console.error(res.error); $('nowPlaying').textContent = 'Build failed — see console'; return; }
  const { patch, info, arrangement, combNotes, pinsCopy } = res;
  built = {
    info, arrangement, combNotes, pins: pinsCopy,
    geom: { ...patch.geom }, drive: { ...patch.drive }, room: { ...patch.room, dims: [...patch.room.dims] },
    sr: patch.sr,
  };
  engine.send({ type: 'patch', patch }, collectBuffers(patch));
  if (playlist.seek) { playlist.seek = false; engine.send({ type: 'seek', theta: 0 }); playlist.prev = 0; }   // a new tune in the playlist starts from its beginning
  scene.build(info, { geom: built.geom }, cfg, pinsCopy);
  scene.setMode(cfg.mode);
  scene.quality = cfg.quality;
  buildRig();
  if (cfg.mode === 'auto') scene.frame($('hamWatch').classList.contains('on') ? 'hamster' : 'rig');
  if (selectedTine >= info.tines.length) selectedTine = -1;
  refreshAfterBuild();
}

// ------------------------------------------------------------------ 3D
const scene = new MusicBoxScene($('view'));
scene.onPick = (i) => selectTine(i, true);

// ---- the settings drawer: slides over the room when you want it, out of the way when you don't
const drawer = $('drawer');
try { if (localStorage.getItem('frisky.hamTried')) document.body.classList.add('ham-tried'); } catch (e) { /* private mode */ }
const wideScreen = () => matchMedia('(min-width: 640px) and (min-aspect-ratio: 5/4)').matches;
let heldBeforeDrawer = false;
function setDrawer(open, viaKey) {
  // the settings want a free mouse: opening them lets go of it; closing them with Tab takes it back
  if (open && scene.mouseHeld && scene.mouseHeld()) { heldBeforeDrawer = true; document.exitPointerLock(); }
  else if (!open) { if (viaKey && heldBeforeDrawer && scene.grabMouse) scene.grabMouse(); heldBeforeDrawer = false; }
  drawer.classList.toggle('open', open); document.body.classList.toggle('drawer-open', open); $('menuBtn').setAttribute('aria-expanded', String(open));
  document.documentElement.style.setProperty('--hdr', document.querySelector('header').getBoundingClientRect().height + 'px');
  // the room's canvas follows the stage as it widens or narrows
  const t0 = performance.now(); const step = () => { scene.resize(); if (performance.now() - t0 < 380) requestAnimationFrame(step); }; requestAnimationFrame(step);
  if (open) setTimeout(() => { map.resize(); roll.resize(); strip.resize(); insp.resize(); }, 340);
}
$('drawerClose').addEventListener('click', () => setDrawer(false));
// the grab tab: tap to slide the drawer open or shut, or drag it and let go
{
  const tab = $('menuBtn'); let drag = null;
  tab.addEventListener('pointerdown', (e) => {
    e.preventDefault(); try { tab.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
    drag = { x0: e.clientX, w: drawer.getBoundingClientRect().width, open: drawer.classList.contains('open'), moved: false };
  });
  tab.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0; if (Math.abs(dx) > 6) drag.moved = true; if (!drag.moved) return;
    const off = Math.max(0, Math.min(drag.w, (drag.open ? 0 : drag.w) + dx));
    drawer.classList.add('dragging'); drawer.style.transform = `translateX(${off}px)`; drag.off = off;
  });
  const end = () => {
    if (!drag) return;
    drawer.classList.remove('dragging'); drawer.style.transform = '';
    if (!drag.moved) setDrawer(!drag.open);
    else setDrawer(drag.off < drag.w * 0.5);
    drag = null;
  };
  tab.addEventListener('pointerup', end); tab.addEventListener('pointercancel', () => { if (drag) { drawer.classList.remove('dragging'); drawer.style.transform = ''; drag = null; } });
  tab.addEventListener('click', (e) => { if (e.detail === 0) setDrawer(!drawer.classList.contains('open')); });   // keyboard / assistive 'click'
  tab.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); setDrawer(!drawer.classList.contains('open')); } });
}
window.addEventListener('keydown', (e) => { if (e.code === 'Tab' && !e.target.closest('input, select, textarea, button, summary') && !e.target.closest('#drawer')) { e.preventDefault(); setDrawer(!drawer.classList.contains('open'), true); } });
// open by default on wide screens; closed on phones so you see the room
setDrawer(matchMedia('(min-width: 640px) and (min-aspect-ratio: 5/4)').matches);
if (!matchMedia('(max-width: 520px)').matches) $('hamMore').open = true;

$('aboutBtn').addEventListener('click', () => { const d = $('about'); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); });

// ------------------------------------------------------------------ audio start
// Audio start. iOS only allows audio from a *completed* tap (click / touchend), and
// only for work done synchronously in that handler, so the unlock happens right there.
let wired = false, snuffTimer = 0;
const prompt = $('lightPrompt'), cap = prompt.querySelector('.lightCap');
const PROMPTS = {
  first: ['Tap the candle to light it', 'and the music box comes to life'],
  relight: ['The candle went out', 'tap it to relight and resume the sound'],
  retry: ['Tap again to start the sound', 'the browser held the audio back'],
};
function showPrompt(kind, sub) {
  prompt.classList.toggle('gone', !kind);
  // walking and zoom controls appear once the candle is lit (a quiet first screen)
  for (const id of ['navCtl', 'lookPad']) { if (kind === 'first') $(id).classList.add('hidden'); if (!kind) $(id).classList.remove('hidden'); }
  if (!kind) return;
  const [a, b] = PROMPTS[kind] || [kind, ''];
  prompt.querySelector('.lightText').textContent = a;
  prompt.querySelector('.lightSub').textContent = sub || b;
  placePrompt(scene.candleScreen());
}
// keep the ring over the candle as the view moves; centre it if the candle is off screen
function placePrompt(p) {
  if (prompt.classList.contains('gone')) return;
  const anchored = !!(p && p.on);
  prompt.classList.toggle('anchored', anchored);
  if (!anchored) { prompt.style.left = prompt.style.top = ''; prompt.style.removeProperty('--ring'); cap.style.transform = ''; return; }
  const ring = Math.max(72, Math.min(190, p.size * 1.25));
  const x = Math.max(ring / 2 + 4, Math.min(p.w - ring / 2 - 4, p.x)), y = Math.max(ring / 2 + 6, Math.min(p.h - ring / 2 - 64, p.y));
  prompt.style.setProperty('--ring', ring.toFixed(0) + 'px');
  prompt.style.left = x.toFixed(1) + 'px'; prompt.style.top = y.toFixed(1) + 'px';
  // the ring stays on the candle; only the caption slides to stay on screen
  const cw = cap.offsetWidth || 220;
  const dx = Math.max(8 - (x - cw / 2), Math.min(0, p.w - 8 - (x + cw / 2)));
  cap.style.transform = dx ? `translateX(${dx.toFixed(1)}px)` : '';
}
scene.onCandleScreen = placePrompt;
function ensureStarted() {
  const p = engine.unlock();
  if (!wired) {
    wired = true; started = true;
    engine.onState = onState;
    // the candle is the audio's pilot light: it goes out when the browser suspends the
    // sound (screen lock, a call, another app) and relights when the sound comes back
    engine.onRunning = (on) => {
      clearTimeout(snuffTimer);
      scene.audioOn = on;
      if (on) { scene.lightCandle(); showPrompt(null); }
      else snuffTimer = setTimeout(() => { if (!engine.running) { scene.snuffCandle(); showPrompt('relight'); } }, 700);
    };
    p.then(() => {
      pushAll();
      if (engine.sampleRate !== cfg.sr) { cfg.sr = engine.sampleRate; requestBuild(0); }
    }).catch((e) => { console.error(e); showPrompt('retry', 'Audio failed to start: ' + e.message); });
  }
  if (engine.running) { scene.audioOn = true; scene.lightCandle(); showPrompt(null); }
}
prompt.addEventListener('click', (e) => {
  e.stopPropagation();
  ensureStarted();                       // synchronous unlock, inside the tap
  strikeMatch(engine.ctx);
  scene.lightCandle(); showPrompt(null);
  // if the browser still refused, ask for one more tap (the flame stays lit)
  setTimeout(() => { if (!engine.running) showPrompt('retry'); }, 1200);
});
showPrompt('first');
// any later completed tap also revives audio that iOS suspended (screen lock, calls, other apps)
for (const ev of ['click', 'touchend']) document.addEventListener(ev, () => { if (started && !engine.running) ensureStarted(); }, { capture: true });
function pushAll() {
  engine.send({ type: 'mode', mode: cfg.mode });
  engine.send({ type: 'noise', value: +$('noise').value });
  engine.send({ type: 'gain', value: +$('vol').value });
  engine.send({ type: 'airBrake', value: cfg.airBrake });
  engine.send({ type: 'listener', listener: { ...map.listener } });
  sendHam(); sendBin();
}

// ------------------------------------------------------------------ crank pad
const pad = new CrankPad($('pad'), $('padCanvas'), {
  onStart: () => ensureStarted(),
  onTurn: ({ delta, total, active }) => {
    if (cfg.mode === 'crank') engine.send({ type: 'hand', angle: total, active });
    else if (delta > 0) { engine.send({ type: 'wind', delta }); scene.state.keyAngle -= delta; }
  },
  onRelease: ({ total }) => { if (cfg.mode === 'crank') engine.send({ type: 'hand', angle: total, active: false }); },
});

// the cage under its blanket: hamster hidden, silent, and the belt unhooked
function setCovered(on) {
  cfg.ham.covered = on;
  if (scene.hamRig) scene.hamRig.setCovered(on);
  // under the blanket he settles down to sleep in his nest, whatever he was doing
  if (on && life) { if (life.where === 'wheel' && life.onWheel) life.onWheel(false); life.where = 'cage'; life.act = 'sleep'; life.plan = []; life.timer = 60; life.x = life.cage.house.bed.x; life.z = life.cage.house.bed.z; life.y = 0; life.v = 0; }
  engine.send({ type: 'hamster', silent: on, ...(on ? { inWheel: false, stopWheel: true } : {}) });
  if (on && cfg.mode === 'auto') setMode('crank');
  // the first time the blanket comes off, Frisky is lifted straight into his wheel
  if (!on && !unveiled) { unveiled = true; const put = (k) => { if (life) life.placeInWheel(); else if (k < 20) setTimeout(() => put(k + 1), 250); }; setTimeout(() => put(0), 700); }
}
let unveiled = false;
scene.onUncover = () => setCovered(false);
function setMode(mode) {
  if (mode === 'auto') { document.body.classList.add('ham-tried'); try { localStorage.setItem('frisky.hamTried', '1'); } catch (e) { /* private mode */ } }
  if (mode === 'auto' && cfg.ham.covered) setCovered(false);   // hooking him up lifts the blanket
  cfg.mode = mode;
  document.querySelectorAll('.modeSwitch button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  $('windInfo').classList.toggle('hidden', mode !== 'spring');
  $('hamInfo').classList.toggle('hidden', mode !== 'auto');
  $('gaitCard').classList.toggle('hidden', mode !== 'auto');
  $('pad').classList.toggle('hidden', mode === 'auto');
  if ($('follow').checked && scene.everLit) settleEyes();
  if (mode === 'auto') {
    // Hamster play style: he's lifted into the wheel to drive the box (he may hop out later, as hamsters do)
    if (unveiled && life && life.where !== 'wheel') setTimeout(() => { if (cfg.mode === 'auto' && life && life.where !== 'wheel') life.placeInWheel(); }, 600);
    sendHam(); $('hamWatch').classList.remove('on'); $('hamWatch').innerHTML = '<span class="ic">👀</span><span class="lb">Watch him</span><span class="sh">Watch</span>';
    // the first time you meet him, make it plain he can be put to work, watched, or put to bed
    try { if (!localStorage.getItem('musicbox.metHer')) { localStorage.setItem('musicbox.metHer', '1'); $('hamInfo').classList.add('intro'); setTimeout(() => $('hamInfo').classList.remove('intro'), 9000); } } catch (e) { /* private mode */ }
  }
  $('padLabel').innerHTML = mode === 'crank' ? 'Circle clockwise<br>to crank' : 'Circle clockwise<br>to wind';
  pad.mode = mode; pad.draw();
  engine.send({ type: 'mode', mode });
  scene.setMode(mode);
}
document.querySelectorAll('.modeSwitch button').forEach((b) => b.addEventListener('click', () => { ensureStarted(); setMode(b.dataset.mode); }));
let braked = true;
$('lever').addEventListener('click', () => {
  ensureStarted();
  braked = !braked;
  engine.send({ type: 'brake', on: braked });
  $('lever').textContent = braked ? 'Start' : 'Stop';
  $('lever').classList.toggle('stop', !braked);
});

// ------------------------------------------------------------------ hamster drive
const fillH = (id, obj, val) => { const el = $(id); el.innerHTML = ''; for (const [k, v] of Object.entries(obj)) { const o = document.createElement('option'); o.value = k; o.textContent = v.label; el.appendChild(o); } el.value = val; };
fillH('hamWheel', WHEELS, cfg.ham.wheel); fillH('hamTread', SURFACES_H, cfg.ham.surface); fillH('hamAxle', AXLES, cfg.ham.axle);
function sendHam() { engine.send({ type: 'hamster', opts: { ...cfg.ham }, silent: cfg.ham.covered, vol: cfg.ham.vol }); }
let life = null;
function buildRig() {
  if (!built) return;
  const R = WHEELS[cfg.ham.wheel].D / 2, [rw, rc] = pulleyRadii(built.drive.G_crank, built.drive.omegaNom, R, cfg.ham.gear);
  scene.buildHamRig({ R, rw, rc, surface: cfg.ham.surface, mass: cfg.ham.mass });
  // his life goes on across rebuilds
  if (!life) { life = new HamsterLife(scene.hamRig.layout); life.onWheel = (on, placed) => engine.send({ type: 'hamster', inWheel: on, ...(placed ? { wake: true } : {}) }); }
  else life.setCage(scene.hamRig.layout);
  life.mode = cfg.ham.nature;
  life.scale = Math.cbrt(cfg.ham.mass / 0.125);   // the same scale the model is drawn at, so he stays inside the glass at any weight
  scene.hamLife = life;
  scene.hamRig.setCovered(cfg.ham.covered);
  const M = cfg.ham.mass;
  $('hamDriveInfo').textContent = [
    `belt       ${(rw * 2e3).toFixed(0)} mm hub pulley → ${(rc * 2e3).toFixed(0)} mm crank pulley (×${(rw / rc).toFixed(2)}), quarter-twist O-ring`,
    `tempo      100% when he runs ${(0.44 / cfg.ham.gear).toFixed(2)} m/s (${(0.44 / cfg.ham.gear / R * 60 / TAU).toFixed(0)} wheel rpm)`,
    `his limits VO2max ≈ ${(vo2maxW(M) / 20.1 * 60).toFixed(1)} ml O2/min, aerobic pace up to ≈ ${((0.7 * vo2maxW(M) / M - 6.03 * M ** -0.303) / (10.7 * M ** -0.316)).toFixed(2)} m/s`,
  ].join('\n');
}
$('hamMass').addEventListener('input', (e) => { cfg.ham.mass = +e.target.value / 1000; $('hamMassv').textContent = e.target.value + ' g'; sendHam(); clearTimeout(buildRig.t); buildRig.t = setTimeout(buildRig, 250); });
for (const [id, key] of [['hamWheel', 'wheel'], ['hamTread', 'surface'], ['hamAxle', 'axle']]) $(id).addEventListener('change', (e) => { cfg.ham[key] = e.target.value; sendHam(); buildRig(); });
$('hamCover').addEventListener('click', () => setCovered(true));
// the hamster panel folds down to its one-line status (remembered); handy on a phone
{
  const setMini = (on) => {
    $('hamInfo').classList.toggle('mini', on); $('hamMin').setAttribute('aria-expanded', String(!on));
    $('hamMin').textContent = on ? '▸' : '–'; $('hamMin').title = on ? 'Show his buttons' : 'Fold this panel down';
    try { localStorage.setItem('frisky.hamMini', on ? '1' : ''); } catch (e) { /* private mode */ }
  };
  let on = false; try { on = !!localStorage.getItem('frisky.hamMini'); } catch (e) { /* private mode */ }
  setMini(on);
  $('hamMin').addEventListener('click', () => setMini(!$('hamInfo').classList.contains('mini')));
  $('hamTxt').addEventListener('click', () => { if ($('hamInfo').classList.contains('mini')) setMini(false); });
}
// tap the glass: asleep, he wakes and potters; awake, he startles. What he does next is up to him.
function tapCage() {
  if (!life) return;
  if (cfg.ham.covered) { setCovered(false); return; }
  const r = life.tap();
  const b = $('hamTap'); b.classList.add('on'); setTimeout(() => b.classList.remove('on'), 400);
  const SAY = {
    wheel: 'and he heads straight for the wheel', eat: 'and he stomps off for a snack', pee: 'and he heads for his toilet corner',
    poop: 'and he heads for his toilet corner', groom: 'and he sits up and washes his face, crossly', explore: 'and he potters about, sniffing',
    drink: 'and he goes for a drink', gnaw: 'and he takes it out on his chew stick', surf: 'and he paces the glass on his hind legs',
    nest: 'and he fusses with his nest', peek: 'and he retreats to peek out of his house', flank: 'and he goes round marking his territory', sand: 'and he climbs up for a roll in his sand bath',
  };
  const msg = r.what === 'ignore' ? 'Tap! He ignores you and keeps running.' : r.what === 'hopOut' ? 'Tap! He hops out of the wheel to see what that was.'
    : r.what === 'freeze' ? 'Tap! He freezes, eyes wide… then bolts for his house.' : r.what === 'busy' ? 'Tap! He\'s a bit busy right now.' : (r.asleep ? 'Tap! He wakes up, grumpy, ' : 'Tap! He startles, up on his hind legs, ') + (SAY[r.what] || 'and potters about') + '.';
  toast(msg);
  return r;
}
function toast(text) {
  let t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; $('stage').appendChild(t); }
  t.textContent = text; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 3200);
}
$('hamTap').addEventListener('click', () => { ensureStarted(); tapCage(); });
scene.onTapCage = () => { ensureStarted(); tapCage(); };
// wheel sound volume: one setting, shown both in the hamster panel and under Music Box → Cage
function setHamVol(v) {
  cfg.ham.vol = v; const pct = Math.round(v * 100) + '%';
  for (const id of ['hamVol', 'hamVolCage']) { $(id).value = v; $(id + 'v').textContent = pct; }
  engine.send({ type: 'hamster', vol: v });
}
for (const id of ['hamVol', 'hamVolCage']) $(id).addEventListener('input', (e) => setHamVol(+e.target.value));
$('hamPlace').addEventListener('click', () => { ensureStarted(); if (life) life.placeInWheel(); });
$('hamGear').addEventListener('input', (e) => {
  cfg.ham.gear = +e.target.value; $('hamGearv').textContent = '×' + cfg.ham.gear.toFixed(2); sendHam();
  clearTimeout(buildRig.t); buildRig.t = setTimeout(buildRig, 200);
});
// his nature: a real (nocturnal) hamster, a wheel lover, or a mutant who's awake by day and asleep by night
function setNature(n) {
  cfg.ham.nature = n; cfg.ham.lover = n === 'lover'; cfg.ham.diurnal = n === 'diurnal';
  if (life) life.mode = n;
  sendHam(); syncNature();
}
function syncNature() { document.querySelectorAll('.hamNature .seg button').forEach((b) => b.classList.toggle('on', b.dataset.nature === cfg.ham.nature)); }
document.querySelectorAll('.hamNature .seg button').forEach((b) => b.addEventListener('click', () => setNature(b.dataset.nature)));
syncNature();
$('hamWatch').addEventListener('click', () => {
  const on = !$('hamWatch').classList.contains('on');
  if (scene.followListener) {
    // through your own eyes: lean in close to the cage (and back out to see the whole rig)
    if (on) { if (lean && lean.what !== 'ham') { lean = null; } scene.onLean('ham'); }
    else if (lean) scene.onLean();
    return;
  }
  $('hamWatch').classList.toggle('on', on); $('hamWatch').innerHTML = on ? '<span class="ic">🔭</span><span class="lb">Whole rig</span><span class="sh">Rig</span>' : '<span class="ic">👀</span><span class="lb">Watch him</span><span class="sh">Watch</span>';
  scene.frame(on ? 'hamster' : 'rig');
});
// the footfall diagram folds to a paw button (remembered)
{
  const setMini = (on) => {
    $('gaitCard').classList.toggle('mini', on); $('gaitMin').setAttribute('aria-expanded', String(!on));
    $('gaitMin').textContent = on ? '🐾' : '–'; $('gaitMin').title = on ? "Show Frisky's footfall diagram" : 'Fold the footfall diagram away';
    try { localStorage.setItem('frisky.gaitMini', on ? '1' : ''); } catch (e) { /* private mode */ }
  };
  let on = false; try { on = !!localStorage.getItem('frisky.gaitMini'); } catch (e) { /* private mode */ }
  setMini(on);
  $('gaitMin').addEventListener('click', () => setMini(!$('gaitCard').classList.contains('mini')));
}
// footfall (Hildebrand) diagram: stance bars for each paw scrolling right to left
const gaitCv = $('gaitCanvas'), gaitHist = [];
let lastHam = null, lastHamT = 0;
function drawGait() {
  requestAnimationFrame(drawGait);
  if (cfg.mode !== 'auto') return;
  const cv = gaitCv, dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const h = lastHam;
  const now = performance.now() / 1000;
  if (h) {
    const ph = (h.phase + h.f * Math.min(0.08, now - lastHamT)) % 1, off = GAITS[h.gait];
    const st = [0, 1, 2, 3].map((k) => { let u = ph - off[k]; u -= Math.floor(u); return h.f > 0 && Math.abs(h.v) > 0.04 ? u < h.D : true; });
    gaitHist.push({ t: now, st });
    while (gaitHist.length && gaitHist[0].t < now - 2.2) gaitHist.shift();
  }
  const top = 22, rowH = (H - top - 8) / 4, x0 = 30, span = W - x0 - 8;
  c.font = '10px -apple-system, sans-serif'; c.fillStyle = '#b5a58f';
  ['LF', 'RF', 'LH', 'RH'].forEach((n, k) => c.fillText(n, 8, top + rowH * k + rowH * 0.68));
  for (let i = 1; i < gaitHist.length; i++) {
    const a = gaitHist[i - 1], b = gaitHist[i];
    const xa = x0 + span * (1 - (now - a.t) / 2.2), xb = x0 + span * (1 - (now - b.t) / 2.2);
    for (let k = 0; k < 4; k++) if (b.st[k]) { c.fillStyle = k < 2 ? '#8fc1d9' : '#e3b45a'; c.fillRect(xa, top + rowH * k + 3, xb - xa + 0.6, rowH - 6); }
  }
  c.fillStyle = '#f2e6d4'; c.font = '11px -apple-system, sans-serif';
  const g = h ? (h.f > 0 && Math.abs(h.v) > 0.04 ? ({ walk: 'walk', trot: 'trot', bound: 'half-bound' })[h.gait] : 'standing') : '—';
  c.fillText(h ? `${g} · ${(Math.abs(h.v)).toFixed(2)} m/s · ${h.f.toFixed(1)} strides/s · duty ${(h.D * 100).toFixed(0)}%` : 'footfalls', 8, 14);
}
requestAnimationFrame(drawGait);
function hamText(h) {
  const inW = life && life.where === 'wheel' && h.inWheel;
  let what;
  if (inW && h.state === 'run') what = `<b>${({ walk: 'Walking', trot: 'Trotting', bound: 'Half-bounding' })[h.gait]}</b> in the wheel, ${(Math.abs(h.v) * 3.6).toFixed(1)} km/h${h.slip ? ' · paws slipping' : ''}`;
  else if (inW) what = `<b>Pausing</b> in the wheel`;
  else if (cfg.ham.covered) what = '<b>Under the blanket</b>, fast asleep in his nest';
  else what = `<b>${life ? life.desc : 'Asleep in his nest'}</b>`;
  if (life && !inW && (life.act === 'sleep' || life.act === 'nap') && life.activity < 0.5) {
    const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    what += cfg.ham.nature === 'diurnal' ? ` — it's ${t}; this mutant sleeps through the night and wakes at dawn` : ` — it's ${t}; Syrian hamsters sleep through the day and wake around dusk`;
  }
  const hooked = cfg.mode === 'auto' ? (inW ? '' : ' — the box is waiting for him') : '';
  return `${what}${hooked}<br>♥ ${h.hr.toFixed(0)} bpm · ${h.br.toFixed(0)} breaths/min · ${h.Emet.toFixed(1)} W · ${h.dist >= 1000 ? (h.dist / 1000).toFixed(2) + ' km' : h.dist.toFixed(0) + ' m'} ${cfg.ham.nature === 'diurnal' ? 'today' : 'tonight'}`;
}

// ------------------------------------------------------------------ listener map
const map = new ListenerMap($('map'), (L) => {
  engine.send({ type: 'listener', listener: { x: L.x, y: L.y, z: L.z, yaw: L.yaw } });
  scene.setListener(L);
  const deg = Math.round(((L.yaw * 180) / Math.PI + 540) % 360 - 180);
  $('yaw').value = deg; $('yawv').textContent = deg + '°';
  updateDist();
});
// ---- your ears: headphone type, head size (sets ITD and head shadow), pinna size (pinna echo delays)
const binCfg = (() => { try { return { mode: 'inear', headC: 57, pinna: 1, ...JSON.parse(localStorage.getItem('musicbox.binaural') || '{}') }; } catch (e) { return { mode: 'inear', headC: 57, pinna: 1 }; } })();
function sendBin() {
  // effective sphere radius for ITD: 8.75 cm for a 57 cm head circumference, scaled with it
  engine.send({ type: 'binaural', bin: { mode: binCfg.mode, headA: 0.0875 * binCfg.headC / 57, pinna: binCfg.pinna } });
  $('headCv').textContent = `${binCfg.headC} cm around`;
  $('pinnav').textContent = binCfg.pinna < 0.92 ? 'small' : binCfg.pinna > 1.08 ? 'large' : 'average';
  $('hpHint').textContent = binCfg.mode === 'inear'
    ? 'In-ear: the model supplies everything your outer ears would, so each sound path is filtered for its direction (left/right, front/back, up/down) and distance. With AirPods, turn off Spatialize Stereo (Control Center → press and hold the volume slider → Spatial Audio → Off) so iOS does not spatialise it a second time.'
    : binCfg.mode === 'overear' ? 'Over-ear: your own ears still shape the sound a little, so the outer-ear cues are applied more gently. Turn off any spatial-audio setting on the headphones.'
    : 'Speakers: the room and box are panned in stereo; your real head and ears do the rest.';
  try { localStorage.setItem('musicbox.binaural', JSON.stringify(binCfg)); } catch (e) { /* private mode */ }
}
$('hpMode').value = binCfg.mode; $('headC').value = binCfg.headC; $('pinna').value = binCfg.pinna;
$('hpMode').addEventListener('change', (e) => { binCfg.mode = e.target.value; sendBin(); });
$('headC').addEventListener('input', (e) => { binCfg.headC = +e.target.value; sendBin(); });
$('pinna').addEventListener('input', (e) => { binCfg.pinna = +e.target.value; sendBin(); });
sendBin();
// head tracking from the device's motion sensors (browsers cannot read AirPods' own head tracking):
// the direction out of the back of the device, from the W3C alpha/beta/gamma rotation, is where you face
let track = null;
if (typeof DeviceOrientationEvent === 'undefined') $('trackRow').style.display = 'none';
function onOrient(ev) {
  if (!track || ev.alpha == null) return;
  const d2r = Math.PI / 180, a = ev.alpha * d2r, b = ev.beta * d2r, g = ev.gamma * d2r;
  const cx = Math.cos(a) * Math.sin(g) + Math.sin(a) * Math.sin(b) * Math.cos(g);
  const cy = Math.sin(a) * Math.sin(g) - Math.cos(a) * Math.sin(b) * Math.cos(g);
  const cz = Math.cos(b) * Math.cos(g);
  const heading = Math.atan2(-cy, -cx), pitch = Math.asin(Math.max(-1, Math.min(1, -cz)));
  if (track.h0 === null) { track.h0 = heading; return; }
  track.yaw = track.yaw0 + Math.atan2(Math.sin(heading - track.h0), Math.cos(heading - track.h0));
  track.pitch = pitch;
  if (!track.raf) track.raf = requestAnimationFrame(() => {
    track.raf = 0; if (!track) return;
    map.listener.yaw = track.yaw; map.emit();
    if (scene.followListener) scene.lookPitch = track.pitch;
  });
}
$('headTrack').addEventListener('change', async (e) => {
  if (e.target.checked) {
    try {
      if (DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') throw new Error('not allowed'); }
    } catch (err) { e.target.checked = false; $('hpHint').textContent = 'Motion access was not allowed, so head tracking is off.'; return; }
    track = { h0: null, yaw0: map.listener.yaw, yaw: map.listener.yaw, pitch: 0, raf: 0 };
    map.faceBox = false; $('faceBox').checked = false;
    window.addEventListener('deviceorientation', onOrient);
  } else { window.removeEventListener('deviceorientation', onOrient); track = null; }
});

// follow perspective: the 3D view is your eyes; dragging it turns your head
$('detach').addEventListener('change', (e) => { const f = $('follow'); f.checked = !e.target.checked; f.dispatchEvent(new Event('change')); });
$('follow').addEventListener('change', (e) => {
  // before the candle is lit you're still taking in the room; the view becomes yours once it is
  if (!scene.everLit) return;
  scene.setFollow(e.target.checked)
});
// double tap through your own eyes: lean over the table to look into the box, then back.
// Your head really moves, so you hear it close up too.
let lean = null;
function leanPose(L, b, dist = 0.3, up = 0.32) {
  const dx = b[0] - L.x, dy = b[1] - L.y, d = Math.hypot(dx, dy) || 1;
  return { x: b[0] - dx / d * dist, y: b[1] - dy / d * dist, z: b[2] + up, yaw: Math.atan2(dy, dx), faceBox: false };
}
// where your eyes go: the box, Frisky, or the whole rig (between them), in room coordinates
function gazePoint(kind) {
  if (kind === 'box' || !scene.hamRig) return built && built.room.boxPos;
  return scene.toRoom(scene.gazeWorld(kind));
}
function gazeAt(kind) {
  scene.gaze = kind; scene.lookPitch = null;
  map.faceAt = kind === 'box' ? null : gazePoint(kind);
  map.faceBox = true; $('faceBox').checked = true; map.emit();
}
// keep turning your head to follow him as he moves about the cage
setInterval(() => {
  if (scene.gaze === 'box' || !map.faceBox || !scene.hamRig) return;
  const p = gazePoint(scene.gaze); if (!p) return;
  const f = map.faceAt;
  if (!f || Math.hypot(p[0] - f[0], p[1] - f[1]) > 0.01) { map.faceAt = p; map.emit(); }
}, 150);
// move your head smoothly to a pose (and hear it move)
function moveHead(to, done) {
  const L = map.listener, start = { x: L.x, y: L.y, z: L.z, yaw: L.yaw }, t0 = performance.now();
  let dyaw = to.yaw - start.yaw; while (dyaw > Math.PI) dyaw -= 2 * Math.PI; while (dyaw < -Math.PI) dyaw += 2 * Math.PI;
  const keepFace = map.faceBox; map.faceBox = false;
  const go = (now) => {
    const u = Math.min(1, (now - t0) / 900), e = u * u * (3 - 2 * u);
    L.x = start.x + (to.x - start.x) * e; L.y = start.y + (to.y - start.y) * e; L.z = start.z + (to.z - start.z) * e; L.yaw = start.yaw + dyaw * e;
    walk.zT = L.z;
    if (u < 1) { map.emit(); requestAnimationFrame(go); }
    else { map.faceBox = keepFace; $('earH').value = L.z; $('earHv').textContent = L.z.toFixed(2) + ' m'; postureLabel(); map.emit(); if (done) done(); }
  };
  requestAnimationFrame(go);
}
const restGaze = () => (cfg.mode === 'auto' ? 'rig' : 'box');
// your eyes go to what's playing: the whole rig with him in it (sitting back first), or the box
function settleEyes() {
  if (lean && (cfg.mode === 'auto' || lean.what === 'ham')) { const back = lean.from; lean = null; syncWatch(); moveHead({ ...back, yaw: map.listener.yaw }, () => gazeAt(restGaze())); }
  else setTimeout(() => gazeAt(restGaze()), 50);
}
// double tap through your own eyes: lean in over the box (or close to the cage), then back.
// Your head really moves, so you hear it close up too.
scene.onLean = (what = 'box') => {
  const L = map.listener;
  if (lean) { const back = lean.from; lean = null; syncWatch(); moveHead({ ...back, yaw: L.yaw }, () => gazeAt(restGaze())); return; }
  const tgt = gazePoint(what === 'ham' ? 'ham' : 'box');
  if (!tgt || (what === 'box' && built.room.held)) return;
  lean = { from: { x: L.x, y: L.y, z: L.z, yaw: L.yaw }, what };
  const pose = what === 'ham' ? leanPose(L, tgt, 0.42, 0.22) : leanPose(L, tgt);
  gazeAt(what === 'ham' ? 'ham' : 'box');
  syncWatch();
  moveHead(pose);
};
function syncWatch() {
  const on = !!(lean && lean.what === 'ham');
  $('hamWatch').classList.toggle('on', on); $('hamWatch').innerHTML = on ? '<span class="ic">🔭</span><span class="lb">Whole rig</span><span class="sh">Rig</span>' : '<span class="ic">👀</span><span class="lb">Watch him</span><span class="sh">Watch</span>';
}
// the first light, with Follow perspective on: lean over the table and fly from the opening view
// down into your own eyes, looking into the box (double-tap to sit back)
scene.onFirstLight = () => {
  if (!$('follow').checked) return false;
  const L = map.listener, b = built && built.room.boxPos;
  if (b && !built.room.held) {
    lean = { from: { x: L.x, y: L.y, z: L.z, yaw: L.yaw, faceBox: map.faceBox } };
    const P = leanPose(L, b); L.x = P.x; L.y = P.y; L.z = P.z; L.yaw = P.yaw; map.faceBox = false; $('faceBox').checked = false; walk.zT = L.z;
    $('earH').value = L.z; $('earHv').textContent = L.z.toFixed(2) + ' m'; postureLabel(); map.emit();
  }
  scene.flyToEyes(() => { scene.setFollow(true); if (cfg.mode === 'auto') settleEyes(); });
  return true;
};
let lookYaw = 0, lookRaf = 0;
scene.onLook = (d) => {       // a fast finger sends many moves per frame: gather them, turn once per frame
  map.faceBox = false; $('faceBox').checked = false;
  lookYaw += d;
  if (!lookRaf) lookRaf = requestAnimationFrame(() => { lookRaf = 0; map.listener.yaw -= lookYaw; lookYaw = 0; map.emit(); });
};
$('faceBox').addEventListener('change', (e) => { map.faceBox = e.target.checked; map.emit(); });
$('earH').addEventListener('input', (e) => { map.listener.z = walk.zT = +e.target.value; $('earHv').textContent = (+e.target.value).toFixed(2) + ' m'; postureLabel(); map.emit(); });

// ------------------------------------------------------------------ walking about
// W/S (or ↑/↓) forward and back, A/D sidestep, Q/E (or ←/→) turn, Space stand, C crouch, +/− zoom;
// the on-screen pad does the same for touch. Your ears move with you, so you hear the room change.
const POSTURES = [['Crouching', 0.8], ['Sitting', 1.2], ['Standing', 1.62]];
const walk = { shift: false, keys: new Set(), pad: new Set(), stick: { x: 0, y: 0 }, vf: 0, vs: 0, vt: 0, vl: 0, raf: 0, last: 0, zT: 1.2 };
function postureLabel() {
  if (lean) { $('postureTxt').textContent = 'Leaning in'; $('standBtn').disabled = $('crouchBtn').disabled = false; return; }
  const z = walk.zT; let i = 0; for (let k = 1; k < POSTURES.length; k++) if (Math.abs(POSTURES[k][1] - z) < Math.abs(POSTURES[i][1] - z)) i = k;
  $('postureTxt').textContent = Math.abs(POSTURES[i][1] - z) < 0.06 ? POSTURES[i][0] : `ears ${z.toFixed(2)} m`;
  $('standBtn').disabled = z >= 1.6; $('crouchBtn').disabled = z <= 0.82;
}
function posture(dir) {
  if (lean) { scene.onLean(); return; }
  const z = walk.zT;
  const next = dir > 0 ? POSTURES.find(([, h]) => h > z + 0.05) : [...POSTURES].reverse().find(([, h]) => h < z - 0.05);
  if (!next) return;
  walk.zT = next[1]; postureLabel(); walkLoop();
}
const held = (k) => walk.keys.has(k);
function walkLoop() {
  if (walk.raf) return;
  walk.last = performance.now();
  const step = (now) => {
    const dt = Math.min(0.05, (now - walk.last) / 1000); walk.last = now;
    const L = map.listener, P = walk.pad;
    const J = walk.stick;
    let f = (held('KeyW') || P.has('fwd') ? 1 : 0) - (held('KeyS') || P.has('back') ? 1 : 0) - J.y;
    let sd = (held('KeyD') || P.has('sr') ? 1 : 0) - (held('KeyA') || P.has('sl') ? 1 : 0) + J.x;
    const m = Math.hypot(f, sd); if (m > 1) { f /= m; sd /= m; }
    const look = (P.has('lu') || held('ArrowUp') ? 1 : 0) - (P.has('ld') || held('ArrowDown') ? 1 : 0);
    const turn = (held('ArrowLeft') || P.has('tl') ? 1 : 0) - (held('ArrowRight') || P.has('tr') ? 1 : 0);
    // momentum: ease into a walk and out of it (and the same for turning and looking), so nothing lurches
    const vmax = (L.z < 1.0 ? 0.45 : 1.0) * (J.run || walk.shift ? 1.6 : 1);      // Shift (or the thumb carried on past the stick's rim) hurries
    const ease = (v, to, rate) => v + (to - v) * (1 - Math.exp(-rate * dt));
    walk.vf = ease(walk.vf, f * vmax, f ? 8 : 6); walk.vs = ease(walk.vs, sd * vmax, sd ? 8 : 6);
    walk.vt = ease(walk.vt, turn * 1.5, turn ? 9 : 7); walk.vl = ease(walk.vl, look * 0.8, look ? 9 : 7);
    const tiny = (v) => Math.abs(v) < 0.004;
    if (tiny(walk.vf)) walk.vf = 0; if (tiny(walk.vs)) walk.vs = 0; if (tiny(walk.vt)) walk.vt = 0; if (tiny(walk.vl)) walk.vl = 0;
    let moved = false;
    if (walk.vl) scene.tilt(walk.vl * dt);      // through your eyes: look up or down; otherwise tilt the view
    if (walk.vt) { map.faceBox = false; $('faceBox').checked = false; L.yaw += walk.vt * dt; moved = true; }
    if (walk.vf || walk.vs) {
      const fx = Math.cos(L.yaw), fy = Math.sin(L.yaw), rx = Math.sin(L.yaw), ry = -Math.cos(L.yaw);
      let x = L.x + (walk.vf * fx + walk.vs * rx) * dt, y = L.y + (walk.vf * fy + walk.vs * ry) * dt;
      [x, y] = collide(x, y, L.x, L.y);
      L.x = x; L.y = y; moved = true;
    }
    if (Math.abs(walk.zT - L.z) > 0.002) { L.z += (walk.zT - L.z) * Math.min(1, dt * 5); moved = true; $('earH').value = L.z; $('earHv').textContent = L.z.toFixed(2) + ' m'; }
    if (moved) map.emit();
    if (moved || f || sd || turn || look || walk.vl) walk.raf = requestAnimationFrame(step); else walk.raf = 0;
  };
  walk.raf = requestAnimationFrame(step);
}
// keep inside the walls, and out of the table (and the hamster's cage beside the box)
// The table (and the cage beside the box) can't be walked into, but if you're already over it (leaning in
// to watch him) you can always walk back out: we only stop you crossing into it, sliding along its edge.
function collide(x, y, ox = x, oy = y) {
  if (!built) return [x, y];
  const room = ROOMS[cfg.room], [X, Y] = room.dims, m = 0.25;
  const clampW = (a, b) => (room.walls ? [Math.min(Math.max(a, m), X - m), Math.min(Math.max(b, m), Y - m)] : [a, b]);
  [x, y] = clampW(x, y);
  const b = built.room.boxPos, t = map.table;
  if (b && t && !built.room.held) {
    const x0 = b[0] - t[0] / 2 - m, x1 = b[0] + t[0] / 2 + m + 0.35, y0 = b[1] - t[1] / 2 - m, y1 = b[1] + t[1] / 2 + m;
    const inside = (px, py) => px > x0 && px < x1 && py > y0 && py < y1;
    if (inside(x, y) && !inside(ox, oy)) {
      // try keeping just one axis of the step (slide along the edge), else stay put
      if (!inside(x, oy)) return clampW(x, oy);
      if (!inside(ox, y)) return clampW(ox, y);
      return [ox, oy];
    }
  }
  return [x, y];
}
// Menus shouldn't keep hold of the keys: only text fields swallow W A S D; a dropdown or slider you
// just used lets go of the keyboard (so the arrows walk again), and Esc or a tap on the room always does.
const TEXTY = new Set(['text', 'search', 'number', 'email', 'url', 'password', 'tel']);
const typing = (e) => { const t = e.target; return t && ((t.tagName === 'INPUT' && TEXTY.has(t.type)) || t.tagName === 'TEXTAREA' || t.isContentEditable); };
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const release = () => { const a = document.activeElement; if (a && a !== document.body && !typing({ target: a })) a.blur(); };
document.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') e.target.blur(); }, true);
document.addEventListener('pointerup', (e) => { const t = e.target; if (t && (t.type === 'range' || t.tagName === 'BUTTON')) setTimeout(() => t.blur(), 0); }, true);
$('view').addEventListener('pointerdown', release);
const WALK_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
window.addEventListener('keydown', (e) => {
  walk.shift = e.shiftKey;
  if (e.code === 'Escape') { release(); return; }
  if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
  // an arrow key on a slider or dropdown you reached with Tab still works that control
  const t = e.target;
  if (ARROWS.has(e.code) && t && (t.tagName === 'SELECT' || t.type === 'range') && t.matches(':focus-visible')) return;
  if (WALK_KEYS.has(e.code)) { e.preventDefault(); walk.keys.add(e.code); lean = null; litKey(e.code, true); walkLoop(); return; }
  // E zooms in, Q zooms out (hold to keep zooming), as do + and −
  if (e.code === 'KeyE' || e.code === 'Equal' || e.code === 'NumpadAdd') { scene.dolly(0.89); litKey(e.code, true); return; }
  if (e.code === 'KeyQ' || e.code === 'Minus' || e.code === 'NumpadSubtract') { scene.dolly(1.12); litKey(e.code, true); return; }
  if (e.repeat) return;
  if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); posture(+1); }
  else if (e.code === 'KeyC') posture(-1);
});
const litKey = (code, on) => document.querySelectorAll(`.navCtl [data-key="${code}"]`).forEach((k) => k.classList.toggle('held', on));
window.addEventListener('keyup', (e) => { walk.shift = e.shiftKey; walk.keys.delete(e.code); litKey(e.code, false); });
window.addEventListener('blur', () => { walk.keys.clear(); walk.pad.clear(); walk.stick.x = walk.stick.y = 0; document.querySelectorAll('[data-move].held').forEach((b) => b.classList.remove('held')); });
document.querySelectorAll('button[data-move]').forEach((b) => {
  const on = (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ } lean = null; walk.pad.add(b.dataset.move); b.classList.add('held'); walkLoop(); };
  const off = () => { walk.pad.delete(b.dataset.move); b.classList.remove('held'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
});
// ---- touch, as in Ashland: a floating thumbstick on the left walks (and strafes); drag anywhere else to look.
// The stick jumps to wherever your thumb lands in the lower left of the room; a quick tap there is still a tap.
{
  const stick = $('stick'), knob = stick.querySelector('i'), view = $('view');
  let joy = null;
  const reset = () => { joy = null; walk.stick.x = walk.stick.y = 0; walk.stick.run = false; knob.style.transform = ''; stick.style.transform = ''; stick.classList.remove('held'); };
  $('stage').addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || joy) return;
    const onStick = e.target === stick, r = $('stage').getBoundingClientRect();
    const inZone = e.target === view && scene.followListener && !$('navCtl').classList.contains('hidden')
      && e.clientX - r.left < r.width * 0.42 && e.clientY - r.top > r.height * 0.5;
    if (!onStick && !inZone) return;
    e.preventDefault(); e.stopPropagation();          // the room underneath doesn't see this finger
    try { stick.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
    const s = stick.getBoundingClientRect(), hx = s.left + s.width / 2, hy = s.top + s.height / 2;
    const inside = Math.hypot(e.clientX - hx, e.clientY - hy) < s.width / 2;
    const cx = inside ? hx : e.clientX, cy = inside ? hy : e.clientY;
    if (!inside) stick.style.transform = `translate(${cx - hx}px, ${cy - hy}px)`;
    joy = { id: e.pointerId, cx, cy, R: s.width * 0.4, t0: e.timeStamp, x0: e.clientX, y0: e.clientY, moved: false, zone: !onStick };
    lean = null; stick.classList.add('held'); move(e);
  }, true);
  const move = (e) => {
    if (!joy || e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.cx, dy = e.clientY - joy.cy;
    const l = Math.hypot(dx, dy); if (l > joy.R) { dx *= joy.R / l; dy *= joy.R / l; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    if (Math.hypot(e.clientX - joy.x0, e.clientY - joy.y0) > 8) joy.moved = true;
    // a small dead zone, then a gentle curve: fine steps near the middle, a full stride at the rim;
    // carry on past the rim (thumb well outside the well) to hurry
    const raw = Math.hypot(e.clientX - joy.cx, e.clientY - joy.cy), n = Math.min(1, raw / joy.R), dead = 0.12;
    const g = n < dead ? 0 : Math.pow((n - dead) / (1 - dead), 1.35);
    walk.stick.x = raw ? (dx / l) * g : 0; walk.stick.y = raw ? (dy / l) * g : 0;
    walk.stick.run = raw > joy.R * 1.25;
    walkLoop();
  };
  stick.addEventListener('pointermove', move);
  const end = (e) => {
    if (!joy || e.pointerId !== joy.id) return;
    const tap = joy.zone && !joy.moved && e.timeStamp - joy.t0 < 350;
    reset();
    if (tap && e.type === 'pointerup') scene.tapAt(e);   // the candle, the cage, a double tap to lean in
  };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end); stick.addEventListener('lostpointercapture', (e) => { if (joy && e.pointerId === joy.id) reset(); });
  stick.addEventListener('contextmenu', (e) => e.preventDefault());
  // the "drag to look" hint fades once you've looked about
  scene.onLookStart = () => { $('lookHint').classList.add('gone'); scene.onLookStart = null; };
}
// ---- desktop, as in Ashland: click an empty part of the room and the mouse looks around (WASD walks, Shift
// hurries); the settings need a free mouse, so Esc lets go, and Tab opens the drawer and lets go (Tab again
// closes it and takes the mouse back). If the page isn't allowed to hold the mouse, dragging the room looks.
scene.canGrab = () => !$('navCtl').classList.contains('hidden') && !(drawer.classList.contains('open') && !wideScreen());
scene.onGrabFail = () => { scene.canGrab = () => false; $('mouseKTxt').innerHTML = 'drag the room:<br>look'; };
let hintQuiet = 0;
document.addEventListener('pointerlockchange', () => {
  const on = scene.mouseHeld();
  document.body.classList.toggle('mouse-held', on);
  $('mouseKTxt').innerHTML = on ? 'Esc frees<br>the mouse' : 'click the room:<br>mouse looks';
  // the long hint shows the first couple of times, then just a moment
  const h = $('mouseHint'); h.classList.remove('quiet');
  if (on && ++hintQuiet > 2) requestAnimationFrame(() => h.classList.add('quiet'));
  if (!on) { walk.keys.clear(); document.querySelectorAll('.navCtl [data-key].held').forEach((k) => k.classList.remove('held')); }
});
document.addEventListener('pointerlockerror', () => scene.onGrabFail());
// Christmas decorations: on by themselves from 1 December to Epiphany; your own choice holds until the season
// next starts or ends
{
  const season = christmasTime();
  let on = season;
  try { const s = JSON.parse(localStorage.getItem('frisky.xmas') || 'null'); if (s && s.season === season) on = s.on; } catch (e) { /* none */ }
  $('xmas').checked = on; scene.setXmas(on);
  $('xmas').addEventListener('change', (e) => { scene.setXmas(e.target.checked); try { localStorage.setItem('frisky.xmas', JSON.stringify({ on: e.target.checked, season })); } catch (err) { /* private mode */ } });
}
// Hanukkah decorations, the same way: on by themselves for the eight days, alone or with Christmas
{
  const season = hanukkahTime();
  let on = season;
  try { const s = JSON.parse(localStorage.getItem('frisky.hanukkah') || 'null'); if (s && s.season === season) on = s.on; } catch (e) { /* none */ }
  $('hanukkah').checked = on; scene.setHanukkah(on);
  $('hanukkah').addEventListener('change', (e) => { scene.setHanukkah(e.target.checked); try { localStorage.setItem('frisky.hanukkah', JSON.stringify({ on: e.target.checked, season })); } catch (err) { /* private mode */ } });
}
$('standBtn').addEventListener('click', () => posture(+1));
$('crouchBtn').addEventListener('click', () => posture(-1));
$('zoomIn').addEventListener('click', () => scene.dolly(0.8));
document.querySelectorAll('.keys [data-zoom]').forEach((b) => b.addEventListener('click', () => scene.dolly(b.dataset.zoom === 'in' ? 0.8 : 1.25)));
$('zoomOut').addEventListener('click', () => scene.dolly(1.25));
$('faceBtn').addEventListener('click', () => { map.faceBox = true; $('faceBox').checked = true; scene.lookPitch = null; map.emit(); });
postureLabel();
$('yaw').addEventListener('input', (e) => { map.faceBox = false; $('faceBox').checked = false; map.listener.yaw = (+e.target.value * Math.PI) / 180; $('yawv').textContent = e.target.value + '°'; map.emit(); });
$('vol').addEventListener('input', (e) => engine.send({ type: 'gain', value: +e.target.value }));
function updateDist() {
  if (!built) return;
  const L = map.listener, b = built.room.boxPos;
  if (!b) { $('distTxt').textContent = 'Box in your hands, ~0.47 m from your ears'; return; }
  const d = Math.hypot(L.x - b[0], L.y - b[1], L.z - b[2]);
  $('distTxt').textContent = `${d.toFixed(2)} m · ${(d / 343.2 * 1000).toFixed(1)} ms acoustic delay`;
}

// ------------------------------------------------------------------ selects
function fillSelect(sel, obj, val) {
  sel.innerHTML = '';
  for (const [k, v] of Object.entries(obj)) { const o = document.createElement('option'); o.value = k; o.textContent = v.name; sel.appendChild(o); }
  sel.value = val;
}
fillSelect($('room'), ROOMS, cfg.room);
fillSelect($('comb'), COMBS, cfg.comb);
fillSelect($('material'), TINE_MATERIALS, cfg.material);
fillSelect($('enclosure'), Object.fromEntries(Object.entries(ENCLOSURES).filter(([k]) => k !== 'bare')), cfg.enclosure);
fillSelect($('surface'), SURFACES, cfg.surface);
const bindSel = (id, key, after) => $(id).addEventListener('change', (e) => { cfg[key] = e.target.value; after && after(); requestBuild(); });
bindSel('room', 'room', () => { placeListenerNextBuild = true; });
bindSel('comb', 'comb');
bindSel('material', 'material');
bindSel('enclosure', 'enclosure');
bindSel('surface', 'surface', () => { placeListenerNextBuild = true; });
bindSel('lid', 'lid');
bindSel('quality', 'quality');
const bindRange = (id, key, fmt, rebuild = true, scale = 1) => {
  const el = $(id), out = $(id + 'v');
  const show = () => { if (out) out.textContent = fmt(+el.value); };
  el.value = cfg[key] / scale; show();
  el.addEventListener('input', () => { show(); cfg[key] = +el.value * scale; if (rebuild) requestBuild(350); });
};
bindRange('length', 'length', (v) => `×${v.toFixed(2)} (thickness ×${(v * v).toFixed(2)} to stay in tune)`);
bindRange('thickness', 'thickness', (v) => '×' + v.toFixed(2));
bindRange('engage', 'engage', (v) => v.toFixed(2) + ' mm', true, 1e-3);
bindRange('pinEdge', 'pinEdge', (v) => v.toFixed(3) + ' mm', true, 1e-3);
bindRange('combTilt', 'combTilt', (v) => v + '°');
bindRange('a4', 'a4', (v) => v + ' Hz');
bindRange('detune', 'detune', (v) => v + ' ¢');
$('dampers').addEventListener('change', (e) => { cfg.dampers = e.target.checked; requestBuild(); });

// ---- box presets: set every box control at once; touching any of them afterwards makes it "Custom"
const PRESET_DEFAULTS = { comb: 'c30', enclosure: 'classic', material: 'steel', surface: 'oak', lid: 'open', dampers: true,
  thickness: 1, length: 1, engage: PIN.engage, pinEdge: PIN.edge, combTilt: PIN.combTilt, a4: 440, detune: 0 };
const PRESET_CONTROLS = { comb: 'sel', enclosure: 'sel', material: 'sel', surface: 'sel', lid: 'sel', dampers: 'chk',
  thickness: 1, length: 1, engage: 1e-3, pinEdge: 1e-3, combTilt: 1, a4: 1, detune: 1 };
let applyingPreset = false;
{
  const sel = $('boxPreset');
  for (const [k, p] of Object.entries(BOX_PRESETS)) { const o = document.createElement('option'); o.value = k; o.textContent = p.name; sel.appendChild(o); }
  const custom = document.createElement('option'); custom.value = 'custom'; custom.textContent = 'Custom (your own settings)'; sel.appendChild(custom);
  sel.value = 'keepsake'; $('presetDesc').textContent = BOX_PRESETS.keepsake.desc;
  sel.addEventListener('change', () => {
    const p = BOX_PRESETS[sel.value];
    if (!p) { $('presetDesc').textContent = 'Your own combination of comb, box, table and tuning.'; return; }
    $('presetDesc').textContent = p.desc;
    applyingPreset = true;
    const want = { ...PRESET_DEFAULTS, ...p.set };
    for (const [key, kind] of Object.entries(PRESET_CONTROLS)) {
      const el = $(key); if (!el) continue;
      if (kind === 'sel') { if (el.value !== want[key]) { el.value = want[key]; el.dispatchEvent(new Event('change')); } }
      else if (kind === 'chk') { if (el.checked !== want[key]) { el.checked = want[key]; el.dispatchEvent(new Event('change')); } }
      else { const v = want[key] / kind; if (Math.abs(+el.value - v) > 1e-9) { el.value = v; el.dispatchEvent(new Event('input')); } }
    }
    applyingPreset = false;
  });
  for (const key of Object.keys(PRESET_CONTROLS)) { const el = $(key); if (el) el.addEventListener(PRESET_CONTROLS[key] === 'sel' || PRESET_CONTROLS[key] === 'chk' ? 'change' : 'input', () => { if (!applyingPreset && sel.value !== 'custom') { sel.value = 'custom'; $('presetDesc').textContent = 'Your own combination of comb, box, table and tuning.'; } }); }
}
$('noise').addEventListener('input', (e) => engine.send({ type: 'noise', value: +e.target.value }));
$('airBrake').addEventListener('input', (e) => { cfg.airBrake = +e.target.value; $('airBrakev').textContent = '×' + cfg.airBrake.toFixed(2); engine.send({ type: 'airBrake', value: cfg.airBrake }); });

// composing lives in its own section, closed until you open it (remembered)
try { if (localStorage.getItem('musicbox.makeOwn') === '1') $('makeOwn').open = true; } catch (e) { /* private mode */ }
$('makeOwn').addEventListener('toggle', () => {
  try { localStorage.setItem('musicbox.makeOwn', $('makeOwn').open ? '1' : '0'); } catch (e) { /* private mode */ }
  if ($('makeOwn').open) requestAnimationFrame(() => roll.resize());
});

// ------------------------------------------------------------------ tabs
// Tunes · Listen · Music box; the music box tab holds Tines, Box and Physics as sub-tabs
let subTab = 'comb';
function showPanel(name) {
  const sub = ['comb', 'box', 'cage', 'physics'].includes(name);
  if (sub) subTab = name;
  const tab = sub ? 'musicbox' : name;
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x.dataset.tab === tab));
  document.querySelector('.subtabs').classList.toggle('hidden', tab !== 'musicbox');
  document.querySelectorAll('.subtabs button').forEach((x) => x.classList.toggle('on', x.dataset.sub === subTab));
  const panel = tab === 'musicbox' ? subTab : tab;
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.dataset.panel === panel));
  requestAnimationFrame(() => { map.resize(); roll.resize(); strip.resize(); insp.resize(); });
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showPanel(b.dataset.tab === 'musicbox' ? subTab : b.dataset.tab)));
document.querySelectorAll('.subtabs button').forEach((b) => b.addEventListener('click', () => showPanel(b.dataset.sub)));

// ------------------------------------------------------------------ tunes
const store = {
  get() { try { return JSON.parse(localStorage.getItem('musicbox.tunes') || '[]'); } catch (e) { return []; } },
  set(v) { try { localStorage.setItem('musicbox.tunes', JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
let cat = 'Classics';
function renderCats() {
  const el = $('cats'); el.innerHTML = '';
  for (const c of CATEGORIES) {
    const b = document.createElement('button'); b.textContent = c; b.classList.toggle('on', c === cat);
    b.addEventListener('click', () => { cat = c; renderCats(); renderSongs(); if (playlist.on) { playlist.queue = []; plNext(); } }); el.appendChild(b);
  }
}
function renderSongs() {
  const ul = $('songList'); ul.innerHTML = '';
  const items = cat === 'My tunes' ? store.get().map((s) => ({ ...s, cat: 'My tunes', mine: true })) : SONGS.filter((s) => s.cat === cat);
  if (!items.length) { const li = document.createElement('li'); li.innerHTML = '<div class="c">Nothing saved yet — compose a tune or import a MIDI file, then “Save to My tunes”.</div>'; ul.appendChild(li); }
  for (const s of items) {
    const li = document.createElement('li'); li.classList.toggle('on', s.id === songId);
    li.innerHTML = `<div class="t">${s.title}</div><div class="c">${s.credit || ''}</div>`;
    if (s.mine) {
      const x = document.createElement('span'); x.className = 'x'; x.textContent = '✕'; x.title = 'Delete';
      x.addEventListener('click', (e) => { e.stopPropagation(); store.set(store.get().filter((t) => t.id !== s.id)); renderSongs(); });
      li.prepend(x);
    }
    li.addEventListener('click', () => { if (playlist.on) playlist.seek = true; loadSong(s.mine ? s : compileSong(s), s.id); renderSongs(); if (playlist.on) { playlist.loops = 0; playlist.target = loopsFor(song); playlist.prev = null; plStatus(); } });
    ul.appendChild(li);
  }
}
function loadSong(compiled, id) {
  song = JSON.parse(JSON.stringify(compiled));
  song.notes = song.notes.filter((n) => Number.isFinite(n.step) && Number.isFinite(n.midi)); // drop any corrupt saved notes
  songId = id;
  $('tuneName').value = song.title || '';
  $('bpm').value = song.bpm; $('bars').value = Math.round(song.steps / ((song.meter[0] * 16) / song.meter[1]));
  $('meterSel').value = song.meter.join(',');
  requestBuild(0);
}
// ------------------------------------------------------------------ playlist: shuffle within the category
// Each tune loops for about a minute (whole loops, so it never stops mid-phrase), then another from the same
// category, in a shuffled order that doesn't repeat until every tune has had its turn.
const playlist = { on: false, queue: [], loops: 0, target: 1, prev: null, seek: false, cat: null };
const catItems = (c) => (c === 'My tunes' ? store.get().map((s) => ({ ...s, mine: true })) : SONGS.filter((s) => s.cat === c));
function loopsFor(s) { const loopSec = s.steps * 60 / (s.bpm * 4); return Math.max(1, Math.round(60 / Math.max(1, loopSec))); }
function plStatus() {
  const n = playlist.target, k = Math.min(playlist.loops, n);
  $('plTxt').innerHTML = playlist.on ? `${cat}: loop ${Math.min(k + 1, n)} of ${n} <span class="plBar"><i style="width:${(100 * k / n).toFixed(0)}%"></i></span>` : 'each tune loops for about a minute, then another';
}
function plNext() {
  const items = catItems(cat); if (!items.length) return;
  if (playlist.cat !== cat || !playlist.queue.length) {
    playlist.cat = cat;
    playlist.queue = items.filter((s) => s.id !== songId).map((s) => [Math.random(), s]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    if (!playlist.queue.length) playlist.queue = [items[0]];
  }
  const s = playlist.queue.shift();
  playlist.seek = true;
  loadSong(s.mine ? s : compileSong(s), s.id); renderSongs();
  playlist.loops = 0; playlist.target = loopsFor(song); playlist.prev = null; plStatus();
  toast(`🔀 ${s.title}`);
}
function playlistTick(st) {
  if (!playlist.on || !song) return;
  const th = st.thetaMod, pv = playlist.prev; playlist.prev = th;
  if (pv === null || !Number.isFinite(th)) return;
  // a loop is done when the cylinder comes round past its start (and undone if you crank it back)
  if (pv > 4.7 && th < 1.6) { playlist.loops++; plStatus(); if (playlist.loops >= playlist.target) setTimeout(plNext, 0); }
  else if (pv < 1.6 && th > 4.7) { playlist.loops = Math.max(0, playlist.loops - 1); plStatus(); }
}
function setPlaylist(on) {
  playlist.on = on; $('plBtn').setAttribute('aria-pressed', String(on)); $('plNext').classList.toggle('hidden', !on);
  $('plBtn').textContent = on ? '🔀 Shuffling' : '🔀 Shuffle this category';
  playlist.queue = []; playlist.cat = null; playlist.loops = 0; playlist.prev = null;
  // start with the tune that's on if it's in this category, otherwise jump straight in
  if (on) { if (catItems(cat).some((s) => s.id === songId)) { playlist.target = loopsFor(song); plStatus(); } else plNext(); }
  else plStatus();
}
$('plBtn').addEventListener('click', () => setPlaylist(!playlist.on));
$('plNext').addEventListener('click', () => plNext());
$('bpm').addEventListener('change', (e) => { song.bpm = Math.max(30, Math.min(240, +e.target.value)); requestBuild(); });
$('bars').addEventListener('change', (e) => { const bl = (song.meter[0] * 16) / song.meter[1]; song.steps = Math.max(1, +e.target.value) * bl; song.notes = song.notes.filter((n) => n.step < song.steps); requestBuild(); });
$('meterSel').addEventListener('change', (e) => { song.meter = e.target.value.split(',').map(Number); requestBuild(); });
$('newTune').addEventListener('click', () => { loadSong({ id: 'new', title: 'Untitled tune', credit: 'Composed here', bpm: 100, meter: [4, 4], steps: 128, notes: [] }, 'new'); });
$('saveTune').addEventListener('click', () => {
  const title = ($('tuneName').value || song.title || 'My tune').trim();
  const id = 'mine-' + Date.now();
  const s = { ...song, id, title, credit: song.credit || 'My tune' };
  store.set([...store.get(), s]); songId = id; song = s; cat = 'My tunes'; renderCats(); renderSongs();
});
$('importMidi').addEventListener('click', () => $('midiFile').click());
$('midiFile').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try { const s = parseMidi(await f.arrayBuffer(), f.name); loadSong(s, s.id); }
  catch (err) { $('arrInfo').textContent = '— could not read that MIDI file: ' + err.message; }
  e.target.value = '';
});
$('retune').addEventListener('click', () => requestBuild(0));
// share links
const b64 = { enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))) };
$('shareTune').addEventListener('click', async () => {
  const pack = { t: song.title, b: song.bpm, m: song.meter, s: song.steps, n: song.notes.map((n) => [n.step, n.midi, n.voice || 0]).flat(), c: cfg.comb };
  const url = location.href.split('#')[0] + '#tune=' + b64.enc(JSON.stringify(pack));
  history.replaceState(null, '', url);
  try { await navigator.clipboard.writeText(url); $('arrInfo').textContent = '— link copied'; } catch (e) { $('arrInfo').textContent = '— share link: ' + url; }
});
function fromHash() {
  const m = /#tune=([\w-]+)/.exec(location.hash); if (!m) return null;
  try {
    const p = JSON.parse(b64.dec(m[1]));
    const notes = []; for (let i = 0; i < p.n.length; i += 3) notes.push({ step: p.n[i], midi: p.n[i + 1], voice: p.n[i + 2] });
    if (p.c && COMBS[p.c]) { cfg.comb = p.c; $('comb').value = p.c; }
    return { id: 'shared', title: p.t || 'Shared tune', credit: 'Shared link', bpm: p.b, meter: p.m, steps: p.s, notes };
  } catch (e) { return null; }
}

// ------------------------------------------------------------------ pin roll
const roll = new PinRoll($('editor'), (step, combPitch) => {
  if (!built || !Number.isFinite(step) || !Number.isFinite(combPitch)) return;
  const t = built.arrangement.transpose;
  const here = built.arrangement.placed.filter((p) => p.step === step && p.midi === combPitch);
  if (here.length) {
    for (const p of here) {
      const k = song.notes.findIndex((n) => n.step === step && n.midi === p.src && (n.voice || 0) === (p.voice || 0));
      if (k >= 0) song.notes.splice(k, 1);
    }
  } else song.notes.push({ step, midi: combPitch - t, voice: 0 });
  song.notes.sort((a, b) => a.step - b.step || a.midi - b.midi);
  if (songId !== 'new' && !String(songId).startsWith('mine-')) { songId = 'edited'; song.title = song.title.replace(/( \(edited\))?$/, ' (edited)'); }
  rearrange();
});
function rearrange() {
  const a = arrange(song, built.combNotes, { transpose: built.arrangement.transpose, staggerMs: cfg.staggerMs, minGap: built.arrangement.minGap });
  a.minGap = built.arrangement.minGap;
  if (Math.abs(a.Trev - built.arrangement.Trev) > 1e-6) { requestBuild(0); return; }
  built.arrangement = a;
  built.pins = a.pins.map((l) => l.slice());
  engine.send({ type: 'pins', pins: a.pins.map((l) => Float64Array.from(l.map((x) => x * TAU))) });
  scene.buildPins(built.info, { geom: built.geom }, built.pins);
  updateRoll(); updateArrInfo();
}
function updateRoll() {
  const rows = [...new Set(built.combNotes)].sort((a, b) => b - a);
  roll.set(rows, song.steps, built.arrangement.placed, song.meter);
  if (!updateRoll.init) { updateRoll.init = true; applyScale(); }
}
// ---- quantised scales for composing (pitches as they sound on the comb)
const scaleState = (() => { try { return JSON.parse(localStorage.getItem('musicbox.scale')) || { id: 'chromatic', root: 0 }; } catch (e) { return { id: 'chromatic', root: 0 }; } })();
{
  const sel = $('scaleSel');
  for (const [label, list] of SCALE_GROUPS) {
    const parent = label ? Object.assign(document.createElement('optgroup'), { label }) : sel;
    for (const [id, name] of list) parent.appendChild(Object.assign(document.createElement('option'), { value: id, textContent: name }));
    if (label) sel.appendChild(parent);
  }
  ROOTS.forEach((r, i) => $('rootSel').appendChild(Object.assign(document.createElement('option'), { value: i, textContent: r })));
  if (!SCALES[scaleState.id]) scaleState.id = 'chromatic';
  sel.value = scaleState.id; $('rootSel').value = scaleState.root;
}
function applyScale() {
  const { id, root } = scaleState;
  $('rootSel').disabled = id === 'chromatic'; $('snapScale').disabled = id === 'chromatic';
  roll.setScale(scaleSet(id, root), root, (m) => degreeOf(m, id, root));
  try { localStorage.setItem('musicbox.scale', JSON.stringify(scaleState)); } catch (e) { /* private mode */ }
}
$('scaleSel').addEventListener('change', (e) => { scaleState.id = e.target.value; applyScale(); });
$('rootSel').addEventListener('change', (e) => { scaleState.root = +e.target.value; applyScale(); });
$('matchKey').addEventListener('click', () => {
  if (!built || !song.notes.length) return;
  const k = song.key && Number.isFinite(song.key.tonic) ? song.key : detectKey(song.notes.map((n) => ({ ...n, w: 1 })));
  scaleState.root = ((((k.tonic + built.arrangement.transpose) % 12) + 12) % 12);
  scaleState.id = k.mode === 'minor' ? 'minor' : 'major';
  $('scaleSel').value = scaleState.id; $('rootSel').value = scaleState.root; applyScale();
});
$('snapScale').addEventListener('click', () => {
  const set = scaleSet(scaleState.id, scaleState.root); if (!set || !built) return;
  const t = built.arrangement.transpose; let moved = 0;
  const seen = new Set(), out = [];
  for (const n of song.notes) {
    const m = snapToScale(n.midi + t, set) - t;
    if (m !== n.midi) moved++;
    const key = `${n.step}:${m}:${n.voice || 0}`; if (seen.has(key)) continue; seen.add(key);
    out.push({ ...n, midi: m });
  }
  if (!moved) { $('arrInfo').textContent = '— every note is already in the scale'; return; }
  song.notes = out;
  if (songId !== 'new' && !String(songId).startsWith('mine-')) { songId = 'edited'; song.title = song.title.replace(/( \(edited\))?$/, ' (edited)'); }
  rearrange();
});
function updateArrInfo() {
  const a = built.arrangement, st = a.stats;
  const parts = [`${built.combNotes.length} tines`, `transposed ${a.transpose >= 0 ? '+' : ''}${a.transpose}`, `${a.pins.reduce((s, p) => s + p.length, 0)} pins`];
  if (st.folded) parts.push(`${st.folded} octave-folded`);
  if (st.substituted) parts.push(`${st.substituted} substituted (red)`);
  if (built.info.cylinder.lostPins) parts.push(`${built.info.cylinder.lostPins} too close to pluck`);
  $('arrInfo').textContent = '— ' + parts.join(' · ');
}

// ------------------------------------------------------------------ inspector
const strip = new TineStrip($('strip'), (i) => selectTine(i, false));
const insp = new Inspector($('insp'));
function selectTine(i, fromScene) {
  selectedTine = i; strip.sel = i; strip.draw();
  scene.select(i);
  const t = built && built.info.tines[i];
  if (!t) return;
  insp.set(t);
  const m1 = t.modes[0];
  $('tineName').textContent = `${t.name} · ${t.f0.toFixed(1)} Hz · L ${(t.L * 1e3).toFixed(2)} mm · t ${(t.t0 * 1e3).toFixed(2)}→${(t.t1 * 1e3).toFixed(2)} mm${t.lead ? ` · lead ${(t.lead * 1e3).toFixed(3)} g` : ''}${t.damper ? ' · damper' : ''}`;
  if (fromScene) {
    showPanel('comb'); setDrawer(true);
  }
}

// ------------------------------------------------------------------ after build
let placeListenerNextBuild = true;
function refreshAfterBuild() {
  const info = built.info;
  $('nowPlaying').textContent = `${song.title} · ${COMBS[cfg.comb].name}`;
  // listener / room
  const room = ROOMS[cfg.room];
  const surf = SURFACES[cfg.surface];
  map.boxZ = built.room.boxPos ? built.room.boxPos[2] : 0;
  map.setRoom(room, built.room.boxPos, surf.plate ? [surf.plate.a, surf.plate.b] : null, built.room.held);
  scene.placeRoom({ dims: room.dims, boxPos: built.room.boxPos, boxYaw: built.room.boxYaw, tableTop: built.room.tableTop, held: built.room.held, kind: cfg.room });
  scene.setListener(map.listener);
  if (placeListenerNextBuild) {
    placeListenerNextBuild = false;
    const [X, Y] = room.dims;
    const b = built.room.boxPos || [X / 2, Y / 2, 1.1];
    let ly = b[1] - 1.1; if (ly < 0.4) ly = Math.min(Y - 0.4, b[1] + 1.1);
    map.listener.x = b[0] + 0.15; map.listener.y = ly; map.listener.z = walk.zT = +$('earH').value; postureLabel();
    map.faceBox = $('faceBox').checked;
    map.emit();
  }
  updateDist();
  updateRoll(); updateArrInfo();
  strip.set(info.tines);
  if (selectedTine >= 0) selectTine(selectedTine, false); else { insp.set(null); }
  // tine table
  const lines = ['note    f0(Hz)   L(mm)  t(mm)  lead(g)  T60(s)  overtone ratios'];
  for (const t of info.tines) lines.push(`${t.name.padEnd(5)} ${t.f0.toFixed(1).padStart(8)} ${(t.L * 1e3).toFixed(2).padStart(7)} ${(t.t0 * 1e3).toFixed(2).padStart(6)} ${(t.lead * 1e3).toFixed(3).padStart(8)} ${t.modes[0].T60.toFixed(2).padStart(7)}   ${t.allModes.slice(1, 4).map((f) => (f / t.allModes[0]).toFixed(2)).join(' ')}`);
  $('tineTable').textContent = lines.join('\n');
  // box info
  const enc = ENCLOSURES[cfg.enclosure];
  const bi = [];
  bi.push(`Soundboard: ${info.plate.name}, ${(enc.plate.a * 100).toFixed(1)}×${(enc.plate.b * 100).toFixed(1)} cm × ${(enc.plate.h * 1e3).toFixed(1)} mm, ${(info.plate.mass * 1e3).toFixed(0)} g, ${info.plate.count} modes modelled`);
  bi.push(`  first modes: ${info.plate.modes.slice(0, 8).map((m) => `${m.f.toFixed(0)} (${m.m},${m.n})`).join(', ')} Hz`);
  bi.push(`  coincidence frequency ${info.plate.fc.toFixed(0)} Hz (radiates efficiently above this)`);
  if (info.cavity.on) bi.push(`Cavity: ${(info.cavity.V * 1e6).toFixed(0)} cm³, Helmholtz resonance ${info.cavity.fH.toFixed(0)} Hz (${cfg.lid === 'open' ? 'lid open' : 'lid closed, leaks ' + (info.cavity.A * 1e4).toFixed(1) + ' cm²'})`);
  if (info.lid.fc) bi.push(`Lid: mass-law corner ${info.lid.fc.toFixed(0)} Hz, leak path ${(info.lid.leak * 100).toFixed(0)}% of tine radiation`);
  bi.push(`Bedplate + comb + cylinder: ${(info.bed.mass * 1e3).toFixed(0)} g on 4 screws (${(info.bed.ks / 1e3).toFixed(0)} kN/m each)`);
  bi.push(`Feet: ${info.feet}; whole box ${(info.mTotal * 1e3).toFixed(0)} g`);
  if (info.table) bi.push(`${info.table.name} top: ${info.table.count} modes, first ${info.table.first.map((f) => f.toFixed(1)).join(', ')} Hz; coincidence ${info.table.fc.toFixed(0)} Hz`);
  $('boxInfo').textContent = bi.join('\n');
  const d = info.driveP;
  const mi = [];
  mi.push(`Model built in ${info.buildMs ? info.buildMs.toFixed(0) : '—'} ms at ${built.sr} Hz`);
  mi.push(`Cylinder: R ${(info.cylinder.R * 1e3).toFixed(1)} mm, one turn = ${info.Trev.toFixed(1)} s of music, ${info.cylinder.pinCount} pins`);
  mi.push(`Pin slides ${info.cylinder.slideDeg.toFixed(1)}° under a tine before it snaps off`);
  mi.push(`Hand crank: ${d.G_crank} crank turns per cylinder turn (nominal ${info.drive.crankRpmNominal.toFixed(0)} rpm)`);
  mi.push(`Mainspring: ${d.turnsMax} turns, ${(d.tauFull * 1e3).toFixed(0)}→${(d.tauEmpty * 1e3).toFixed(0)} mN·m, ${d.G_spring.toFixed(2)} cylinder turns per barrel turn`);
  mi.push(`Governor: fan geared ×${d.G_fan.toFixed(0)}, nominal ${info.drive.fanRpmNominal.toFixed(0)} rpm; its reflected inertia is ${info.drive.inertiaRatio.toFixed(0)}× the cylinder's`);
  $('modelInfo').textContent = mi.join('\n');
}

// ------------------------------------------------------------------ live state
// The worklet posts ~47 states/s; coalesce them to one UI update per frame so a slow
// frame can never build a backlog, and only draw the panel that is visible.
let uiPending = false;
function onState(st) {
  lastState = st;
  playlistTick(st);
  if (!uiPending) { uiPending = true; requestAnimationFrame(applyState); }
}
const panelOn = (name) => document.querySelector(`.panel[data-panel="${name}"]`).classList.contains('on');
function applyState() {
  uiPending = false;
  const st = lastState;
  if (!built || !st) return;
  scene.update(st, built.drive.G_crank, built.drive.G_fan);
  if (st.ham) {
    scene.hamState(st.ham);
    const inW = life && life.where === 'wheel' && st.ham.inWheel;
    lastHam = inW ? st.ham : life ? { ...life.gaitState(), state: 'cage' } : st.ham; lastHamT = performance.now() / 1000;
    const now = performance.now();
    if (!applyState.ht || now - applyState.ht > 400) { applyState.ht = now; $('hamTxt').innerHTML = hamText(st.ham); $('hamPlace').disabled = !life || life.where === 'wheel'; }
  }
  const spl = Math.max(st.splL, st.splR);
  $('spl').textContent = isFinite(spl) && spl > 5 ? `${spl.toFixed(0)} dB SPL` : '— dB';
  if (cfg.mode === 'spring') {
    const fr = st.turns / built.drive.turnsMax;
    $('springBar').style.width = (fr * 100).toFixed(1) + '%';
    $('springTxt').textContent = `${st.turns.toFixed(1)} turns`;
  }
  if (cfg.mode === 'crank') pad.setShown((st.crank % TAU) - Math.PI / 2);
  if (panelOn('tunes') && $('makeOwn').open) roll.setPlayhead((st.thetaMod / TAU) * song.steps);
  if (panelOn('comb')) { strip.amp = st.amp; strip.draw(); }
  if (!panelOn('physics')) return;
  const tempo = st.omega / built.drive.omegaNom * 100;
  const P = (v, w, d = 0) => (Number.isFinite(v) ? v.toFixed(d) : '—').padStart(w);
  const h = st.ham;
  $('live').textContent = [
    `cylinder   ${P(st.omega * 60 / TAU, 6, 2)} rpm   (${P(tempo, 3)}% of written tempo)`,
    `crank      ${P(st.omega * built.drive.G_crank * 60 / TAU, 6)} rpm`,
    `spring     ${P(st.turns, 6, 2)} turns wound`,
    `governor   ${P(st.fanRpm, 6)} rpm`,
    `pin load   ${P(-st.torque * 1e3, 6, 2)} mN·m on the cylinder`,
    `contacts   ${P(st.contacts, 3)} pins touching tines, ${P(st.awake, 3)} tines ringing`,
    `at ears    L ${P(st.splL, 5, 1)} dB · R ${P(st.splR, 5, 1)} dB SPL`,
    h ? `hamster    ${h.state.padEnd(4)} ${P(Math.abs(h.v), 5, 2)} m/s (wants ${P(h.vCmd, 4, 2)}) ${h.gait.padEnd(5)} ${P(h.f, 4, 1)} Hz duty ${P(h.D, 4, 2)}` : 'hamster    — (not in the wheel)',
    h ? `           φ ${P(h.phi * 57.3, 5, 1)}° up the wheel · paw force ${P(h.F * 1e3, 5)} mN · belt ${P(h.belt * 1e3, 5, 1)} mN` : '',
    h ? `           ${P(h.Emet, 5, 2)} W · ♥ ${P(h.hr, 3)} bpm · reserve ${P(h.reserve * 100, 3)}% · ${P(h.dist, 6)} m · ${P(h.kJ / 4.184, 6, 2)} kcal` : '',
  ].join('\n');
}

// ------------------------------------------------------------------ boot
renderCats();
const shared = fromHash();
if (shared) { song = shared; songId = 'shared'; cat = 'My tunes'; }
else song = compileSong(SONGS.find((s) => s.id === songId));
$('bpm').value = song.bpm;
$('bars').value = Math.round(song.steps / ((song.meter[0] * 16) / song.meter[1]));
$('meterSel').value = song.meter.join(',');
renderSongs();
setMode('crank');
requestBuild(0);
window.__mb = { walk, collide,  cfg, engine, scene, get built() { return built; }, get song() { return song; }, get state() { return lastState; }, roll };
