/* =============================================================================
   Kontrollrummet – avvikelserna (påskäggen).
   Saker i rummet som reagerar när man letar: pekar, klickar, skriver eller
   bara väntar. Varje fynd loggas ("Anomaly 07/27 logged") och listan syns på
   anslaget bakom dörren. Fynden sparas i webbläsaren (localStorage) om det går.

   Alla platser är i bildens pixlar (1672 × 941), samma som i live.js.
   Effekterna är vanliga DOM-element i #world, som följer bilden när den rör sig.
   ============================================================================= */

const $ = (s) => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);

/** Alla avvikelser, i den ordning de visas i loggen. */
export const ANOMALIES = [
  ['nameplate', 'Property of Drekmor'],
  ['morse', 'Morse in the warning lights'],
  ['silent', 'A silent alarm'],
  ['beacon', 'The beacon goes dark'],
  ['phone', 'The midnight call'],
  ['critters', 'The critters'],
  ['typed', 'A name typed in the dark'],
  ['signal', 'Signal received'],
  ['konami', 'Maintenance mode'],
  ['map', 'The last transmission'],
  ['shiftlog', 'The shift log'],
  ['blueprint', 'The facility plan'],
  ['mug', 'Still warm'],
  ['headphones', 'Left on'],
  ['chair', 'The chair'],
  ['tube', 'Tube no. 4'],
  ['mainswitch', 'Main breaker'],
  ['vent', 'Something in the ducts'],
  ['drip', 'The leak'],
  ['puddle', 'Standing water'],
  ['corridor', 'Somebody in the corridor'],
  ['knock', 'A knock on the door'],
  ['cables', 'Live wire'],
  ['reels', 'Backwards'],
  ['geiger', 'Background radiation'],
  ['scope', 'X–Y mode'],
  ['testcard', 'Test transmission'],
  ['idle', 'Are you still there?'],
];
const WORDS = ['drekmor', 'beacon', 'alarm', 'midnight', 'signal'];
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
const MORSE = { D: '-..', R: '.-.', E: '.', K: '-.-', M: '--', O: '---' };

