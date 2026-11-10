/* =============================================================================
   DREKMOR — Arkivet. Realtids-3D (three.js): ett rum på natten, ett kassettdäck,
   fodral och kassetter. Data: releases.js · Texturer: textures.js ·
   Modeller: models.js · Rummet: room.js · Ljud: audio.js · DOM: ui.js
   ============================================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as T from './textures.js';
import { makeDeck, drawVFD, makeCassette, makeCase, DECK, CASE } from './models.js';
import { makeRoom } from './room.js';
import { AudioEngine } from './audio.js';
import { UI } from './ui.js';
import { tween, updateTweens, ease, wait, lerp, damp, clamp, setMotionScale } from './tween.js';

const RELEASES = window.RELEASES || [];
const Q = new URLSearchParams(location.search);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none)').matches;
const STILL_MODE = Q.get('still') === '1';          // renderar stillbilden för laddaren (verktyg)
if (REDUCED) setMotionScale(0.4);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const audio = new AudioEngine();
const S = {
  entered: false, power: false, boot: 1, busy: false, modal: false, muted: false,
  loaded: null, playing: false, paused: false, windDir: 0, windUntil: 0,
  levels: { l: 0, r: 0 }, peaks: { l: 0, r: 0, hl: 0, hr: 0 },
  focus: 0, shake: 0, glitch: 0, msg: null, msgUntil: 0,
  hover: null, volume: 0.8, view: 'desk', fadeIn: 0,
};

let renderer, scene, camera, composer, bloom, grainPass, deck, room, dust, lights = {};
const cases = [];
const rig = { target: new THREE.Vector3(), dist: 90, elev: 0.5, azim: 0, fixed: false };
const cam = { target: new THREE.Vector3(0, 5, 6), dist: 90, elev: 0.5, azim: 0 };
const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, px: 0, py: 0, dirty: false };
const jcards = new Map();
const images = new Map();

/* =============================================================== EFFEKT ==== */
const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGlitch: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uGlitch; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      if (uGlitch > 0.001) {
        float band = floor(uv.y * 26.0 + floor(uTime * 24.0));
        float r = hash(vec2(band, floor(uTime * 18.0)));
        if (r < uGlitch * 0.7) uv.x += (r - 0.35) * 0.09 * uGlitch;
      }
      vec2 d = uv - 0.5;
      float ca = 0.0016 + uGlitch * 0.012;
      vec3 col = vec3(texture2D(tDiffuse, uv + d * ca).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d * ca).b);
      float v = smoothstep(0.92, 0.28, length(d * vec2(1.0, 0.9)));
      col *= mix(0.5, 1.0, v);
      col += (hash(uv * uRes + fract(uTime * 7.13) * 91.7) - 0.5) * 0.05;
      col += vec3(0.012, 0.004, 0.018);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

/* ================================================================ START ==== */
boot();

async function boot() {
  UI.init({
    releases: RELEASES, enter, toggleSound, playPause, inlay: openInlay, eject, seekTo,
    pick: (id) => pickRelease(id), modal: (m) => { S.modal = m; if (m) S.hover = null; },
    setView, goLofi: () => { location.href = location.pathname + '?lofi=1'; },
  });
  audio.onfallback = (r) => { if (S.loaded?.r === r) UI.sub('Ljudfilen hittades inte – spelar demosignal'); };

  // Lo-fi: valt (?lofi=1), eller en dator som ritar 3D i mjukvara (då hänger hela maskinen – ?room=1 provar ändå)
  if (Q.get('lofi') === '1') return lofi('chosen');
  UI.loading(0.05, 'Laddar typsnitt');
  await fontsReady();
  try { createRenderer(); } catch (e) { console.warn(e); return lofi('nogl'); }
  if (softwareGL() && Q.get('room') !== '1' && !STILL_MODE) return lofi('soft');

  UI.loading(0.2, 'Bygger rummet'); await nextFrame();
  buildWorld();
  UI.loading(0.38, 'Hämtar omslagen'); await nextFrame();
  await loadCovers();
  room = makeRoom({ posterRelease: RELEASES[0], posterImage: images.get(RELEASES[0]?.id), touch: TOUCH });
  scene.add(room.group);
  await buildCases((p) => UI.loading(0.42 + p * 0.4, 'Packar kassetterna'));
  layout();
  UI.loading(0.86, 'Värmer upp displayen'); await nextFrame();
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* äldre webbläsare */ }
  if (STILL_MODE) return stillMode();
  addEvents();
  requestAnimationFrame(frame);
  await sleep(250);
  UI.loading(1);
  UI.ready();
}

async function fontsReady() {
  const fonts = ['500 32px "Space Grotesk"', '700 32px "Space Grotesk"', '400 32px "Space Mono"', '700 32px "Space Mono"', '400 32px "Bebas Neue"'];
  try { await Promise.race([Promise.all(fonts.map((f) => document.fonts.load(f, 'DREKMORÅÄÖ01'))), sleep(4000)]); } catch (e) {}
}

function createRenderer() {
  const canvas = document.getElementById('scene');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, TOUCH ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  T.setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());
}
function softwareGL() {
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    return /swiftshader|llvmpipe|softpipe|lavapipe|software|basic render/i.test(name);
  } catch (e) { return false; }
}

