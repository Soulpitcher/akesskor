/* =============================================================================
   Hallen runt däcket: vått betonggolv som speglar neonljuset, en rostig plåtvägg
   med rör och DREKMOR-skylten bakom däcket, och en djup industrihall till
   vänster med gångbro, lampor, fat, lådor och rök. Mått i cm-enheter, origo i
   däcket (däckets front vetter mot +Z).
   ============================================================================= */
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as T from './textures.js';

export const HALL = {
  WALL_Z: -30, WALL_X0: -15,            // väggen bakom däcket börjar här och löper åt höger
  SIDE_X: -120, FAR_Z: -240,            // hallens vänstra vägg och bortre gavel
  SIGN: { x: 17, y: 23.4, w: 37, h: 9.25 },
};

const NEON = { magenta: '#d23cff', cyan: '#2fd6ff', red: '#ff2a3a' };
const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);
const glowMat = (hex, k) => new THREE.MeshBasicMaterial({ color: hdr(hex, k), toneMapped: false });
const sh = (m, c = true, r = true) => { m.castShadow = c; m.receiveShadow = r; return m; };

/* Golvets spegelbild läggs additivt ovanpå det vanliga (belysta, skuggade) golvet:
   skarp och stark i pölarna, svag och bruten på torr betong.                       */
