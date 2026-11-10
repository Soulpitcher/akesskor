/* =============================================================================
   Rummet runt däcket: vägg, fönster mot neonstaden (regn utanför, droppar på
   glaset), neonskylt, affisch och hörlurar. Mått i centimeter, origo i däcket.
   ============================================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as T from './textures.js';

export const ROOM = {
  WALL_Z: -58, WALL_H: 130,
  WIN: { x: 0, y: 31, w: 74, h: 42, sill: 10 },
  NEON: { x: -58, y: 24, w: 36 },
  POSTER: { x: 53, y: 22, w: 19, h: 26.9 },
  PHONES: { x: 30, z: 25, s: 14 },
};

const shadow = (m, c = true, r = true) => { m.castShadow = c; m.receiveShadow = r; return m; };

export function makeRoom({ posterRelease, posterImage, touch }) {
  const g = new THREE.Group(); g.name = 'room';
  const interactive = [];
  const { WALL_Z, WALL_H, WIN, NEON, POSTER, PHONES } = ROOM;

  /* ---- väggen, med hål för fönstret ------------------------------------- */
  const wallTex = T.drawWall();
  const wm = T.toTexture(wallTex.map, { wrap: true }), wr = T.toTexture(wallTex.rough, { color: false, wrap: true });
  wm.repeat.set(4, 1.4); wr.repeat.set(4, 1.4);
  const wallMat = new THREE.MeshStandardMaterial({ map: wm, roughnessMap: wr, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 });
  const shape = new THREE.Shape(); shape.moveTo(-220, 0); shape.lineTo(220, 0); shape.lineTo(220, WALL_H); shape.lineTo(-220, WALL_H); shape.closePath();
  const hole = new THREE.Path(); const hx = WIN.x - WIN.w / 2, hy = WIN.y - WIN.h / 2;
  hole.moveTo(hx, hy); hole.lineTo(hx + WIN.w, hy); hole.lineTo(hx + WIN.w, hy + WIN.h); hole.lineTo(hx, hy + WIN.h); hole.closePath();
  shape.holes.push(hole);
  const wallGeo = new THREE.ShapeGeometry(shape, 1);
  // uv i meter-ish så väggtexturen får rätt skala
  const uv = wallGeo.attributes.uv; const pos = wallGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + 220) / 440, pos.getY(i) / WALL_H);
  const wall = shadow(new THREE.Mesh(wallGeo, wallMat), false, true);
  wall.position.z = WALL_Z; g.add(wall);
  // mörk list där väggen möter bordet
  const skirting = shadow(new THREE.Mesh(new THREE.BoxGeometry(440, 1.4, 1.2), new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.7 })), false, true);
  skirting.position.set(0, 0.7, WALL_Z + 0.6); g.add(skirting);

  /* ---- fönstret: karm, glas, droppar, stad, regn ------------------------ */
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x15171c, metalness: 0.6, roughness: 0.45 });
  const frame = new THREE.Group(); frame.position.set(WIN.x, WIN.y, WALL_Z); g.add(frame);
  const F = 2.2, D = 3.2;
  for (const [w, h, x, y] of [[WIN.w + F * 2, F, 0, WIN.h / 2 + F / 2], [WIN.w + F * 2, F, 0, -WIN.h / 2 - F / 2], [F, WIN.h, -WIN.w / 2 - F / 2, 0], [F, WIN.h, WIN.w / 2 + F / 2, 0]]) {
    const m = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, D), frameMat)); m.position.set(x, y, 0); frame.add(m);
  }
  const mullion = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.2, WIN.h, 1.6), frameMat)); mullion.position.set(0, 0, -0.4); frame.add(mullion);
  const transom = shadow(new THREE.Mesh(new THREE.BoxGeometry(WIN.w, 1.2, 1.6), frameMat)); transom.position.set(0, WIN.h * 0.18, -0.4); frame.add(transom);
  const sill = shadow(new THREE.Mesh(new RoundedBoxGeometry(WIN.w + 10, 1.6, 7, 2, 0.4), new THREE.MeshStandardMaterial({ color: 0x1d1f26, roughness: 0.6, metalness: 0.2 })));
  sill.position.set(0, -WIN.h / 2 - F - 0.2, 2.6); frame.add(sill);

  // staden långt bak (parallax mot karmen)
  const cityTex = T.toTexture(T.drawCity());
  const city = new THREE.Mesh(new THREE.PlaneGeometry(360, 120), new THREE.MeshBasicMaterial({ map: cityTex, fog: false, toneMapped: true, color: new THREE.Color(1.0, 1.0, 1.05) }));
  city.position.set(WIN.x + 6, 44, WALL_Z - 120); g.add(city);

  // glaset
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), new THREE.MeshPhysicalMaterial({
    color: 0x9fb8c8, metalness: 0, roughness: 0.04, transmission: 0, transparent: true, opacity: 0.09,
    envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide,
  }));
  glass.position.set(0, 0, -0.9); glass.renderOrder = 2; frame.add(glass);
  glass.userData.hit = { type: 'window' }; interactive.push(glass);

  // droppar: ett stilla lager pärlor och ett som sakta rinner
  const dropTex = T.toTexture(T.drawDrops(), { wrap: true });
  const dropMat = (rep, op) => new THREE.MeshBasicMaterial({ map: dropTex, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(0.9, 1.0, 1.1) });
  const drops1 = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), dropMat(1, 0.32));
  drops1.material.map = dropTex.clone(); drops1.material.map.repeat.set(3.2, 2.0); drops1.material.map.needsUpdate = true;
  drops1.position.set(0, 0, -0.7); drops1.renderOrder = 3; frame.add(drops1);
  const drops2 = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), dropMat(1, 0.24));
  drops2.material.map = dropTex.clone(); drops2.material.map.repeat.set(2.4, 1.5); drops2.material.map.needsUpdate = true;
  drops2.position.set(0, 0, -0.6); drops2.renderOrder = 3; frame.add(drops2);

  // regn utanför
  const N = touch ? 260 : 700, rp = new Float32Array(N * 3), rs = new Float32Array(N), rand = T.seeded('rain');
  const RX = WIN.w / 2 + 30, RY0 = -10, RY1 = WIN.h / 2 + 60, RZ0 = -4, RZ1 = -70;
  for (let i = 0; i < N; i++) { rp[i * 3] = (rand() - 0.5) * RX * 2; rp[i * 3 + 1] = RY0 + rand() * (RY1 - RY0); rp[i * 3 + 2] = RZ0 + rand() * (RZ1 - RZ0); rs[i] = 0.7 + rand() * 0.6; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.Points(rg, new THREE.PointsMaterial({ map: T.toTexture(T.drawStreak()), size: 2.2, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xbfe6ff, sizeAttenuation: true }));
  rain.position.set(WIN.x, WIN.y, WALL_Z); rain.userData = { speeds: rs, RY0, RY1 }; g.add(rain);

  // kallt ljus in genom fönstret
  const winLight = new THREE.SpotLight(0x5fd0ff, 1.5, 0, 0.7, 0.9, 0);
  winLight.position.set(WIN.x, WIN.y + 50, WALL_Z - 40); winLight.target.position.set(0, 4, 10); g.add(winLight, winLight.target);

  /* ---- neonskylten ----------------------------------------------------- */
  const neonColor = '#39e2ff';
  const neonTex = T.toTexture(T.drawNeon('DREKMOR', neonColor));
  const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(2.2, 2.2, 2.2) });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(NEON.w, NEON.w / 4), neonMat);
  neon.position.set(NEON.x, NEON.y, WALL_Z + 1.2); neon.rotation.z = 0.01; g.add(neon);
  const neonBack = new THREE.Mesh(new THREE.PlaneGeometry(NEON.w + 4, NEON.w / 4 + 4), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 }));
  neonBack.position.set(NEON.x, NEON.y, WALL_Z + 0.9); neonBack.userData.hit = { type: 'neon' }; g.add(neonBack); interactive.push(neonBack);
  const neonLight = new THREE.PointLight(neonColor, 6, 110, 1.6); neonLight.position.set(NEON.x, NEON.y - 2, WALL_Z + 6); g.add(neonLight);
  // sladd och fästen
  const bracket = new THREE.MeshStandardMaterial({ color: 0x0a0b0e, roughness: 0.8 });
  for (const dx of [-NEON.w * 0.38, NEON.w * 0.38]) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), bracket); b.position.set(NEON.x + dx, NEON.y - 4.5, WALL_Z + 0.6); g.add(b); }

  /* ---- affischen -------------------------------------------------------- */
  const posterTex = T.toTexture(T.drawPoster(posterRelease, posterImage));
  const poster = shadow(new THREE.Mesh(new THREE.PlaneGeometry(POSTER.w, POSTER.h), new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.85, metalness: 0 })), false, true);
  poster.position.set(POSTER.x, POSTER.y, WALL_Z + 0.25); poster.rotation.z = -0.025;
  poster.userData.hit = { type: 'poster', release: posterRelease }; g.add(poster); interactive.push(poster);
  const posterLight = new THREE.SpotLight(0xff3d9a, 3.2, 90, 0.42, 0.8, 0);
  posterLight.position.set(POSTER.x + 10, 80, WALL_Z + 30); posterLight.target.position.set(POSTER.x, POSTER.y, WALL_Z); g.add(posterLight, posterLight.target);

  /* ---- hörlurarna på bordet -------------------------------------------- */
  const phonesTex = T.toTexture(T.drawHeadphones());
  const phones = new THREE.Mesh(new THREE.PlaneGeometry(PHONES.s, PHONES.s), new THREE.MeshStandardMaterial({ map: phonesTex, transparent: true, alphaTest: 0.4, roughness: 0.5, metalness: 0.2, depthWrite: true }));
  phones.rotation.set(-Math.PI / 2, 0, 0.35); phones.position.set(PHONES.x, 0.12, PHONES.z);
  phones.castShadow = true; phones.userData.hit = { type: 'phones' }; g.add(phones); interactive.push(phones);
  const phonesGlow = new THREE.PointLight(0x39e2ff, 0, 18, 2); phonesGlow.position.set(PHONES.x, 3, PHONES.z); g.add(phonesGlow);

  const state = { neonOn: true, neonT: 0, flicker: 1, phonesOn: false, dropOff: 0 };

  function update(dt, t) {
    // regn
    const p = rain.geometry.attributes.position, sp = rain.userData.speeds;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 95 * sp[i];
      if (y < RY0) { y = RY1; p.setX(i, (Math.random() - 0.5) * RX * 2); }
      p.setY(i, y);
    }
    p.needsUpdate = true;
    // droppar som rinner
    state.dropOff = (state.dropOff + dt * 0.012) % 1;
    drops2.material.map.offset.y = -state.dropOff;
    // neon: flimmer, och en sällsynt sprakning
    if (state.neonOn) {
      state.neonT -= dt;
      if (state.neonT <= 0) { state.flicker = Math.random() < 0.06 ? 0.15 + Math.random() * 0.5 : 0.88 + Math.random() * 0.14; state.neonT = state.flicker < 0.7 ? 0.04 + Math.random() * 0.08 : 0.4 + Math.random() * 1.6; }
    } else state.flicker = 0;
    const k = state.flicker;
    neonMat.color.setScalar(0.25 + 1.05 * k); neonMat.opacity = 0.35 + 0.65 * k;
    neonLight.intensity = 6 * k;
    phonesGlow.intensity = state.phonesOn ? 1.2 + Math.sin(t * 3) * 0.2 : 0;
  }

  /** Kameraläge vid fönstret: tittar ut över staden. */
  const windowView = { target: new THREE.Vector3(WIN.x, WIN.y + 1, WALL_Z - 6), dist: 60, elev: 0.03, azim: 0.08 };
  const posterView = { target: new THREE.Vector3(POSTER.x, POSTER.y - 1, WALL_Z), dist: 48, elev: 0.08, azim: -0.18 };

  return {
    group: g, interactive, update, state, windowView, posterView,
    setNeon(on) { state.neonOn = on; state.neonT = 0; },
    setPhones(on) { state.phonesOn = on; },
    lights: { winLight, neonLight, posterLight },
    phones,
  };
}
