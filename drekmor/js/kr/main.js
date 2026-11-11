/* =============================================================================
   DREKMOR – Kontrollrummet
   Rummet är dött tills man väljer en signal på larmtablån. Då startar
   anläggningen: lysrören flimrar igång, nålarna rör sig, oscilloskopet ritar
   musiken och skrivarna matar fram låten och journalen.

   Nya släpp läggs till i releases.js – den här filen behöver inte röras.
   ============================================================================= */
import { AudioEngine } from '../audio.js';
import { Plate, PW, PH, LI } from './plate.js';
import { drawLive, HOT, BTN, Twinkles } from './live.js';
import { Panels, fmt } from './panels.js';

const $ = (s) => document.querySelector(s);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (cur, to, rate, dt) => cur + (to - cur) * (1 - Math.exp(-rate * dt));
const rnd = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

const RELEASES = window.RELEASES || [];
const AVAIL = RELEASES.filter((r) => r.status === 'available');
RELEASES.forEach((r) => { r._lines = (r.status === 'available' && r.text ? r.text : '').split('\n').map((l) => l.length); });
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

const audio = new AudioEngine();
const S = { entered: false, en: 0, pw: 0, cur: null, playing: false, hover: null, hoverS: 0, hotBtn: -1, glitch: 0, missing: false };
const stage = $('#stage'), world = $('#world'), marks = $('#marks');
const V = { sw: 1, sh: 1, zoom: 1.035, zoomT: 1.035, px: 0, py: 0, pxT: 0, pyT: 0, tx: 0, ty: 0, s: 1, portrait: false };
let plate = null;
const covers = new Map(), twinkles = new Twinkles(), hist = [];
const needles = new Float32Array(6);

/* ================================================================ panelerna */
const panels = new Panels(RELEASES, {
  select: (r) => select(r),
  toggle: () => toggle(),
  stop: () => stop(),
  show: (n) => show(n),
  close: () => close(),
});
function show(name) {
  if (!S.entered) return;
  if (name === 'tabla' && V.portrait) { $('#tabla .tile.is-available')?.focus(); return; }
  panels.show(name); V.zoomT = 1.1; sfx('key');
}
function close() { if (!panels.open) return; panels.hide(); V.zoomT = 1.035; }

/* ================================================================== ljudet */
function sfx(n) { if (audio.ready) audio.sfx(n); }
function ping() { if (audio.ready) audio.noiseHit(audio.ctx.currentTime + 0.005, { type: 'bandpass', f: 4200 + Math.random() * 2600, q: 7, dur: 0.035, gain: 0.1 }); }
audio.onfallback = (r) => { if (S.cur === r) { S.missing = true; hud(); } };

function select(r) {
  if (!S.entered) return;
  if (r.status !== 'available') { sfx('denied'); panels.deny(r); return; }
  if (S.cur === r) { toggle(); return; }
  S.cur = r; S.missing = false;
  audio.load(r); sfx('clunk');
  setPlaying(audio.play());
  if (panels.open === 'tabla') setTimeout(() => { if (panels.open === 'tabla') close(); }, 620);
}
function toggle() {
  if (!S.entered) return;
  if (!S.cur) { if (AVAIL[0]) select(AVAIL[0]); return; }
  if (S.playing) { audio.pause(); sfx('key'); setPlaying(false); }
  else { if (audio.ended) audio.seekTo(0); sfx('key'); setPlaying(audio.play()); }
}
function stop() { if (!S.cur) return; audio.pause(); audio.seekTo(0); sfx('key'); setPlaying(false); }
function step(dir) {
  if (!AVAIL.length) return;
  const i = AVAIL.indexOf(S.cur);
  select(AVAIL[(i + dir + AVAIL.length) % AVAIL.length] || AVAIL[0]);
}
function setPlaying(on) {
  const was = S.playing; S.playing = !!on;
  if (S.playing && !was) powerUp(); else if (!S.playing && was) powerDown();
  panels.setCurrent(S.cur, S.playing); hud();
}

