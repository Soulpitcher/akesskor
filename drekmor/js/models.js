/* =============================================================================
   3D-modeller: kassettdäck, kassett och kassettfodral. Mått i centimeter.
   ============================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

const shadow = (m, cast = true, receive = true) => { m.castShadow = cast; m.receiveShadow = receive; return m; };

function roundedRect(target, x, y, w, h, r) {
  target.moveTo(x + r, y); target.lineTo(x + w - r, y); target.quadraticCurveTo(x + w, y, x + w, y + r);
  target.lineTo(x + w, y + h - r); target.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  target.lineTo(x + r, y + h); target.quadraticCurveTo(x, y + h, x, y + h - r);
  target.lineTo(x, y + r); target.quadraticCurveTo(x, y, x + r, y);
  return target;
}

/* ================================================================== DÄCK == */
export const DECK = {
  W: 44, H: 15, D: 24, FOOT: 0.6, PLATE: 2.2,
  hole: { x: -10.5, y: 1.8, w: 11.2, h: 7.4 },
  vfd: { x: 10.5, y: 3.3, w: 17.2, h: 5.0 },
  knob: { x: 17.5, y: -3.5, r: 2.0 },
  power: { x: -19.3, y: -4.5 },
  DOOR_OPEN: 0.5,
};
const KEYS = [
  { id: 'rew', label: 'REW' }, { id: 'play', label: 'PLAY' }, { id: 'ff', label: 'F.FWD' },
  { id: 'stop', label: 'STOP' }, { id: 'pause', label: 'PAUSE' }, { id: 'eject', label: 'EJECT' },
];

