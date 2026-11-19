/* =============================================================================
   Kontrollrummet – bandets D-logga på bildskärmen, som en gammal TV-vinjett:
   ett grönt rutnät som står still och ett D som vänder sig ett varv runt sin
   lodräta axel och sedan står still en stund. Samma ritning används på skärmen
   i väggen (liten) och i närbilden (stor).
   ============================================================================= */

/** D:et med genomskinlig bakgrund, utklippt ur bandets gröna logga. */
export const DLOGO = new Image();
DLOGO.decoding = 'async';
DLOGO.src = 'assets/monitor-d.png';

const TURN = 2.6, HOLD = 3.2; // ett varv, sedan stilla

/** Rita vinjetten i g (w × h). t = sekunder, rm = reducerad rörelse (D:et står still). */
export function drawIdent(g, w, h, t, rm) {
  g.save();
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#010c07'; g.fillRect(0, 0, w, h);
  // rutnätet
  const step = Math.min(w, h) / 6.5, lw = Math.max(1, w / 320);
  g.strokeStyle = 'rgba(80,215,170,0.13)'; g.lineWidth = lw; g.beginPath();
  for (let x = (w / 2) % step; x < w; x += step) { g.moveTo(x, 0); g.lineTo(x, h); }
  for (let y = (h / 2) % step; y < h; y += step) { g.moveTo(0, y); g.lineTo(w, y); }
  g.stroke();
  const img = DLOGO;
  if (img.complete && img.naturalWidth) {
    const k = rm ? TURN : t % (TURN + HOLD), u = Math.min(1, k / TURN);
    const a = ((1 - Math.cos(Math.PI * u)) / 2) * Math.PI * 2; // mjuk start och mjukt stopp
    const sx = Math.cos(a), dh = h * 0.66, dw = (dh * img.naturalWidth) / img.naturalHeight;
    const thick = dw * 0.075 * Math.sin(a), face = 0.55 + 0.45 * Math.abs(sx);
    g.translate(w / 2 + w * 0.015, h / 2);
    // djupet: kopior bakom framsidan, förskjutna åt det håll D:et vrider sig
    for (let i = 5; i >= 1; i--) {
      g.save(); g.translate(thick * (i / 5), 0); g.scale(sx || 0.001, 1);
      g.globalAlpha = 0.16 * face; g.drawImage(img, -dw / 2, -dh / 2, dw, dh); g.restore();
    }
    g.save(); g.scale(sx || 0.001, 1);
    g.globalAlpha = face; g.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    // fosforn blöder lite
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.22 * face;
    g.drawImage(img, -dw * 0.52, -dh * 0.52, dw * 1.04, dh * 1.04);
    g.restore();
  }
  g.restore();
}