/* ============================================================== statusraden */
function hud() {
  const h = $('#hud'); h.hidden = !S.cur; if (!S.cur) return;
  $('#hud-id').textContent = S.cur.id; $('#hud-title').textContent = S.cur.title;
  $('#hud-note').hidden = !S.missing;
  h.classList.toggle('is-playing', S.playing);
  $('#hud-play').setAttribute('aria-label', S.playing ? 'Paus' : 'Spela');
  document.body.classList.toggle('has-signal', true);
}
let lastHud = 0;
function hudTime(now) {
  if (!S.cur || now - lastHud < 0.25) return; lastHud = now;
  const d = audio.duration;
  $('#hud-time').textContent = d ? `${fmt(audio.time)} / ${fmt(d)}` : fmt(audio.time);
  $('#seek-fill').style.transform = `scaleX(${audio.progress.toFixed(4)})`;
  $('#seek').setAttribute('aria-valuenow', Math.round(audio.progress * 100));
}
$('#hud-play').addEventListener('click', toggle);
$('#hud-stop').addEventListener('click', stop);
$('#hud-open').addEventListener('click', () => show('rec'));
$('#seek').addEventListener('click', (e) => { const r = e.currentTarget.getBoundingClientRect(); audio.seekTo(clamp((e.clientX - r.left) / r.width, 0, 1)); lastHud = 0; });
$('#seek').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { audio.seek(5); e.stopPropagation(); } if (e.key === 'ArrowLeft') { audio.seek(-5); e.stopPropagation(); } lastHud = 0; });
$('#snd').addEventListener('click', () => mute(!audio.muted));
function mute(m) {
  audio.setMuted(m); $('#snd').setAttribute('aria-pressed', m ? 'false' : 'true');
  $('#snd-l').textContent = m ? 'Ljud av' : 'Ljud på'; $('#snd').classList.toggle('is-off', m);
}

/* ============================================================ strömmen i rummet */
const TUBES = ['tubeL', 'tubeC', 'tubeR', 'tubeR2'].map((id, k) => ({ id, i: LI[id], state: 'off', t0: 0, dur: 1, seed: k * 7.31 + 1.7, pinged: true }));
let clock = 0;
function powerUp() {
  TUBES.forEach((tb, k) => { tb.state = 'ign'; tb.t0 = clock + 0.1 + k * 0.26 + Math.random() * 0.22; tb.dur = RM ? 0.01 : 0.5 + Math.random() * 0.8; tb.pinged = false; });
  if (!RM) S.glitch = 1;
  sfx('power');
}
function powerDown() {
  TUBES.forEach((tb) => { if (tb.state !== 'off') { tb.state = 'die'; tb.t0 = clock + Math.random() * 0.3; tb.dur = RM ? 0.01 : 0.3 + Math.random() * 0.5; } });
}
function tubeLevel(tb, now) {
  const r = rnd(Math.floor(now * 24) + tb.seed * 100);
  if (tb.state === 'ign') {
    const p = (now - tb.t0) / tb.dur; if (p < 0) return 0;
    if (!tb.pinged) { tb.pinged = true; ping(); }
    if (p >= 1) { tb.state = 'on'; return 1; }
    return r < 0.2 + p * 0.8 ? 0.4 + 0.6 * p : 0.04;
  }
  if (tb.state === 'on') {
    if (RM) return 1;
    if (tb.id === 'tubeR2') return rnd(Math.floor(now * 9) + 3.3) < 0.84 ? 1 : 0.18; // det trasiga röret
    return r < 0.004 ? 0.55 : 1;
  }
  if (tb.state === 'die') {
    const p = (now - tb.t0) / tb.dur; if (p < 0) return 1;
    if (p >= 1) { tb.state = 'off'; return 0; }
    return r < 1 - p ? 1 - p * 0.5 : 0.03;
  }
  if (tb.id === 'tubeR2' && S.entered && !RM) return rnd(Math.floor(now * 14) * 1.37) > 0.986 ? 0.32 : 0;
  return 0;
}

