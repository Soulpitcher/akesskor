/* =============================================================================
   Kontrollrummet – bildmotorn.
   Rummet är EN bild (assets/kontrollrum.webp). Den här filen ritar den med
   WebGL och låter den leva: varje lampa i bilden kan släckas och tändas var
   för sig, golvet skimrar, damm svävar i ljusstrålen och ett överlägg (vanlig
   2D-canvas i bildens koordinater) lägger in det som rör sig – oscilloskopets
   kurva, visarnålar, skrivarpapper och knapplampor.

   Alla mått nedan är i bildens pixlar (1672 × 941).
   ============================================================================= */

export const PW = 1672, PH = 941;

/** Remsan av bilden där allt rörligt finns. Överlägget täcker bara den. */
export const BAND = { y0: 340, y1: 630 };
const BH = BAND.y1 - BAND.y0;

/** Ljuskällorna i bilden. De två första är dagsljuset uppifrån, resten lampor. */
export const LIGHTS = [
  { id: 'sky',    x: 940,  y: 95,  rx: 540, ry: 250 },
  { id: 'shaft',  x: 895,  y: 430, rx: 340, ry: 430 },
  { id: 'redL',   x: 296,  y: 268, rx: 112, ry: 112 },
  { id: 'redR',   x: 1196, y: 300, rx: 100, ry: 100 },
  { id: 'tubeL',  x: 105,  y: 222, rx: 380, ry: 350 },
  { id: 'tubeC',  x: 956,  y: 342, rx: 350, ry: 310 },
  { id: 'tubeR',  x: 1552, y: 320, rx: 350, ry: 320 },
  { id: 'tubeR2', x: 1190, y: 356, rx: 180, ry: 160 },
  { id: 'desk',   x: 860,  y: 566, rx: 690, ry: 60 },
  { id: 'door',   x: 385,  y: 400, rx: 100, ry: 95 },
  { id: 'wallL',  x: 170,  y: 470, rx: 130, ry: 120 },
  { id: 'rec',    x: 1570, y: 412, rx: 120, ry: 85 },
];
export const LI = Object.fromEntries(LIGHTS.map((l, i) => [l.id, i]));
const NL = LIGHTS.length;

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';