/* ============================================================== VÄRLDEN ==== */
function buildWorld() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020205);
  scene.fog = new THREE.Fog(0x020205, 170, 330);
  scene.environment = studioEnvironment();
  scene.environmentIntensity = 1;

  camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 900);

  // Skrivbord i mörk lack
  const desk = T.drawDesk();
  const dm = T.toTexture(desk.map, { wrap: true }), dr = T.toTexture(desk.rough, { color: false, wrap: true });
  dm.repeat.set(3, 1.6); dr.repeat.set(3, 1.6);
  const deskMesh = new THREE.Mesh(new THREE.PlaneGeometry(280, 150), new THREE.MeshStandardMaterial({ map: dm, roughnessMap: dr, roughness: 0.7, metalness: 0, envMapIntensity: 0.9 }));
  deskMesh.rotation.x = -Math.PI / 2; deskMesh.position.set(0, 0, 18); deskMesh.receiveShadow = true;
  scene.add(deskMesh);
  const deskFront = new THREE.Mesh(new THREE.BoxGeometry(280, 5, 2), new THREE.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.6 }));
  deskFront.position.set(0, -2.5, 93); scene.add(deskFront);

  // Ljus: kall nyckel ovanifrån, neon och fönster ger färgen
  scene.add(new THREE.HemisphereLight(0x1a2438, 0x030303, 0.36));
  const key = new THREE.SpotLight(0xdfe8ff, 4.2, 0, 0.46, 0.75, 0);
  key.position.set(-30, 80, 52); key.target.position.set(2, 3, 8);
  key.castShadow = true; key.shadow.mapSize.set(TOUCH ? 1024 : 2048, TOUCH ? 1024 : 2048);
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.04; key.shadow.camera.near = 40; key.shadow.camera.far = 220;
  scene.add(key, key.target);
  const rimC = new THREE.SpotLight(0x33d9ff, 4.0, 0, 0.46, 0.9, 0);
  rimC.position.set(46, 72, -52); rimC.target.position.set(0, 6, -4); scene.add(rimC, rimC.target);
  const rimM = new THREE.SpotLight(0xff3d9a, 3.4, 0, 0.46, 0.9, 0);
  rimM.position.set(-50, 68, -48); rimM.target.position.set(0, 6, -4); scene.add(rimM, rimM.target);
  const fill = new THREE.DirectionalLight(0x8190ff, 0.2); fill.position.set(10, 30, 90); scene.add(fill);
  lights = { key, rimC, rimM, fill, moodTarget: new THREE.Color(0x33d9ff), rimBase: 4.0 };

  // Kassettdäcket
  deck = makeDeck();
  scene.add(deck.group);

  // Damm i ljuskäglan
  const N = TOUCH ? 140 : 320, pos = new Float32Array(N * 3), seed = new Float32Array(N), rand = T.seeded('dust');
  for (let i = 0; i < N; i++) { pos[i * 3] = (rand() - 0.5) * 100; pos[i * 3 + 1] = 2 + rand() * 50; pos[i * 3 + 2] = -30 + rand() * 70; seed[i] = rand() * 100; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dust = new THREE.Points(dg, new THREE.PointsMaterial({ map: T.toTexture(T.drawSprite()), size: 0.5, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xdde8ff }));
  dust.userData.seed = seed; scene.add(dust);

  // Efterbehandling
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.48, 0.6, 0.93);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  grainPass = new ShaderPass(FilmShader);
  composer.addPass(grainPass);
}

/** Egen mörk studiomiljö för reflexer: softboxar i scenens färger. */
function studioEnvironment() {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: 0x040406, side: THREE.BackSide })));
  const box = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); env.add(m);
  };
  box(46, 14, 0xe8f0ff, 2.4, [-14, 46, 22]);   // kall softbox snett ovanifrån
  box(40, 26, 0x6fd8ff, 1.6, [0, 22, -40]);     // fönstret bakom
  box(7, 60, 0x2fd6ff, 2.6, [48, 8, -18]);      // cyan list höger
  box(7, 60, 0xff3d9a, 2.2, [-48, 8, -18]);     // magenta list vänster
  box(90, 30, 0x1a1c2a, 1.0, [0, -10, 48]);     // svag studs framifrån
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}

async function loadCovers() {
  await Promise.all(RELEASES.map(async (r) => images.set(r.id, await T.loadImage(r.cover))));
}

function jcard(r) {
  if (!jcards.has(r.id)) {
    const canvas = T.drawJCard(r, images.get(r.id));
    jcards.set(r.id, { canvas, tex: T.toTexture(canvas), url: null });
  }
  return jcards.get(r.id);
}
const spineCache = new Map();
const spine = (r) => { if (!spineCache.has(r.id)) spineCache.set(r.id, T.toTexture(T.drawSpine(r))); return spineCache.get(r.id); };
const blankCard = () => {
  if (!blankCard.t) { const c = T.makeCanvas(8, 8), x = c.getContext('2d'); x.fillStyle = '#101114'; x.fillRect(0, 0, 8, 8); blankCard.t = T.toTexture(c); }
  return blankCard.t;
};

