/* =============================================================================
   DOM-lagret ovanpå 3D-scenen: laddare (på däckets display i en stillbild av
   rummet), HUD, markör, index, omslag, lo-fi, toast.
   ============================================================================= */
import { TYPE_LABEL } from './textures.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (t) => (!isFinite(t) || t <= 0 ? '0:00' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
const statusWord = (r) => (r.status === 'locked' ? 'Låst' : r.status === 'coming' ? 'Snart' : TYPE_LABEL[r.type] || '');
const SEGS = 24;

/** Projektiv avbildning: elementets egna hörn (0,0)…(W,H) på fyra skärmpunkter. Returnerar matrix3d(). */
function warpTo(W, H, Q) {
  const adj = (m) => [m[4] * m[8] - m[5] * m[7], m[2] * m[7] - m[1] * m[8], m[1] * m[5] - m[2] * m[4], m[5] * m[6] - m[3] * m[8], m[0] * m[8] - m[2] * m[6], m[2] * m[3] - m[0] * m[5], m[3] * m[7] - m[4] * m[6], m[1] * m[6] - m[0] * m[7], m[0] * m[4] - m[1] * m[3]];
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]; return r; };
  const basis = (p) => { const m = [p[0][0], p[1][0], p[2][0], p[0][1], p[1][1], p[2][1], 1, 1, 1], a = adj(m), x = p[3][0], y = p[3][1];
    const v = [a[0] * x + a[1] * y + a[2], a[3] * x + a[4] * y + a[5], a[6] * x + a[7] * y + a[8]]; return mul(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]); };
  const h = mul(basis(Q), adj(basis([[0, 0], [W, 0], [W, H], [0, H]])));
  const t = h.map((v) => v / h[8]);
  return `matrix3d(${[t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, 1].map((v) => +v.toFixed(8)).join(',')})`;
}

