/* =============================================================================
   Ljudmotor: musik (fil eller generativ demosignal), bandbrus, VU-analys och
   syntetiserade mekaniska ljudeffekter. Inga ljudfiler behövs för effekterna.
   ============================================================================= */

const DEMO_LENGTH = 200; // sekunder – styr hur mycket band som "spelas" i demoläget
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CHORDS = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]]; // Am – F – C/G – G
const BASS = [33, 29, 36, 31];

export class AudioEngine {
  constructor() {
    this.ctx = null; this.muted = false; this.volume = 0.8;
    this.mode = 'none'; this.playing = false; this.demoTime = 0;
    this.el = null; this.levelsL = 0; this.levelsR = 0;
  }

  /** Måste anropas från en användarinteraktion. */
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.2;
    this.master.connect(comp).connect(ctx.destination);

    this.musicIn = ctx.createGain();
    this.musicIn.channelCount = 2; this.musicIn.channelCountMode = 'explicit'; this.musicIn.channelInterpretation = 'speakers';
    this.music = ctx.createGain(); this.music.gain.value = this.volume;
    this.musicIn.connect(this.music).connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.gain.value = 0.7; this.sfxBus.connect(this.master);

    const split = ctx.createChannelSplitter(2); this.musicIn.connect(split);
    this.anL = ctx.createAnalyser(); this.anR = ctx.createAnalyser();
    this.anL.fftSize = this.anR.fftSize = 1024;
    split.connect(this.anL, 0); split.connect(this.anR, 1);
    this.anF = ctx.createAnalyser(); this.anF.fftSize = 256; this.musicIn.connect(this.anF);
    this.bufL = new Float32Array(1024); this.bufR = new Float32Array(1024); this.bufF = new Uint8Array(128);

    const len = ctx.sampleRate * 2, nb = ctx.createBuffer(1, len, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = nb;

    // Reverb (genererat impulssvar) för demosignalen
    const ir = ctx.createBuffer(2, ctx.sampleRate * 2.6, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2.6); }
    this.reverb = ctx.createConvolver(); this.reverb.buffer = ir;
    this.reverbOut = ctx.createGain(); this.reverbOut.gain.value = 0.32;
    this.reverb.connect(this.reverbOut).connect(this.musicIn);