async function buildCases(progress) {
  const featured = RELEASES.filter((r) => r.featured).slice(0, 4);
  const half = Math.ceil(RELEASES.length / 2);
  const stacks = [RELEASES.slice(0, half), RELEASES.slice(half)];
  const total = featured.length + RELEASES.length;
  let n = 0;
  const add = (r, kind, lazyCard) => {
    const c = makeCase(r, lazyCard ? blankCard() : jcard(r).tex, spine(r));
    Object.assign(c, { kind, busy: false, hoverT: 0, home: { p: new THREE.Vector3(), q: new THREE.Quaternion() }, cardReady: !lazyCard, cassette: null });
    c.proxy.userData.hit.c = c;
    scene.add(c.group); cases.push(c);
    return c;
  };
  for (const r of featured) { add(r, 'featured', false); progress(++n / total); await nextFrame(); }
  stacks.forEach((list, side) => {
    list.forEach((r, i) => { const c = add(r, 'stack', i !== list.length - 1); c.side = side; c.level = i; progress(++n / total); });
  });
}

function ensureCard(c) {
  if (c.cardReady) return;
  c.card.material.map = jcard(c.release).tex; c.card.material.needsUpdate = true; c.cardReady = true;
}
function ensureCassette(c) {
  if (c.cassette) return c.cassette;
  c.cassette = makeCassette(c.release);
  c.anchor.remove(c.placeholder);
  c.anchor.add(c.cassette);
  return c.cassette;
}

/* =============================================================== LAYOUT ==== */
/* Liggande fönster (1.4:1 och bredare) ser samma vertikala skiva av rummet – bredare fönster ser mer åt sidorna.
   Så kan laddarens stillbild (renderad i 2.4:1) läggas exakt över det levande rummet. */
export const FRAME = { fov: 42, target: [0, 10, 2], elev: 0.3, halfH: 27 };
function layout() {
  const w = innerWidth, h = innerHeight, a = w / h, portrait = a < 0.85;
  renderer.setSize(w, h); composer.setSize(w, h);
  grainPass.uniforms.uRes.value.set(w, h);
  camera.aspect = a;

  const featured = cases.filter((c) => c.kind === 'featured');
  const placeF = portrait
    ? [[-5.9, 16.5, 0.05], [5.9, 17.1, -0.04], [-5.9, 32.2, -0.03], [5.9, 32.8, 0.05]]
    : [[-16.8, 17.6, 0.1], [-5.6, 18.4, -0.04], [5.6, 17.8, 0.05], [16.8, 18.6, -0.09]];
  featured.forEach((c, i) => {
    const [x, z, yaw] = placeF[i];
    const k = portrait ? 1.28 : 1;
    c.group.scale.setScalar(k);
    c.home.p.set(x, (CASE.d / 2) * k, z);
    c.home.q.setFromEuler(new THREE.Euler(-Math.PI / 2, yaw, 0, 'YXZ'));
  });
  const rand = T.seeded('stack');
  cases.filter((c) => c.kind === 'stack').forEach((c) => {
    const x = (c.side ? 1 : -1) * 31.5 + (rand() - 0.5) * 0.7, z = -1 + (rand() - 0.5) * 0.6;
    c.home.p.set(x, CASE.d / 2 + c.level * (CASE.d + 0.02), z);
    c.home.q.setFromEuler(new THREE.Euler(-Math.PI / 2, Math.PI / 2 + (rand() - 0.5) * 0.06, 0, 'YXZ'));
    c.group.visible = !portrait;
  });
  for (const c of cases) if (!c.busy) { c.group.position.copy(c.home.p); c.group.quaternion.copy(c.home.q); }
  if (room) room.phones.visible = !portrait;

  const t = Math.tan(THREE.MathUtils.degToRad(FRAME.fov / 2));
  if (portrait) { camera.fov = 34; rig.target.set(0, 4, 15); rig.elev = 0.82; rig.fixed = false; const t2 = Math.tan(THREE.MathUtils.degToRad(17)); rig.dist = Math.max(25 / (t2 * a), 33 / t2); }
  else if (a >= 1.4) { camera.fov = FRAME.fov; rig.target.set(...FRAME.target); rig.elev = FRAME.elev; rig.fixed = true; rig.dist = FRAME.halfH / t; }
  else { camera.fov = FRAME.fov; rig.target.set(...FRAME.target); rig.elev = FRAME.elev; rig.fixed = false; rig.dist = Math.max(37.5 / (t * a), FRAME.halfH / t); }
  camera.updateProjectionMatrix();
  UI.stillMatches(rig.fixed);
}

