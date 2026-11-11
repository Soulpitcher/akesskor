/* =============================================================================
   Kontrollrummet – det som rör sig i bilden.
   Allt ritas med vanlig 2D-canvas i bildens egna pixlar (1672 × 941) och läggs
   sedan in i bilden av plate.js. Två lager:
     'ytor' – ersätter ytor i bilden (skärmglas, papper, visartavlor, släckta knappar)
     'ljus' – sådant som lyser av sig självt (kurvan, tända knappar, tablårutor)
   ============================================================================= */

/** Klickytor i bilden: [x, y, bredd, höjd]. */
export const HOT = {
  tablaL: [283, 518, 218, 104],
  tablaR: [1256, 518, 202, 104],
  scope:  [548, 513, 100, 80],
  rec:    [1480, 350, 178, 118],
  door:   [486, 390, 142, 112],
};
export const SCOPE = { x: 559, y: 521, w: 78, h: 58, r: 9 };
export const BTN = [1100, 1117, 1134, 1151, 1168, 1186, 1203.5, 1221.5].map((x, i) => ({ x, y: 561 + i * 0.5, w: 14.5, h: 17 }));
const PAPER = [{ x: 1499, y: 380, w: 44, h: 66 }, { x: 1585, y: 375, w: 50, h: 69 }];
const METERS = [[717, 517, 36, 22], [761, 517, 37, 22], [717, 551, 36, 24], [761, 551, 37, 24], [992, 521, 35, 22], [1033, 521, 37, 22]];
const TAB = {
  L: { tl: [298.5, 535], tr: [474, 533], br: [485, 600.6], bl: [308, 611], cols: 8, rows: 12 },
  R: { tl: [1275, 534.5], tr: [1439, 542.5], br: [1429, 612], bl: [1261, 601], cols: 10, rows: 12 },
};

const lerp = (a, b, t) => a + (b - a) * t;
function cell(side, c, r) {
  const q = TAB[side], u = c / (q.cols - 1), v = r / (q.rows - 1);
  const ax = lerp(q.tl[0], q.tr[0], u), ay = lerp(q.tl[1], q.tr[1], u), bx = lerp(q.bl[0], q.br[0], u), by = lerp(q.bl[1], q.br[1], u);
  return [lerp(ax, bx, v), lerp(ay, by, v)];
}
/** Var på vänstra tablån släpp nummer i har sin ruta. */
export const tileOf = (i) => cell('L', (i % 4) * 2, 2 + Math.floor(i / 4) * 2);

