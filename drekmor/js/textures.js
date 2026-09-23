/* =============================================================================
   Procedurella texturer (canvas). Varje släpp får unika omslag, ryggar och
   etiketter genererade från releases.js – inga bildfiler krävs, men riktiga
   omslagsbilder används automatiskt när de finns.
   ============================================================================= */
import * as THREE from 'three';

let MAX_ANISO = 8;
export const setMaxAnisotropy = (n) => { MAX_ANISO = n; };

export const F = {
  sans: (w, s) => `${w} ${s}px "Space Grotesk", system-ui, sans-serif`,
  mono: (w, s) => `${w} ${s}px "Space Mono", ui-monospace, monospace`,
  display: (s) => `400 ${s}px "Bebas Neue", "Space Grotesk", sans-serif`,
};

export const TYPE_LABEL = { song: 'Låt', interview: 'Intervju', story: 'Berättelse' };

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function toTexture(canvas, { color = true, wrap = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ---------------------------------------------------------------- helpers -- */
export function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hexRgb = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
export const lighten = (hex, t) => mix(hex, '#ffffff', t);
export const darken = (hex, t) => mix(hex, '#000000', t);

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Text med manuell spärrning (fungerar i alla webbläsare). */
export function spaced(ctx, text, x, y, spacing, align = 'left') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign; ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, cx, y); cx += widths[i] + spacing; });
  ctx.textAlign = prev;
  return total;
}

/** Största fontstorlek (<= start) där texten får plats. */
export function fitSize(ctx, text, fontFn, maxW, start, min) {
  let s = start;
  for (; s > min; s -= 2) { ctx.font = fontFn(s); if (ctx.measureText(text).width <= maxW) break; }
  ctx.font = fontFn(s);
  return s;
}

export function grain(ctx, w, h, amount, rand = Math.random) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (rand() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

export function scratches(ctx, w, h, n, rand, alpha = 0.07) {
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rand() * w, y = rand() * h, len = (0.04 + rand() * 0.22) * w, ang = (rand() - 0.5) * 0.5 + (rand() < 0.3 ? Math.PI / 2 : 0);
    ctx.strokeStyle = rand() < 0.75 ? `rgba(255,255,255,${alpha * rand()})` : `rgba(0,0,0,${alpha * 1.6 * rand()})`;
    ctx.lineWidth = 0.5 + rand() * 1.1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
  }
  ctx.restore();
}

export function vignette(ctx, w, h, strength = 0.5, inner = 0.35) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * inner, w / 2, h / 2, Math.hypot(w, h) * 0.6);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function padlock(ctx, x, y, s, color, hole) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = s * 0.15; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.05); ctx.lineTo(x - s * 0.3, y - s * 0.32);
  ctx.arc(x, y - s * 0.32, s * 0.3, Math.PI, 0); ctx.lineTo(x + s * 0.3, y - s * 0.05); ctx.stroke();
  roundRect(ctx, x - s / 2, y - s * 0.08, s, s * 0.78, s * 0.1); ctx.fill();
  ctx.fillStyle = hole;
  ctx.beginPath(); ctx.arc(x, y + s * 0.24, s * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - s * 0.035, y + s * 0.24, s * 0.07, s * 0.22);
  ctx.restore();
}

function pulseLine(ctx, x0, x1, y, u, color, width) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = width * 8;
  const m = (x0 + x1) / 2;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(m - u * 1.6, y); ctx.lineTo(m - u * 1.1, y - u * 0.35);
  ctx.lineTo(m - u * 0.65, y + u * 0.3); ctx.lineTo(m - u * 0.2, y - u * 1.25); ctx.lineTo(m + u * 0.28, y + u * 0.95);
  ctx.lineTo(m + u * 0.62, y - u * 0.2); ctx.lineTo(m + u * 1.0, y); ctx.lineTo(x1, y); ctx.stroke();
  ctx.restore();
}

function screw(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, '#9a9fa6'); g.addColorStop(0.6, '#4a4e55'); g.addColorStop(1, '#16181b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = r * 0.28;
  ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.2); ctx.lineTo(x + r * 0.6, y + r * 0.2); ctx.stroke();
}