const FRAG = `
precision highp float;
uniform sampler2D uPlate, uOver;
uniform vec2 uRes;
uniform vec4 uView;            // tx, ty, bredd, höjd – bildens plats på skärmen
uniform float uT, uAmb, uEmis, uRed, uGlitch, uSharp;
uniform vec3 uAmbCol, uSkyCol;
uniform vec4 uL[${NL}];
uniform float uI[${NL}];
uniform vec4 uHover; uniform float uHoverS;
uniform vec2 uBand;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float motes(vec2 uv, float t){
  float s = 0.0;
  for (int k = 0; k < 2; k++) {
    float sc = 46.0 + float(k) * 37.0;
    vec2 q = uv * vec2(sc * 1.78, sc) + vec2(t * 0.012 * (1.0 + float(k)), -t * 0.02 + float(k) * 7.0);
    vec2 c = floor(q), f = fract(q);
    vec2 o = vec2(hash(c), hash(c + 17.3));
    float d = length(f - 0.2 - 0.6 * o);
    float tw = 0.5 + 0.5 * sin(t * (0.6 + hash(c + 3.0) * 1.6) + hash(c + 9.0) * 6.28);
    s += smoothstep(0.07, 0.0, d) * tw * step(0.7, hash(c + 5.0));
  }
  return s;
}

void main(){
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = (frag - uView.xy) / uView.zw;
  vec2 suv = frag / uRes;

  // strömstöt: bilden rycker till i sidled
  uv.x += (hash(vec2(floor(uv.y * 46.0), floor(uT * 28.0))) - 0.5) * 0.012 * uGlitch;
  // blött golv: speglingarna darrar lite
  float fl = smoothstep(0.76, 0.94, uv.y);
  uv.x += fl * (sin(uv.y * 310.0 + uT * 1.7) + sin(uv.y * 131.0 - uT * 1.1)) * 0.00042;

  vec2 px = 1.0 / vec2(${PW}.0, ${PH}.0);
  vec3 c = texture2D(uPlate, uv).rgb;
  vec3 b = (texture2D(uPlate, uv + vec2(px.x, 0.0)).rgb + texture2D(uPlate, uv - vec2(px.x, 0.0)).rgb
          + texture2D(uPlate, uv + vec2(0.0, px.y)).rgb + texture2D(uPlate, uv - vec2(0.0, px.y)).rgb) * 0.25;
  c = clamp(c + (c - b) * uSharp, 0.0, 1.0);
  vec3 lin = pow(c, vec3(2.2));

  // överlägget: övre halvan ersätter ytor (papper, nålar), nedre halvan lyser
  float by = (uv.y - uBand.x) / (uBand.y - uBand.x);
  float inB = step(0.004, by) * step(by, 0.996) * step(0.0, uv.x) * step(uv.x, 1.0);
  vec2 bu = vec2(uv.x, clamp(by, 0.004, 0.996) * 0.5);
  vec4 alb = texture2D(uOver, bu);
  vec3 emi = texture2D(uOver, bu + vec2(0.0, 0.5)).rgb;
  lin = mix(lin, pow(alb.rgb, vec3(2.2)), alb.a * inB);

  // ljuset: summan av det som är tänt
  float Es = 0.0, Ew = 0.0, red = 0.0;
  for (int i = 0; i < ${NL}; i++) {
    vec2 d = (uv - uL[i].xy) / uL[i].zw;
    float g = exp(-dot(d, d));
    if (i < 2) Es += g * uI[i]; else Ew += g * uI[i];
    if (i == 2 || i == 3) red += g * uI[i];
  }
  float lum = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  vec3 light = uAmbCol * uAmb + uSkyCol * Es + vec3(Ew);
  float E = uAmb + Es + Ew;
  float k = 1.12 * (1.0 - exp(-2.2 * E)) / max(E, 0.0001);
  vec3 col = mix(vec3(lum), lin, 0.55 + 0.45 * clamp(E * 1.6, 0.0, 1.0)) * light * k;

  // varningslamporna färgar väggen runt sig
  col += vec3(0.9, 0.05, 0.02) * red * uRed * (0.02 + lum * 0.5);

  // damm i ljusstrålen
  float sx = mix(0.572, 0.528, clamp((uv.y - 0.15) / 0.42, 0.0, 1.0));
  float sh = exp(-pow((uv.x - sx) / 0.075, 2.0)) * smoothstep(0.13, 0.22, uv.y) * smoothstep(0.64, 0.42, uv.y);
  col += uSkyCol * motes(uv, uT) * sh * (uI[0] + uI[1]) * 0.16;

  // det man pekar på lyfts fram
  vec2 hd = (uv - uHover.xy) / uHover.zw;
  float hm = smoothstep(1.3, 0.55, max(abs(hd.x), abs(hd.y)));
  col += (lin * 0.55 + vec3(0.010, 0.008, 0.004)) * hm * uHoverS;

  // det som lyser av sig självt
  col += pow(emi, vec3(2.2)) * uEmis * inB * 1.7;

  col = pow(max(col, 0.0), vec3(1.0 / 2.2));
  col += (hash(frag + fract(uT) * 91.7) - 0.5) * 0.055 * (0.55 + 0.45 * (1.0 - lum));
  vec2 v = suv - 0.5;
  col *= 1.0 - dot(v, v) * 0.5;
  gl_FragColor = vec4(col, 1.0);
}`;