export function makeDeck() {
  const { W, H, D, FOOT, PLATE, hole, vfd, knob, power } = DECK;
  const cy = FOOT + H / 2;
  const g = new THREE.Group(); g.name = 'deck';
  const interactive = [];

  const keyLayout = KEYS.map((k, i) => ({ ...k, x: hole.x - 2.5 * 1.85 + i * 1.85, y: -4.5, w: 1.65, h: 1.25 }));

  const matte = new THREE.MeshStandardMaterial({ color: 0x131417, metalness: 0.55, roughness: 0.48 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.35, roughness: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd6dade, metalness: 1, roughness: 0.18 });

  // Kropp
  const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(W - 0.2, H - 0.2, D, 4, 0.6), matte));
  body.position.set(0, cy, -1.9 - D / 2);
  g.add(body);
  const topTex = T.toTexture(T.drawTopPlate(W - 2, D - 2));
  const top = shadow(new THREE.Mesh(new THREE.PlaneGeometry(W - 2, D - 2), new THREE.MeshStandardMaterial({ map: topTex, metalness: 0.6, roughness: 0.42 })), false, true);
  top.rotation.x = -Math.PI / 2; top.position.set(0, FOOT + H - 0.08, body.position.z);
  g.add(top);

  // Frontplatta med riktigt hål för kassettfacket
  const shape = roundedRect(new THREE.Shape(), -W / 2 + 0.15, -H / 2 + 0.15, W - 0.3, H - 0.3, 0.45);
  shape.holes.push(roundedRect(new THREE.Path(), hole.x - hole.w / 2, hole.y - hole.h / 2, hole.w, hole.h, 0.35));
  const plateGeo = new THREE.ExtrudeGeometry(shape, { depth: PLATE - 0.3, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 3, curveSegments: 16 });
  const panel = T.drawPanel({ W, H, vfd, knob, power, keys: keyLayout });
  const panelMap = T.toTexture(panel.map), panelRough = T.toTexture(panel.rough, { color: false });
  for (const t of [panelMap, panelRough]) { t.repeat.set(1 / W, 1 / H); t.offset.set(0.5, 0.5); }
  const panelMat = new THREE.MeshStandardMaterial({ map: panelMap, roughnessMap: panelRough, metalness: 0.92, roughness: 1, envMapIntensity: 1.1 });
  const plate = shadow(new THREE.Mesh(plateGeo, [panelMat, dark]));
  plate.position.set(0, cy, 0.2 - (PLATE - 0.15));
  g.add(plate);

  // Mekanik längst in i facket (syns när det är tomt)
  const holeWorld = new THREE.Vector3(hole.x, cy + hole.y, 0);
  for (const sx of [-2.15, 2.15]) {
    const sp = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.0, 12), chrome));
    sp.rotation.x = Math.PI / 2; sp.position.set(holeWorld.x + sx, holeWorld.y + 0.15, -1.6);
    g.add(sp);
  }
  const head = shadow(new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.9, 1.0, 2, 0.15), chrome));
  head.position.set(holeWorld.x, holeWorld.y - 2.7, -1.5); g.add(head);

  // Lucka (ledad nedtill) – kassetten sitter i luckan precis som på riktiga däck
  const doorPivot = new THREE.Group(); doorPivot.name = 'door';
  doorPivot.position.set(hole.x, cy + hole.y - hole.h / 2 + 0.05, 0.28);
  g.add(doorPivot);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0b0c10, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.42, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.8, depthWrite: false });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(hole.w - 0.15, hole.h - 0.1, 0.14, 2, 0.06), glassMat);
  glass.position.set(0, hole.h / 2, 0); glass.renderOrder = 2;
  glass.userData.hit = { type: 'door' };
  doorPivot.add(glass); interactive.push(glass);
  const lip = shadow(new THREE.Mesh(new RoundedBoxGeometry(hole.w - 0.15, 0.55, 0.42, 2, 0.12), chrome));
  lip.position.set(0, 0.28, 0.12); doorPivot.add(lip);
  const tapeAnchor = new THREE.Object3D(); tapeAnchor.name = 'tapeAnchor';
  tapeAnchor.position.set(0, hole.h / 2 + 0.02, -0.72);
  doorPivot.add(tapeAnchor);

  // Transportknappar
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1f2226, metalness: 0.75, roughness: 0.32 });
  const keys = {};
  for (const k of keyLayout) {
    const grp = new THREE.Group(); grp.position.set(k.x, cy + k.y, 0.2); g.add(grp);
    const m = shadow(new THREE.Mesh(new RoundedBoxGeometry(k.w, k.h, 0.95, 2, 0.12), keyMat));
    m.position.z = 0.28; grp.add(m);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(k.w * 0.9, k.h * 0.9), new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawKeyFace(k.id)), transparent: true, roughness: 0.5, depthWrite: false }));
    face.position.z = 0.28 + 0.476; grp.add(face);
    m.userData.hit = { type: 'key', key: k.id };
    interactive.push(m);
    keys[k.id] = { grp, rest: 0.2, down: false, pulse: 0 };
  }

  // Strömknapp + lysdiod
  const pwr = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.7, 1.05, 0.8, 2, 0.12), keyMat));
  pwr.position.set(power.x, cy + power.y, 0.45); pwr.userData.hit = { type: 'power' };
  g.add(pwr); interactive.push(pwr);
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x2a0503, emissive: 0xff2a14, emissiveIntensity: 0, roughness: 0.3 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), ledMat);
  led.position.set(power.x, cy + power.y + 1.45, 0.28); g.add(led);

  // Volymratt
  const kn = T.drawKnob();
  const knobSide = T.toTexture(kn.side); knobSide.wrapS = THREE.RepeatWrapping; knobSide.repeat.set(3, 1);
  const knobMats = [
    new THREE.MeshStandardMaterial({ map: knobSide, metalness: 1, roughness: 0.3 }),
    new THREE.MeshStandardMaterial({ map: T.toTexture(kn.top), metalness: 1, roughness: 0.26 }),
    dark,
  ];
  const skirt = shadow(new THREE.Mesh(new THREE.CylinderGeometry(knob.r + 0.3, knob.r + 0.35, 0.25, 64), dark));
  skirt.rotation.x = Math.PI / 2; skirt.position.set(knob.x, cy + knob.y, 0.33); g.add(skirt);
  const knobPivot = new THREE.Group(); knobPivot.position.set(knob.x, cy + knob.y, 1.2); g.add(knobPivot);
  const knobMesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(knob.r - 0.05, knob.r, 1.6, 64), knobMats));
  knobMesh.rotation.x = Math.PI / 2; knobMesh.userData.hit = { type: 'knob' };
  knobPivot.add(knobMesh); interactive.push(knobMesh);

  // VFD-display
  const vfdCanvas = T.makeCanvas(1024, Math.round(1024 * vfd.h / vfd.w));
  const vfdTex = T.toTexture(vfdCanvas);
  const vfdMesh = new THREE.Mesh(new THREE.PlaneGeometry(vfd.w, vfd.h), new THREE.MeshBasicMaterial({ map: vfdTex, color: new THREE.Color(2.4, 2.4, 2.4) }));
  vfdMesh.position.set(vfd.x, cy + vfd.y, 0.207); g.add(vfdMesh);
  const vfdGlass = new THREE.Mesh(new THREE.PlaneGeometry(vfd.w + 0.5, vfd.h + 0.5), new THREE.MeshPhysicalMaterial({ color: 0x050607, transparent: true, opacity: 0.16, roughness: 0.03, clearcoat: 1, envMapIntensity: 2, depthWrite: false }));
  vfdGlass.position.set(vfd.x, cy + vfd.y, 0.24); g.add(vfdGlass);
  const vfdLight = new THREE.PointLight(0x5fe8ff, 0, 30, 2);
  vfdLight.position.set(vfd.x, cy + vfd.y, 4); g.add(vfdLight);

  // Fötter
  for (const [fx, fz] of [[-19, -3], [19, -3], [-19, -22], [19, -22]]) {
    const f = shadow(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, FOOT, 20), dark));
    f.position.set(fx, FOOT / 2, fz); g.add(f);
  }

  return {
    group: g, interactive, keys, doorPivot, tapeAnchor, knobPivot, led, vfdLight,
    vfd: { canvas: vfdCanvas, ctx: vfdCanvas.getContext('2d'), tex: vfdTex },
    center: new THREE.Vector3(0, cy, 0),
    slotWorld: holeWorld,
  };
}