function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function glow(c, x, y, r, rgb, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Gnistrande tablårutor medan anläggningen går. */
export class Twinkles {
  constructor() { this.list = []; }
  step(dt, energy) {
    for (const t of this.list) t.a -= dt * t.d;
    this.list = this.list.filter((t) => t.a > 0);
    let n = energy * dt * 26;
    while (n > 0 && this.list.length < 46) {
      if (Math.random() < n) {
        const side = Math.random() < 0.5 ? 'L' : 'R', q = TAB[side];
        const [x, y] = cell(side, Math.floor(Math.random() * q.cols), Math.floor(Math.random() * q.rows));
        this.list.push({ x, y, a: 0.5 + Math.random() * 0.5, d: 0.8 + Math.random() * 2.4 });
      }
      n -= 1;
    }
  }
}

/**
 * st: { t, on, power, playing, wave, lv:{l,r,bass}, needles:[6], cur, releases, covers, hist, progress, twinkles, hotBtn }
 */
export function drawLive(c, layer, st) {
  if (layer === 'ytor') surfaces(c, st); else lights(c, st);
}

function surfaces(c, st) {
  // --- oscilloskopets glas: bildens stilla kurva täcks, vår egen ritas i ljuslagret
  rr(c, SCOPE.x, SCOPE.y, SCOPE.w, SCOPE.h, SCOPE.r);
  c.fillStyle = 'rgba(6,20,15,0.97)'; c.fill();

  // --- knapparna 1–8: bara släppta signaler lyser
  BTN.forEach((b, i) => {
    const r = st.releases[i];
    if (r && r.status === 'available') return;
    c.fillStyle = 'rgba(30,15,7,0.93)'; c.fillRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
    c.fillStyle = 'rgba(64,32,16,1)'; c.fillRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    c.fillStyle = 'rgba(104,58,28,0.8)'; c.fillRect(b.x + 1.5, b.y + 1.5, b.w - 3, 2.2);
  });

  // --- visarinstrument: ny tavla och en nål som följer ljudet
  METERS.forEach(([x, y, w, h], i) => {
    const fx = x + 3.5, fy = y + 3, fw = w - 7, fh = h - 8.5;
    const g = c.createLinearGradient(0, fy, 0, fy + fh);
    g.addColorStop(0, 'rgba(238,220,178,0.94)'); g.addColorStop(1, 'rgba(214,190,140,0.94)');
    c.fillStyle = g; c.fillRect(fx, fy, fw, fh);
    const px = x + w / 2, py = y + h - 4.2, R = fh * 1.0;
    c.strokeStyle = 'rgba(60,40,26,0.75)'; c.lineWidth = 0.8;
    c.beginPath(); c.arc(px, py, R * 0.86, Math.PI * 1.22, Math.PI * 1.78); c.stroke();
    c.strokeStyle = 'rgba(170,40,28,0.8)';
    c.beginPath(); c.arc(px, py, R * 0.86, Math.PI * 1.66, Math.PI * 1.78); c.stroke();
    c.strokeStyle = 'rgba(60,40,26,0.6)'; c.lineWidth = 0.6;
    for (let k = 0; k <= 6; k++) { const a = Math.PI * (1.22 + 0.56 * k / 6); c.beginPath(); c.moveTo(px + Math.cos(a) * R * 0.86, py + Math.sin(a) * R * 0.86); c.lineTo(px + Math.cos(a) * R * 0.72, py + Math.sin(a) * R * 0.72); c.stroke(); }
    const a = Math.PI * (1.22 + 0.56 * Math.max(0, Math.min(1.06, st.needles[i])));
    c.strokeStyle = 'rgba(24,16,12,0.95)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * R * 0.95, py + Math.sin(a) * R * 0.95); c.stroke();
    c.fillStyle = 'rgba(20,16,14,1)'; c.fillRect(fx, fy + fh - 1.6, fw, 2.2);
  });

  // --- skrivarfönstren: papper som matas fram
  PAPER.forEach((p, i) => {
    c.save(); c.beginPath(); c.rect(p.x, p.y, p.w, p.h); c.clip();
    const g = c.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, 'rgba(236,216,172,0.9)'); g.addColorStop(1, 'rgba(222,198,150,0.9)');
    c.fillStyle = g; c.fillRect(p.x, p.y, p.w, p.h);
    const feed = st.playing || st.progress > 0 ? (st.progress * 260) % 5 : 0;
    c.strokeStyle = 'rgba(150,92,56,0.32)'; c.lineWidth = 0.5; c.beginPath();
    for (let x = p.x + 2.5; x < p.x + p.w; x += 5) { c.moveTo(x, p.y); c.lineTo(x, p.y + p.h); }
    for (let y = p.y + feed; y < p.y + p.h; y += 5) { c.moveTo(p.x, y); c.lineTo(p.x + p.w, y); }
    c.stroke();
    if (i === 0) {
      // signalen: omslaget tryckt överst, pennan ritar kurvan under
      const cov = st.cur && st.covers.get(st.cur.id);
      if (cov) { c.globalAlpha = 0.86; c.drawImage(cov, p.x + 8, p.y + 5, 28, 28); c.globalAlpha = 1; c.strokeStyle = 'rgba(40,26,18,0.7)'; c.lineWidth = 0.6; c.strokeRect(p.x + 8, p.y + 5, 28, 28); }
      const base = p.y + (cov ? 50 : 36), h = st.hist, n = h.length;
      c.strokeStyle = 'rgba(150,38,24,0.9)'; c.lineWidth = 0.8; c.beginPath();
      for (let k = 0; k < p.w - 4; k++) {
        const v = n ? h[Math.max(0, n - 1 - (p.w - 5 - k))] || 0 : 0, x = p.x + 2 + k;
        c.moveTo(x, base - v * 11); c.lineTo(x, base + v * 9 + 0.6);
      }
      c.stroke();
    } else if (st.cur) {
      // journalen: textrader som rullar förbi i takt med låten
      const lines = st.cur._lines || [], off = st.progress * Math.max(0, lines.length * 3.6 - p.h + 12);
      c.fillStyle = 'rgba(44,28,20,0.72)';
      lines.forEach((len, k) => { const y = p.y + 6 + k * 3.6 - off; if (y > p.y + 2 && y < p.y + p.h - 3 && len) c.fillRect(p.x + 4, y, Math.min(p.w - 8, len * 1.15), 1.3); });
    }
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1.5; c.strokeRect(p.x, p.y, p.w, p.h);
    c.restore();
  });
}