export const UI = {
  init(handlers) {
    this.h = handlers;
    this.el = {
      loader: $('loader'), still: $('still'), osd: $('osd'), osdPc: $('osd-pc'), osdBar: $('osd-bar'), osdStatus: $('osd-status'), osdCta: $('osd-cta'), osdSnd: $('osd-snd'), gate: $('gate'),
      enter: $('enter'), gateSound: $('gate-sound'), scene: $('scene'),
      hud: $('hud'), label: $('hud-label'), title: $('hud-title'), sub: $('hud-sub'), hint: $('hud-hint'), keys: $('keys'), back: $('back'),
      actionsBar: $('hud-actions'), play: $('act-play'), progress: $('hud-progress'), time: $('hud-time'), dur: $('hud-dur'), bar: $('hud-bar'), barFill: $('hud-fill'),
      cursor: $('cursor'), cursorLabel: $('cursor-label'), toast: $('toast'), live: $('live'),
      index: $('index'), tracklist: $('tracklist'), about: $('about'), jcard: $('jcard'), sound: $('toggle-sound'),
      lite: $('lite'), liteGo: $('lite-go'), liteStay: $('lite-stay'), lofiNote: $('lofi-note'),
    };
    const e = this.el;
    this.gateSound = true;
    e.enter.addEventListener('click', () => { if (this._ready) handlers.enter(this.gateSound); });
    e.enter.addEventListener('keydown', (ev) => { if ((ev.key === 'Enter' || ev.key === ' ') && this._ready) { ev.preventDefault(); handlers.enter(this.gateSound); } });
    const flip = (ev) => { ev.stopPropagation(); this.gateSound = !this.gateSound; this.paintGate(); };
    e.osdSnd.addEventListener('click', flip);
    e.gateSound.addEventListener('click', flip);
    $('open-index').addEventListener('click', () => this.open('index'));
    $('open-about').addEventListener('click', () => this.open('about'));
    $('open-lofi').addEventListener('click', (ev) => { ev.preventDefault(); this.lite(true); });
    e.liteStay.addEventListener('click', () => this.lite(false));
    e.liteGo.addEventListener('click', (ev) => { ev.preventDefault(); handlers.goLofi(); });
    e.lite.addEventListener('click', (ev) => { if (ev.target === e.lite) this.lite(false); });
    e.sound.addEventListener('click', () => handlers.toggleSound());
    e.play.addEventListener('click', () => handlers.playPause());
    $('act-inlay').addEventListener('click', () => handlers.inlay());
    $('act-eject').addEventListener('click', () => handlers.eject());
    e.back.addEventListener('click', () => handlers.setView('desk'));
    e.bar.addEventListener('click', (ev) => { const r = e.bar.getBoundingClientRect(); handlers.seekTo((ev.clientX - r.left) / r.width); });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.closeAll()));
    for (const sheet of [e.index, e.about, e.jcard]) sheet.addEventListener('click', (ev) => { if (ev.target === sheet) this.closeAll(); });
    $('count').textContent = handlers.releases.length;
    this.buildIndex(handlers.releases);
    this.loadStill();
    addEventListener('resize', () => this.placeOSD());
  },

  /* ----------------------------------------------- laddaren på displayen -- */
  /* Stillbilden (assets/still.jpg, 2.4:1) passas i höjd och centreras; i liggande
     fönster 1.4:1 och bredare är det exakt rummets egen bild. Displayens hörn
     (assets/still.json) ger laddningstexten sin plats i perspektiv.            */
  loadStill() {
    const im = new Image(); im.decoding = 'async';
    im.onload = () => { if (this._entered) return; this.el.still.style.backgroundImage = `url("${im.src}")`; this.el.still.classList.add('on'); this.placeOSD(); };
    im.src = 'assets/still.jpg';
    fetch('assets/still.json').then((r) => r.json()).then((j) => { this.stillInfo = j; this.placeOSD(); }).catch(() => {});
  },
  stillMatches(yes) { this._matches = yes; this.placeOSD(); },
  placeOSD() {
    const o = this.el.osd, info = this.stillInfo;
    const landscape = innerWidth / innerHeight >= 1.4;
    if (!info || !landscape || !this._matches || !this.el.still.classList.contains('on')) { o.classList.remove('placed'); o.style.cssText = ''; return; }
    const k = innerHeight / info.h, cx = innerWidth / 2 - (info.w * k) / 2;
    const Q = info.vfd.map(([x, y]) => [x * k + cx, y * k]);
    const W = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]), H = Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]);
    o.style.cssText = `width:${W}px;height:${H}px;font-size:${Math.max(7, H * 0.2)}px;transform:${warpTo(W, H, Q)}`;
    o.classList.add('placed');
  },
  loading(p, text) {
    const e = this.el, n = Math.round(p * SEGS);
    e.osdPc.textContent = String(Math.floor(p * 100)).padStart(3, ' ') + '%';
    e.osdBar.innerHTML = '▮'.repeat(n) + '<i>' + '▯'.repeat(SEGS - n) + '</i>';
    if (text) e.osdStatus.textContent = text.toUpperCase();
  },
  paintGate() { this.el.osdSnd.innerHTML = `LJUD <b class="${this.gateSound ? 'on' : ''}">PÅ</b><b class="${this.gateSound ? '' : 'on'}">AV</b>`; this.el.gateSound.setAttribute('aria-checked', String(this.gateSound)); },
  ready() {
    this._ready = true;
    this.loading(1, 'Arkivet är redo');
    this.el.osd.classList.add('enter');
    this.el.osdCta.textContent = 'KLICKA FÖR ATT GÅ IN';
    this.paintGate();
    this.el.gate.hidden = false; this.el.enter.hidden = false; this.el.gateSound.hidden = false;
    this.el.enter.focus({ preventScroll: true });
  },
  entered() {
    this._entered = true;
    const e = this.el;
    e.osd.classList.add('out'); e.gate.classList.add('out'); e.still.classList.add('out'); e.scene.classList.add('ready');
    document.body.classList.add('entered');
    e.enter.hidden = true; e.gateSound.hidden = true;
    setTimeout(() => { e.loader.hidden = true; }, 1600);
  },

  /* ---------------------------------------------------------------- lo-fi -- */
  lofi(why) {
    document.body.classList.add('lofi');
    const msg = { soft: 'Din dator ritar 3D utan grafikkort, så rummet skulle gå tungt. Du får den enkla versionen – eller provar rummet ändå.',
      nogl: 'Din webbläsare kan inte visa 3D-rummet. Här är arkivet som lista.', chosen: 'Lo-fi-version: samma arkiv, utan 3D-rummet.' }[why];
    this.el.lofiNote.textContent = msg; this.el.lofiNote.hidden = false;
    $('lofi-try').hidden = why === 'nogl';
    this.loading(1, 'Lo-fi');
    this.el.osd.classList.add('enter'); this.el.osdCta.textContent = 'KLICKA FÖR ATT ÖPPNA ARKIVET'; this.paintGate();
    this.el.gate.hidden = false; this.el.enter.hidden = false; this.el.gateSound.hidden = false; this._ready = true; this.el.enter.focus({ preventScroll: true });
  },
  lite(open) {
    this.el.lite.hidden = !open; document.body.classList.toggle('liteup', open);
    if (open) this.el.liteGo.focus({ preventScroll: true });
  },

  /* ------------------------------------------------------------------ HUD -- */
  setView(v) {
    document.body.dataset.view = v;
    this.el.back.hidden = v === 'desk';
    this.el.back.textContent = v === 'deck' ? 'Tillbaka · Esc' : v === 'window' ? 'Tillbaka till bordet · Esc' : 'Tillbaka · Esc';
    this.el.keys.innerHTML = v === 'window'
      ? '<b>Esc</b> tillbaka · <b>Mellanslag</b> spela'
      : '<b>1–4</b> band · <b>Mellanslag</b> spela · <b>Z</b> däcket · <b>F</b> fönstret · <b>E</b> mata ut · <b>O</b> omslag · <b>I</b> arkivet';
  },
  setTape(r) {
    const e = this.el;
    if (!r) {
      e.label.textContent = 'I däcket'; e.title.textContent = 'Inget band'; e.sub.textContent = 'Välj en kassett ur arkivet';
      e.actionsBar.hidden = true; e.progress.hidden = true; document.body.style.removeProperty('--tape');
      return;
    }
    e.label.textContent = `I däcket · ${r.id}`;
    e.title.textContent = r.title;
    e.sub.textContent = r.status === 'coming' ? 'Ännu inte släppt · öppna omslaget för en förhandstitt' : r.audio ? 'Redo att spela' : 'Demosignal – riktig inspelning kommer';
    e.actionsBar.hidden = false; e.progress.hidden = r.status !== 'available';
    e.play.disabled = r.status !== 'available';
    document.body.style.setProperty('--tape', r.accent || '#38cfe0');
    this.hideHint();
  },
  setPlaying(playing) {
    this.el.play.classList.toggle('is-playing', playing);
    this.el.play.querySelector('span').textContent = playing ? 'Paus' : 'Spela';
    this.el.play.setAttribute('aria-label', playing ? 'Pausa' : 'Spela');
  },
  setProgress(time, dur) {
    this.el.time.textContent = fmt(time); this.el.dur.textContent = dur ? fmt(dur) : '—';
    this.el.barFill.style.transform = `scaleX(${dur ? time / dur : 0})`;
  },
  sub(text) { this.el.sub.textContent = text; },
  hideHint() { this.el.hint.classList.add('gone'); },

  /* --------------------------------------------------------------- markör -- */
  cursor(x, y, label, active) {
    const c = this.el.cursor;
    c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    c.classList.toggle('active', !!active);
    if (label !== this._label) { this._label = label; this.el.cursorLabel.innerHTML = label || ''; }
  },
  cursorHidden(h) { this.el.cursor.classList.toggle('hidden', h); },

  toast(msg) {
    const t = this.el.toast; t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 3400);
    this.announce(msg);
  },
  announce(msg) { this.el.live.textContent = ''; requestAnimationFrame(() => (this.el.live.textContent = msg)); },
  setSound(on) {
    this.el.sound.setAttribute('aria-pressed', String(on));
    this.el.sound.querySelector('.sound__txt').textContent = on ? 'Ljud på' : 'Ljud av';
  },

  /* ---------------------------------------------------------- index/arkiv -- */
  buildIndex(releases) {
    this.el.tracklist.innerHTML = releases.map((r) => `
      <li><button class="track" data-id="${esc(r.id)}" data-status="${r.status}" style="--c:${esc(r.accent || '#38cfe0')}">
        <span class="track__id">${esc(r.id)}</span>
        <span class="track__title">${esc(r.title)}</span>
        <span class="track__meta">${esc(statusWord(r))}${r.duration ? ' · ' + esc(r.duration) : ''}</span>
        <span class="track__go" aria-hidden="true">${r.status === 'locked' ? '⊘' : '→'}</span>
      </button></li>`).join('');
    this.el.tracklist.querySelectorAll('.track').forEach((b) => b.addEventListener('click', () => { this.closeAll(); this.h.pick(b.dataset.id); }));
  },

  open(name, opener) {
    this.closeAll(true);
    const el = this.el[name]; if (!el) return;
    this._return = opener || document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    const f = el.querySelector('[data-close]'); f && f.focus({ preventScroll: true });
    document.body.classList.add('modal');
    this.h.modal(true);
  },
  closeAll(silent) {
    let any = false;
    if (!this.el.lite.hidden) { this.lite(false); any = true; }
    for (const k of ['index', 'about', 'jcard']) {
      const el = this.el[k];
      if (!el.hidden) { any = true; el.classList.remove('open'); setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; }, 520); }
    }
    if (any) { document.body.classList.remove('modal'); this.h.modal(false); if (!silent && this._return) this._return.focus?.({ preventScroll: true }); }
    return any;
  },
  isOpen() { return ['index', 'about', 'jcard'].some((k) => !this.el[k].hidden); },

  /* ---------------------------------------------------- omslaget (J-kort) -- */
  openJCard(r, artURL) {
    const creds = (r.credits || []).filter((c) => c && c.name);
    const links = r.links || {}, names = { spotify: 'Spotify', apple: 'Apple Music', youtube: 'YouTube', tidal: 'Tidal', deezer: 'Deezer', bandcamp: 'Bandcamp' };
    const heading = { song: 'Text', interview: 'Transkript', story: 'Berättelse' }[r.type] || 'Text';
    const body = r.status === 'locked' ? 'Signalen är krypterad.\nBandet är låst tills vidare.'
      : r.status === 'coming' ? 'Texten publiceras när signalen släpps.\nSnart i sändning.'
      : (r.text && r.text.trim()) || 'Innehåll läggs till här.';
    const meta = [r.releaseDate && new Date(r.releaseDate).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }), r.duration, TYPE_LABEL[r.type]].filter(Boolean);

    $('jc-art').src = artURL; $('jc-art').alt = `Omslag: ${r.title}`;
    $('jc-spine').innerHTML = `<b>${esc(r.id)}</b> ${esc(r.title)} <i>DREKMOR</i>`;
    $('jc-id').textContent = r.id;
    $('jc-title').textContent = r.title;
    $('jc-meta').innerHTML = meta.map((m) => `<span>${esc(m)}</span>`).join('');
    $('jc-notes').textContent = r.notes || '';
    $('jc-credits-wrap').hidden = !creds.length;
    $('jc-credits').innerHTML = creds.map((c) => `<dt>${esc(c.role)}</dt><dd>${esc(c.name)}</dd>`).join('');
    $('jc-text-h').textContent = r.status === 'locked' ? 'Status' : heading;
    $('jc-text').textContent = body;
    $('jc-links').innerHTML = Object.keys(names).filter((k) => links[k]).map((k) => `<a href="${esc(links[k])}" target="_blank" rel="noopener">${names[k]} ↗</a>`).join('');
    this.el.jcard.style.setProperty('--c', r.accent || '#38cfe0');
    this.el.jcard.querySelector('.jc-inside').scrollTop = 0;
    this.open('jcard');
  },
};