/* ------------------------------------------------------------- lapparna -- */
const NOTES = {
  map: `
    <div class="sheet__paper sheet__paper--map">
      <svg class="sheet__chart" viewBox="0 0 400 220" aria-hidden="true">
        <path d="M0 150 C40 130 60 160 90 140 S150 90 180 110 230 150 260 120 320 70 400 90" fill="none" stroke="currentColor" stroke-width="1.4"/>
        <path d="M0 175 C50 160 80 185 120 170 S200 140 240 160 330 120 400 130" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3 4"/>
        <circle cx="262" cy="118" r="13" fill="none" stroke="#a3251a" stroke-width="2.2"/>
        <path d="M250 104 l24 28 M274 104 l-24 28" stroke="#a3251a" stroke-width="1.6"/>
        <text x="282" y="112" font-size="11">BEACON (DARK)</text>
        <text x="18" y="28" font-size="10">59°19′N 18°04′E</text>
      </svg>
      <p class="sheet__k">Sector D · Last transmission</p>
      <h2 id="note-title">Whoever finds this: follow the signal.</h2>
      <ul class="sheet__list">
        <li><b>D-01</b> The beacon has been dark since 10.07. <i>The sun has given up.</i></li>
        <li><b>D-02</b> The line is still open at midnight. Nobody answers.</li>
        <li><b>D-03</b> Alarm triggered 09.10. No sound. Nobody noticed in time.</li>
        <li><b>D-04</b> <span class="redact">████████████</span> encrypted</li>
      </ul>
      <p class="sheet__scrawl">If the lights fail: main breaker, left wall.<br>Do NOT touch the hanging cables.<br>Type the name when it is dark.</p>
    </div>`,
  shiftlog: `
    <div class="sheet__paper sheet__paper--log">
      <p class="sheet__k">Shift log · Control room</p>
      <h2 id="note-title">Night shift</h2>
      <table class="sheet__log">
        <tr><td>02:14</td><td>Tube no. 4 flickering again. Third request for a replacement.</td></tr>
        <tr><td>02:51</td><td>Synths through the ventilation. Checked sector D. Empty.</td></tr>
        <tr><td>03:12</td><td>The phone rang. Static on the line, and someone counting.</td></tr>
        <tr><td>03:40</td><td>The reel-to-reel was running backwards. I did not start it.</td></tr>
        <tr><td>04:05</td><td>Coffee on the desk is still warm. I haven't made any coffee.</td></tr>
        <tr><td>04:30</td><td>Alarm panel lit up by itself: D-01, D-02, D-03.</td></tr>
        <tr><td>05:00</td><td>Leaving. The override is the old code: ↑ ↑ ↓ ↓ ← → ← → B A</td></tr>
      </table>
    </div>`,
  blueprint: `
    <div class="sheet__paper sheet__paper--blue">
      <p class="sheet__k">Drekmor signal station · Level −2</p>
      <h2 id="note-title">Facility plan</h2>
      <svg class="sheet__plan" viewBox="0 0 420 260" aria-hidden="true">
        <g fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="150" cy="140" r="78"/><circle cx="150" cy="140" r="30" stroke-dasharray="4 4"/>
          <path d="M228 140 H330 V60 H400 M330 140 V220 H400 M72 140 H20 V40 H110"/>
          <rect x="330" y="30" width="70" height="60"/><rect x="330" y="190" width="70" height="60"/>
          <path d="M150 62 V20 H260" stroke-dasharray="2 5"/>
        </g>
        <g font-size="10" fill="currentColor">
          <text x="112" y="144">CONTROL</text><text x="128" y="156">ROOM</text>
          <text x="338" y="64">SECTOR A</text><text x="338" y="224">SECTOR D</text>
          <text x="340" y="238" fill="#ff8a70">SEALED</text>
          <text x="24" y="34">GENERATOR</text><text x="196" y="16">VENT SHAFT → ?</text>
          <text x="232" y="134">CORRIDOR</text>
        </g>
        <circle cx="150" cy="182" r="5" fill="#ff8a70"/><text x="160" y="196" font-size="10" fill="#ff8a70">YOU ARE HERE</text>
      </svg>
      <p class="sheet__scrawl sheet__scrawl--light">Beacon feed runs through sector D. Since the collapse: nothing.</p>
    </div>`,
};