/* ============================================================== KAMERA ==== */
const focusPoint = new THREE.Vector3(DECK.hole.x, DECK.FOOT + DECK.H / 2 + DECK.hole.y, 0);
const _t = new THREE.Vector3(), _want = { target: new THREE.Vector3(), dist: 0, elev: 0, azim: 0 };
function wanted() {
  if (S.view === 'window' && room) return room.windowView;
  if (S.view === 'poster' && room) return room.posterView;
  const f = S.view === 'deck' ? 1 : S.focus;
  _want.target.copy(rig.target).lerp(focusPoint, f * 0.62);
  _want.dist = rig.dist * (1 - 0.3 * f); _want.elev = rig.elev - f * 0.1; _want.azim = rig.azim;
  return _want;
}
function updateCamera(dt, snap) {
  pointer.px = damp(pointer.px, TOUCH ? 0 : pointer.nx, 2.5, dt);
  pointer.py = damp(pointer.py, TOUCH ? 0 : pointer.ny, 2.5, dt);
  const w = wanted(), k = snap ? 1 : 1 - Math.exp(-2.6 * dt);
  cam.target.lerp(w.target, k); cam.dist = lerp(cam.dist, w.dist, k); cam.elev = lerp(cam.elev, w.elev, k); cam.azim = lerp(cam.azim, w.azim, k);
  const look = S.view === 'window' ? 0.09 : 0.035;
  const elev = cam.elev - pointer.py * look, az = cam.azim + pointer.px * look * 1.7;
  _t.copy(cam.target);
  camera.position.set(_t.x + Math.sin(az) * Math.cos(elev) * cam.dist, _t.y + Math.sin(elev) * cam.dist, _t.z + Math.cos(az) * Math.cos(elev) * cam.dist);
  if (S.shake > 0.001) camera.position.add(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), 0).multiplyScalar(S.shake * 0.35));
  camera.lookAt(_t);
}
const focus = (v, dur = 1.0) => { const f0 = S.focus; return tween(dur, (e) => (S.focus = lerp(f0, v, e)), ease.inOutCubic); };
const kick = (a = 1) => { S.shake = Math.max(S.shake, a); };

function setView(v) {
  if (!S.entered) return;
  if (v === S.view) v = 'desk';
  if (v === 'window' && innerWidth / innerHeight < 0.85) { UI.toast('Vänd telefonen för att titta ut.'); return; }
  S.view = v; S.hover = null;
  if (v !== 'desk') audio.sfx('whoosh');
  UI.setView(v);
  UI.announce(v === 'window' ? 'Vid fönstret: regnet över staden.' : v === 'poster' ? 'Affischen på väggen.' : v === 'deck' ? 'Nära däcket.' : 'Tillbaka vid bordet.');
}

/* =========================================================== RENDER-LOOP ==== */
let last = performance.now(), vfdAcc = 0, hudAcc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const rawDt = Math.min(1, (now - last) / 1000), dt = Math.min(0.05, rawDt); last = now;
  const t = now / 1000;
  updateTweens(now);
  audio.tick(rawDt);
  tick(dt, t, now, rawDt);
  composer.render(dt);
}

function tick(dt, t, now, rawDt = dt) {
  // Ljudnivåer (snabb attack, långsam release, toppvärden)
  const lv = audio.levels();
  for (const ch of ['l', 'r']) {
    const v = lv[ch];
    S.levels[ch] = v > S.levels[ch] ? lerp(S.levels[ch], v, 0.6) : damp(S.levels[ch], v, 7, dt);
    const hk = ch === 'l' ? 'hl' : 'hr';
    if (S.levels[ch] >= S.peaks[ch]) { S.peaks[ch] = S.levels[ch]; S.peaks[hk] = t + 0.9; }
    else if (t > S.peaks[hk]) S.peaks[ch] = damp(S.peaks[ch], S.levels[ch], 2.5, dt);
  }

  // Kassetten i däcket
  if (S.loaded) {
    const cas = S.loaded.cassette;
    cas.userData.setProgress(audio.progress);
    const winding = now < S.windUntil;
    if (S.playing || winding) cas.userData.advance(dt, winding ? S.windDir * 55 : 4.76);
    if (S.playing && audio.ended) { stop(); UI.toast('Sida A är slut. Tryck ◀◀ för att spola tillbaka.'); }
  }

  // Knappar (spärrade + tillfälliga tryck)
  for (const [id, k] of Object.entries(deck.keys)) {
    const latched = (id === 'play' && S.playing) || (id === 'pause' && S.paused);
    k.pulse = damp(k.pulse, 0, 9, dt);
    k.grp.position.z = damp(k.grp.position.z, k.rest - (latched ? 0.3 : 0) - k.pulse * 0.34, 22, dt);
  }
  deck.knobPivot.rotation.z = damp(deck.knobPivot.rotation.z, lerp(2.36, -2.36, S.volume), 12, dt);

  // Fodralens hover
  for (const c of cases) {
    const target = S.hover && S.hover.c === c && !S.busy ? 1 : 0;
    c.hoverT = damp(c.hoverT, target, 10, dt);
    if (!c.busy) {
      c.group.position.copy(c.home.p);
      if (c.kind === 'featured') c.group.position.y += c.hoverT * 0.9;
      else c.group.position.z += c.hoverT * 1.6;
    }
  }

  // Display
  vfdAcc += dt;
  if (vfdAcc > 1 / 30) {
    vfdAcc = 0;
    drawVFD(deck.vfd, { power: S.power, boot: S.boot, mode: vfdMode(now), marquee: vfdText(now), time: S.loaded && S.loaded.r.status === 'available' ? audio.time : null, levels: S.levels, peaks: S.peaks, t, dolby: true });
  }
  deck.vfdLight.intensity = S.power ? 1.2 + (S.levels.l + S.levels.r) * 3 : 0;
  deck.led.material.emissiveIntensity = damp(deck.led.material.emissiveIntensity, S.power ? 3.2 : 0, 6, dt);

  // Stämning: rimljuset tar färg av bandet, och rummet andas med basen
  lights.rimC.color.lerp(lights.moodTarget, 1 - Math.exp(-1.6 * dt));
  lights.rimC.intensity = lights.rimBase * (1 + (S.playing ? lv.bass * 1.1 : 0));
  room.lights.winLight.intensity = 1.5 + (S.playing ? lv.bass * 1.2 : 0) + Math.sin(t * 0.7) * 0.1;
  room.update(dt, t);

  // Damm
  const p = dust.geometry.attributes.position, sd = dust.userData.seed;
  for (let i = 0; i < p.count; i++) {
    let y = p.getY(i) + dt * (0.25 + Math.sin(t * 0.3 + sd[i]) * 0.2);
    if (y > 52) y = 2;
    p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * 0.2 + sd[i]) * dt * 0.3);
  }
  p.needsUpdate = true;

  // HUD-tid
  hudAcc += dt;
  if (hudAcc > 0.25 && S.loaded) { hudAcc = 0; UI.setProgress(audio.time, audio.duration); }

  // Hover via raycast
  if (pointer.dirty && S.entered && !S.modal) { pointer.dirty = false; updateHover(); }

  S.shake = damp(S.shake, 0, 7, dt);
  S.glitch = damp(S.glitch, 0, 3.2, Math.min(0.25, rawDt));
  grainPass.uniforms.uTime.value = t;
  grainPass.uniforms.uGlitch.value = S.glitch;
  updateCamera(dt);
}

