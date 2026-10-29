import { Engine } from './audio/engine.js';
import { strikeMatch } from './audio/match.js';
import { FireSound, StormSound } from './audio/fire.js';
import { CABIN_FEATURES } from './render/cabin.js';
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
import { COMBS, TINE_MATERIALS, ENCLOSURES, SURFACES, ROOMS, FEET, PLATE_MATERIALS, noteName } from './physics/constants.js';

const $ = (id) => document.getElementById(id);
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ state
const cfg = { ...DEFAULT_CONFIG, ham: { mass: 0.125, wheel: 'd28', surface: 'rungs', axle: 'bearing', gear: 1, lover: false }, mode: 'crank', comb: 'c30', enclosure: 'classic', surface: 'oak', room: 'cabin' };
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
      if (on) { scene.lightCandle(); showPrompt(null); updateFire(); }
      else snuffTimer = setTimeout(() => { if (!engine.running) { scene.snuffCandle(); showPrompt('relight'); } }, 700);
    };
    p.then(() => {
      pushAll(); updateFire();
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
  sendHam();
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

function setMode(mode) {
  cfg.mode = mode;
  document.querySelectorAll('.modeSwitch button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  $('windInfo').classList.toggle('hidden', mode !== 'spring');
  $('hamInfo').classList.toggle('hidden', mode !== 'auto');
  $('gaitCard').classList.toggle('hidden', mode !== 'auto');
  $('pad').classList.toggle('hidden', mode === 'auto');
  if (mode === 'auto') { sendHam(); $('hamWatch').classList.remove('on'); }
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
function sendHam() { engine.send({ type: 'hamster', opts: { ...cfg.ham } }); }
let life = null;
function buildRig() {
  if (!built) return;
  const R = WHEELS[cfg.ham.wheel].D / 2, [rw, rc] = pulleyRadii(built.drive.G_crank, built.drive.omegaNom, R, cfg.ham.gear);
  scene.buildHamRig({ R, rw, rc, surface: cfg.ham.surface, mass: cfg.ham.mass });
  // her life goes on across rebuilds
  if (!life) { life = new HamsterLife(scene.hamRig.layout); life.onWheel = (on, placed) => engine.send({ type: 'hamster', inWheel: on, ...(placed ? { wake: true } : {}) }); }
  else life.setCage(scene.hamRig.layout);
  life.mode = cfg.ham.lover ? 'lover' : 'real';
  scene.hamLife = life;
  const M = cfg.ham.mass;
  $('hamDriveInfo').textContent = [
    `belt       ${(rw * 2e3).toFixed(0)} mm hub pulley → ${(rc * 2e3).toFixed(0)} mm crank pulley (×${(rw / rc).toFixed(2)}), quarter-twist O-ring`,
    `tempo      100% when she runs ${(0.44 / cfg.ham.gear).toFixed(2)} m/s (${(0.44 / cfg.ham.gear / R * 60 / TAU).toFixed(0)} wheel rpm)`,
    `her limits VO2max ≈ ${(vo2maxW(M) / 20.1 * 60).toFixed(1)} ml O2/min, aerobic pace up to ≈ ${((0.7 * vo2maxW(M) / M - 6.03 * M ** -0.303) / (10.7 * M ** -0.316)).toFixed(2)} m/s`,
  ].join('\n');
}
$('hamMass').addEventListener('input', (e) => { cfg.ham.mass = +e.target.value / 1000; $('hamMassv').textContent = e.target.value + ' g'; sendHam(); clearTimeout(buildRig.t); buildRig.t = setTimeout(buildRig, 250); });
for (const [id, key] of [['hamWheel', 'wheel'], ['hamTread', 'surface'], ['hamAxle', 'axle']]) $(id).addEventListener('change', (e) => { cfg.ham[key] = e.target.value; sendHam(); buildRig(); });
$('hamPlace').addEventListener('click', () => { ensureStarted(); if (life) life.placeInWheel(); });
$('hamGear').addEventListener('input', (e) => {
  cfg.ham.gear = +e.target.value; $('hamGearv').textContent = '×' + cfg.ham.gear.toFixed(2); sendHam();
  clearTimeout(buildRig.t); buildRig.t = setTimeout(buildRig, 200);
});
$('hamLover').addEventListener('change', (e) => { cfg.ham.lover = e.target.checked; if (life) life.mode = cfg.ham.lover ? 'lover' : 'real'; sendHam(); });
$('hamWatch').addEventListener('click', () => {
  const on = !$('hamWatch').classList.contains('on');
  $('hamWatch').classList.toggle('on', on); $('hamWatch').textContent = on ? 'Whole rig' : 'Watch her';
  scene.frame(on ? 'hamster' : 'rig');
});
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
  else what = `<b>${life ? life.desc : 'Asleep in her nest'}</b>`;
  const hooked = cfg.mode === 'auto' ? (inW ? '' : ' — the box is waiting for her') : '';
  return `${what}${hooked}<br>♥ ${h.hr.toFixed(0)} bpm · ${h.br.toFixed(0)} breaths/min · ${h.Emet.toFixed(1)} W · ${h.dist >= 1000 ? (h.dist / 1000).toFixed(2) + ' km' : h.dist.toFixed(0) + ' m'} tonight`;
}

// ------------------------------------------------------------------ listener map
const map = new ListenerMap($('map'), (L) => {
  engine.send({ type: 'listener', listener: { x: L.x, y: L.y, z: L.z, yaw: L.yaw } });
  scene.setListener(L); if (fire) { fire.listen(L); }
  const deg = Math.round(((L.yaw * 180) / Math.PI + 540) % 360 - 180);
  $('yaw').value = deg; $('yawv').textContent = deg + '°';
  updateDist();
});
// follow perspective: the 3D view is your eyes; dragging it turns your head
$('follow').addEventListener('change', (e) => scene.setFollow(e.target.checked));
scene.onLook = (d) => {
  map.faceBox = false; $('faceBox').checked = false;
  map.listener.yaw -= d; map.emit();
};
// the fireplace crackles (cabin only), heard through an HRTF panner from where you stand
let fire = null;
function updateFire() {
  const cabin = !!ROOMS[cfg.room].cabin;
  $('fireRow').style.display = cabin ? '' : 'none';
  if (!engine.ctx || !engine.running) return;
  if (!fire) { fire = new FireSound(engine.ctx); storm = new StormSound(engine.ctx); fire.listen(map.listener); }
  const F = CABIN_FEATURES.fireplace, W = CABIN_FEATURES.window;
  fire.place(0.35, (F.y0 + F.y1) / 2, 0.55);
  storm.place((W.x0 + W.x1) / 2, ROOMS[cfg.room].dims[1] + 0.3, (W.z0 + W.z1) / 2);
  fire.set(cabin && $('fireOn').checked, +$('vol').value);
  storm.set(cabin && $('stormOn').checked, +$('vol').value);
}
let storm = null;
$('fireOn').addEventListener('change', updateFire);
$('stormOn').addEventListener('change', updateFire);
$('faceBox').addEventListener('change', (e) => { map.faceBox = e.target.checked; map.emit(); });
$('earH').addEventListener('input', (e) => { map.listener.z = +e.target.value; $('earHv').textContent = (+e.target.value).toFixed(2) + ' m'; map.emit(); });
$('yaw').addEventListener('input', (e) => { map.faceBox = false; $('faceBox').checked = false; map.listener.yaw = (+e.target.value * Math.PI) / 180; $('yawv').textContent = e.target.value + '°'; map.emit(); });
$('vol').addEventListener('input', (e) => { engine.send({ type: 'gain', value: +e.target.value }); updateFire(); });
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
fillSelect($('enclosure'), ENCLOSURES, cfg.enclosure);
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
$('noise').addEventListener('input', (e) => engine.send({ type: 'noise', value: +e.target.value }));
$('airBrake').addEventListener('input', (e) => { cfg.airBrake = +e.target.value; $('airBrakev').textContent = '×' + cfg.airBrake.toFixed(2); engine.send({ type: 'airBrake', value: cfg.airBrake }); });

// composing lives in its own section, closed until you open it (remembered)
try { if (localStorage.getItem('musicbox.makeOwn') === '1') $('makeOwn').open = true; } catch (e) { /* private mode */ }
$('makeOwn').addEventListener('toggle', () => {
  try { localStorage.setItem('musicbox.makeOwn', $('makeOwn').open ? '1' : '0'); } catch (e) { /* private mode */ }
  if ($('makeOwn').open) requestAnimationFrame(() => roll.resize());
});

// ------------------------------------------------------------------ tabs
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.dataset.panel === b.dataset.tab));
  requestAnimationFrame(() => { map.resize(); roll.resize(); strip.resize(); insp.resize(); });
}));

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
    b.addEventListener('click', () => { cat = c; renderCats(); renderSongs(); }); el.appendChild(b);
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
    li.addEventListener('click', () => { loadSong(s.mine ? s : compileSong(s), s.id); renderSongs(); });
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
    document.querySelector('.tabs button[data-tab="comb"]').click();
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
  scene.placeRoom({ dims: room.dims, boxPos: built.room.boxPos, boxYaw: built.room.boxYaw, tableTop: built.room.tableTop, held: built.room.held, cabin: !!room.cabin });
  scene.setListener(map.listener);
  updateFire();
  if (placeListenerNextBuild) {
    placeListenerNextBuild = false;
    const [X, Y] = room.dims;
    const b = built.room.boxPos || [X / 2, Y / 2, 1.1];
    let ly = b[1] - 1.1; if (ly < 0.4) ly = Math.min(Y - 0.4, b[1] + 1.1);
    map.listener.x = b[0] + 0.15; map.listener.y = ly; map.listener.z = +$('earH').value;
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
window.__mb = { cfg, engine, scene, get built() { return built; }, get song() { return song; }, get state() { return lastState; }, roll };
