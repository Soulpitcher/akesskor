/* =============================================================================
   Kontrollrummet – bildskärmen i bortre väggen.
   En kanal per släpp med video (fältet `video` i releases.js) och sist en
   testbild. YouTube bäddas in via youtube-nocookie.com och laddas först när
   besökaren trycker på play. Spelarens läge (spelar/pausad) läses via
   postMessage, så att rummet vet när en video går.
   ============================================================================= */

import { drawIdent } from './ident.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const YT = 'https://www.youtube-nocookie.com';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Monitor {
  /** h: { audio, onplay(bool), sfx(name), found(id) } */
  constructor(releases, h) {
    this.h = h; this.state = 'idle'; this.playing = false; this.ch = 0;
    this.channels = releases.filter((r) => r.status === 'available' && r.video).map((r) => ({ id: r.id, title: r.title, video: r.video, label: r.videoLabel, cover: r.cover }));
    this.channels.push({ id: 'TEST', title: 'Test transmission', test: true });
    this.screen = $('#tv-screen');
    const bar = $('#tv-ch');
    this.buttons = this.channels.map((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tvbtn';
      b.innerHTML = `<i></i><span>${c.test ? 'Test' : 'CH ' + (i + 1)}</span>`;
      b.setAttribute('aria-label', c.test ? 'Test transmission' : `Channel ${i + 1}: ${c.title}`);
      b.addEventListener('click', () => this.tune(i));
      bar.appendChild(b); return b;
    });
    addEventListener('message', (e) => this.onMessage(e));
    document.addEventListener('securitypolicyviolation', (e) => {
      if (this.frame && /youtube/.test(e.blockedURI || '')) this.fail(this.channels[this.ch]);
    });
  }

  /** Öppna skärmen på en viss kanal (släppets id), annars på D-loggan tills man väljer kanal. */
  open(id) {
    const i = id ? this.channels.findIndex((c) => c.id === id) : -1;
    if (i >= 0) this.tune(i, true); else this.idle();
  }

  /** D-loggan snurrar på skärmen, samma som på skärmen i väggen. */
  idle() {
    this.stop(true);
    this.state = 'ident';
    this.buttons.forEach((b) => b.classList.remove('is-on'));
    const cv = document.createElement('canvas'); cv.className = 'tvtest'; cv.width = 960; cv.height = 720;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'The Drekmor logo turning on the screen. Pick a channel below.');
    this.screen.prepend(cv);
    const g = cv.getContext('2d'), t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      drawIdent(g, 960, 720, t, RM);
      g.fillStyle = `rgba(120,240,190,${RM ? 0.7 : 0.45 + 0.25 * (Math.sin(t * 2.4) > 0)})`;
      g.font = '22px "Space Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText('SELECT CHANNEL', 480, 680);
      this.raf = requestAnimationFrame(draw);
    };
    draw();
    this.static(300);
  }

  tune(i, quiet) {
    this.stop(true);
    this.ch = i; const c = this.channels[i];
    this.buttons.forEach((b, k) => b.classList.toggle('is-on', k === i));
    if (!quiet) this.h.sfx('clack');
    this.static(380);
    if (c.test) { this.state = 'test'; this.testCard(); this.h.found('testcard'); return; }
    this.state = 'poster';
    this.screen.innerHTML = `
      <div class="tvposter">
        ${c.cover ? `<img src="${esc(c.cover)}" alt="">` : ''}
        <p class="tvposter__id">${esc(c.id)} · ${esc(c.label || 'On YouTube')}</p>
        <p class="tvposter__t">${esc(c.title)}</p>
        <button class="tvplay" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>Play video</button>
      </div>`;
    this.screen.querySelector('.tvplay').addEventListener('click', () => this.play());
  }

  play() {
    const c = this.channels[this.ch]; if (!c || c.test) return;
    this.state = 'video';
    const q = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', enablejsapi: '1' });
    if (location.origin && location.origin !== 'null') q.set('origin', location.origin);
    this.screen.innerHTML = `<iframe src="${YT}/embed/${encodeURIComponent(c.video)}?${q}" title="Drekmor – ${esc(c.title)} (video)" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    const f = this.screen.querySelector('iframe'); this.frame = f; this.heard = false;
    f.addEventListener('load', () => { try { f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*'); } catch (e) {} });
    this.setPlaying(true); // autoplay: räkna med att den startar; spelaren rättar oss annars
    // svarar inte YouTubes spelare (blockerad av sidan den visas i, nätet eller ett tillägg)
    // blir det inte bara svart: skärmen visar "No signal" och en länk till videon på YouTube
    clearTimeout(this.failT);
    this.failT = setTimeout(() => { if (this.frame === f && !this.heard) this.fail(c); }, 12000);
  }

  fail(c) {
    if (this.state !== 'video') return;
    this.frame = null; this.setPlaying(false); this.state = 'poster';
    this.screen.innerHTML = `
      <div class="tvposter tvfail">
        <p class="tvposter__t">No signal</p>
        <p class="tvposter__id">The video can't be shown on this screen.</p>
        <a class="tvplay" href="https://www.youtube.com/watch?v=${encodeURIComponent(c.video)}" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>Watch on YouTube</a>
      </div>`;
    this.static(260);
  }

  onMessage(e) {
    if (!this.frame || e.source !== this.frame.contentWindow) return;
    let d = e.data; try { if (typeof d === 'string') d = JSON.parse(d); } catch (x) { return; }
    this.heard = true;
    const st = d?.info?.playerState ?? (d?.event === 'onStateChange' ? d.info : undefined);
    if (typeof st === 'number') this.setPlaying(st === 1 || st === 3);
  }
  setPlaying(on) { if (on === this.playing) return; this.playing = on; this.h.onplay(on); }

  pause() { try { this.frame?.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'); } catch (e) {} this.setPlaying(false); }

  stop(keepState) {
    clearTimeout(this.failT);
    this.frame = null; this.screen.innerHTML = '';
    if (this.tone) { try { this.tone.stop(); } catch (e) {} this.tone = null; }
    cancelAnimationFrame(this.raf);
    this.setPlaying(false);
    if (!keepState) this.state = 'idle';
  }

  /* --------------------------------------------------------- brus och testbild */
  static(ms) {
    const cv = document.createElement('canvas'); cv.className = 'tvstatic'; cv.width = 160; cv.height = 120;
    this.screen.appendChild(cv);
    const g = cv.getContext('2d'), img = g.createImageData(160, 120), t0 = performance.now();
    const a = this.h.audio;
    if (a.ready) a.noiseHit(a.ctx.currentTime, { type: 'highpass', f: 900, dur: ms / 1000, gain: 0.07 });
    const tick = () => {
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      if (performance.now() - t0 < ms) requestAnimationFrame(tick); else cv.remove();
    };
    tick();
  }

  testCard() {
    const cv = document.createElement('canvas'); cv.className = 'tvtest'; cv.width = 960; cv.height = 720;
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Test card: DREKMOR test transmission');
    this.screen.prepend(cv);
    const g = cv.getContext('2d'), W = 960, H = 720;
    const draw = (t) => {
      g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#d8d8d8'; g.lineWidth = 2;
      for (let x = 0; x <= W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
      for (let y = 0; y <= H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      g.save(); g.beginPath(); g.arc(W / 2, H / 2, 300, 0, 7); g.clip();
      g.fillStyle = '#111'; g.fillRect(0, 0, W, H);
      bars.forEach((c, i) => { g.fillStyle = c; g.fillRect(W / 2 - 300 + i * (600 / 7), 140, 600 / 7 + 1, 230); });
      for (let i = 0; i < 6; i++) { const v = Math.round(i * 51); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(W / 2 - 300 + i * 100, 370, 100, 70); }
      for (let x = W / 2 - 300; x < W / 2 + 300; x += 6) { g.fillStyle = (x / 6) % 2 ? '#fff' : '#000'; g.fillRect(x, 440, 3, 60); }
      g.fillStyle = '#000'; g.fillRect(W / 2 - 190, 300, 380, 110);
      g.fillStyle = '#f1ecd8'; g.font = '84px "Bebas Neue", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('D R E K M O R', W / 2, 360);
      g.fillStyle = '#000'; g.fillRect(W / 2 - 170, 520, 340, 46);
      g.fillStyle = '#f1ecd8'; g.font = '26px "Space Mono", monospace';
      const d = new Date(), tt = d.toTimeString().slice(0, 8);
      g.fillText(`D-00  ${tt}`, W / 2, 544);
      g.restore();
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(W / 2, H / 2, 300, 0, 7); g.stroke();
      g.fillStyle = '#fff'; g.font = '20px "Space Mono", monospace'; g.textAlign = 'center';
      g.fillText('TEST TRANSMISSION · STOCKHOLM / SWEDEN · DO NOT ADJUST YOUR SET', W / 2, 30);
      g.fillText('THE SIGNAL WILL RESUME SHORTLY', W / 2, H - 22);
      this.raf = requestAnimationFrame(draw);
    };
    draw();
    // en svag ton på 1 kHz, som på riktiga testsändningar
    const a = this.h.audio;
    if (a.ready) {
      const o = a.ctx.createOscillator(), gn = a.ctx.createGain();
      o.frequency.value = 1000; gn.gain.value = 0.018; o.connect(gn).connect(a.sfxBus); o.start(); this.tone = o;
    }
  }
}