function lights(dt, t, lv) {
  const I = plate.I;
  let avg = 0;
  for (const tb of TUBES) { const l = tubeLevel(tb, t); I[tb.i] = l * 0.66; if (tb.id !== 'tubeR2') avg += l / 3; }
  S.pw = damp(S.pw, avg, 9, dt);
  S.en = damp(S.en, S.entered ? 1 : 0, 1.6, dt);
  const en = S.en, P = S.pw, m = (d, s, a) => lerp(lerp(d, s, en), a, P);
  const br = 0.5 + 0.5 * Math.sin(t * 1.5), bass = lv.bass;
  I[LI.sky] = m(0.05, 0.14, 0.5); I[LI.shaft] = m(0.05, 0.13, 0.36);
  I[LI.redL] = m(0.16 + 0.1 * br, 0.3 + 0.36 * br, 0.3 + bass * 1.0);
  I[LI.redR] = m(0.16 + 0.1 * (1 - br), 0.3 + 0.36 * (1 - br), 0.3 + bass * 1.0);
  I[LI.desk] = m(0, 0.3, 0.55); I[LI.door] = m(0.1, 0.3, 0.42); I[LI.wallL] = m(0, 0.22, 0.42);
  I[LI.rec] = m(0, S.cur ? 0.3 : 0.12, 0.5);
  return {
    amb: m(0.01, 0.03, 0.62), emis: en, red: en * (0.5 + bass * 1.8 * P),
    ambCol: [lerp(0.5, 1, P), lerp(0.7, 1, P), lerp(1.05, 1, P)],
    skyCol: [lerp(0.55, 1, P), lerp(0.76, 1, P), lerp(1.1, 1, P)],
  };
}

/* ================================================================== vyn */
const MARKS = [{ hot: 'tablaL', label: 'Tablå', act: () => show('tabla') }, { hot: 'rec', label: 'Skrivare', act: () => show('rec') }, { hot: 'door', label: 'Om Drekmor', act: () => show('om') }];
const tip = document.createElement('span'); tip.className = 'mark mark--tip'; tip.hidden = true;

function buildWorld() {
  const hot = (key, rect, label, act, cls = '') => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hot ' + cls; b.setAttribute('aria-label', label);
    Object.assign(b.style, { left: rect[0] + 'px', top: rect[1] + 'px', width: rect[2] + 'px', height: rect[3] + 'px' });
    const over = () => { S.hover = rect; S.hoverKey = key; S.hoverLabel = label; S.hotBtn = b.dataset.btn != null ? +b.dataset.btn : -1; };
    const out = () => { if (S.hoverKey === key) { S.hover = null; S.hoverKey = null; S.hotBtn = -1; } };
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') over(); }); b.addEventListener('pointerleave', out);
    b.addEventListener('focus', () => { if (b.matches(':focus-visible')) over(); }); b.addEventListener('blur', out);
    b.addEventListener('click', act);
    world.appendChild(b); return b;
  };
  hot('tablaL', HOT.tablaL, 'Tablån: välj signal', () => show('tabla'));
  BTN.forEach((bt, i) => {
    const r = RELEASES[i]; if (!r) return;
    const b = hot('btn' + i, [bt.x - 1.2, bt.y - 20, bt.w + 2.4, bt.h + 24], r.status === 'available' ? `${i + 1} · ${r.title}` : `${i + 1} · Ej i drift`, () => select(r), 'hot--btn');
    b.dataset.btn = i;
  });
  hot('scope', HOT.scope, 'Spela / paus', () => toggle());
  hot('tablaR', HOT.tablaR, 'Tablån: välj signal', () => show('tabla'));
  hot('rec', HOT.rec, 'Skrivarna: låten och journalen', () => show('rec'));
  hot('door', HOT.door, 'Om Drekmor', () => show('om'));
  for (const mk of MARKS) {
    const n = document.createElement('span'); n.className = 'mark'; n.textContent = mk.label; n.dataset.hot = mk.hot;
    n.addEventListener('click', mk.act); marks.appendChild(n); mk.el = n;
  }
  marks.appendChild(tip);
}

