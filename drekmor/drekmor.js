/* =============================================================================
   DREKMOR — ARKIVET  ·  drekmor.js
   All logik. Ingen data här – släppen bor i releases.js.
   ============================================================================= */
(function () {
  "use strict";

  const RELEASES = window.RELEASES || [];
  const TYPE_LABEL = { song: "Låt", interview: "Intervju", story: "Berättelse" };
  const TEXT_HEADING = { song: "Text", interview: "Transkript", story: "Berättelse" };

  const $ = (id) => document.getElementById(id);
  const el = {
    nav: $("nav"), intro: $("intro"),
    featured: $("featured"), rack: $("rack"),
    deck: $("deck"), deckWindow: $("deck-window"), deckTape: $("deck-tape"),
    vuBars: $("vu-bars"), powerLed: $("power-led"), volume: $("volume"), audio: $("audio"),
    btnPlay: $("btn-play"), btnRew: $("btn-rew"), btnStop: $("btn-stop"), btnInlay: $("btn-inlay"), btnEject: $("btn-eject"),
    playGlyph: $("play-glyph"), playLabel: $("play-label"),
    // nowbar
    nowbar: $("nowbar"), nowArt: $("now-art"), nowId: $("now-id"), nowTitle: $("now-title"), nowSub: $("now-sub"),
    nbRew: $("nb-rew"), nbPlay: $("nb-play"), nbStop: $("nb-stop"), nbInlay: $("nb-inlay"), nbEject: $("nb-eject"),
    scrub: $("scrub"), scrubFill: $("scrub-fill"), scrubKnob: $("scrub-knob"), timeCur: $("time-cur"), timeDur: $("time-dur"),
    // inlay
    inlay: $("inlay"), inlayClose: $("inlay-close"),
  };

  let current = null, playable = false, playing = false;

  /* ========================================================================
     KASSETT-KOMPONENT (delas av arkiv + spelare)
     ==================================================================== */
  function cassetteHTML(r) {
    const accent = r.accent || "#c0392b";
    const type = TYPE_LABEL[r.type] || "";
    const sideInfo = r.status === "coming" ? "SNART" : (r.duration || type || "DREKMOR");
    const reel = (s) =>
      `<div class="reel reel--${s}"><div class="reel__spin"><span class="reel__pack"></span><span class="reel__hub"></span></div><div class="reel__gloss"></div></div>`;
    const lock = r.status === "locked" ? `<div class="cassette__lock">🔒</div>` : "";
    const hasCover = !!r.cover;
    const artLayer = hasCover
      ? `<div class="cassette__art" style="background-image:url('${r.cover}'), linear-gradient(160deg, ${accent}, #0a0c10 82%)"></div>
         <div class="cassette__scrim"></div>
         <div class="cassette__plate"><span>DREKMOR · ARKIV</span><span class="cassette__id">${r.id}</span></div>
         <div class="cassette__name">${escapeHtml(r.title)}</div>`
      : `<div class="cassette__label"><div class="cassette__stripe"></div>
           <div class="cassette__brand"><span>DREKMOR</span><span>ARKIV</span></div>
           <div class="cassette__idrow"><span class="cassette__id">${r.id}</span><span class="cassette__title">${escapeHtml(r.title)}</span></div>
           <div class="cassette__side"><b>A</b><span>${escapeHtml(sideInfo)}</span></div></div>`;
    return `<div class="cassette${hasCover ? " has-cover" : ""}" style="--accent:${accent}">
        <div class="cassette__shell">${artLayer}
          <i class="screw s-tl"></i><i class="screw s-tr"></i><i class="screw s-bl"></i><i class="screw s-br"></i><i class="screw s-c"></i>
          <div class="cassette__window">${reel("l")}<div class="cassette__tape"></div>${reel("r")}</div>
          <div class="cassette__ports"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="cassette__wear"></div>
        </div><div class="cassette__case"></div>${lock}
      </div>`;
  }

  /* ========================================================================
     RENDERING
     ==================================================================== */
  function makeCase(r) {
    const b = document.createElement("button");
    b.className = "case";
    b.dataset.id = r.id; b.dataset.status = r.status;
    b.style.setProperty("--accent", r.accent || "#c0392b");
    const meta = r.status === "coming" ? "Snart" : (r.duration ? `${TYPE_LABEL[r.type]} · ${r.duration}` : TYPE_LABEL[r.type]);
    b.innerHTML = cassetteHTML(r) +
      `<div class="case__cap"><span class="case__cap-title">${escapeHtml(r.title)}</span><span class="case__cap-meta">${escapeHtml(meta || "")}</span></div>`;
    b.addEventListener("click", () => loadTape(r.id));
    return b;
  }

  function makeRow(r) {
    const b = document.createElement("button");
    b.className = "rrow"; b.dataset.id = r.id; b.dataset.status = r.status;
    b.style.setProperty("--accent", r.accent || "#c0392b");
    const badge = r.status === "coming" ? "Snart" : r.status === "locked" ? "Låst" : TYPE_LABEL[r.type];
    const right = r.status === "locked" ? "🔒" : (r.duration || "");
    b.innerHTML =
      `<span class="rrow__num">${r.id}</span>
       <span class="rrow__main"><span class="rrow__title">${escapeHtml(r.title)}</span><span class="rrow__type">${TYPE_LABEL[r.type] || ""}</span></span>
       <span class="rrow__right"><span class="rrow__badge">${badge}</span><span class="rrow__meta">${right}</span><span class="rrow__play">▶</span></span>`;
    b.addEventListener("click", () => loadTape(r.id));
    return b;
  }

  function render() {
    RELEASES.filter((r) => r.featured).slice(0, 4).forEach((r) => el.featured.appendChild(makeCase(r)));
    RELEASES.forEach((r) => el.rack.appendChild(makeRow(r)));
    buildVU();
  }

  /* ========================================================================
     ISÄTTNING / UTMATNING
     ==================================================================== */
  const findById = (id) => RELEASES.find((r) => r.id === id);

  function loadTape(id) {
    const r = findById(id);
    if (!r) return;
    stopPlayback();
    current = r;
    playable = r.status === "available" && (r.audio || r.type !== "story");

    document.querySelectorAll(".case, .rrow").forEach((n) => n.classList.toggle("is-loaded", n.dataset.id === id));

    el.deckTape.innerHTML = cassetteHTML(r);
    el.deckWindow.dataset.empty = "false";
    el.powerLed.classList.add("on");

    setEnabled(el.btnEject, true); setEnabled(el.btnInlay, true);
    setEnabled(el.btnPlay, playable); setEnabled(el.btnRew, playable); setEnabled(el.btnStop, playable);

    // Now-bar
    el.nowbar.dataset.active = "true";
    el.nowbar.style.setProperty("--accent", r.accent || "#c0392b");
    el.nowArt.style.backgroundImage = r.cover ? `url("${r.cover}")` : "";
    el.nowId.textContent = r.id;
    el.nowTitle.textContent = r.title;
    el.nowSub.textContent = subLine(r);
    resetScrub();

    el.audio.removeAttribute("src");
    if (r.audio) el.audio.src = r.audio;

    if (r.status === "locked") toast(`🔒 ${r.id} — signalen är krypterad. Öppna omslaget.`);
    else if (r.status === "coming") toast(`◍ ${r.id} — ${r.title} · snart i sändning.`);
  }

  function ejectTape() {
    stopPlayback();
    current = null; playable = false;
    el.deckWindow.dataset.empty = "true";
    setTimeout(() => { if (!current) el.deckTape.innerHTML = ""; }, 550);
    el.powerLed.classList.remove("on");
    document.querySelectorAll(".case, .rrow").forEach((n) => n.classList.remove("is-loaded"));
    [el.btnPlay, el.btnRew, el.btnStop, el.btnInlay, el.btnEject].forEach((b) => setEnabled(b, false));
    el.nowbar.dataset.active = "false";
  }

  function subLine(r) {
    if (r.status === "locked") return "Krypterad signal · öppna omslaget";
    if (r.status === "coming") return "Ännu ej släppt · förhandsvisning";
    if (!r.audio) return "Demosignal · riktig inspelning kommer";
    return TYPE_LABEL[r.type] || "Redo";
  }

  /* ========================================================================
     WEB AUDIO (uppspelning + platshållarsignal + VU)
     ==================================================================== */
  let ac = null, analyser = null, masterGain = null, mediaSrc = null, synthNodes = null, hasAnalyser = false, rafId = null;

  function ensureAudio() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ac.createAnalyser(); analyser.fftSize = 64;
      masterGain = ac.createGain(); masterGain.gain.value = el.volume.value / 100;
      analyser.connect(masterGain).connect(ac.destination);
      hasAnalyser = true;
    } catch (e) { hasAnalyser = false; }
  }
  function connectElement() {
    if (!ac || mediaSrc) return;
    try { mediaSrc = ac.createMediaElementSource(el.audio); mediaSrc.connect(analyser); }
    catch (e) { hasAnalyser = false; }
  }
  function startSynth() {
    stopSynth(); ensureAudio();
    const g = ac.createGain(); g.gain.value = 0;
    const o1 = ac.createOscillator(); o1.type = "sine"; o1.frequency.value = 110;
    const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 55;
    const o3 = ac.createOscillator(); o3.type = "triangle"; o3.frequency.value = 220;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.25;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(g.gain);
    g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(0.1, ac.currentTime + 1.2);
    [o1, o2, o3].forEach((o) => o.connect(g)); g.connect(analyser);
    [o1, o2, o3, lfo].forEach((o) => o.start());
    synthNodes = { o1, o2, o3, lfo, g };
  }
  function stopSynth() {
    if (!synthNodes) return;
    try { const t = ac.currentTime; synthNodes.g.gain.cancelScheduledValues(t); synthNodes.g.gain.linearRampToValueAtTime(0, t + 0.25); Object.values(synthNodes).forEach((n) => n.stop && n.stop(t + 0.3)); } catch (e) {}
    synthNodes = null;
  }

  function togglePlay() {
    if (!current) return;
    if (!playable) { toast(current.status === "locked" ? "🔒 Låst signal." : "◍ Ännu ej släppt."); return; }
    ensureAudio(); if (ac.state === "suspended") ac.resume();
    playing ? pausePlayback() : startPlayback();
  }
  function startPlayback() {
    playing = true;
    el.deck.classList.add("is-playing");
    el.btnPlay.classList.add("is-active");
    el.playGlyph.textContent = "❚❚"; el.playLabel.textContent = "PAUSE";
    el.nbPlay.textContent = "❚❚";
    el.nowSub.textContent = "Spelar";
    if (current.audio) { connectElement(); el.audio.play().catch(() => toast("Kunde inte spela ljudfilen.")); }
    else { startSynth(); el.nowSub.textContent = "Demosignal · riktig inspelning kommer"; }
    animateVU();
  }
  function pausePlayback() { playing = false; if (current && current.audio) el.audio.pause(); else stopSynth(); setPausedUI(); }
  function stopPlayback() { playing = false; try { el.audio.pause(); el.audio.currentTime = 0; } catch (e) {} stopSynth(); setPausedUI(); resetScrub(); }
  function setPausedUI() {
    el.deck.classList.remove("is-playing");
    el.btnPlay.classList.remove("is-active");
    el.playGlyph.textContent = "▶"; el.playLabel.textContent = "PLAY"; el.nbPlay.textContent = "▶";
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    decayVU();
    if (current) el.nowSub.textContent = subLine(current);
  }

  /* ---- VU ---------------------------------------------------------------- */
  const VU_N = 28;
  function buildVU() { el.vuBars.innerHTML = ""; for (let i = 0; i < VU_N; i++) { const b = document.createElement("div"); b.className = "vu__bar"; el.vuBars.appendChild(b); } }
  let vuData = null;
  function animateVU() {
    const bars = el.vuBars.children;
    if (hasAnalyser && analyser) {
      vuData = vuData || new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(vuData);
      const step = Math.floor(vuData.length / VU_N) || 1;
      for (let i = 0; i < VU_N; i++) { const v = vuData[i * step] / 255; bars[i].style.height = Math.max(6, v * 100) + "%"; bars[i].style.opacity = 0.5 + v * 0.5; }
    } else {
      for (let i = 0; i < VU_N; i++) { const base = Math.sin(Date.now() / 200 + i) * 0.3 + 0.5; bars[i].style.height = Math.max(6, (base + Math.random() * 0.25) * 90) + "%"; }
    }
    if (playing) rafId = requestAnimationFrame(animateVU);
  }
  function decayVU() { const bars = el.vuBars.children; let h = 90, s = 0; (function fall() { h *= 0.72; s++; for (let i = 0; i < bars.length; i++) bars[i].style.height = Math.max(6, h * (0.5 + Math.random() * 0.5)) + "%"; if (s < 12) requestAnimationFrame(fall); })(); }

  /* ---- Scrubber / tid ---------------------------------------------------- */
  function fmt(t) { if (!isFinite(t)) return "—:—"; const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ":" + (s < 10 ? "0" : "") + s; }
  function resetScrub() { el.scrubFill.style.width = "0%"; el.scrubKnob.style.left = "0%"; el.timeCur.textContent = "0:00"; el.timeDur.textContent = current && current.audio ? "…" : "—:—"; }
  function updateScrub() {
    const d = el.audio.duration, c = el.audio.currentTime;
    if (!isFinite(d) || d === 0) return;
    const p = (c / d) * 100;
    el.scrubFill.style.width = p + "%"; el.scrubKnob.style.left = p + "%";
    el.timeCur.textContent = fmt(c); el.timeDur.textContent = fmt(d);
  }
  function seekAt(clientX) {
    const d = el.audio.duration; if (!isFinite(d) || d === 0) return;
    const rect = el.scrub.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.audio.currentTime = p * d; updateScrub();
  }

  /* ========================================================================
     OMSLAG / INLAY
     ==================================================================== */
  function openInlay() {
    if (!current) return; const r = current;
    const cover = $("inlay-cover");
    cover.style.setProperty("--accent", r.accent || "#c0392b");
    cover.classList.toggle("has-image", !!r.cover);
    cover.style.backgroundImage = r.cover
      ? `url("${r.cover}"), linear-gradient(160deg, ${r.accent || "#c0392b"}, #0a0c10 82%)`
      : "";
    $("inlay-cover-id").textContent = r.id; $("inlay-cover-title").textContent = r.title; $("inlay-cover-type").textContent = TYPE_LABEL[r.type] || "";
    $("inlay-id").textContent = r.id; $("inlay-title").textContent = r.title;
    const meta = [];
    if (r.releaseDate) meta.push(formatDate(r.releaseDate));
    if (r.duration) meta.push(r.duration);
    meta.push(TYPE_LABEL[r.type] || "");
    if (r.status !== "available") meta.push(r.status === "locked" ? "🔒 Låst" : "Snart");
    $("inlay-meta").innerHTML = meta.filter(Boolean).map((m) => `<span>${m}</span>`).join("");
    $("inlay-notes").textContent = r.notes || "";
    const cw = $("inlay-credits-wrap"), cl = $("inlay-credits");
    const creds = (r.credits || []).filter((c) => c && c.name);
    if (creds.length) { cl.innerHTML = creds.map((c) => `<dt>${escapeHtml(c.role)}</dt><dd>${escapeHtml(c.name)}</dd>`).join(""); cw.hidden = false; } else cw.hidden = true;
    const tw = $("inlay-text-wrap");
    tw.hidden = false;
    if (r.status === "locked") { $("inlay-text-heading").textContent = "Status"; $("inlay-text").textContent = "🔒 Signalen är krypterad.\nBandet är låst tills vidare."; }
    else if (r.text && r.text.trim()) { $("inlay-text-heading").textContent = TEXT_HEADING[r.type] || "Text"; $("inlay-text").textContent = r.text; }
    else { $("inlay-text-heading").textContent = TEXT_HEADING[r.type] || "Text"; $("inlay-text").textContent = r.status === "coming" ? "Ännu ej publicerad. Snart i sändning." : "Innehåll läggs till här."; }
    const lw = $("inlay-links"), links = r.links || {}, map = { spotify: "Spotify", youtube: "YouTube", apple: "Apple Music", bandcamp: "Bandcamp" };
    lw.innerHTML = Object.keys(map).filter((k) => links[k]).map((k) => `<a href="${links[k]}" target="_blank" rel="noopener">${map[k]}</a>`).join("");
    el.inlay.hidden = false; document.body.style.overflow = "hidden"; el.inlayClose.focus();
  }
  function closeInlay() { el.inlay.hidden = true; document.body.style.overflow = ""; }

  /* ========================================================================
     HJÄLPARE + EVENT
     ==================================================================== */
  function setEnabled(btn, on) { btn.disabled = !on; }
  function escapeHtml(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function formatDate(iso) { const d = new Date(iso); if (isNaN(d)) return iso; return d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" }); }
  let toastTimer = null;
  function toast(msg) { let t = document.querySelector(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = msg; requestAnimationFrame(() => t.classList.add("show")); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 3200); }

  function wire() {
    // Deck-knappar
    el.btnPlay.addEventListener("click", togglePlay);
    el.btnStop.addEventListener("click", stopPlayback);
    el.btnEject.addEventListener("click", ejectTape);
    el.btnInlay.addEventListener("click", openInlay);
    el.btnRew.addEventListener("click", () => { if (current && current.audio) el.audio.currentTime = Math.max(0, el.audio.currentTime - 10); });
    // Now-bar
    el.nbPlay.addEventListener("click", togglePlay);
    el.nbStop.addEventListener("click", stopPlayback);
    el.nbEject.addEventListener("click", ejectTape);
    el.nbInlay.addEventListener("click", openInlay);
    el.nbRew.addEventListener("click", () => { if (current && current.audio) el.audio.currentTime = Math.max(0, el.audio.currentTime - 10); });
    // Scrub
    let scrubbing = false;
    el.scrub.addEventListener("pointerdown", (e) => { scrubbing = true; el.scrub.setPointerCapture(e.pointerId); seekAt(e.clientX); });
    el.scrub.addEventListener("pointermove", (e) => { if (scrubbing) seekAt(e.clientX); });
    el.scrub.addEventListener("pointerup", () => { scrubbing = false; });
    // Modal
    el.inlayClose.addEventListener("click", closeInlay);
    el.inlay.addEventListener("click", (e) => { if (e.target === el.inlay) closeInlay(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.inlay.hidden) closeInlay();
      if (e.key === " " && current && el.inlay.hidden && e.target.tagName !== "INPUT") { e.preventDefault(); togglePlay(); }
    });
    // Volym
    el.volume.addEventListener("input", () => { if (masterGain) masterGain.gain.value = el.volume.value / 100; });
    // Audio
    el.audio.addEventListener("timeupdate", updateScrub);
    el.audio.addEventListener("loadedmetadata", updateScrub);
    el.audio.addEventListener("ended", () => { stopPlayback(); el.nowSub.textContent = "Slut · signalen tystnade"; });
  }

  /* ---- Nav, scrollspy, reveal, intro ------------------------------------- */
  function chrome() {
    const onScroll = () => el.nav.classList.toggle("scrolled", window.scrollY > 40);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal
    if ("IntersectionObserver" in window) {
      const rev = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("in"); rev.unobserve(x.target); } }), { threshold: 0.12 });
      document.querySelectorAll("[data-reveal]").forEach((n) => rev.observe(n));

      // Scrollspy
      const map = { machine: "#machine", archive: "#archive", collection: "#machine", about: "#about" };
      const links = [...document.querySelectorAll(".nav__link")];
      const spy = new IntersectionObserver((es) => {
        es.forEach((x) => {
          if (!x.isIntersecting) return;
          const href = "#" + x.target.id;
          links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === href));
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      ["machine", "archive", "about"].forEach((id) => { const s = $(id); if (s) spy.observe(s); });
    } else {
      document.querySelectorAll("[data-reveal]").forEach((n) => n.classList.add("in"));
    }

    // Intro
    window.addEventListener("load", () => setTimeout(() => el.intro.classList.add("done"), 900));
    setTimeout(() => el.intro.classList.add("done"), 2600); // failsafe
  }

  /* ---- START ------------------------------------------------------------- */
  render(); wire(); chrome();
  const yr = $("year"); if (yr) yr.textContent = new Date().getFullYear();
})();
