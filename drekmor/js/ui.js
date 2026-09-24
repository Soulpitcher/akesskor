/* =============================================================================
   DOM-lagret ovanpå 3D-scenen: laddare, HUD, markör, index, omslag, toast.
   ============================================================================= */
import { TYPE_LABEL } from './textures.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (t) => (!isFinite(t) || t <= 0 ? '0:00' : `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
const statusWord = (r) => (r.status === 'locked' ? 'Låst' : r.status === 'coming' ? 'Snart' : TYPE_LABEL[r.type] || '');

export const UI = {
  init(handlers) {
    this.h = handlers;
    this.el = {
      loader: $('loader'), fill: $('loader-fill'), status: $('loader-status'), actions: $('loader-actions'),
      hud: $('hud'), label: $('hud-label'), title: $('hud-title'), sub: $('hud-sub'), hint: $('hud-hint'),
      actionsBar: $('hud-actions'), play: $('act-play'), progress: $('hud-progress'), time: $('hud-time'), dur: $('hud-dur'), bar: $('hud-bar'), barFill: $('hud-fill'),
      cursor: $('cursor'), cursorLabel: $('cursor-label'), toast: $('toast'), live: $('live'),
      index: $('index'), tracklist: $('tracklist'), about: $('about'), jcard: $('jcard'), sound: $('toggle-sound'),
    };
    $('enter-sound').addEventListener('click', () => handlers.enter(true));
    $('enter-silent').addEventListener('click', () => handlers.enter(false));
    $('open-index').addEventListener('click', () => this.open('index'));
    $('open-about').addEventListener('click', () => this.open('about'));
    this.el.sound.addEventListener('click', () => handlers.toggleSound());
    this.el.play.addEventListener('click', () => handlers.playPause());
    $('act-inlay').addEventListener('click', () => handlers.inlay());
    $('act-eject').addEventListener('click', () => handlers.eject());
    this.el.bar.addEventListener('click', (e) => {
      const r = this.el.bar.getBoundingClientRect(); handlers.seekTo((e.clientX - r.left) / r.width);
    });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.closeAll()));
    for (const sheet of [this.el.index, this.el.about, this.el.jcard]) sheet.addEventListener('click', (e) => { if (e.target === sheet) this.closeAll(); });
    $('count').textContent = handlers.releases.length;
    this.buildIndex(handlers.releases);
  },

  /* ---------------------------------------------------------- laddare -- */
  loading(p, text) { this.el.fill.style.transform = `scaleX(${p})`; if (text) this.el.status.textContent = text; },
  ready() {
    this.el.status.textContent = 'Arkivet är redo.';
    this.el.actions.hidden = false;
    requestAnimationFrame(() => this.el.actions.classList.add('in'));
    $('enter-sound').focus({ preventScroll: true });
  },
  entered() { this.el.loader.classList.add('gone'); document.body.classList.add('entered'); setTimeout(() => (this.el.loader.hidden = true), 1400); },

  /* -------------------------------------------------------------- HUD --- */
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

  /* ----------------------------------------------------------- markör --- */
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

  /* ------------------------------------------------------ index/arkiv --- */
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
    for (const k of ['index', 'about', 'jcard']) {
      const el = this.el[k];
      if (!el.hidden) { any = true; el.classList.remove('open'); setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; }, 520); }
    }
    if (any) { document.body.classList.remove('modal'); this.h.modal(false); if (!silent && this._return) this._return.focus?.({ preventScroll: true }); }
    return any;
  },
  isOpen() { return ['index', 'about', 'jcard'].some((k) => !this.el[k].hidden); },

  /* ------------------------------------------------ omslaget (J-kort) --- */
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