/* ============================================================== VFD-RITNING */
const VFD_ON = '#7ef4ff', VFD_GHOST = 'rgba(126,244,255,0.075)', VFD_HOT = '#ff5646', VFD_AMB = '#ffc86b';
const MODES = [['notape', 'NO TAPE'], ['stop', 'STOP'], ['play', '▶ PLAY'], ['pause', 'PAUSE'], ['rew', '◀◀'], ['ff', '▶▶']];

export function drawVFD(v, s) {
  const { ctx, canvas } = v, W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#010304'; ctx.fillRect(0, 0, W, H);
  const lit = (on) => (on ? VFD_ON : VFD_GHOST);
  const bootAll = s.power && s.boot < 0.45;

  ctx.textBaseline = 'alphabetic';
  ctx.font = T.F.mono(700, 24);
  let x = 26;
  for (const [id, label] of MODES) {
    ctx.fillStyle = lit(s.power && (bootAll || s.mode === id || (id === 'stop' && s.mode === 'coming')));
    ctx.fillText(label, x, 46); x += ctx.measureText(label).width + 30;
  }
  ctx.fillStyle = lit(s.power && (bootAll || s.dolby)); ctx.fillText('NR', 690, 46);

  // Räkneverk
  ctx.textAlign = 'right';
  ctx.font = T.F.mono(700, 15); ctx.fillStyle = lit(s.power); ctx.fillText('TIME', W - 26, 30);
  ctx.font = T.F.mono(700, 64);
  const t = s.time == null ? '--:--' : `${String(Math.floor(s.time / 60)).padStart(2, '0')}:${String(Math.floor(s.time % 60)).padStart(2, '0')}`;
  ctx.fillStyle = VFD_GHOST; ctx.fillText('88:88', W - 26, 98);
  if (s.power) { ctx.fillStyle = VFD_ON; ctx.fillText(bootAll ? '88:88' : t, W - 26, 98); }
  ctx.textAlign = 'left';

  // Rullande text
  ctx.save(); ctx.beginPath(); ctx.rect(24, 64, 700, 52); ctx.clip();
  ctx.font = T.F.mono(400, 32);
  if (s.power) {
    const msg = s.boot < 1 ? (s.boot < 0.45 ? '█'.repeat(40) : 'DRKMR DECK-01 · HEJ') : s.marquee;
    ctx.fillStyle = VFD_ON;
    if (s.boot < 1) ctx.fillText(msg, 26, 104);
    else {
      const w = ctx.measureText(msg).width, off = (s.t * 70) % w;
      ctx.fillText(msg, 26 - off, 104); ctx.fillText(msg, 26 - off + w, 104);
    }
  } else { ctx.fillStyle = VFD_GHOST; ctx.fillText('█'.repeat(40), 26, 104); }
  ctx.restore();

  // Nivåmätare L/R
  const N = 32, x0 = 70, x1 = W - 30, sw = (x1 - x0) / N;
  ctx.font = T.F.mono(700, 22);
  [['L', s.levels.l, s.peaks.l, 142], ['R', s.levels.r, s.peaks.r, 190]].forEach(([ch, lv, pk, y]) => {
    ctx.fillStyle = lit(s.power); ctx.fillText(ch, 30, y + 22);
    const n = bootAll ? N : Math.round(lv * N), p = Math.round(pk * N);
    for (let i = 0; i < N; i++) {
      const hot = i >= N - 5, amb = i >= N - 9 && !hot;
      const on = s.power && (i < n || (i === p - 1 && p > 1));
      ctx.fillStyle = on ? (hot ? VFD_HOT : amb ? VFD_AMB : VFD_ON) : VFD_GHOST;
      ctx.fillRect(x0 + i * sw + 2, y, sw - 6, 26);
    }
  });
  ctx.font = T.F.mono(400, 15); ctx.fillStyle = lit(s.power);
  const labels = [['-30', 0], ['-20', 0.2], ['-10', 0.45], ['-5', 0.62], ['0', 0.78], ['+3', 0.92]];
  for (const [l, p] of labels) ctx.fillText(l, x0 + p * (x1 - x0), H - 22);
  v.tex.needsUpdate = true;
}