export class Eggs {
  /**
   * api: { world, audio, S, toast(text, ms, action), select(id), show(name), note(html), playing(),
   *        twinkleBurst(), outline(rects) }
   */
  constructor(api) {
    this.a = api; this.audio = api.audio;
    this.fx = { black: 0, blackT: 0, red: null, sky: null, flickUntil: 0, tubeDeadUntil: 0, dimT: 0 };
    this.scopeMode = 'wave'; this.scopeText = null; this.scopeTextUntil = 0;
    this.monMessage = null; this.monStaticUntil = 0; this.reelBoost = 0;
    this.buf = ''; this.lastKey = 0; this.kon = 0; this.lastInput = performance.now(); this.rang = false; this.stillThere = false;
    this.cool = {}; this.found = new Set();
    try { JSON.parse(localStorage.getItem('drekmor.anomalies') || '[]').forEach((id) => this.found.add(id)); } catch (e) {}
    this.layer = document.createElement('div'); this.layer.id = 'fx'; api.world.appendChild(this.layer);
    this.build();
    this.renderLog();
    for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, () => this.poke(), { passive: true });
  }

  /* ------------------------------------------------------------------ logg -- */
  log(id) {
    if (this.found.has(id)) return;
    this.found.add(id);
    try { localStorage.setItem('drekmor.anomalies', JSON.stringify([...this.found])); } catch (e) {}
    const i = ANOMALIES.findIndex((a) => a[0] === id);
    const n = String(this.found.size).padStart(2, '0'), N = String(ANOMALIES.length).padStart(2, '0');
    setTimeout(() => this.a.toast(`Anomaly ${n}/${N} logged · ${ANOMALIES[i]?.[1] || id}`, 3600, null, 'log'), 1400);
    this.renderLog();
  }
  renderLog() {
    const el = $('#anomalies'); if (!el) return;
    const n = this.found.size, N = ANOMALIES.length;
    el.innerHTML = `<p class="anomalies__h">Anomalies logged: <b>${n} / ${N}</b></p>
      <p class="anomalies__hint">${n ? 'Keep looking. Point at things. Click things. Type things. Wait.' : 'Something is not right in this room. Look around.'}</p>
      <ol class="anomalies__list">${ANOMALIES.map(([id, name], i) => `<li class="${this.found.has(id) ? 'is-found' : ''}"><span>${String(i + 1).padStart(2, '0')}</span>${this.found.has(id) ? name : '▒▒▒▒▒▒▒▒▒▒'}</li>`).join('')}</ol>`;
  }

  /* --------------------------------------------------------------- ljuden -- */
  get ok() { return this.audio.ready; }
  now(d = 0) { return this.audio.ctx.currentTime + 0.005 + d; }
  tone(o, d = 0) { if (this.ok) this.audio.tone(this.now(d), o); }
  hit(o, d = 0) { if (this.ok) this.audio.noiseHit(this.now(d), o); }
  once(key, s) { const t = performance.now(); if ((this.cool[key] || 0) > t) return false; this.cool[key] = t + s * 1000; return true; }

  /** Kopplar in ett filter efter musiken (för hörlurarna och det tysta larmet). */
  init() {
    const a = this.audio; if (!a.ready || this.chain) return;
    const ctx = a.ctx;
    this.hp = ctx.createBiquadFilter(); this.hp.type = 'highpass'; this.hp.frequency.value = 10;
    this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000;
    this.duck = ctx.createGain();
    try { a.music.disconnect(); a.music.connect(this.hp).connect(this.lp).connect(this.duck).connect(a.master); this.chain = true; } catch (e) {}
    if (new Date().getHours() === 0) setTimeout(() => this.ring(true), 9000); // vid midnatt ringer det direkt
  }
  duckTo(v, tc = 0.08) { if (this.duck) this.duck.gain.setTargetAtTime(v, this.audio.ctx.currentTime, tc); }

  /* --------------------------------------------------------- platserna -- */
  build() {
    const spot = (id, rect, o) => {
      const d = document.createElement('div'); d.className = 'egg'; d.dataset.egg = id;
      Object.assign(d.style, { left: rect[0] + 'px', top: rect[1] + 'px', width: rect[2] + 'px', height: rect[3] + 'px' });
      if (o.hover) {
        d.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') o.hover(e); });
        d.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') o.hover(e); });
      }
      if (o.leave) d.addEventListener('pointerleave', o.leave);
      if (o.click) d.addEventListener('click', (e) => { e.stopPropagation(); o.click(e); });
      this.a.world.appendChild(d); (this.spots ||= []).push(rect);
      return d;
    };
    const imgPt = (e) => { const r = this.a.world.getBoundingClientRect(), s = r.width / 1672; return [(e.clientX - r.left) / s, (e.clientY - r.top) / s]; };

    // golvet först, så att allt annat ligger ovanpå
    spot('puddle', [0, 862, 1672, 79], { click: (e) => { this.ripple(...imgPt(e)); this.log('puddle'); } });
    spot('floorL', [0, 700, 236, 162], { hover: () => this.rat(1) });
    spot('floorR', [1500, 690, 172, 172], { hover: () => this.rat(-1) });
    spot('blueprint', [1026, 842, 284, 96], { click: () => this.note('blueprint') });
    spot('chair', [776, 624, 196, 290], {
      hover: () => { if (this.once('creak', 4)) this.creak(); },
      click: () => { this.creak(); this.a.toast('It creaks. Nobody is sitting in it.'); this.log('chair'); },
    });
    spot('mug', [354, 608, 50, 50], {
      hover: () => this.steam(),
      click: () => { this.steam(); this.a.toast('Still warm. Someone was here a minute ago.'); this.log('mug'); },
    });
    spot('headphones', [468, 600, 84, 64], { click: () => this.headphones() });
    spot('map', [628, 612, 184, 40], { click: () => this.note('map') });
    spot('nameplate', [978, 556, 96, 23], { click: () => this.nameplate() });
    spot('shiftlog', [132, 374, 28, 36], { click: () => this.note('shiftlog') });
    spot('mainswitch', [26, 412, 98, 96], { click: () => this.blackout() });
    spot('corridor', [320, 366, 112, 140], {
      hover: () => { if (this.once('steps', 12)) this.footsteps(); },
      click: () => this.flashlight(),
    });
    spot('reels', [678, 394, 72, 48], { hover: () => { this.reelBoost = Math.max(this.reelBoost, 1.2); }, click: () => this.backwards() });
    spot('geiger', [918, 396, 54, 104], { hover: () => this.geiger(true), leave: () => this.geiger(false), click: () => { this.a.toast('Background radiation: within acceptable limits. Probably.'); this.log('geiger'); } });
    spot('tube', [1156, 344, 76, 24], { hover: () => this.buzz(), click: () => this.popTube() });
    spot('cables', [1256, 74, 88, 218], { click: () => this.zap() });
    spot('redL', [274, 246, 44, 50], { click: () => this.morse() });
    spot('redR', [1178, 280, 38, 46], { click: () => this.silentAlarm() });
    spot('skylight', [560, 8, 560, 168], { click: () => this.beacon() });
    for (const r of [[44, 64, 78, 80], [210, 200, 46, 50]]) spot('vent', r, { hover: () => { if (this.once('vent', 6)) this.ducts(false); }, click: () => this.ducts(true) });
    for (const [r, land] of [[[338, 98, 70, 84], 646], [[1072, 126, 56, 98], 640]]) spot('drip', r, { click: () => { this.drop(r[0] + r[2] / 2, r[1] + r[3] * 0.7, land); this.log('drip'); } });
  }

  /* ----------------------------------------------------------- effekterna -- */
  add(cls, x, y, css = {}, life = 3000) {
    const d = document.createElement('i'); d.className = 'fx ' + cls;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    // egna CSS-variabler (--dx, --run …) måste sättas med setProperty
    for (const [k, v] of Object.entries(css)) { if (k.startsWith('--')) d.style.setProperty(k, v); else d.style[k] = v; }
    this.layer.appendChild(d); setTimeout(() => d.remove(), life); return d;
  }
  note(id) { this.a.note(NOTES[id]); this.log(id); }

  ripple(x, y) {
    for (let i = 0; i < 3; i++) this.add('fx-ripple', x, y, { animationDelay: i * 0.18 + 's' }, 1800);
    this.hit({ type: 'bandpass', f: 1400, q: 1.2, dur: 0.22, gain: 0.22, sweepTo: 500 });
    this.tone({ f: 900, to: 380, dur: 0.12, gain: 0.08 }, 0.02);
  }
  /** Dörren (klickytan ägs av main.js): står man still på den knackar det. */
  doorHover(on) { clearTimeout(this.doorT); if (on) this.doorT = setTimeout(() => this.knock(), 2600); }
  drop(x, y, land = 646) {
    this.add('fx-drop', x, y, { '--fall': (land - y) + 'px' }, 1400);
    setTimeout(() => { this.tone({ f: 1500, to: 520, dur: 0.07, gain: 0.12 }); this.tone({ f: 1300, to: 480, dur: 0.06, gain: 0.04 }, 0.18); }, 900);
  }
  steam() {
    if (!this.once('steam', 1.6)) return;
    for (let i = 0; i < 4; i++) this.add('fx-steam', 378 + rand(-6, 6), 612, { animationDelay: i * 0.35 + 's', '--dx': rand(-10, 10) + 'px' }, 3600);
  }
  rat(dir) {
    if (!this.once('rat', 25)) return;
    const y = rand(856, 896), x0 = dir > 0 ? -40 : 1712;
    const r = this.add('fx-rat' + (dir < 0 ? ' fx-rat--l' : ''), x0, y, { '--run': (dir > 0 ? 1760 : -1760) + 'px' }, 2600);
    const eye = document.createElement('span'); eye.className = 'fx-eye'; r.appendChild(eye);
    for (let i = 0; i < 9; i++) this.hit({ type: 'bandpass', f: rand(2500, 4200), q: 6, dur: 0.02, gain: 0.05 }, i * 0.09 + rand(0, 0.03));
    setTimeout(() => this.a.toast('We scurry, we scurry…'), 400);
    this.log('critters');
  }
  creak() {
    this.tone({ type: 'sawtooth', f: rand(160, 200), to: rand(120, 150), dur: 0.42, gain: 0.05, cutoff: 900 });
    this.hit({ type: 'bandpass', f: 700, q: 4, dur: 0.35, gain: 0.05 });
  }
  footsteps() {
    for (let i = 0; i < 5; i++) { this.hit({ type: 'lowpass', f: 380, dur: 0.12, gain: 0.16 - i * 0.025 }, i * 0.55); this.tone({ f: 70, to: 45, dur: 0.1, gain: 0.08 - i * 0.012 }, i * 0.55); }
  }
  flashlight() {
    this.add('fx-beam', 376, 436, {}, 3400);
    this.footsteps();
    setTimeout(() => this.a.toast('“Hello…? Is somebody there?”'), 700);
    this.log('corridor');
  }
  knock() {
    for (const [d, g] of [[0, 0.3], [0.22, 0.26], [0.9, 0.3], [1.12, 0.22], [1.34, 0.28]]) { this.hit({ type: 'lowpass', f: 520, dur: 0.08, gain: g }, d); this.tone({ f: 110, to: 70, dur: 0.07, gain: g * 0.5 }, d); }
    setTimeout(() => this.a.toast('Someone knocks. From the other side.'), 1500);
    this.log('knock');
  }
  geiger(on) {
    clearInterval(this.gT); if (!on) return;
    let n = 0;
    const t0 = performance.now();
    const tick = () => { n++; this.hit({ type: 'highpass', f: 3200, dur: 0.006, gain: 0.32 }); clearInterval(this.gT); if (performance.now() - t0 < 6000) this.gT = setTimeout(tick, Math.max(25, rand(40, 420) / (1 + n * 0.06))); };
    tick();
  }
  buzz() {
    if (!this.once('buzz', 1.5)) return;
    this.tone({ type: 'sawtooth', f: 100, dur: 0.7, gain: 0.025, cutoff: 1400 });
    this.tone({ type: 'square', f: 120, dur: 0.5, gain: 0.012, cutoff: 900 }, 0.1);
    this.sparks(1192, 360, 5);
    this.fx.flickUntil = performance.now() + 500;
  }
  popTube() {
    this.hit({ type: 'highpass', f: 1800, dur: 0.18, gain: 0.5 }); this.tone({ f: 260, to: 60, dur: 0.25, gain: 0.25 });
    this.sparks(1192, 360, 18);
    this.fx.tubeDeadUntil = performance.now() + 6500;
    this.a.toast('Tube no. 4 is gone. Again.');
    this.log('tube');
  }
  sparks(x, y, n) {
    for (let i = 0; i < n; i++) this.add('fx-spark', x + rand(-8, 8), y, { '--dx': rand(-40, 40) + 'px', '--dy': rand(30, 120) + 'px', animationDuration: rand(0.4, 0.9) + 's' }, 1000);
  }
  zap() {
    this.sparks(1300, 290, 26);
    for (let i = 0; i < 6; i++) this.hit({ type: 'highpass', f: rand(1500, 5000), dur: rand(0.02, 0.06), gain: 0.35 }, i * 0.05 + rand(0, 0.03));
    this.tone({ type: 'square', f: 50, dur: 0.6, gain: 0.08, cutoff: 600 });
    this.fx.flickUntil = performance.now() + 900;
    this.a.glitch(1);
    this.a.toast('Live wire. Don’t do that again.');
    this.log('cables');
  }
  ducts(click) {
    this.hit({ type: 'bandpass', f: 380, q: 1.5, dur: 2.4, gain: 0.07, sweepTo: 900 });
    if (!click) return;
    for (let i = 0; i < 12; i++) this.hit({ type: 'bandpass', f: rand(1800, 3800), q: 5, dur: 0.03, gain: 0.07 - i * 0.004 }, 0.3 + i * rand(0.07, 0.15));
    for (let i = 0; i < 14; i++) this.add('fx-dust', rand(54, 112), 140, { animationDelay: rand(0, 0.8) + 's', '--dx': rand(-20, 20) + 'px' }, 3200);
    this.a.toast('Something moves in the ducts. Something with a lot of legs.');
    this.log('vent');
  }

  headphones() {
    this.hpOn = !this.hpOn;
    const a = this.audio;
    if (this.hp) {
      const t = a.ctx.currentTime;
      this.hp.frequency.setTargetAtTime(this.hpOn ? 650 : 10, t, 0.05);
      this.lp.frequency.setTargetAtTime(this.hpOn ? 3200 : 20000, t, 0.05);
      this.duckTo(this.hpOn ? 0.22 : 1);
    }
    if (this.hpOn && !this.a.playing()) {
      // inget spelar: bara klickspåret som någon glömt stänga av
      for (let i = 0; i < 16; i++) this.tone({ type: 'square', f: i % 4 ? 1600 : 2400, dur: 0.03, gain: 0.025, cutoff: 3500 }, i * 0.5);
      this.a.toast('Someone left these on. A click track, 120 BPM.');
      setTimeout(() => { if (this.hpOn) this.headphones(); }, 8200);
    } else this.a.toast(this.hpOn ? 'Someone left these on. You hear it through the headphones.' : 'You put the headphones down.');
    this.log('headphones');
  }

  nameplate() {
    this.scopeText = 'DREKMOR'; this.scopeTextUntil = performance.now() + 5000;
    const ch = [57, 64, 69, 72];
    ch.forEach((m, i) => this.tone({ type: 'sawtooth', f: 440 * Math.pow(2, (m - 69) / 12), dur: 2.4, gain: 0.03, cutoff: 1600 }, i * 0.06));
    this.a.twinkleBurst();
    this.a.toast('Property of Drekmor. Do not remove.');
    this.log('nameplate');
  }

  morse() {
    const u = 0.12, seq = [];
    let t = 0;
    // lampan blinkar DREKMOR på morse, helt tyst
    for (const ch of 'DREKMOR') { for (const s of MORSE[ch]) { const d = s === '-' ? 3 * u : u; seq.push([t, t + d]); t += d + u; } t += 2 * u; }
    const t0 = performance.now() / 1000;
    this.fx.red = (now) => { const x = now - t0; if (x > t) return null; const lit = seq.some(([a, b]) => x >= a && x < b); return lit ? [1.6, 1.6] : [0.04, 0.04]; };
    this.fx.redUntil = performance.now() + t * 1000;
    this.a.toast('-.. .-. . -.- -- --- .-.', 5200);
    this.log('morse');
  }

  silentAlarm() {
    // ett tyst larm: lamporna blinkar växelvis och musiken tystnar, men inget låter
    const D = 6, t0 = performance.now() / 1000;
    this.fx.red = (now) => { const x = now - t0; if (x > D) return null; const p = (x * 2.2) % 1; return [p < 0.5 ? 2.2 : 0.1, p >= 0.5 ? 2.2 : 0.1]; };
    this.fx.redUntil = performance.now() + D * 1000;
    this.duckTo(0, 0.15);
    clearTimeout(this.alarmT); this.alarmT = setTimeout(() => this.duckTo(this.hpOn ? 0.22 : 1, 0.6), (D - 0.4) * 1000);
    this.a.toast('There was a silent alarm. I realized it far too late.', 5600);
    this.log('silent');
  }

  beacon() {
    const t0 = performance.now() / 1000;
    this.fx.sky = (now) => { const x = now - t0; if (x > 9) return null; if (x > 5.5) return 0; const p = (x / 1.4) % 1; return 0.25 + Math.pow(Math.max(0, Math.sin(p * Math.PI)), 6) * 3.2; };
    this.fx.skyUntil = performance.now() + 9000;
    setTimeout(() => { this.hit({ type: 'lowpass', f: 200, dur: 1.4, gain: 0.25 }); this.a.toast('The beacon is blacked out. The sun has given up.', 3800); }, 5500);
    this.log('beacon');
  }

  blackout() {
    if (this.fx.blackT > performance.now()) return;
    this.fx.black = 1; this.fx.blackT = performance.now() + 3200;
    this.tone({ f: 160, to: 40, dur: 0.5, gain: 0.5 }); this.hit({ type: 'lowpass', f: 900, dur: 0.15, gain: 0.5 });
    const a = this.audio;
    if (a.mode === 'file' && a.el && !a.el.paused) { a.el.preservesPitch = false; this.rate(1, 0.35, 700); }
    this.duckTo(0.05, 0.4);
    this.a.toast('Main breaker tripped.', 2600);
    setTimeout(() => {
      this.tone({ type: 'sawtooth', f: 28, to: 110, dur: 2.2, gain: 0.08, cutoff: 500 });
      this.a.toast('Backup generator online.', 2600);
      this.fx.black = 0;
      if (a.mode === 'file' && a.el) this.rate(0.35, 1, 900);
      this.duckTo(this.hpOn ? 0.22 : 1, 0.5);
    }, 3200);
    this.log('mainswitch');
  }
  rate(from, to, ms) {
    const el = this.audio.el, t0 = performance.now();
    const step = () => { const p = Math.min(1, (performance.now() - t0) / ms); try { el.playbackRate = from + (to - from) * p; } catch (e) {} if (p < 1) requestAnimationFrame(step); };
    step();
  }

  backwards() {
    this.reelBoost = 6;
    this.tone({ type: 'sawtooth', f: 300, to: 2600, dur: 0.9, gain: 0.035, cutoff: 3200 });
    // en baklänges-svällning: ackord som växer och klipps tvärt
    if (this.ok) {
      const ctx = this.audio.ctx, t = this.now(1);
      [57, 60, 64, 69].forEach((m) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); f.type = 'lowpass'; f.frequency.value = 1400;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 2.2); g.gain.setValueAtTime(0.0001, t + 2.21);
        o.connect(f).connect(g).connect(this.audio.sfxBus); o.start(t); o.stop(t + 2.3);
      });
    }
    this.a.toast('.kcab gniog ton er’eW', 2600);
    setTimeout(() => this.a.toast('We’re not going back.', 3000), 2800);
    this.log('reels');
  }

  scopeClick() {
    this.scopeMode = { wave: 'xy', xy: 'spec', spec: 'wave' }[this.scopeMode];
    this.tone({ type: 'square', f: 1200, dur: 0.03, gain: 0.04 });
    this.a.toast({ wave: 'Display: time base', xy: 'Display: X–Y', spec: 'Display: spectrum' }[this.scopeMode], 1600);
    if (this.scopeMode === 'xy') this.log('scope');
  }

  /* ------------------------------------------------------- telefonen -- */
  ring(force) {
    if (this.ringing || (this.rang && !force)) return;
    this.rang = true; this.ringing = true;
    let n = 0;
    const once = () => {
      if (!this.ringing || n++ > 5) { this.ringing = false; this.a.toast(null); return; }
      if (this.ok) {
        const ctx = this.audio.ctx, t = this.now();
        for (const [a, b] of [[0, 0.4], [0.6, 1.0]]) for (const f of [400, 450]) {
          const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
          g.gain.setValueAtTime(0, t + a); g.gain.linearRampToValueAtTime(0.03, t + a + 0.02); g.gain.setValueAtTime(0.03, t + b - 0.02); g.gain.linearRampToValueAtTime(0, t + b);
          o.connect(g).connect(this.audio.sfxBus); o.start(t + a); o.stop(t + b + 0.05);
        }
      }
      this.ringT = setTimeout(once, 3000);
    };
    once();
    this.a.toast('Incoming call…', 18000, { label: 'Answer', run: () => this.answer() }, 'call');
  }
  answer() {
    this.ringing = false; clearTimeout(this.ringT);
    this.hit({ type: 'bandpass', f: 1200, q: 0.6, dur: 1.2, gain: 0.08 });
    this.a.toast('This is my midnight call. Pick up now.', 3600);
    setTimeout(() => this.a.select('D-02'), 1200);
    this.log('phone');
  }

  /* ---------------------------------------------------------- tangenter -- */
  /** Bokstäver: hemliga ord. Returnerar inget; kör `run` (kortkommandot) om tangenten inte ingick i ett ord. */
  letter(k, run) {
    const t = performance.now();
    if (this.konamiKey(k)) return;
    this.buf = (t - this.lastKey < 1500 ? this.buf : '') + k; this.lastKey = t;
    clearTimeout(this.pend);
    const w = WORDS.find((x) => this.buf.endsWith(x));
    if (w) { this.buf = ''; this.word(w); return; }
    for (let i = 0; i < this.buf.length; i++) { const s = this.buf.slice(i); if (WORDS.some((x) => x.startsWith(s))) { this.buf = s; if (s.length === 1) this.pend = setTimeout(run, 420); return; } }
    this.buf = ''; run();
  }
  /** Piltangenter: Konami-koden. Returnerar true om tangenten ska sväljas. */
  arrow(k) { return this.konamiKey(k); }
  konamiKey(k) {
    if (KONAMI[this.kon] === k) { this.kon++; if (this.kon === KONAMI.length) { this.kon = 0; this.konami(); return true; } return this.kon > 2; }
    this.kon = KONAMI[0] === k ? 1 : 0; return false;
  }
  word(w) {
    if (w === 'drekmor') { this.nameplate(); this.a.twinkleBurst(); this.fx.flickUntil = performance.now() + 700; this.log('typed'); }
    if (w === 'beacon') this.beacon();
    if (w === 'alarm') this.silentAlarm();
    if (w === 'midnight') this.ring(true);
    if (w === 'signal') {
      this.monMessage = { lines: ['> SIGNAL RECEIVED', '> D-01  DARK', '> D-02  OPEN', '> D-03  SILENT', '> D-04  ▓▓▓▓ ?'], until: performance.now() + 7000 };
      this.monStaticUntil = performance.now() + 400;
      this.tone({ type: 'square', f: 1800, dur: 0.05, gain: 0.04 }); this.tone({ type: 'square', f: 2400, dur: 0.05, gain: 0.04 }, 0.08);
      this.a.toast('Look at the monitor.', 2400);
      this.log('signal');
    }
  }
  konami() {
    this.scopeMode = 'xy'; this.fx.flickUntil = performance.now() + 600;
    this.a.twinkleBurst(); this.a.outline(this.spots);
    [60, 64, 67, 72].forEach((m, i) => this.tone({ type: 'square', f: 440 * Math.pow(2, (m - 69) / 12), dur: 0.12, gain: 0.04, cutoff: 3000 }, i * 0.1));
    this.a.toast('Maintenance mode. All anomaly sensors highlighted.', 4200);
    this.log('konami');
  }

  /* --------------------------------------------------- tid utan aktivitet -- */
  poke() {
    this.lastInput = performance.now();
    if (this.stillThere) { this.stillThere = false; this.fx.dimT = 0; this.monMessage = null; }
  }
  tick(busy, dt = 0.016) {
    const t = performance.now(), idle = (t - this.lastInput) / 1000;
    if (this.scopeText && t > this.scopeTextUntil) this.scopeText = null;
    if (this.monMessage && this.monMessage.until && t > this.monMessage.until) this.monMessage = null;
    if (this.fx.red && t > this.fx.redUntil) this.fx.red = null;
    if (this.fx.sky && t > this.fx.skyUntil) this.fx.sky = null;
    this.reelBoost = Math.max(0, this.reelBoost - dt * 2.5);
    if (busy) { this.lastInput = Math.max(this.lastInput, t - 30000); return; }
    if (idle > 50 && !this.rang) this.ring();
    if (idle > 150 && !this.stillThere) {
      this.stillThere = true; this.fx.dimT = 1;
      this.monMessage = { lines: ['> NO ACTIVITY', '> ARE YOU STILL', '  THERE?', '', '> _'] };
      this.log('idle');
    }
    if (!this.dripT || t > this.dripT) { this.dripT = t + rand(9000, 20000); if (Math.random() < 0.7) this.drop(rand(362, 386), 160); }
  }
}