function vfdMode(now) {
  if (!S.loaded) return 'notape';
  if (now < S.windUntil) return S.windDir > 0 ? 'ff' : 'rew';
  if (S.playing) return 'play';
  if (S.paused) return 'pause';
  return S.loaded.r.status === 'coming' ? 'coming' : 'stop';
}
function vfdText(now) {
  if (S.msg && now < S.msgUntil) return S.msg + '   ·   ';
  if (!S.loaded) return 'SÄTT I ETT BAND   ·   DREKMOR ARKIV   ·   SIGNAL 001–012   ·   ';
  const r = S.loaded.r, name = `${r.id}  ${r.title.toUpperCase()}`;
  if (r.status === 'coming') return `${name}   ·   INGEN SIGNAL ÄNNU   ·   SNART I SÄNDNING   ·   `;
  if (audio.mode === 'demo') return `${name}   ·   DEMOSIGNAL   ·   RIKTIG INSPELNING KOMMER   ·   `;
  return `${name}   ·   DREKMOR   ·   `;
}
const vfdSay = (msg, secs = 4) => { S.msg = msg; S.msgUntil = performance.now() + secs * 1000; };

/* =========================================================== INTERAKTION ==== */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function hitAt(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const targets = [...deck.interactive, ...room.interactive, ...cases.filter((c) => c.group.visible).map((c) => c.proxy)];
  const hit = raycaster.intersectObjects(targets, false)[0];
  return hit ? hit.object.userData.hit : null;
}

const KEY_LABEL = { play: 'Spela', pause: 'Paus', stop: 'Stopp', rew: 'Spola tillbaka', ff: 'Spola fram', eject: 'Mata ut' };
function hoverLabel(h) {
  if (!h) return null;
  switch (h.type) {
    case 'case': {
      const r = h.release;
      const verb = S.loaded && S.loaded.c === h.c ? 'I däcket' : r.status === 'locked' ? 'Låst signal' : r.status === 'coming' ? 'Förhandsvisa' : 'Sätt i';
      return `<em>${verb}</em><b>${r.id}</b> ${r.title}`;
    }
    case 'key': return `<em>Knapp</em>${KEY_LABEL[h.key]}`;
    case 'knob': return `<em>Dra</em>Volym ${Math.round(S.volume * 100)}`;
    case 'door': return S.loaded ? '<em>Lucka</em>Mata ut' : '<em>Lucka</em>Tom';
    case 'power': return `<em>Ström</em>${S.power ? 'Stäng av' : 'Slå på'}`;
    case 'window': return S.view === 'window' ? '<em>Fönstret</em>Tillbaka · Esc' : '<em>Fönstret</em>Titta ut · F';
    case 'neon': return `<em>Neon</em>${room.state.neonOn ? 'Släck' : 'Tänd'}`;
    case 'poster': return `<em>Affisch</em>Om Drekmor`;
    case 'phones': return `<em>Hörlurar</em>${S.muted ? 'Ljud på' : 'Ljud av'}`;
  }
}
function updateHover() {
  const h = hitAt(pointer.x, pointer.y);
  const prev = S.hover;
  S.hover = h;
  if (h && h.type === 'case' && (!prev || prev.c !== h.c)) audio.sfx('hover');
  document.body.style.cursor = h ? 'pointer' : '';
  UI.cursor(pointer.x, pointer.y, hoverLabel(h), !!h);
}