/* ============================================================ KASSETT ===== */
const SHELL_MAT = () => new THREE.MeshPhysicalMaterial({ color: 0x1c1916, metalness: 0.05, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3 });
let sharedSpool, sharedHub;

export function makeCassette(r) {
  sharedSpool ||= new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawSpool()), roughness: 0.5, metalness: 0.15 });
  sharedHub ||= new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawHub()), alphaTest: 0.5, roughness: 0.55 });

  const g = new THREE.Group(); g.name = 'cassette:' + r.id;
  g.add(shadow(new THREE.Mesh(new RoundedBoxGeometry(10, 6.4, 1.2, 3, 0.24), SHELL_MAT())));
  const hy = T.LABEL.hubY, Z = 0.6;

  const backing = new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.9 });
  for (const s of [1, -1]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.7), backing);
    b.position.set(0, hy, s * (Z + 0.003)); if (s < 0) b.rotation.y = Math.PI; g.add(b);
  }
  const spools = [], hubs = [];
  for (const hx of [-T.LABEL.hubX, T.LABEL.hubX]) {
    const sp = new THREE.Mesh(new THREE.CircleGeometry(1, 64), sharedSpool); sp.position.set(hx, hy, Z + 0.006); g.add(sp); spools.push(sp);
    const hb = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), sharedHub); hb.position.set(hx, hy, Z + 0.009); g.add(hb); hubs.push(hb);
  }
  const faceMat = (side) => new THREE.MeshPhysicalMaterial({ map: T.toTexture(T.drawCassetteFace(r, side)), alphaTest: 0.5, roughness: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.28 });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(T.LABEL.w, T.LABEL.h), faceMat('A'));
  front.position.z = Z + 0.014; g.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(T.LABEL.w, T.LABEL.h), faceMat('B'));
  back.position.z = -Z - 0.014; back.rotation.y = Math.PI; g.add(back);

  const R_HUB = 0.62, R_FULL = 2.3;
  const state = { progress: 0, angleL: 0, angleR: 0 };
  const radii = (p) => [
    Math.sqrt(R_HUB ** 2 + (1 - p) * (R_FULL ** 2 - R_HUB ** 2)),
    Math.sqrt(R_HUB ** 2 + p * (R_FULL ** 2 - R_HUB ** 2)),
  ];
  g.userData.setProgress = (p) => {
    state.progress = Math.min(1, Math.max(0, p));
    const [rl, rr] = radii(state.progress);
    spools[0].scale.setScalar(rl); spools[1].scale.setScalar(rr);
  };
  /** Band framåt med `cmPerSec` (4.76 = normal hastighet, negativt = bakåt). */
  g.userData.advance = (dt, cmPerSec) => {
    const [rl, rr] = radii(state.progress);
    state.angleL -= (cmPerSec / rl) * dt; state.angleR -= (cmPerSec / rr) * dt;
    hubs[0].rotation.z = state.angleL; hubs[1].rotation.z = state.angleR;
    spools[0].rotation.z = state.angleL; spools[1].rotation.z = state.angleR;
  };
  g.userData.setProgress(0);
  return g;
}