    // Bandbrus
    const hiss = ctx.createBufferSource(); hiss.buffer = this.noise; hiss.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2600;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9500;
    this.hissGain = ctx.createGain(); this.hissGain.gain.value = 0;
    hiss.connect(hp).connect(lp).connect(this.hissGain).connect(this.music);
    hiss.start();
  }

  get ready() { return !!this.ctx; }
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.05); }
  setVolume(v) { this.volume = v; if (this.music) this.music.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03); }

  /* --------------------------------------------------------------- musik -- */
  load(release) {
    this.stop();
    this.release = release; this.demoTime = 0;
    if (release.audio) {
      this.mode = 'file';
      if (!this.el) {
        this.el = new Audio(); this.el.crossOrigin = 'anonymous'; this.el.preload = 'metadata';
        if (this.ctx) { try { this.ctx.createMediaElementSource(this.el).connect(this.musicIn); } catch (e) { /* spelas ändå */ } }
      }
      this.el.src = release.audio;
    } else {
      this.mode = release.status === 'available' ? 'demo' : 'none';
    }
  }
  unload() { this.stop(); this.mode = 'none'; this.release = null; if (this.el) this.el.removeAttribute('src'); }

  play() {
    if (this.mode === 'none' || this.playing) return false;
    this.playing = true;
    if (this.mode === 'file') this.el.play().catch(() => { this.playing = false; });
    else this.startDemo();
    if (this.hissGain) this.hissGain.gain.setTargetAtTime(0.016, this.ctx.currentTime, 0.2);
    return true;
  }
  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this.mode === 'file') this.el.pause(); else this.stopDemo();
    if (this.hissGain) this.hissGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
  }
  stop() { this.pause(); }
  seek(delta) {
    if (this.mode === 'file' && this.el && isFinite(this.el.duration)) this.el.currentTime = Math.min(this.el.duration, Math.max(0, this.el.currentTime + delta));
    else if (this.mode === 'demo') { this.demoTime = Math.min(DEMO_LENGTH, Math.max(0, this.demoTime + delta)); }
  }
  seekTo(p) {
    if (this.mode === 'file' && this.el && isFinite(this.el.duration)) this.el.currentTime = p * this.el.duration;
    else if (this.mode === 'demo') this.demoTime = p * DEMO_LENGTH;
  }
  get time() { return this.mode === 'file' ? (this.el?.currentTime || 0) : this.demoTime; }
  get duration() { return this.mode === 'file' ? (isFinite(this.el?.duration) ? this.el.duration : 0) : this.mode === 'demo' ? DEMO_LENGTH : 0; }
  get progress() { const d = this.duration; return d ? Math.min(1, this.time / d) : 0; }
  get ended() { return this.mode === 'file' ? !!this.el?.ended : this.demoTime >= DEMO_LENGTH; }

  tick(dt) {
    if (this.playing && this.mode === 'demo') {
      this.demoTime += dt;
      if (this.demoTime >= DEMO_LENGTH) { this.demoTime = DEMO_LENGTH; this.pause(); }
    }
  }

  /** Nivåer 0..1 för VU-mätaren + basenergi för ljussättningen. */
  levels() {
    if (!this.ctx) return { l: 0, r: 0, bass: 0 };
    const rms = (an, buf) => { an.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
    const toMeter = (v) => Math.max(0, Math.min(1, (20 * Math.log10(v + 1e-6) + 42) / 44));
    this.anF.getByteFrequencyData(this.bufF);
    let bass = 0; for (let i = 1; i < 7; i++) bass += this.bufF[i]; bass /= 6 * 255;
    return { l: toMeter(rms(this.anL, this.bufL)), r: toMeter(rms(this.anR, this.bufR)), bass };
  }

  /* ---------------------------------------------------- demosignal (synt) -- */
  startDemo() {
    const ctx = this.ctx, now = ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(0.85, now + 0.8);
    out.connect(this.musicIn);
    const delay = ctx.createDelay(1); delay.delayTime.value = 60 / 84 * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.34;
    const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400;
    delay.connect(dlp).connect(fb).connect(delay); dlp.connect(out);
    const send = ctx.createGain(); send.gain.value = 1; send.connect(this.reverb);
    const spb = 60 / 84;
    this.demo = { out, delay, send, spb, step: Math.floor(this.demoTime / (spb / 4)), next: now + 0.06 };
    this.demo.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }
  stopDemo() {
    if (!this.demo) return;
    const d = this.demo, t = this.ctx.currentTime;
    clearInterval(d.timer);
    d.out.gain.cancelScheduledValues(t); d.out.gain.setValueAtTime(d.out.gain.value, t); d.out.gain.linearRampToValueAtTime(0, t + 0.25);
    setTimeout(() => { try { d.out.disconnect(); d.send.disconnect(); } catch (e) {} }, 6000);
    this.demo = null;
  }
  schedule() {
    const d = this.demo; if (!d) return;
    while (d.next < this.ctx.currentTime + 0.14) { this.step(d.step, d.next); d.next += d.spb / 4; d.step++; }
  }
  step(step, t) {
    const d = this.demo, bar = Math.floor(step / 16), s = step % 16, ci = Math.floor(bar / 2) % 4, chord = CHORDS[ci];
    if (s === 0 && bar % 2 === 0) this.pad(chord, t, d.spb * 8);
    if (s % 4 === 0) { this.kick(t); this.bass(BASS[ci], t, d.spb * 0.9); }
    if (s === 4 || s === 12) this.snare(t);
    if (s % 4 === 2) this.hat(t);
    if (s % 2 === 0) { const pat = [0, 1, 2, 1, 2, 0, 1, 2]; this.pluck(chord[pat[(s / 2) % 8]] + 12, t); }
  }
  voice(type, f, t, dur, gain, dest, { cutoff = 1200, q = 0.7, attack = 0.005, release = 0.2, pan = 0, detune = 0 } = {}) {
    const ctx = this.ctx, o = ctx.createOscillator(), flt = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
    o.type = type; o.frequency.value = f; o.detune.value = detune;
    flt.type = 'lowpass'; flt.frequency.value = cutoff; flt.Q.value = q; p.pan.value = pan;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(flt).connect(g).connect(p); dest.forEach((n) => p.connect(n));
    o.start(t); o.stop(t + dur + 0.05);
    return { flt };
  }
  pad(chord, t, dur) {
    const d = this.demo;
    chord.forEach((m, i) => {
      for (const [det, pan] of [[-8, -0.45], [8, 0.45]]) {
        const v = this.voice('sawtooth', mtof(m), t, dur, 0.035, [d.out, d.send], { cutoff: 900, q: 1.2, attack: 1.1, release: 1.8, pan, detune: det + i });
        v.flt.frequency.setValueAtTime(600, t); v.flt.frequency.linearRampToValueAtTime(1500, t + dur * 0.5); v.flt.frequency.linearRampToValueAtTime(700, t + dur);
      }
    });
  }
  bass(m, t, dur) { const d = this.demo; this.voice('sawtooth', mtof(m), t, dur, 0.16, [d.out], { cutoff: 240, q: 4, attack: 0.008, release: 0.25 }); }
  pluck(m, t) { const d = this.demo; this.voice('square', mtof(m), t, 0.32, 0.045, [d.out, d.delay, d.send], { cutoff: 1900, attack: 0.003, release: 0.28, pan: (Math.random() - 0.5) * 0.6 }); }
  kick(t) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g).connect(this.demo.out); o.start(t); o.stop(t + 0.4);
  }
  snare(t) { const d = this.demo; this.noiseHit(t, { type: 'bandpass', f: 1800, q: 0.8, dur: 0.22, gain: 0.16 }, [d.out, d.send, d.send]); }
  hat(t) { this.noiseHit(t, { type: 'highpass', f: 8000, q: 0.7, dur: 0.045, gain: 0.035 }, [this.demo.out]); }

  noiseHit(t, { type = 'bandpass', f = 2000, q = 1, dur = 0.05, gain = 0.3, sweepTo } = {}, dest = [this.sfxBus]) {
    const ctx = this.ctx, src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = this.noise; src.loopStart = Math.random();
    flt.type = type; flt.frequency.setValueAtTime(f, t); flt.Q.value = q;
    if (sweepTo) flt.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g); dest.forEach((n) => g.connect(n));
    src.start(t, Math.random()); src.stop(t + dur + 0.02);
  }
  tone(t, { type = 'sine', f = 440, to, dur = 0.1, gain = 0.2, cutoff } = {}) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) { const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = cutoff; node = o.connect(flt); }
    node.connect(g).connect(this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }

  /* ----------------------------------------------------- ljudeffekter ------ */
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'hover': this.tone(t, { f: 2200, dur: 0.02, gain: 0.02 }); break;
      case 'key':
        this.noiseHit(t, { type: 'lowpass', f: 2600, dur: 0.035, gain: 0.45 });
        this.tone(t, { f: 190, to: 85, dur: 0.06, gain: 0.3 }); break;
      case 'clunk':
        this.tone(t, { f: 125, to: 40, dur: 0.18, gain: 0.85 });
        this.noiseHit(t, { type: 'lowpass', f: 800, dur: 0.08, gain: 0.5 });
        this.noiseHit(t + 0.012, { type: 'bandpass', f: 2800, q: 2, dur: 0.018, gain: 0.25 }); break;
      case 'open':
        this.noiseHit(t, { type: 'lowpass', f: 1800, dur: 0.06, gain: 0.3 });
        this.tone(t, { f: 320, to: 170, dur: 0.07, gain: 0.12 });
        this.noiseHit(t + 0.05, { type: 'bandpass', f: 900, q: 1, dur: 0.25, gain: 0.08, sweepTo: 400 }); break;
      case 'clack':
        this.noiseHit(t, { type: 'bandpass', f: 2400, q: 3, dur: 0.02, gain: 0.5 });
        this.noiseHit(t + 0.05, { type: 'bandpass', f: 3100, q: 3, dur: 0.016, gain: 0.35 }); break;
      case 'whoosh': this.noiseHit(t, { type: 'bandpass', f: 320, q: 1.4, dur: 0.95, gain: 0.16, sweepTo: 1900 }); break;
      case 'slide': this.noiseHit(t, { type: 'lowpass', f: 1500, dur: 0.22, gain: 0.28, sweepTo: 420 }); break;
      case 'motor':
        this.tone(t, { type: 'sawtooth', f: 46, to: 64, dur: 0.5, gain: 0.12, cutoff: 200 });
        this.noiseHit(t, { type: 'lowpass', f: 1400, dur: 0.03, gain: 0.3 }); break;
      case 'whir':
        this.tone(t, { type: 'sawtooth', f: 150, to: 330, dur: 0.7, gain: 0.07, cutoff: 900 });
        this.noiseHit(t, { type: 'highpass', f: 5000, dur: 0.6, gain: 0.04 }); break;
      case 'denied':
        this.tone(t, { type: 'square', f: 78, dur: 0.2, gain: 0.25, cutoff: 420 });
        this.noiseHit(t, { type: 'highpass', f: 1500, dur: 0.28, gain: 0.12 }); break;
      case 'power':
        this.tone(t, { f: 120, to: 40, dur: 0.2, gain: 0.7 });
        this.tone(t + 0.08, { f: 55, dur: 0.9, gain: 0.07 });
        this.tone(t + 0.25, { f: 1760, dur: 0.06, gain: 0.05 }); break;
    }
  }
}