function layout() {
  V.portrait = matchMedia('(max-aspect-ratio: 4/5)').matches;
  document.body.classList.toggle('portrait', V.portrait);
  const r = stage.getBoundingClientRect(); V.sw = r.width; V.sh = r.height;
  if (V.portrait && panels.open === 'tabla') panels.hide(true);
  panels.buildTabla();
  plate?.resize(V.sw, V.sh, Math.min(2, devicePixelRatio || 1));
  view(0, true);
}
function view(dt, force) {
  const k = force ? 1 : 1 - Math.exp(-5 * dt);
  V.px += (V.pxT - V.px) * k; V.py += (V.pyT - V.py) * k; V.zoom += (V.zoomT - V.zoom) * (force ? 1 : 1 - Math.exp(-3.2 * dt));
  const s = Math.max(V.sw / PW, V.sh / PH) * V.zoom, ox = PW * s - V.sw, oy = PH * s - V.sh;
  const tx = -ox * (0.5 + 0.5 * V.px), ty = -oy * (0.5 + 0.5 * V.py);
  if (!force && Math.abs(tx - V.tx) < 0.02 && Math.abs(ty - V.ty) < 0.02 && Math.abs(s - V.s) < 0.00002) return;
  V.tx = tx; V.ty = ty; V.s = s;
  world.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${s.toFixed(5)})`;
  plate?.setView(tx, ty, s);
  for (const mk of MARKS) place(mk.el, HOT[mk.hot]);
}
function place(n, rect) {
  const x = V.tx + (rect[0] + rect[2] / 2) * V.s, y = V.ty + rect[1] * V.s;
  n.style.transform = `translate(${clamp(x, 56, V.sw - 56).toFixed(1)}px,${Math.max(54, y - 8).toFixed(1)}px) translate(-50%,-100%)`;
  n.classList.toggle('is-off', x < -20 || x > V.sw + 20);
}

// titta runt: musen flyttar blicken, på pekskärm drar man
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || RM || panels.open) return;
  V.pxT = clamp((e.clientX / innerWidth) * 2 - 1, -1, 1); V.pyT = clamp((e.clientY / innerHeight) * 2 - 1, -1, 1);
});
let drag = null, dragged = false;
stage.addEventListener('pointerdown', (e) => { dragged = false; if (e.pointerType !== 'mouse') drag = { x: e.clientX, px: V.pxT }; });
addEventListener('pointermove', (e) => {
  if (!drag || e.pointerType === 'mouse') return;
  if (Math.abs(e.clientX - drag.x) > 8) dragged = true;
  const ox = PW * V.s - V.sw; if (ox > 4) V.pxT = clamp(drag.px - ((e.clientX - drag.x) / ox) * 2, -1, 1);
});
addEventListener('pointerup', () => (drag = null)); addEventListener('pointercancel', () => (drag = null));
// ett drag som råkar sluta på en klickyta ska inte räknas som ett klick
stage.addEventListener('click', (e) => { if (dragged) { dragged = false; e.stopPropagation(); e.preventDefault(); } }, true);
addEventListener('resize', layout);

/* ============================================================== tangenter */
addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape') { close(); return; }
  if (!S.entered) return;
  const tag = e.target.tagName;
  if (e.key === ' ' && tag === 'BUTTON') return;
  if (e.key === ' ') { e.preventDefault(); toggle(); return; }
  if (/^[1-8]$/.test(e.key)) { const r = RELEASES[+e.key - 1]; if (r) select(r); return; }
  switch (e.key.toLowerCase()) {
    case 't': panels.open === 'tabla' ? close() : show('tabla'); break;
    case 's': case 'i': panels.open === 'rec' ? close() : show('rec'); break;
    case 'o': panels.open === 'om' ? close() : show('om'); break;
    case 'm': mute(!audio.muted); break;
    case 'arrowright': step(1); break;
    case 'arrowleft': step(-1); break;
    case 'arrowup': audio.setVolume(clamp(audio.volume + 0.1, 0, 1)); e.preventDefault(); break;
    case 'arrowdown': audio.setVolume(clamp(audio.volume - 0.1, 0, 1)); e.preventDefault(); break;
    case 'l': audio.seek(10); lastHud = 0; break;
    case 'j': audio.seek(-10); lastHud = 0; break;
  }
});

/* ================================================================= bildrutan */
let last = 0, frameNo = 0, histT = 0;
const ZERO = { l: 0, r: 0, bass: 0 };
function frame(ms) {
  requestAnimationFrame(frame);
  if (document.hidden) { last = ms; return; }
  const dt = Math.min(0.1, (ms - last) / 1000 || 0.016); last = ms; clock += dt; frameNo++;
  audio.tick(dt);
  const lv = audio.ready ? audio.levels() : ZERO;
  if (S.playing && (audio.ended || (!audio.playing && audio.mode !== 'file'))) setPlaying(false);

  // nålar, kurvans historik och gnistrande rutor
  const tg = S.playing ? [lv.l, lv.r, Math.min(1, lv.bass * 1.5), (lv.l + lv.r) / 2, lv.l, lv.r] : null;
  for (let i = 0; i < 6; i++) {
    const rest = S.en * (0.05 + 0.025 * Math.sin(clock * 0.7 + i * 1.9)), to = tg ? tg[i] * 0.94 : rest;
    needles[i] = damp(needles[i], to, to > needles[i] ? 14 : 4.5, dt);
  }
  histT += dt;
  if (histT > 1 / 30) {
    histT = 0; let pk = 0;
    if (S.playing && audio.ready) { const b = audio.bufL; for (let i = 0; i < b.length; i += 4) { const a = Math.abs(b[i]); if (a > pk) pk = a; } pk = Math.min(0.92, pk * 1.2); }
    hist.push(S.playing ? pk : 0.012 + Math.random() * 0.01); if (hist.length > 900) hist.splice(0, 300);
  }
  twinkles.step(dt, S.pw * (0.25 + (lv.l + lv.r) * 0.6));
  S.glitch = Math.max(0, S.glitch - dt * 4);
  S.hoverS = damp(S.hoverS, S.hover ? 1 : 0, 10, dt);
  if (S.hover) S.lastHover = S.hover;

  view(dt);
  tipUpdate();
  if (plate) {
    const L = lights(dt, clock, lv);
    if (S.playing || frameNo % 2 === 0) {
      plate.paint((c, layer) => drawLive(c, layer, {
        t: clock, on: S.en, playing: S.playing, wave: audio.ready ? audio.bufL : null, lv, needles, cur: S.cur,
        releases: RELEASES, covers, hist, progress: S.cur ? audio.progress : 0, twinkles: twinkles.list, hotBtn: S.hotBtn,
      }));
    }
    plate.render({ t: clock, ...L, glitch: S.glitch, hover: S.lastHover, hoverS: S.hoverS * 0.5 });
  } else {
    S.en = damp(S.en, S.entered ? 1 : 0, 1.6, dt); S.pw = damp(S.pw, S.playing ? 1 : 0, 3, dt);
    world.style.filter = `brightness(${(0.16 + 0.24 * S.en + 0.6 * S.pw).toFixed(3)}) saturate(${(0.5 + 0.5 * S.pw).toFixed(2)})`;
  }
  hudTime(clock);
  panels.tick(hist, S.cur ? audio.progress : 0, S.playing);
}
function tipUpdate() {
  const key = S.hoverKey, has = key && !MARKS.some((m) => m.hot === key && !(V.portrait && key === 'tablaL'));
  if (!has || panels.open) { tip.hidden = true; return; }
  tip.hidden = false; tip.textContent = S.hoverLabel; place(tip, S.hover);
}

/* =================================================================== start */
function enter(muted) {
  if (S.entered) return;
  audio.init(); mute(!!muted);
  S.entered = true; document.body.classList.remove('is-gate'); document.body.classList.add('is-in');
  if (!RM) S.glitch = 0.8;
  sfx('power');
  $('#gate').addEventListener('transitionend', () => ($('#gate').hidden = true), { once: true });
  setTimeout(() => ($('#gate').hidden = true), 1400);
}
$('#enter').addEventListener('click', () => enter(false));
$('#enter-mute').addEventListener('click', () => enter(true));

async function boot() {
  buildWorld();
  const img = new Image(); img.decoding = 'async'; img.src = 'assets/kontrollrum.webp';
  try { await img.decode(); } catch (e) { await new Promise((res) => { img.onload = res; img.onerror = res; }); }
  plate = Plate.create($('#gl'), img);
  if (!plate) { document.body.classList.add('nogl'); world.style.backgroundImage = `url(${img.src})`; }
  layout();
  for (const r of RELEASES) if (r.cover && r.status === 'available') { const c = new Image(); c.onload = () => covers.set(r.id, c); c.src = r.cover; }
  requestAnimationFrame((ms) => { last = ms; frame(ms); });
  document.body.classList.remove('is-loading'); document.body.classList.add('is-gate');
  $('#gate-load').hidden = true; $('#gate-go').hidden = false;
  window.__kr = { S, V, audio, select, show, close, enter };
}
boot();