/* ============================================================ OMSLAGSKONST == */

/** Genererad "signal"-konst när ingen riktig omslagsbild finns. */
export function drawSignalArt(ctx, s, r) {
  const rand = seeded(r.id + ':art');
  const locked = r.status === 'locked';
  const A = locked ? '#737a84' : (r.accent || '#38cfe0');

  let g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, '#020306'); g.addColorStop(0.58, darken(A, 0.84)); g.addColorStop(1, darken(A, 0.62));
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);

  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.55})`;
    const z = rand() < 0.9 ? 1 : 2;
    ctx.fillRect(rand() * s, rand() * s * 0.62, z, z);
  }

  const bx = s * (0.34 + rand() * 0.32), top = s * 0.27, baseY = s * 0.79;
  if (!locked) {
    const glow = ctx.createRadialGradient(bx, top, 0, bx, top, s * 0.62);
    glow.addColorStop(0, rgba(lighten(A, 0.45), 0.62)); glow.addColorStop(0.18, rgba(A, 0.22)); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, s, s);
    ctx.lineWidth = Math.max(1.5, s * 0.0028);
    for (let i = 1; i <= 6; i++) {
      ctx.strokeStyle = rgba(lighten(A, 0.35), 0.34 - i * 0.045);
      ctx.beginPath(); ctx.arc(bx, top, s * (0.035 + i * i * 0.012), Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    }
  }

  // Radiomast i fackverk
  const half = s * 0.075;
  ctx.strokeStyle = 'rgba(4,5,8,0.97)'; ctx.lineWidth = s * 0.0065;
  ctx.beginPath(); ctx.moveTo(bx - half, baseY); ctx.lineTo(bx, top); ctx.lineTo(bx + half, baseY); ctx.stroke();
  ctx.lineWidth = s * 0.0028;
  for (let i = 0; i < 11; i++) {
    const t0 = i / 11, t1 = (i + 1) / 11;
    const y0 = baseY + (top - baseY) * t0, y1 = baseY + (top - baseY) * t1;
    const w0 = half * (1 - t0), w1 = half * (1 - t1);
    ctx.beginPath(); ctx.moveTo(bx - w0, y0); ctx.lineTo(bx + w1, y1); ctx.moveTo(bx + w0, y0); ctx.lineTo(bx - w1, y1); ctx.stroke();
  }
  if (!locked) {
    ctx.save(); ctx.shadowColor = lighten(A, 0.6); ctx.shadowBlur = s * 0.06; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, top, s * 0.011, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Stadssiluett med tända fönster
  let x = -2;
  while (x < s) {
    const bw = s * (0.028 + rand() * 0.07);
    const near = Math.abs(x + bw / 2 - bx) < s * 0.13;
    const bh = s * (0.05 + rand() * 0.2) * (near ? 0.45 : 1);
    const y0 = s * 0.81 - bh;
    ctx.fillStyle = '#030406'; ctx.fillRect(x, y0, bw + 1, s - y0);
    for (let wy = y0 + s * 0.012; wy < s * 0.8; wy += s * 0.017) {
      for (let wx = x + s * 0.008; wx < x + bw - s * 0.008; wx += s * 0.013) {
        if (rand() < (locked ? 0.02 : 0.09)) {
          ctx.fillStyle = rand() < 0.55 ? rgba(lighten(A, 0.55), 0.85) : 'rgba(255,214,160,0.75)';
          ctx.fillRect(wx, wy, s * 0.0045, s * 0.006);
        }
      }
    }
    x += bw;
  }
  g = ctx.createLinearGradient(0, s * 0.74, 0, s);
  g.addColorStop(0, rgba(A, 0)); g.addColorStop(0.3, rgba(A, locked ? 0.05 : 0.16)); g.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = g; ctx.fillRect(0, s * 0.74, s, s * 0.26);

  if (!locked) pulseLine(ctx, s * 0.06, s * 0.94, s * 0.9, s * 0.045, lighten(A, 0.35), Math.max(2, s * 0.0045));

  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  for (let y = 0; y < s; y += 3) ctx.fillRect(0, y, s, 1);

  ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = F.mono(700, Math.round(s * 0.026)); ctx.textBaseline = 'alphabetic';
  spaced(ctx, `SIGNAL ${r.id.replace('D-', '')}`, s * 0.055, s * 0.075, s * 0.008);

  if (locked) {
    // Glitch-remsor + hänglås
    for (let i = 0; i < 9; i++) {
      const y = rand() * s, h = s * (0.008 + rand() * 0.03), dx = (rand() - 0.5) * s * 0.12;
      ctx.drawImage(ctx.canvas, 0, y, s, h, dx, y, s, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, s, s);
    padlock(ctx, s / 2, s * 0.45, s * 0.2, 'rgba(225,230,236,0.88)', '#15171b');
    ctx.fillStyle = 'rgba(225,230,236,0.8)'; ctx.font = F.mono(700, Math.round(s * 0.032)); ctx.textAlign = 'center';
    spaced(ctx, 'SIGNAL KRYPTERAD', s / 2, s * 0.7, s * 0.01, 'center');
    ctx.textAlign = 'left';
  }
}

function stamp(ctx, text, x, y, color, size) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.12);
  ctx.font = F.mono(700, size);
  const w = ctx.measureText(text).width + size * 1.4 + (text.length - 1) * size * 0.12;
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.14; ctx.globalAlpha = 0.9;
  roundRect(ctx, -w, -size * 0.95, w, size * 1.9, size * 0.2); ctx.stroke();
  ctx.fillStyle = color; spaced(ctx, text, -w / 2, size * 0.36, size * 0.12, 'center');
  ctx.restore();
}

/** J-kort (omslaget i kassettfodralet): fyrkantig bild överst + typografiskt band. */
export function drawJCard(r, img) {
  const W = 640, H = 985, S = 640;
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  const rand = seeded(r.id + ':jc');
  const A = r.status === 'locked' ? '#7d848e' : (r.accent || '#38cfe0');

  if (img) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
  } else {
    drawSignalArt(ctx, S, r);
  }

  const g = ctx.createLinearGradient(0, S, 0, H);
  g.addColorStop(0, '#0d0d11'); g.addColorStop(1, '#07070a');
  ctx.fillStyle = g; ctx.fillRect(0, S, W, H - S);
  ctx.fillStyle = A; ctx.fillRect(0, S, W, 5);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#eef0f3'; ctx.font = F.sans(700, 27); spaced(ctx, 'DREKMOR', 38, S + 60, 13);
  ctx.fillStyle = lighten(A, 0.25); ctx.font = F.mono(700, 23); ctx.textAlign = 'right'; ctx.fillText(r.id, W - 38, S + 59); ctx.textAlign = 'left';

  const title = r.title.toUpperCase();
  ctx.fillStyle = '#f6f3ec';
  const size = fitSize(ctx, title, F.display, W - 76, 124, 58);
  if (ctx.measureText(title).width <= W - 76) {
    ctx.fillText(title, 36, S + 88 + size * 0.86);
  } else {
    const words = title.split(' '), mid = Math.ceil(words.length / 2);
    const l1 = words.slice(0, mid).join(' '), l2 = words.slice(mid).join(' ');
    const s2 = Math.min(fitSize(ctx, l1, F.display, W - 76, 104, 50), fitSize(ctx, l2, F.display, W - 76, 104, 50));
    ctx.font = F.display(s2);
    ctx.fillText(l1, 36, S + 84 + s2 * 0.86); ctx.fillText(l2, 36, S + 84 + s2 * 1.78);
  }

  const year = (r.releaseDate || '').slice(0, 4);
  const meta = [TYPE_LABEL[r.type] || '', 'Sida A/B', year || 'Signal', 'Stereo'].join('  ·  ').toUpperCase();
  ctx.fillStyle = 'rgba(255,255,255,0.46)'; ctx.font = F.mono(400, 16); spaced(ctx, meta, 38, H - 40, 2.5);

  if (r.status === 'coming') stamp(ctx, 'SNART I SÄNDNING', W - 36, 62, '#7ff0ff', 19);

  scratches(ctx, W, H, 46, rand, 0.06);
  vignette(ctx, W, H, 0.32, 0.45);
  grain(ctx, W, H, 11, rand);
  return c;
}

/** Ryggen på fodralet – syns när kassetterna ligger staplade. */
export function drawSpine(r) {
  const W = 1024, H = 144, c = makeCanvas(W, H), ctx = c.getContext('2d');
  const rand = seeded(r.id + ':sp');
  const locked = r.status === 'locked';
  const A = locked ? '#5d636c' : (r.accent || '#38cfe0');

  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, locked ? '#18191c' : darken(A, 0.5)); g.addColorStop(1, locked ? '#101113' : darken(A, 0.74));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sh = ctx.createLinearGradient(0, 0, 0, H);
  sh.addColorStop(0, 'rgba(255,255,255,0.07)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = locked ? '#26292e' : darken(A, 0.25); ctx.fillRect(0, 0, 176, H);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = locked ? '#9aa1aa' : lighten(A, 0.7); ctx.font = F.mono(700, 46); ctx.fillText(r.id, 22, H / 2 + 2);

  ctx.fillStyle = locked ? '#8d939c' : '#f5f1e8';
  const title = r.title.toUpperCase();
  fitSize(ctx, title, F.display, W - 176 - 250, 96, 50);
  ctx.fillText(title, 206, H / 2 + 6);
  if (locked) padlock(ctx, 206 + ctx.measureText(title).width + 48, H / 2 + 4, 36, '#8d939c', darken(A, 0.6));

  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = F.mono(700, 16); ctx.textAlign = 'right';
  spaced(ctx, 'DREKMOR', W - 118, H / 2 - 12, 3, 'right'); spaced(ctx, 'ARKIV', W - 118, H / 2 + 14, 3, 'right');
  ctx.strokeStyle = locked ? '#8d939c' : '#f5f1e8'; ctx.lineWidth = 5; ctx.strokeRect(W - 98, H / 2 - 34, 68, 68);
  ctx.fillStyle = locked ? '#8d939c' : '#f5f1e8'; ctx.font = F.sans(700, 50); ctx.textAlign = 'center'; ctx.fillText('D', W - 64, H / 2 + 3);
  ctx.textAlign = 'left';

  scratches(ctx, W, H, 26, rand, 0.08);
  grain(ctx, W, H, 12, rand);
  return c;
}

/* ============================================================== KASSETTEN == */
/* Dekalen täcker kassettens framsida (9.56 × 5.96 cm) – helt ogenomskinlig
   utom fönstret där spolarna syns. Koordinater i cm, origo i mitten.        */
export const LABEL = { w: 9.56, h: 5.96, hubX: 2.15, hubY: 0.15 };

export function drawCassetteFace(r, side = 'A') {
  const W = 1024, H = Math.round(W * LABEL.h / LABEL.w);
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  const rand = seeded(r.id + ':face' + side);
  const k = W / LABEL.w;
  const X = (cx) => (cx + LABEL.w / 2) * k, Y = (cy) => (LABEL.h / 2 - cy) * k;
  const A = r.accent || '#38cfe0';

  // Skal (rökfärgad plast) – syns runt etiketten
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#26221e'); g.addColorStop(1, '#141210');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // Nederdelens trapets
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.beginPath(); ctx.moveTo(X(-3.3), Y(-1.5)); ctx.lineTo(X(3.3), Y(-1.5)); ctx.lineTo(X(3.9), Y(-2.98)); ctx.lineTo(X(-3.9), Y(-2.98)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = F.sans(700, 20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  spaced(ctx, 'DRKMR', X(0), Y(-2.1), 8, 'center');
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  for (const hx of [-1.9, -0.9, 0.9, 1.9]) { roundRect(ctx, X(hx) - 11, Y(-2.62) - 7, 22, 14, 3); ctx.fill(); }
  for (const [sx, sy] of [[-4.45, 2.68], [4.45, 2.68], [-4.45, -2.68], [4.45, -2.68], [0, -2.72]]) screw(ctx, X(sx), Y(sy), 12);

  // Etikett (åldrat papper)
  const lx = X(-4.4), ly = Y(2.72), lw = X(4.4) - lx, lh = Y(-1.25) - ly;
  ctx.save();
  roundRect(ctx, lx, ly, lw, lh, 14); ctx.clip();
  g = ctx.createLinearGradient(0, ly, 0, ly + lh);
  g.addColorStop(0, '#f1e8d0'); g.addColorStop(1, '#dfd0ae');
  ctx.fillStyle = g; ctx.fillRect(lx, ly, lw, lh);
  // färgband
  ctx.fillStyle = A; ctx.fillRect(lx, ly, lw, Y(2.0) - ly);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(lx, Y(2.0) - 3, lw, 3);
  ctx.fillStyle = '#ffffff'; ctx.font = F.mono(700, 26); ctx.textBaseline = 'middle';
  spaced(ctx, 'DREKMOR', X(-4.0), Y(2.36), 6); ctx.textAlign = 'right'; ctx.fillText(`${r.id}  ·  SIDA ${side}`, X(4.0), Y(2.36)); ctx.textAlign = 'left';
  // titel + linjer
  ctx.strokeStyle = 'rgba(70,55,35,0.28)'; ctx.lineWidth = 2;
  for (const ly2 of [1.12, -0.95]) { ctx.beginPath(); ctx.moveTo(X(-4.0), Y(ly2)); ctx.lineTo(X(4.0), Y(ly2)); ctx.stroke(); }
  ctx.fillStyle = '#231c12';
  fitSize(ctx, r.title.toUpperCase(), (s) => F.mono(700, s), X(4.0) - X(-4.0), 40, 20);
  ctx.textBaseline = 'alphabetic'; ctx.fillText(r.title.toUpperCase(), X(-4.0), Y(1.22));
  // sidobokstav
  ctx.fillStyle = '#231c12'; ctx.beginPath(); ctx.arc(X(-3.75), Y(LABEL.hubY), 0.42 * k, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1e8d0'; ctx.font = F.sans(700, 54); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(side, X(-3.75), Y(LABEL.hubY) + 2);
  ctx.fillStyle = '#231c12'; ctx.font = F.mono(700, 24); ctx.fillText('C-60', X(3.72), Y(0.32)); ctx.font = F.mono(400, 16); ctx.fillText('TYPE I', X(3.72), Y(-0.06));
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(35,28,18,0.7)'; ctx.font = F.mono(400, 15);
  spaced(ctx, 'NORMAL BIAS · 120µs EQ · STEREO', X(-4.0), Y(-1.1), 1.5);
  // fläckar + slitage på papperet
  for (let i = 0; i < 3; i++) {
    const sx = lx + rand() * lw, sy = ly + rand() * lh, sr = 30 + rand() * 60;
    const sg = ctx.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr);
    sg.addColorStop(0, 'rgba(120,85,40,0)'); sg.addColorStop(0.85, 'rgba(120,85,40,0.10)'); sg.addColorStop(1, 'rgba(120,85,40,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }
  scratches(ctx, W, H, 30, rand, 0.1);
  const eg = ctx.createLinearGradient(lx, 0, lx + lw, 0);
  eg.addColorStop(0, 'rgba(90,60,20,0.18)'); eg.addColorStop(0.08, 'rgba(0,0,0,0)'); eg.addColorStop(0.92, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(90,60,20,0.18)');
  ctx.fillStyle = eg; ctx.fillRect(lx, ly, lw, lh);
  ctx.restore();

  // Fönstret – stanslas ut helt (genomskinligt)
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  roundRect(ctx, X(-2.95), Y(0.9), X(2.95) - X(-2.95), Y(-0.6) - Y(0.9), 0.75 * k); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4;
  roundRect(ctx, X(-2.95), Y(0.9), X(2.95) - X(-2.95), Y(-0.6) - Y(0.9), 0.75 * k); ctx.stroke();

  grain(ctx, W, H, 9, rand);
  return c;
}

export function drawHub() {
  const S = 256, c = makeCanvas(S, S), ctx = c.getContext('2d'), m = S / 2;
  const g = ctx.createRadialGradient(m - 20, m - 20, 10, m, m, m);
  g.addColorStop(0, '#fbf6ea'); g.addColorStop(1, '#bfb6a2');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m, m, m - 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(m, m, 56, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.5; ctx.beginPath(); ctx.arc(m + Math.cos(a) * 92, m + Math.sin(a) * 92, 11, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = '#e6dfcf';
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(m, m); ctx.rotate(i * Math.PI / 3); ctx.fillRect(-8, -58, 16, 22); ctx.restore(); }
  return c;
}

export function drawSpool() {
  const S = 512, c = makeCanvas(S, S), ctx = c.getContext('2d'), m = S / 2;
  const rand = seeded('spool');
  for (let r = m; r > 0; r -= 1.6) {
    const l = 26 + rand() * 20;
    ctx.fillStyle = `rgb(${l + 18},${l + 5},${l - 8})`;
    ctx.beginPath(); ctx.arc(m, m, r, 0, Math.PI * 2); ctx.fill();
  }
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, 'rgba(255,220,180,0.16)'); g.addColorStop(0.45, 'rgba(255,220,180,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(m, m, m, 0, Math.PI * 2); ctx.fill();
  return c;
}

/* ============================================================ SPELAREN ===== */
export function brushed(w, h, base, spread, rand = Math.random) {
  const c = makeCanvas(w, h), ctx = c.getContext('2d');
  ctx.fillStyle = `rgb(${base},${base},${base})`; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    const v = base + (rand() - 0.5) * spread;
    ctx.fillStyle = `rgba(${v | 0},${v | 0},${(v + 3) | 0},0.55)`;
    ctx.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < h * 1.4; i++) {
    const v = base + (rand() - 0.5) * spread * 2.2;
    ctx.fillStyle = `rgba(${v | 0},${v | 0},${v | 0},0.35)`;
    ctx.fillRect(rand() * w, rand() * h, 40 + rand() * w * 0.4, 1);
  }
  return c;
}

/** Frontpanel med tryck. `L` = layout i panel-cm (origo i panelens mitt). */
export function drawPanel(L) {
  const W = 2048, H = Math.round(W * L.H / L.W);
  const k = W / L.W, X = (x) => (x + L.W / 2) * k, Y = (y) => (L.H / 2 - y) * k;
  const rand = seeded('panel');
  const base = brushed(W, H, 168, 30, rand);
  const c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.drawImage(base, 0, 0);
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // svart list nedtill
  ctx.fillStyle = '#101114'; ctx.fillRect(0, Y(-L.H / 2 + 1.25), W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(0, Y(-L.H / 2 + 1.25), W, 2);

  const ink = 'rgba(20,22,26,0.9)';
  ctx.textBaseline = 'alphabetic';
  // Varumärke
  ctx.fillStyle = ink; ctx.font = F.sans(700, 44); spaced(ctx, 'DRKMR', X(-21.0), Y(6.3), 12);
  ctx.font = F.mono(400, 17); ctx.fillStyle = 'rgba(20,22,26,0.7)';
  spaced(ctx, 'DECK-01  ·  STEREO CASSETTE DECK', X(-13.4), Y(6.36), 4);
  // tunn linje under brand
  ctx.fillStyle = 'rgba(20,22,26,0.25)'; ctx.fillRect(X(-21), Y(5.9), X(-0.4) - X(-21), 2);

  // Displayens infattning
  const v = L.vfd;
  roundRect(ctx, X(v.x - v.w / 2 - 0.35), Y(v.y + v.h / 2 + 0.35), (v.w + 0.7) * k, (v.h + 0.7) * k, 16);
  ctx.fillStyle = '#07080a'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = ink; ctx.font = F.mono(700, 15);
  spaced(ctx, 'SIGNAL PROCESSING · FL DISPLAY', X(v.x - v.w / 2), Y(v.y + v.h / 2 + 0.72), 4);
  ctx.textAlign = 'right'; spaced(ctx, 'NR · MPX · AUTO TAPE SELECT', X(v.x + v.w / 2), Y(v.y + v.h / 2 + 0.72), 4, 'right'); ctx.textAlign = 'left';

  // Knappetiketter
  ctx.font = F.mono(700, 15); ctx.fillStyle = ink; ctx.textAlign = 'center';
  for (const key of L.keys) spaced(ctx, key.label, X(key.x), Y(key.y - key.h / 2 - 0.45), 2, 'center');
  spaced(ctx, 'POWER', X(L.power.x), Y(L.power.y - 1.0), 2, 'center');
  // Indikatorer bredvid knapparna
  const ix = L.keys[L.keys.length - 1].x + 2.2;
  [['NR', true], ['MPX', false], ['TYPE I', true]].forEach(([t, on], i) => {
    const iy = L.keys[0].y + 0.55 - i * 0.62;
    ctx.fillStyle = on ? 'rgba(20,22,26,0.85)' : 'rgba(20,22,26,0.4)';
    roundRect(ctx, X(ix) - 12, Y(iy) - 7, 24, 14, 3); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = F.mono(700, 14); ctx.fillStyle = ink; ctx.fillText(t, X(ix) + 20, Y(iy) + 5);
  });

  // Volymskala
  ctx.textAlign = 'center'; ctx.strokeStyle = ink; ctx.fillStyle = ink;
  const kx = X(L.knob.x), ky = Y(L.knob.y);
  for (let i = 0; i <= 10; i++) {
    const a = (-225 + i * 27) * Math.PI / 180, r0 = (L.knob.r + 0.35) * k, r1 = r0 + (i % 5 === 0 ? 0.45 : 0.25) * k;
    ctx.lineWidth = i % 5 === 0 ? 4 : 2.5;
    ctx.beginPath(); ctx.moveTo(kx + Math.cos(a) * r0, ky + Math.sin(a) * r0); ctx.lineTo(kx + Math.cos(a) * r1, ky + Math.sin(a) * r1); ctx.stroke();
  }
  ctx.font = F.mono(700, 15);
  spaced(ctx, 'VOLUME', kx, ky + (L.knob.r + 1.25) * k, 3, 'center');
  ctx.textAlign = 'left';

  // Skruvar i hörnen
  for (const [sx, sy] of [[-21.3, 6.85], [21.3, 6.85], [-21.3, -6.95], [21.3, -6.95]]) screw(ctx, X(sx), Y(sy), 11);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = F.mono(400, 14); ctx.textAlign = 'right';
  spaced(ctx, 'DREKMOR SIGNAL ARCHIVE SERIES — MADE FOR THE NIGHT', X(20.4), Y(-L.H / 2 + 0.5), 3, 'right');
  ctx.textAlign = 'left';

  const rough = brushed(W, H, 105, 40, seeded('panel-r'));
  const rctx = rough.getContext('2d');
  rctx.fillStyle = 'rgb(150,150,150)'; rctx.fillRect(0, Y(-L.H / 2 + 1.25), W, H);
  return { map: c, rough };
}

export function drawTopPlate(w, d) {
  const W = 1024, H = Math.round(W * d / w), k = W / w;
  const c = brushed(W, H, 26, 14, seeded('top'));
  const ctx = c.getContext('2d');
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 16; col++) {
      const x = (4 + col * 2.1) * k, y = (2.5 + row * 0.9) * k;
      ctx.fillStyle = '#030303'; roundRect(ctx, x, y, 1.5 * k, 0.38 * k, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, y + 0.38 * k, 1.5 * k, 2);
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.font = F.sans(700, 40); ctx.textAlign = 'center';
  spaced(ctx, 'DRKMR', W / 2, H - 1.6 * k, 16, 'center');
  return c;
}

export function drawKeyFace(kind) {
  const W = 160, H = 120, c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = kind === 'play' ? '#ffc46b' : '#d7dce3';
  ctx.strokeStyle = ctx.fillStyle;
  const cx = W / 2, cy = H / 2, s = 22;
  const tri = (x, y, dir) => { ctx.beginPath(); ctx.moveTo(x - s * 0.55 * dir, y - s * 0.6); ctx.lineTo(x + s * 0.55 * dir, y); ctx.lineTo(x - s * 0.55 * dir, y + s * 0.6); ctx.closePath(); ctx.fill(); };
  switch (kind) {
    case 'play': tri(cx, cy, 1); break;
    case 'rew': tri(cx - 11, cy, -1); tri(cx + 11, cy, -1); break;
    case 'ff': tri(cx - 11, cy, 1); tri(cx + 11, cy, 1); break;
    case 'stop': ctx.fillRect(cx - s * 0.5, cy - s * 0.5, s, s); break;
    case 'pause': ctx.fillRect(cx - s * 0.5, cy - s * 0.55, s * 0.32, s * 1.1); ctx.fillRect(cx + s * 0.18, cy - s * 0.55, s * 0.32, s * 1.1); break;
    case 'eject':
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.7); ctx.lineTo(cx + s * 0.6, cy + s * 0.05); ctx.lineTo(cx - s * 0.6, cy + s * 0.05); ctx.closePath(); ctx.fill();
      ctx.fillRect(cx - s * 0.6, cy + s * 0.3, s * 1.2, s * 0.26); break;
  }
  return c;
}

export function drawKnob() {
  const side = makeCanvas(512, 32), s = side.getContext('2d');
  for (let x = 0; x < 512; x += 4) { s.fillStyle = x % 8 ? '#3a3e44' : '#9aa0a8'; s.fillRect(x, 0, 4, 32); }
  const top = makeCanvas(256, 256), t = top.getContext('2d'), m = 128;
  for (let a = 0; a < 360; a += 1) {
    const l = 130 + Math.sin(a * 0.35) * 18 + (Math.random() - 0.5) * 30;
    t.fillStyle = `rgb(${l | 0},${l | 0},${(l + 4) | 0})`;
    t.beginPath(); t.moveTo(m, m); t.arc(m, m, m, a * Math.PI / 180, (a + 1.4) * Math.PI / 180); t.fill();
  }
  const g = t.createRadialGradient(m, m, 10, m, m, m); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
  t.fillStyle = g; t.fillRect(0, 0, 256, 256);
  t.fillStyle = '#ff5a3c'; roundRect(t, m - 5, 14, 10, 52, 5); t.fill();
  return { side, top };
}

export function drawDesk() {
  const S = 1024, c = makeCanvas(S, S), ctx = c.getContext('2d'), rand = seeded('desk');
  ctx.fillStyle = '#0d0b0a'; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const y = rand() * S, amp = 4 + rand() * 14, f = 0.002 + rand() * 0.006, ph = rand() * 6.28;
    ctx.strokeStyle = rand() < 0.5 ? `rgba(255,225,190,${0.012 + rand() * 0.03})` : `rgba(0,0,0,${0.1 + rand() * 0.2})`;
    ctx.lineWidth = 1 + rand() * 3;
    ctx.beginPath();
    for (let x = -10; x <= S + 10; x += 16) { const yy = y + Math.sin(x * f + ph) * amp; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke();
  }
  grain(ctx, S, S, 8, rand);
  const r = makeCanvas(512, 512), rc = r.getContext('2d');
  rc.fillStyle = 'rgb(95,95,95)'; rc.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = rand() * 512, y = rand() * 512, rr = 20 + rand() * 90, v = rand() < 0.5 ? 150 : 60;
    const g = rc.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, `rgba(${v},${v},${v},0.45)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    rc.fillStyle = g; rc.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  return { map: c, rough: r };
}

/** Mjukt ljusspill på bakväggen – ingen skarp form, bara atmosfär. */
export function drawBackGlow() {
  const W = 1024, H = 512, c = makeCanvas(W, H), ctx = c.getContext('2d');
  ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
  const blob = (x, y, rx, ry, color, a) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx / ry, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
    g.addColorStop(0, rgba(color, a)); g.addColorStop(0.5, rgba(color, a * 0.35)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(-ry, -ry, ry * 2, ry * 2); ctx.restore();
  };
  blob(W * 0.2, H * 0.58, 380, 260, '#c42a80', 0.5);
  blob(W * 0.8, H * 0.55, 380, 260, '#1fb0d0', 0.55);
  blob(W * 0.5, H * 0.95, 520, 180, '#3b2a8f', 0.35);
  grain(ctx, W, H, 10);
  return c;
}

export function drawSprite() {
  const S = 64, c = makeCanvas(S, S), ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  return c;
}

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