/* ============================================================ FODRAL ====== */
/* Lokalt: stående porträtt – bredd X 7.0, höjd Y 11.0, tjocklek Z 1.7,
   J-kortet åt +Z, ryggen på -X-kanten (gångjärnet).                         */
export const CASE = { w: 7.0, h: 11.0, d: 1.7, LID_OPEN: -1.95 };
let clearMat;

export function makeCase(r, jcardTex, spineTex) {
  // Klar plast: ingen diffus färg, bara speglingar som adderas ovanpå (inget dis).
  clearMat ||= new THREE.MeshPhysicalMaterial({ color: 0x000000, metalness: 0, roughness: 0.07, specularIntensity: 1, envMapIntensity: 1.35, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
  const { w, h, d } = CASE;
  const g = new THREE.Group(); g.name = 'case:' + r.id;

  const tray = new THREE.Mesh(new RoundedBoxGeometry(w, h, d / 2, 2, 0.14), clearMat);
  tray.position.z = -d / 4; tray.renderOrder = 3; g.add(tray);

  const lidPivot = new THREE.Group(); lidPivot.position.set(-w / 2, 0, 0); g.add(lidPivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(w, h, d / 2, 2, 0.14), clearMat);
  lid.position.set(w / 2, 0, d / 4); lid.renderOrder = 3; lidPivot.add(lid);

  const card = shadow(new THREE.Mesh(new THREE.PlaneGeometry(w - 0.35, h - 0.5), new THREE.MeshStandardMaterial({ map: jcardTex, roughness: 0.82 })));
  card.position.set(w / 2, 0, d / 2 - 0.09); lidPivot.add(card);
  const spine = shadow(new THREE.Mesh(new THREE.PlaneGeometry(h - 0.5, d - 0.2), new THREE.MeshStandardMaterial({ map: spineTex, roughness: 0.55 })), false, true);
  spine.rotation.set(0, -Math.PI / 2, -Math.PI / 2, 'XYZ');
  spine.position.set(0.075, 0, 0); lidPivot.add(spine);
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.35, h - 0.5), new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.8 }));
  inside.position.set(w / 2, 0, d / 2 - 0.1); inside.rotation.y = Math.PI; lidPivot.add(inside);

  // Kassetten ligger i tråget, långsidan längs Y
  const anchor = new THREE.Object3D(); anchor.position.set(0.1, 0, -0.18); anchor.rotation.z = Math.PI / 2; g.add(anchor);
  const placeholder = shadow(new THREE.Mesh(new RoundedBoxGeometry(10, 6.4, 1.1, 2, 0.2), new THREE.MeshStandardMaterial({ color: 0x17140f, roughness: 0.5 })), true, false);
  anchor.add(placeholder);

  const proxy = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, d + 0.3), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.userData.hit = { type: 'case', release: r };
  g.add(proxy);

  return { group: g, lidPivot, anchor, placeholder, proxy, card, release: r };
}