let knobDrag = null;
function addEvents() {
  const canvas = renderer.domElement;
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = (e.clientX / innerWidth) * 2 - 1; pointer.ny = (e.clientY / innerHeight) * 2 - 1;
    pointer.dirty = true;
    if (!S.hover) UI.cursor(pointer.x, pointer.y, null, false);
    if (knobDrag) setVolume(knobDrag.v0 + (knobDrag.y0 - e.clientY) / 180 + (e.clientX - knobDrag.x0) / 260);
  }, { passive: true });
  document.addEventListener('pointerleave', () => UI.cursorHidden(true));
  document.addEventListener('pointerenter', () => UI.cursorHidden(false));
  canvas.addEventListener('pointerdown', (e) => {
    if (!S.entered || S.modal) return;
    const h = hitAt(e.clientX, e.clientY);
    if (h && h.type === 'knob') { knobDrag = { y0: e.clientY, x0: e.clientX, v0: S.volume }; canvas.setPointerCapture(e.pointerId); }
  });
  addEventListener('pointerup', () => { knobDrag = null; });
  canvas.addEventListener('click', (e) => {
    if (!S.entered || S.modal) return;
    const h = hitAt(e.clientX, e.clientY);
    if (!h) { if (S.view !== 'desk' && S.view !== 'deck') setView('desk'); return; }
    switch (h.type) {
      case 'case': return insert(h.c);
      case 'key': return pressKey(h.key);
      case 'door': return S.loaded ? eject() : UI.toast('Facket är tomt – välj en kassett.');
      case 'power': return togglePower();
      case 'window': return setView('window');
      case 'poster': return UI.open('about');
      case 'neon': room.setNeon(!room.state.neonOn); audio.sfx(room.state.neonOn ? 'power' : 'clack'); return;
      case 'phones': toggleSound(); return;
    }
  });
  canvas.addEventListener('wheel', (e) => { if (S.hover && S.hover.type === 'knob') { e.preventDefault(); setVolume(S.volume - e.deltaY / 1200); } }, { passive: false });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!UI.closeAll() && S.view !== 'desk') setView('desk'); return; }
    if (!S.entered || S.modal || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = document.activeElement?.tagName;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); playPause(); }
    else if (k === 'e') eject();
    else if (k === 'i') UI.open('index');
    else if (k === 'o' && S.loaded) openInlay();
    else if (k === 'm') toggleSound();
    else if (k === 'z') setView('deck');
    else if (k === 'f') setView('window');
    else if (k === 'n') { room.setNeon(!room.state.neonOn); audio.sfx(room.state.neonOn ? 'power' : 'clack'); }
    else if (/^[1-4]$/.test(k)) { const c = cases.filter((x) => x.kind === 'featured')[+k - 1]; if (c) insert(c); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setVolume(S.volume + 0.05); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setVolume(S.volume - 0.05); }
    else if (e.key === 'ArrowLeft' && S.loaded) pressKey('rew');
    else if (e.key === 'ArrowRight' && S.loaded) pressKey('ff');
  });
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 80); });
}

/* ============================================================ STYRNING ==== */
async function enter(withSound) {
  if (S.entered) return;
  audio.init();
  S.muted = !withSound; audio.setMuted(S.muted); UI.setSound(!S.muted);
  room.setPhones(!S.muted);
  S.entered = true;
  updateCamera(0, true);                 // stå exakt som stillbilden
  S.glitch = 1.0;                        // störningsblixten när rummet tar över
  UI.entered();
  await sleep(REDUCED ? 200 : 900);
  powerOn();
}

function powerOn() {
  if (S.power) return;
  S.power = true; S.boot = 0; audio.sfx('power');
  tween(1.8, (e) => (S.boot = e), ease.linear);
}
function togglePower() {
  if (S.busy) return;
  audio.sfx('key');
  if (S.power) { stop(); S.power = false; UI.toast('Däcket är avstängt.'); }
  else powerOn();
}
function toggleSound() {
  if (!audio.ready) audio.init();
  S.muted = !S.muted; audio.setMuted(S.muted); UI.setSound(!S.muted);
  if (room) room.setPhones(!S.muted);
  audio.sfx('clack');
}
function setVolume(v) { S.volume = clamp(v, 0, 1); audio.setVolume(S.volume); if (S.hover?.type === 'knob') UI.cursor(pointer.x, pointer.y, hoverLabel(S.hover), true); }

function pressKey(k) {
  if (!S.entered) return;
  deck.keys[k].pulse = 1; audio.sfx('key');
  if (!S.power && k !== 'eject') { UI.toast('Slå på strömmen först (POWER).'); return; }
  ({ play, pause, stop, rew: () => wind(-1), ff: () => wind(1), eject })[k]();
}

function play() {
  if (!S.power) powerOn();
  if (!S.loaded) { vfdSay('SÄTT I ETT BAND'); UI.toast('Sätt i ett band först – klicka på en kassett.'); return; }
  const r = S.loaded.r;
  if (r.status !== 'available') { vfdSay('INGEN SIGNAL ÄNNU · SNART I SÄNDNING'); audio.sfx('denied'); UI.toast(`${r.title} är inte släppt än – öppna omslaget för en förhandstitt.`); return; }
  if (S.playing) return;
  if (audio.ended) audio.seekTo(0);
  if (!audio.ready) audio.init();
  audio.play(); audio.sfx('motor');
  S.playing = true; S.paused = false; UI.setPlaying(true);
  UI.announce(`Spelar ${r.title}`);
}
function pause() {
  if (S.playing) { audio.pause(); S.playing = false; S.paused = true; UI.setPlaying(false); }
  else if (S.paused) play();
}
function stop() {
  if (!S.playing && !S.paused) return;
  audio.pause(); S.playing = false; S.paused = false; UI.setPlaying(false);
}
function playPause() { S.playing ? pause() : play(); }
function wind(dir) {
  if (!S.loaded || S.loaded.r.status !== 'available') return;
  audio.seek(dir * 15); S.windDir = dir; S.windUntil = performance.now() + 700; audio.sfx('whir');
}
function seekTo(p) { if (S.loaded) audio.seekTo(clamp(p, 0, 1)); }