const WetShader = {
  name: 'WetFloor',
  uniforms: {
    color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
    tWet: { value: null }, uStrength: { value: 1.35 }, uFog: { value: new THREE.Vector2(60, 320) },
  },
  vertexShader: /* glsl */`
    uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
    void main(){ vUv = textureMatrix * vec4(position, 1.0); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: /* glsl */`
    uniform vec3 color; uniform sampler2D tDiffuse; uniform sampler2D tWet; uniform float uStrength; uniform vec2 uFog;
    varying vec4 vUv; varying vec3 vWorld;
    void main(){
      vec2 wuv = vWorld.xz / 96.0;
      vec4 wet = texture2D(tWet, wuv), fine = texture2D(tWet, wuv * 4.3 + 0.37);
      float puddle = smoothstep(0.26, 0.62, wet.r);
      vec2 n = (wet.gb - 0.5) * 2.0 + (fine.gb - 0.5) * 1.2;
      vec2 uv = vUv.xy / vUv.w + n * mix(0.022, 0.004, puddle);
      float b = mix(0.011, 0.0015, puddle);
      vec3 r = texture2D(tDiffuse, uv).rgb * 0.36
             + texture2D(tDiffuse, uv + vec2(b, 0.0)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(b, 0.0)).rgb * 0.16
             + texture2D(tDiffuse, uv + vec2(0.0, b * 2.2)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(0.0, b * 2.2)).rgb * 0.16;
      vec3 V = normalize(cameraPosition - vWorld);
      float fres = 0.3 + 0.7 * pow(1.0 - clamp(V.y, 0.0, 1.0), 2.2);
      float k = mix(0.3, 1.0, puddle) * fres * uStrength;
      float fog = 1.0 - smoothstep(uFog.x, uFog.y, length(cameraPosition - vWorld));
      gl_FragColor = vec4(r * color * k * fog, 1.0);
    }`,
};

export function makeHall({ renderer, touch }) {
  const g = new THREE.Group(); g.name = 'hall';
  const { WALL_Z, WALL_X0, SIDE_X, FAR_Z, SIGN } = HALL;

  /* ---- golvet ----------------------------------------------------------- */
  const ft = T.drawFloorTiles();
  const fm = T.toTexture(ft.map, { wrap: true }), fr = T.toTexture(ft.rough, { color: false, wrap: true });
  const FW = 560, FD = 460, FX = -80, FZ = -60;
  fm.repeat.set(FW / 96, FD / 96); fr.repeat.set(FW / 96, FD / 96);
  // texturen ska ligga still i världen, oavsett var planet står
  fm.offset.set((FX - FW / 2) / 96, -(FZ + FD / 2) / 96); fr.offset.copy(fm.offset);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FW, FD), new THREE.MeshStandardMaterial({ map: fm, roughnessMap: fr, color: 0x9a9ca4, roughness: 0.85, metalness: 0, envMapIntensity: 0.15 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(FX, 0, FZ); floor.receiveShadow = true; g.add(floor);

  const wetTex = T.toTexture(T.drawWetMask(), { color: false, wrap: true });
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  const k = touch ? 0.4 : 0.5;
  const mirror = new Reflector(new THREE.PlaneGeometry(FW, FD), {
    textureWidth: Math.max(256, Math.round(size.x * k)), textureHeight: Math.max(256, Math.round(size.y * k)),
    shader: WetShader, color: 0xffffff, multisample: 0, clipBias: 0.003,
  });
  mirror.material.uniforms.tWet.value = wetTex;
  mirror.material.transparent = true; mirror.material.blending = THREE.AdditiveBlending; mirror.material.depthWrite = false;
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(FX, 0.04, FZ); mirror.renderOrder = 1; g.add(mirror);

  /* ---- väggen bakom däcket ---------------------------------------------- */
  const wt = T.drawRustWall();
  const wallMaps = (rx, ry) => { const m = T.toTexture(wt.map, { wrap: true }), r = T.toTexture(wt.rough, { color: false, wrap: true }); m.repeat.set(rx, ry); r.repeat.set(rx, ry); return { map: m, roughnessMap: r }; };
  const WW = 150, WH = 64;
  const wall = sh(new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), new THREE.MeshStandardMaterial({ ...wallMaps(WW / 40, WH / 40), metalness: 0.15, roughness: 0.9, envMapIntensity: 0.3 })), false, true);
  wall.position.set(WALL_X0 + WW / 2, WH / 2, WALL_Z); g.add(wall);

  const steel = new THREE.MeshStandardMaterial({ color: 0x24262d, metalness: 0.45, roughness: 0.55 });
  const pipeTex = T.toTexture(T.drawBarrel(), { wrap: true }); pipeTex.repeat.set(1, 3);
  const pipeMat = new THREE.MeshStandardMaterial({ map: pipeTex, color: 0xb0a6ac, metalness: 0.45, roughness: 0.45, envMapIntensity: 0.9 });
  const pipe = (r, len, x, y, z, horiz) => {
    const grp = new THREE.Group(); g.add(grp);
    const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 20), pipeMat));
    if (horiz) m.rotation.z = Math.PI / 2;
    m.position.set(x, y, z); grp.add(m);
    const n = Math.floor(len / 18);
    for (let i = 0; i <= n; i++) {                                    // flänsar
      const f = sh(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.28, r * 1.28, 0.9, 20), steel));
      const o = -len / 2 + 4 + i * (len - 8) / Math.max(1, n);
      if (horiz) { f.rotation.z = Math.PI / 2; f.position.set(x + o, y, z); } else f.position.set(x, y + o, z);
      grp.add(f);
    }
    return grp;
  };
  // hörnet där väggen börjar: pelare och stående rör
  const pillar = sh(new THREE.Mesh(new THREE.BoxGeometry(5, WH, 7), steel)); pillar.position.set(WALL_X0 - 0.5, WH / 2, WALL_Z + 1); g.add(pillar);
  const cornerPipes = [pipe(1.9, WH, WALL_X0 + 6, WH / 2, WALL_Z + 2.6), pipe(1.1, WH, WALL_X0 + 10.4, WH / 2, WALL_Z + 1.8)];
  pipe(3.0, WH, 60, WH / 2, WALL_Z + 3.6); pipe(1.5, WH, 66.5, WH / 2, WALL_Z + 2.2);
  // liggande rör överst
  pipe(1.5, WW - 6, WALL_X0 + WW / 2 + 2, 34.6, WALL_Z + 2.4, true); pipe(0.8, WW - 6, WALL_X0 + WW / 2 + 2, 37.4, WALL_Z + 1.6, true);

  // lysrör (cyan) under rören
  const housing = sh(new THREE.Mesh(new THREE.BoxGeometry(30, 1.5, 2.4), steel)); housing.position.set(30, 31.9, WALL_Z + 1.5); g.add(housing);
  const tubeMat = glowMat(NEON.cyan, 2.6);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 27.5, 12), tubeMat); tube.rotation.z = Math.PI / 2; tube.position.set(30, 30.8, WALL_Z + 2.1); g.add(tube);
  const tubeLight = new THREE.PointLight(NEON.cyan, 9, 90, 1.4); tubeLight.position.set(30, 30, WALL_Z + 9); g.add(tubeLight);

  // skylten
  const signMat = new THREE.MeshBasicMaterial({ map: T.toTexture(T.drawNeonLogo(NEON.magenta)), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.5, 1.5, 1.5) });
  const signGroup = new THREE.Group(); signGroup.position.x = SIGN.x; g.add(signGroup);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(SIGN.w, SIGN.h), signMat); sign.position.set(0, SIGN.y, WALL_Z + 1.3); signGroup.add(sign);
  const signLight = new THREE.PointLight(NEON.magenta, 4, 70, 1.5); signLight.position.set(0, SIGN.y - 1, WALL_Z + 10); signGroup.add(signLight);
  for (const dx of [-0.42, 0.42]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.3), steel); b.position.set(dx * SIGN.w, SIGN.y - SIGN.h * 0.52, WALL_Z + 0.65); signGroup.add(b); }
  const hazard = new THREE.Mesh(new THREE.PlaneGeometry(42, 1.64), new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawHazard()), roughness: 0.8, metalness: 0.2 }));
  hazard.position.set(0, 17.2, WALL_Z + 0.2); signGroup.add(hazard);
  const fanMat = new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawFan()), roughness: 0.7, metalness: 0.5 });
  for (const fx of [44, 52.4]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 7.6), fanMat); f.position.set(fx, 26.4, WALL_Z + 0.25); g.add(f); }

  // slangar på golvet till höger
  const hoseTex = T.toTexture(T.drawHose(), { wrap: true });
  const hose = (pts, r) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const t = hoseTex.clone(); t.needsUpdate = true; t.repeat.set(1, 1);
    const m = sh(new THREE.Mesh(new THREE.TubeGeometry(curve, 90, r, 12), new THREE.MeshStandardMaterial({ map: t, color: 0x9a9aa2, metalness: 0.5, roughness: 0.42 })));
    g.add(m);
    for (let i = 0; i < 46; i++) {                                    // korrugeringen: tunna ringar längs slangen
      const p = curve.getPointAt(i / 45), tan = curve.getTangentAt(i / 45);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, r * 0.09, 6, 14), steel);
      ring.position.copy(p); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan); g.add(ring);
    }
  };
  hose([[58, 1.7, WALL_Z + 6], [50, 1.7, -8], [38, 1.7, 6], [44, 1.7, 22], [60, 1.7, 34], [74, 1.7, 60]], 1.7);
  hose([[66, 1.2, WALL_Z + 5], [70, 1.2, -4], [56, 1.2, 14], [64, 1.2, 30], [84, 1.2, 44]], 1.2);
  const redSide = new THREE.PointLight(NEON.red, 15, 95, 1.3); redSide.position.set(46, 9, 14); g.add(redSide);

  /* ---- hallen till vänster --------------------------------------------- */
  const sideMat = new THREE.MeshStandardMaterial({ ...wallMaps((WALL_Z - FAR_Z) / 40, WH / 40), metalness: 0.15, roughness: 0.9, envMapIntensity: 0.2 });
  const side = new THREE.Mesh(new THREE.PlaneGeometry(WALL_Z - FAR_Z, WH), sideMat);
  side.rotation.y = Math.PI / 2; side.position.set(SIDE_X, WH / 2, (WALL_Z + FAR_Z) / 2); g.add(side);
  const cyanMat = glowMat(NEON.cyan, 2.2), redMat = glowMat(NEON.red, 2.4);
  for (let i = 0; i < 5; i++) {
    const z = -62 - i * 40;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 17, 0.6), cyanMat); strip.position.set(SIDE_X + 0.5, 12, z + 14); g.add(strip);
    const under = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 12), redMat); under.position.set(SIDE_X + 13, 29.2, z); g.add(under);
  }
  // gångbro längs vänsterväggen
  const walk = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, WALL_Z - FAR_Z), steel); walk.position.set(SIDE_X + 9, 30.4, (WALL_Z + FAR_Z) / 2); g.add(walk);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, WALL_Z - FAR_Z), steel); rail.position.set(SIDE_X + 17.6, 37.4, (WALL_Z + FAR_Z) / 2); g.add(rail);
  for (let z = WALL_Z - 4; z > FAR_Z; z -= 13) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), steel); post.position.set(SIDE_X + 17.6, 34, z); g.add(post);
    if (Math.round(z) % 2 === 0) { const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 30, 1.2), steel); leg.position.set(SIDE_X + 17, 15, z); g.add(leg); }
  }
  // gaveln längst bort
  const far = new THREE.Mesh(new THREE.PlaneGeometry(150, 80), new THREE.MeshBasicMaterial({ map: T.toTexture(T.drawHallBackdrop()), fog: false, color: new THREE.Color(0.9, 0.9, 0.95) }));
  far.position.set(SIDE_X + 75, 40, FAR_Z); g.add(far);

  // hängande lampor
  const sprite = T.toTexture(T.drawSprite());
  const lamps = [];
  const lamp = (x, y, z, hex, light) => {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 60, 5), steel); cord.position.set(x, y + 31.5, z); g.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x111216, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide })); shade.position.set(x, y + 0.6, z); g.add(shade);
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), glowMat(hex, 3)); bulb.rotation.x = Math.PI / 2; bulb.position.set(x, y - 0.6, z); g.add(bulb);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite, color: hdr(hex, 1.1), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    halo.position.set(x, y - 1, z); halo.scale.setScalar(26); g.add(halo);
    let pl = null;
    if (light) { pl = new THREE.PointLight(hex, light, 170, 0.95); pl.position.set(x, y - 3, z); g.add(pl); }
    lamps.push({ bulb, halo, pl, base: light, ph: x * 0.37 });
  };
  lamp(-72, 35, -44, NEON.cyan, 7);
  lamp(-50, 35, -84, NEON.red, 12);
  lamp(-34, 37, -136, NEON.red, 0);
  lamp(-92, 38, -168, NEON.cyan, 0);

  // fat och lådor
  const barrelMat = new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawBarrel(), { wrap: true }), metalness: 0.6, roughness: 0.55 });
  for (const [x, z, s] of [[-66, -4, 1], [-80, -18, 0.92], [-98, -70, 1]]) {
    const b = sh(new THREE.Mesh(new THREE.CylinderGeometry(6.4 * s, 6.4 * s, 18 * s, 28), [barrelMat, steel, steel])); b.position.set(x, 9 * s, z); b.rotation.y = x; g.add(b);
    for (const ry of [0.3, 0.7]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(6.5 * s, 0.3, 6, 28), steel); ring.rotation.x = Math.PI / 2; ring.position.set(x, 18 * s * ry, z); g.add(ring); }
  }
  const crateMat = new THREE.MeshStandardMaterial({ map: T.toTexture(T.drawCrate()), color: 0xd8dcea, metalness: 0.25, roughness: 0.75 });
  for (const [x, y, z, w, h, d, ry] of [[-84, 6.5, -96, 15, 13, 15, 0.1], [-83, 18, -97, 12, 10, 12, -0.2], [-100, 6, -112, 13, 12, 13, 0.3], [-44, 5.5, -160, 12, 11, 12, 0], [-58, 5.5, -164, 12, 11, 12, 0.15], [-52, 15.5, -162, 11, 9, 11, -0.1]]) {
    const c = sh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat)); c.position.set(x, y, z); c.rotation.y = ry; g.add(c);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.2), redMat); led.position.set(x - w * 0.3, y + h * 0.3, z + d / 2 + 0.3); led.rotation.y = ry; g.add(led);
  }

  // rök som driver längs golvet
  const smokeTex = T.toTexture(T.drawSmoke());
  const smoke = [];
  const srand = T.seeded('smokepos');
  for (let i = 0; i < (touch ? 5 : 9); i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: new THREE.Color(0.42, 0.5, 0.72), transparent: true, opacity: 0.0, depthWrite: false, fog: false }));
    const x0 = -150 + srand() * 120, z0 = -150 + srand() * 130;
    s.position.set(x0, 9 + srand() * 12, z0); s.scale.set(70 + srand() * 50, 34 + srand() * 22, 1);
    s.userData = { x0, sp: 1.2 + srand() * 2.2, ph: srand() * 60, op: 0.2 + srand() * 0.22 };
    g.add(s); smoke.push(s);
  }

  /* ---- liv ---------------------------------------------------------------- */
  const state = { flick: 1, next: 0 };
  function update(dt, t, bass = 0) {
    // skylten: lugn, med en sällsynt sprakning
    state.next -= dt;
    if (state.next <= 0) { const spark = Math.random() < 0.07; state.flick = spark ? 0.25 + Math.random() * 0.45 : 0.93 + Math.random() * 0.07; state.next = spark ? 0.04 + Math.random() * 0.09 : 0.5 + Math.random() * 2.2; }
    const f = state.flick;
    signMat.color.setScalar(0.35 + 1.15 * f + bass * 0.35); signLight.intensity = (4 + bass * 4) * f;
    for (const l of lamps) { const w = 0.92 + Math.sin(t * 1.3 + l.ph) * 0.08; l.halo.material.opacity = 0.55 * w; if (l.pl) l.pl.intensity = l.base * w; }
    for (const s of smoke) {
      const u = s.userData, x = u.x0 + ((t * u.sp + u.ph) % 90) - 20;
      s.position.x = x;
      const life = ((t * u.sp + u.ph) % 90) / 90;
      s.material.opacity = u.op * Math.sin(life * Math.PI);
    }
  }
  /** Stående skärm: skylten mitt över däcket, och hörnrören (som annars skymmer den) borta. */
  function setPortrait(on) { signGroup.position.x = on ? 4.5 : SIGN.x; for (const p of cornerPipes) p.visible = !on; }
  function setFog(near, far) { mirror.material.uniforms.uFog.value.set(near, far * 0.92); }
  function resize(w, h) { const kk = touch ? 0.4 : 0.5; mirror.getRenderTarget().setSize(Math.max(256, Math.round(w * kk)), Math.max(256, Math.round(h * kk))); }

  return { group: g, update, setFog, setPortrait, resize, mirror, lights: { signLight, tubeLight, redSide } };
}