function lights(c, st) {
  const on = st.on;
  if (on <= 0.001) return;

  // --- oscilloskopet
  const S = SCOPE, mid = S.y + S.h / 2;
  glow(c, S.x + S.w / 2, mid, 64, '50,255,170', 0.05 * on);
  c.save(); rr(c, S.x, S.y, S.w, S.h, S.r); c.clip();
  glow(c, S.x + S.w / 2, mid, 52, '30,150,100', 0.2 * on);
  c.strokeStyle = `rgba(70,255,180,${0.1 * on})`; c.lineWidth = 0.5; c.beginPath();
  for (let i = 1; i < 8; i++) { const x = S.x + S.w * i / 8; c.moveTo(x, S.y); c.lineTo(x, S.y + S.h); }
  for (let i = 1; i < 6; i++) { const y = S.y + S.h * i / 6; c.moveTo(S.x, y); c.lineTo(S.x + S.w, y); }
  c.stroke();
  const N = 78, pts = [];
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1); let v;
    if (st.playing && st.wave) v = st.wave[Math.floor(u * 620)] * 1.5;
    else {
      // ingen signal: en ensam puls som vandrar över skärmen
      const ph = (st.t * 0.42) % 1.5, d = (u - ph) * 16;
      v = Math.exp(-d * d) * Math.sin(d * 5) * 0.55 + (Math.sin(i * 12.9898 + st.t * 40) * 43758.5453 % 1) * 0.012;
    }
    pts.push([S.x + 3 + u * (S.w - 6), mid - Math.max(-1, Math.min(1, v)) * (S.h * 0.42)]);
  }
  const line = (w, a) => { c.strokeStyle = `rgba(120,255,200,${a * on})`; c.lineWidth = w; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  line(4.2, 0.12); line(2.2, 0.3); line(0.95, 1);
  // glasets reflex
  const rg = c.createLinearGradient(S.x, S.y, S.x + S.w * 0.7, S.y + S.h);
  rg.addColorStop(0, `rgba(200,255,230,${0.07 * on})`); rg.addColorStop(0.35, 'rgba(200,255,230,0)');
  c.fillStyle = rg; c.fillRect(S.x, S.y, S.w, S.h);
  c.restore();

  // --- knapparna 1–8
  BTN.forEach((b, i) => {
    const r = st.releases[i]; if (!r || r.status !== 'available') return;
    const act = st.cur === r, hot = st.hotBtn === i;
    const a = act ? (st.playing ? 0.5 + st.lv.bass * 0.7 : 0.38 + 0.12 * Math.sin(st.t * 3)) : hot ? 0.3 : 0;
    if (a > 0) { glow(c, b.x + b.w / 2, b.y + b.h / 2, 17, '255,170,70', a * on); c.fillStyle = `rgba(255,214,150,${a * 0.7 * on})`; c.fillRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4); }
  });

  // --- tablåerna: släppta signaler lyser, den valda pulserar, nästa blinkar rött
  let next = true;
  st.releases.forEach((r, i) => {
    if (i >= 24) return;
    const [x, y] = tileOf(i);
    if (r.status === 'available') {
      const act = st.cur === r;
      const a = act ? (st.playing ? 0.75 + st.lv.bass * 0.5 : 0.6 + 0.25 * Math.sin(st.t * 3)) : 0.34 + 0.06 * Math.sin(st.t * 1.3 + i);
      glow(c, x, y, act ? 13 : 9, '255,180,80', a * 0.55 * on);
      c.fillStyle = `rgba(255,214,140,${a * on})`; c.fillRect(x - 4.6, y - 2.4, 9.2, 4.8);
    } else if (r.status === 'coming' && next) {
      next = false;
      const a = (Math.sin(st.t * 2.6) > 0.2 ? 0.8 : 0.08) * on;
      glow(c, x, y, 10, '255,50,30', a * 0.5); c.fillStyle = `rgba(255,70,45,${a})`; c.fillRect(x - 4.6, y - 2.4, 9.2, 4.8);
    }
  });
  for (const t of st.twinkles) { c.fillStyle = `rgba(255,200,110,${t.a * 0.55 * on})`; c.fillRect(t.x - 4.2, t.y - 2.1, 8.4, 4.2); }
}