function setMood(hex) { lights.moodTarget.set(hex || '#33d9ff'); }

/* ===================================================== KOREOGRAFI ========= */
const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
function pose(obj) { obj.updateWorldMatrix(true, false); obj.matrixWorld.decompose(_p, _q, _s); return { p: _p.clone(), q: _q.clone(), s: _s.clone() }; }
function doorOpenPose() {
  const d = deck.doorPivot, prev = d.rotation.x;
  d.rotation.x = DECK.DOOR_OPEN; const out = pose(deck.tapeAnchor);
  d.rotation.x = prev; d.updateMatrixWorld(true);
  return out;
}
const openDoor = () => { audio.sfx('open'); const r0 = deck.doorPivot.rotation.x; return tween(0.5, (e) => (deck.doorPivot.rotation.x = lerp(r0, DECK.DOOR_OPEN, e)), ease.outBack); };
const closeDoor = () => { const r0 = deck.doorPivot.rotation.x; return tween(0.26, (e) => (deck.doorPivot.rotation.x = lerp(r0, 0, e)), ease.inCubic).then(() => { audio.sfx('clunk'); kick(1); }); };
const openLid = (c) => { const r0 = c.lidPivot.rotation.y; return tween(0.55, (e) => (c.lidPivot.rotation.y = lerp(r0, CASE.LID_OPEN, e)), ease.outCubic); };
const closeLid = (c) => { const r0 = c.lidPivot.rotation.y; return tween(0.42, (e) => (c.lidPivot.rotation.y = lerp(r0, 0, e)), ease.inCubic).then(() => audio.sfx('clack')); };

async function present(c) {
  c.busy = true; ensureCard(c);
  const p0 = c.group.position.clone();
  const to = c.home.p.clone();
  if (c.kind === 'featured') to.y += 2.2; else to.z += 8.6;
  await tween(0.42, (e) => c.group.position.lerpVectors(p0, to, e), ease.outCubic);
}
async function returnHome(c) {
  const p0 = c.group.position.clone();
  await tween(0.5, (e) => c.group.position.lerpVectors(p0, c.home.p, e), ease.inOutCubic);
  c.busy = false;
}

const spinQ = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
function fly(obj, to, dur, { arc = 17, toward = 7 } = {}) {
  const p0 = obj.position.clone(), q0 = obj.quaternion.clone(), s0 = obj.scale.clone();
  const ctrl = p0.clone().lerp(to.p, 0.5); ctrl.y += arc; ctrl.z += toward;
  return tween(dur, (e, raw) => {
    const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
    obj.position.set(a * p0.x + b * ctrl.x + c * to.p.x, a * p0.y + b * ctrl.y + c * to.p.y, a * p0.z + b * ctrl.z + c * to.p.z);
    obj.quaternion.slerpQuaternions(q0, to.q, e);
    if (to.s) obj.scale.lerpVectors(s0, to.s, e);
    if (!REDUCED) { spinQ.setFromAxisAngle(UP, Math.PI * 2 * ease.inOutSine(raw)); obj.quaternion.multiply(spinQ); }
  }, ease.inOutCubic);
}

async function deny(c) {
  if (c.busy) return;
  c.busy = true; audio.sfx('denied'); S.glitch = 1; vfdSay('ÅTKOMST NEKAD · SIGNAL KRYPTERAD');
  UI.toast(`${c.release.id} är låst – signalen är krypterad. Ännu.`);
  const p0 = c.home.p.clone();
  await tween(0.5, (e, raw) => { c.group.position.set(p0.x + Math.sin(raw * Math.PI * 9) * (1 - raw) * 0.45, p0.y + (c.kind === 'featured' ? 0.4 * (1 - raw) : 0), p0.z); }, ease.linear);
  c.busy = false;
}