export class Plate {
  /** Returnerar null om WebGL saknas (då visas bilden utan effekter). */
  static create(canvas, img) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' })
      || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    try { return new Plate(canvas, gl, img); } catch (e) { console.warn(e); return null; }
  }

  constructor(canvas, gl, img) {
    this.canvas = canvas; this.gl = gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    for (const n of ['uPlate', 'uOver', 'uRes', 'uView', 'uT', 'uAmb', 'uEmis', 'uRed', 'uGlitch', 'uSharp', 'uAmbCol', 'uSkyCol', 'uL', 'uI', 'uHover', 'uHoverS', 'uBand'])
      this.u[n] = gl.getUniformLocation(pr, n);

    const tex = (unit, src) => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      return t;
    };
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    this.tPlate = tex(0, img);

    // överlägget: bildens bredd, två remsor på höjden (ersätt + lys)
    this.over = document.createElement('canvas'); this.over.width = PW; this.over.height = BH * 2;
    this.ctx = this.over.getContext('2d');
    this.tOver = tex(1, this.over);

    gl.uniform1i(this.u.uPlate, 0); gl.uniform1i(this.u.uOver, 1);
    gl.uniform2f(this.u.uBand, BAND.y0 / PH, BAND.y1 / PH);
    const L = new Float32Array(NL * 4);
    LIGHTS.forEach((l, i) => L.set([l.x / PW, l.y / PH, l.rx / PW, l.ry / PH], i * 4));
    gl.uniform4fv(this.u.uL, L);
    this.I = new Float32Array(NL);
    this.view = [0, 0, PW, PH]; this.dpr = 1;
  }

  resize(w, h, dpr) {
    this.dpr = dpr;
    const cw = Math.round(w * dpr), ch = Math.round(h * dpr);
    if (this.canvas.width !== cw || this.canvas.height !== ch) { this.canvas.width = cw; this.canvas.height = ch; }
    this.gl.viewport(0, 0, cw, ch);
  }

  /** Bildens läge på skärmen i CSS-pixlar. */
  setView(tx, ty, scale) { this.view = [tx, ty, PW * scale, PH * scale]; this.scale = scale; }

  /** Rita i överlägget. draw(ctx, lager) anropas två gånger: 'ytor' och 'ljus'. */
  paint(draw) {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, PW, BH * 2);
    c.save(); c.beginPath(); c.rect(0, 0, PW, BH); c.clip(); c.translate(0, -BAND.y0); draw(c, 'ytor'); c.restore();
    c.save(); c.beginPath(); c.rect(0, BH, PW, BH); c.clip(); c.fillStyle = '#000'; c.fillRect(0, BH, PW, BH);
    c.translate(0, BH - BAND.y0); c.globalCompositeOperation = 'lighter'; draw(c, 'ljus'); c.restore();
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tOver);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.over);
  }

  render(s) {
    const gl = this.gl, u = this.u, d = this.dpr, v = this.view;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform4f(u.uView, v[0] * d, v[1] * d, v[2] * d, v[3] * d);
    gl.uniform1f(u.uT, s.t % 600);
    gl.uniform1f(u.uAmb, s.amb); gl.uniform1f(u.uEmis, s.emis); gl.uniform1f(u.uRed, s.red);
    gl.uniform1f(u.uGlitch, s.glitch);
    // skärpan anpassas: ju mer bilden förstoras, desto mer hjälp behöver den
    gl.uniform1f(u.uSharp, Math.max(0, Math.min(0.9, (this.scale * d - 0.7) * 0.75)));
    gl.uniform3fv(u.uAmbCol, s.ambCol); gl.uniform3fv(u.uSkyCol, s.skyCol);
    gl.uniform1fv(u.uI, this.I);
    const h = s.hover;
    if (h) gl.uniform4f(u.uHover, (h[0] + h[2] / 2) / PW, (h[1] + h[3] / 2) / PH, h[2] / 2 / PW, h[3] / 2 / PH);
    gl.uniform1f(u.uHoverS, h ? s.hoverS : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
