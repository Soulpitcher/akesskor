/* =============================================================================
   Kontrollrummet – närbilderna: larmtablån (välj signal), skrivarna (låten och
   journalen) och anslaget (om Drekmor). Vanlig HTML, så att allt går att läsa,
   markera och nå med tangentbord och skärmläsare.
   ============================================================================= */

const $ = (s, el = document) => el.querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TYPE = { song: 'Låt', interview: 'Intervju', story: 'Berättelse' };
const LINKS = { spotify: 'Spotify', apple: 'Apple Music', youtube: 'YouTube', tidal: 'Tidal', deezer: 'Deezer', bandcamp: 'Bandcamp' };
const MONTHS = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
const date = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}` : ''; };
export const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** Sliten emaljplåt, ritad en gång och använd som bakgrund på skåpen. */
function enamel() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#7f9f91'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const x = rnd() * S, y = rnd() * S, r = 6 + rnd() * 46; g.fillStyle = `rgba(${rnd() < 0.5 ? '40,62,54' : '168,196,182'},${0.012 + rnd() * 0.02})`; g.beginPath(); g.ellipse(x, y, r, r * (0.4 + rnd()), rnd() * 3, 0, 7); g.fill(); }
  for (let i = 0; i < 90; i++) { const x = rnd() * S, y = rnd() * S; g.strokeStyle = `rgba(200,222,210,${0.03 + rnd() * 0.06})`; g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 90, y + (rnd() - 0.5) * 14); g.stroke(); }
  for (let i = 0; i < 24; i++) {
    const x = rnd() * S, y = rnd() * S, n = 2 + Math.floor(rnd() * 9);
    for (let k = 0; k < n; k++) { const r = 0.6 + rnd() * 3.4; g.fillStyle = `rgba(${96 + rnd() * 50},${50 + rnd() * 24},${24 + rnd() * 14},${0.2 + rnd() * 0.45})`; g.beginPath(); g.ellipse(x + (rnd() - 0.5) * 46, y + (rnd() - 0.5) * 16, r * 1.5, r * 0.8, rnd() * 3, 0, 7); g.fill(); }
    if (rnd() < 0.4) { const gr = g.createLinearGradient(0, y, 0, y + 50); gr.addColorStop(0, 'rgba(110,58,28,0.3)'); gr.addColorStop(1, 'rgba(110,58,28,0)'); g.fillStyle = gr; g.fillRect(x - 1.5, y, 3, 50); }
  }
  const d = g.getImageData(0, 0, S, S); for (let i = 0; i < d.data.length; i += 4) { const n = (rnd() - 0.5) * 14; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } g.putImageData(d, 0, 0);
  return c.toDataURL('image/jpeg', 0.82);
}

export class Panels {
  constructor(releases, h) {
    this.releases = releases; this.h = h; this.open = null; this.cur = null; this.playing = false;
    document.documentElement.style.setProperty('--enamel', `url(${enamel()})`);
    this.tabla = $('#tabla'); this.rec = $('#rec'); this.om = $('#om');
    // vänster tablå i pulten = låtarna, höger = extramaterialet (intervjuer och berättelser)
    this.groups = [
      { key: 'songs', label: 'Låtar', list: releases.filter((r) => r.type === 'song') },
      { key: 'extra', label: 'Extramaterial', list: releases.filter((r) => r.type !== 'song') },
    ];
    this.cols = 0; this.buildTabla();
    this.trace = $('#rec-trace'); this.tctx = this.trace.getContext('2d');
    this.journal = $('#rec-journal'); this.lastScroll = 0;
    this.journal.addEventListener('wheel', () => (this.lastScroll = performance.now()), { passive: true });
    this.journal.addEventListener('touchmove', () => (this.lastScroll = performance.now()), { passive: true });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.h.close()));
    for (const p of [this.tabla, this.rec, this.om]) p.addEventListener('pointerdown', (e) => { if (e.target === p) this.h.close(); });
    $('#pb-play').addEventListener('click', () => this.h.toggle());
    $('#pb-stop').addEventListener('click', () => this.h.stop());
    $('#pb-rec').addEventListener('click', () => this.h.show('rec'));
    this.fillRec(null);
  }

  /* ------------------------------------------------------------ tablån -- */
  buildTabla() {
    const portrait = document.body.classList.contains('portrait');
    const cols = matchMedia('(max-width: 720px)').matches ? 2 : 4, key = cols + (portrait ? 'p' : 'm');
    if (key === this.cols) return; this.cols = key;
    const host = $('#mods'); host.innerHTML = ''; this.tiles = new Map();
    for (const g of this.groups) {
      const mod = el('div', 'mod', `<span class="plate plate--tag mod__tag">${g.label}</span><i class="screw s1"></i><i class="screw s2"></i><i class="screw s3"></i><i class="screw s4"></i>`);
      mod.dataset.group = g.key;
      const grid = el('div', 'tiles'); grid.style.setProperty('--cols', cols); mod.appendChild(grid); host.appendChild(mod);
      const R = g.list, rows = Math.max(portrait ? 1 : 5, Math.ceil(R.length / cols));
      let next = true;
      for (let r = 0; r < rows; r++) {
        grid.appendChild(el('span', 'rowl', 'ABCDEFGHJKLMNPQRSTUVWXYZ'[r] || ''));
        for (let c = 0; c < cols; c++) {
          const rel = R[r * cols + c];
          if (!rel) { grid.appendChild(el('span', 'tile is-blank')); continue; }
          const b = el('button', 'tile'); b.type = 'button'; b.dataset.id = rel.id;
          const kind = TYPE[rel.type] || '', reads = rel.type === 'story' && !rel.audio;
          if (rel.status === 'available') {
            b.classList.add('is-available');
            b.innerHTML = `<span class="tile__id">${esc(rel.id)}</span><span class="tile__t">${esc(rel.title)}</span><span class="tile__k">${esc(kind)}${rel.duration ? ' · ' + esc(rel.duration) : ''}</span>`;
            b.setAttribute('aria-label', `${rel.id} ${rel.title}, ${kind.toLowerCase()}. ${reads ? 'Läs' : 'Spela'}.`);
          } else if (rel.status === 'coming') {
            b.classList.add('is-coming'); if (next) { b.classList.add('is-next'); next = false; }
            b.innerHTML = `<span class="tile__id">${esc(rel.id)}</span><span class="tile__t">${esc(rel.title)}</span>${g.key === 'extra' ? `<span class="tile__k">${esc(kind)}</span>` : ''}<span class="tile__tape">Ej i drift</span>`;
            b.setAttribute('aria-label', `${rel.id} ${rel.title}. Inte släppt än.`);
          } else {
            b.classList.add('is-locked');
            b.innerHTML = `<span class="tile__id">${esc(rel.id)}</span>`;
            b.setAttribute('aria-label', `${rel.id}. Låst.`);
          }
          b.addEventListener('click', () => this.h.select(rel));
          grid.appendChild(b); this.tiles.set(rel.id, b);
        }
      }
    }
    this.mark();
  }
  mark() {
    for (const [id, b] of this.tiles) { const on = this.cur?.id === id; b.classList.toggle('is-active', on); b.classList.toggle('is-playing', on && this.playing); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    $('#pb-play').classList.toggle('is-on', this.playing);
    $('#pb-play-l').textContent = this.playing ? 'Paus' : 'Spela';
  }
  deny(rel) { const b = this.tiles.get(rel.id); if (!b) return; b.classList.remove('is-denied'); void b.offsetWidth; b.classList.add('is-denied'); }

  /* ---------------------------------------------------------- skrivarna -- */
  fillRec(rel) {
    const sig = $('#rec-signal'), j = this.journal;
    if (!rel) {
      sig.innerHTML = '<p class="stamp">Ingen signal</p>';
      j.innerHTML = '<p class="typed typed--dim">Välj en signal på tablån.</p>';
      return;
    }
    sig.innerHTML = `${rel.cover ? `<img class="paper__cover" src="${esc(rel.cover)}" alt="Omslag: ${esc(rel.title)}">` : ''}
      <p class="paper__id">${esc(rel.id)} · ${esc(TYPE[rel.type] || '')}${rel.duration ? ' · ' + esc(rel.duration) : ''}</p>
      <h2 class="paper__title" id="rec-title">${esc(rel.title)}</h2>`;
    const links = Object.entries(rel.links || {}).filter(([k, v]) => v && LINKS[k]).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${LINKS[k]}</a>`).join('');
    const credits = (rel.credits || []).map((c) => `<div><dt>${esc(c.role)}</dt><dd>${esc(c.name)}</dd></div>`).join('');
    j.innerHTML = `
      ${rel.notes ? `<p class="typed typed--lead">${esc(rel.notes)}</p>` : ''}
      ${date(rel.releaseDate) ? `<p class="typed typed--dim">Släppt ${date(rel.releaseDate)}</p>` : ''}
      ${credits ? `<dl class="credits">${credits}</dl>` : ''}
      ${links ? `<p class="outs">${links}</p>` : ''}
      ${rel.text ? `<h3 class="typed-h">${rel.type === 'song' ? 'Text' : rel.type === 'interview' ? 'Utskrift' : 'Berättelse'}</h3><pre class="lyrics">${esc(rel.text)}</pre>` : ''}`;
    j.scrollTop = 0;
  }
  setCurrent(rel, playing) {
    if (rel !== this.cur) { this.cur = rel; this.fillRec(rel); }
    this.playing = playing; this.mark();
  }

  /** Körs varje bildruta medan skrivarna är öppna. */
  tick(hist, progress, playing) {
    if (this.open !== 'rec') return;
    const cv = this.trace, w = cv.clientWidth, h = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = this.tctx; g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    const mid = h / 2, n = hist.length, step = 2;
    g.strokeStyle = 'rgba(150,34,22,0.88)'; g.lineWidth = 1.15; g.lineCap = 'round'; g.beginPath();
    for (let x = w - 26, k = 0; x > 0; x -= step, k++) { const v = n ? hist[n - 1 - k] || 0 : 0; g.moveTo(x, mid - v * mid * 0.86); g.lineTo(x, mid + v * mid * 0.7 + 0.5); }
    g.stroke();
    const v = n ? hist[n - 1] : 0; $('#rec-pen').style.transform = `translateY(${(-v * mid * 0.86).toFixed(1)}px)`;
    // journalen följer med låten tills läsaren själv tar över
    if (playing && performance.now() - this.lastScroll > 5000) {
      const j = this.journal, max = j.scrollHeight - j.clientHeight;
      if (max > 0) j.scrollTop += (Math.max(0, Math.min(1, (progress - 0.06) / 0.88)) * max - j.scrollTop) * 0.04;
    }
  }

  /* ------------------------------------------------------- öppna/stäng -- */
  show(name, mode = 'songs') {
    if (name === 'tabla') {
      this.tabla.dataset.mode = mode;
      this.tabla.setAttribute('aria-label', mode === 'extra' ? 'Tablå: extramaterial' : 'Tablå: välj låt');
    }
    if (this.open === name) return;
    this.hide(true);
    const p = this[name]; if (!p) return;
    this.buildTabla();
    this.returnTo = document.activeElement;
    this.open = name; p.hidden = false; void p.offsetWidth; p.classList.add('is-open');
    document.body.dataset.panel = name;
    const m = name === 'tabla' && p.querySelector(`.mod[data-group="${mode}"]`);
    const f = (m && (m.querySelector('.tile.is-active') || m.querySelector('.tile.is-available'))) || p.querySelector('[data-close]');
    f?.focus({ preventScroll: true });
  }
  hide(silent) {
    if (!this.open) return;
    const p = this[this.open]; this.open = null; delete document.body.dataset.panel;
    p.classList.remove('is-open');
    setTimeout(() => { if (!p.classList.contains('is-open')) p.hidden = true; }, 380);
    if (!silent) this.returnTo?.focus?.({ preventScroll: true });
  }
}