async function insert(c) {
  const r = c.release;
  if (r.status === 'locked') return deny(c);
  if (S.busy) return;
  if (S.loaded && S.loaded.c === c) { UI.toast(`${r.title} sitter redan i däcket.`); return; }
  S.busy = true; UI.hideHint(); UI.cursor(pointer.x, pointer.y, null, false);
  if (S.view === 'window' || S.view === 'poster') setView('desk');
  try {
    if (!S.power) powerOn();
    if (S.loaded) await ejectInternal();
    audio.sfx('clack');
    await present(c);
    const cas = ensureCassette(c);
    await openLid(c);
    scene.attach(cas);
    const u0 = cas.position.clone();
    await tween(0.34, (e) => cas.position.set(u0.x, u0.y + 3.4 * e, u0.z), ease.outCubic);
    openDoor(); audio.sfx('whoosh'); if (S.view === 'desk') focus(1, 1.2);
    const target = doorOpenPose();
    closeLid(c).then(() => returnHome(c));
    await fly(cas, target, REDUCED ? 0.5 : 1.3);
    deck.tapeAnchor.attach(cas); cas.position.set(0, 0, 0); cas.quaternion.identity(); cas.scale.setScalar(1);
    audio.sfx('slide');
    await wait(0.14);
    await closeDoor();
    S.loaded = { r, c, cassette: cas };
    audio.load(r);
    UI.setTape(r); UI.setPlaying(false);
    setMood(r.accent);
    vfdSay(r.status === 'coming' ? `${r.id} ${r.title.toUpperCase()} · SNART I SÄNDNING` : `${r.id} ${r.title.toUpperCase()} · REDO`, 3);
    UI.announce(`${r.title} sitter i däcket.`);
    if (S.view === 'desk') focus(0, 1.8);
  } finally { S.busy = false; }
}

async function eject() {
  if (!S.loaded) { UI.toast('Facket är tomt.'); return; }
  if (S.busy) return;
  S.busy = true;
  try { deck.keys.eject.pulse = 1; await ejectInternal(); } finally { S.busy = false; }
}
async function ejectInternal() {
  const { c, cassette: cas } = S.loaded;
  stop();
  await openDoor();
  const p0 = cas.position.clone();
  await tween(0.16, (e) => cas.position.set(p0.x, p0.y + 1.0 * e, p0.z + 0.6 * e), ease.outCubic);
  scene.attach(cas);
  S.loaded = null; audio.unload(); UI.setTape(null); UI.setPlaying(false); setMood(null);
  await present(c); await openLid(c);
  const target = pose(c.anchor);
  closeDoor();
  audio.sfx('whoosh');
  await fly(cas, target, REDUCED ? 0.45 : 1.05, { arc: 12, toward: 5 });
  c.anchor.attach(cas); cas.position.set(0, 0, 0); cas.quaternion.identity(); cas.scale.setScalar(1);
  await closeLid(c);
  await returnHome(c);
}

function pickRelease(id) {
  const list = cases.filter((c) => c.release.id === id);
  const c = list.find((x) => x.kind === 'featured' && x.group.visible) || list.find((x) => x.group.visible) || list[0];
  if (!c) return;
  if (c.release.status === 'locked') return deny(c);
  insert(c);
}

function openInlay() {
  if (!S.loaded) { UI.toast('Sätt i ett band för att läsa omslaget.'); return; }
  const r = S.loaded.r, j = jcard(r);
  if (!j.url) { try { j.url = j.canvas.toDataURL('image/jpeg', 0.9); } catch (e) { j.url = r.cover || ''; } }
  UI.openJCard(r, j.url);
}

/* ================================================= STILLBILDEN (verktyg) == */
/* ?still=1: rummet som laddaren visar, exakt i FRAME, utan gränssnitt. Verktyget
   (scratch/still.js) fotograferar sidan i 2.4:1 och läser displayens hörn ur
   window.__still för att lägga laddningstexten på rätt plats i bilden.        */
function stillMode() {
  document.body.classList.add('still');
  S.power = false;
  room.setNeon(true); room.state.flicker = 1; room.state.neonT = 99;
  updateCamera(0, true);
  tick(0.016, 0.5, performance.now());
  room.state.flicker = 1; room.update(0, 0.5); updateCamera(0, true);
  composer.render(0.016);
  const v = DECK.vfd, cy = DECK.FOOT + DECK.H / 2 + v.y, z = 0.21;
  const corners = [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => {
    const p = new THREE.Vector3(v.x + sx * v.w / 2, cy + sy * v.h / 2, z).project(camera);
    return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight];
  });
  window.__still = { w: innerWidth, h: innerHeight, vfd: corners };
}

/* ================================================================ LO-FI ==== */
function lofi(why) {
  document.body.classList.add('lofi');
  UI.lofi(why);
  UI.h.enter = (withSound) => { audio.init(); audio.setMuted(!withSound); S.muted = !withSound; UI.setSound(!S.muted); UI.entered(); UI.open('index'); };
  UI.h.pick = (id) => {
    const r = RELEASES.find((x) => x.id === id);
    if (!r || r.status === 'locked') return UI.toast('Signalen är låst.');
    S.loaded = { r }; audio.load(r); UI.setTape(r); UI.setPlaying(false);
  };
  UI.h.playPause = () => { if (!S.loaded) return; if (audio.playing) { audio.pause(); UI.setPlaying(false); } else if (audio.play()) UI.setPlaying(true); else UI.toast('Inte släppt än.'); };
  UI.h.inlay = () => S.loaded && UI.openJCard(S.loaded.r, (() => { try { return T.drawJCard(S.loaded.r, null).toDataURL('image/jpeg', 0.9); } catch (e) { return ''; } })());
  UI.h.eject = () => { audio.unload(); S.loaded = null; UI.setTape(null); };
  UI.h.setView = () => {};
  setInterval(() => { audio.tick(0.25); if (S.loaded) UI.setProgress(audio.time, audio.duration); }, 250);
}
