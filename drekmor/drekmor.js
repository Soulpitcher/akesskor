/* =============================================================================
   DREKMOR – ARKIVET  ·  drekmor.js
   All logik. Innehåller INGEN data – släppen bor i releases.js.
   ============================================================================= */
(function () {
  "use strict";

  const RELEASES = window.RELEASES || [];

  const TYPE_LABEL = { song: "LÅT", interview: "INTERVJU", story: "BERÄTTELSE" };
  const TEXT_HEADING = { song: "TEXT", interview: "TRANSKRIPT", story: "BERÄTTELSE" };
  const STATUS_TAG = { available: "DREKMOR\nARKIV", coming: "SNART\nI SÄNDNING", locked: "SIGNAL\nLÅST" };

  /* --- DOM-referenser ------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const el = {
    shelfLeft: $("shelf-left"),
    shelfRight: $("shelf-right"),
    featured: $("featured"),
    deckWindow: $("deck-window"),
    deck: $("deck"),
    deckTape: $("deck-tape"),
    vuBars: $("vu-bars"),
    powerLed: $("power-led"),
    volume: $("volume"),
    audio: $("audio"),
    btnPlay: $("btn-play"), btnRew: $("btn-rew"), btnStop: $("btn-stop"),
    btnInlay: $("btn-inlay"), btnEject: $("btn-eject"),
    playGlyph: $("play-glyph"), playLabel: $("play-label"),
    stNow: $("st-now"), stNowSub: $("st-now-sub"),
    stState: $("st-state"), stStateSub: $("st-state-sub"),
    stCount: $("st-count"), stSelection: $("st-selection"),
    stId: $("st-id"), stTitle: $("st-title"), stMeter: $("st-meter"),
    inlay: $("inlay"), inlayClose: $("inlay-close"),
  };

  let current = null;     // aktuellt isatt band
  let playing = false;

  /* ========================================================================
     1.  RENDERING
     ==================================================================== */
  function spineTag(r) {
    return (STATUS_TAG[r.status] || "DREKMOR\nARKIV").replace("\n", "<br>");
  }
  function statusIcon(r) {
    if (r.status === "locked") return "🔒";
    if (r.status === "coming") return "◍";
    if (r.type === "story") return "☰";
    if (r.type === "interview") return "🎙";
    return "▸";
  }

  function makeSpine(r) {
    const b = document.createElement("button");
    b.className = "spine";
    b.dataset.id = r.id;
    b.dataset.status = r.status;
    b.style.setProperty("--accent", r.accent || "#c0392b");
    b.innerHTML =
      `<span class="spine__id">${r.id}</span>` +
      `<span class="spine__title">${escapeHtml(r.title)}</span>` +
      `<span class="spine__tag">${spineTag(r)}</span>`;
    // liten ikon till vänster om taggen
    const icon = document.createElement("span");
    icon.className = "spine__icon";
    icon.textContent = statusIcon(r);
    b.insertBefore(icon, b.children[2]);
    b.addEventListener("click", () => loadTape(r.id));
    return b;
  }

  /* Bygger en realistisk analog kassett (samma anatomi i hyllan och i spelaren).
     "full" = full etikett/titel (liggande kassett + spelaren).                */
  function cassetteHTML(r) {
    const accent = r.accent || "#c0392b";
    const type = TYPE_LABEL[r.type] || "";
    const sideInfo = r.status === "coming" ? "SNART" : (r.duration || type || "DREKMOR");
    const reel = (side) =>
      `<div class="reel reel--${side}">
         <div class="reel__spin"><span class="reel__pack"></span><span class="reel__hub"></span></div>
         <div class="reel__gloss"></div>
       </div>`;
    const lock = r.status === "locked"
      ? `<div class="cassette__lock">🔒</div>` : "";
    return (
      `<div class="cassette" style="--accent:${accent}">
         <div class="cassette__shell">
           <i class="screw s-tl"></i><i class="screw s-tr"></i>
           <i class="screw s-bl"></i><i class="screw s-br"></i><i class="screw s-c"></i>
           <div class="cassette__label">
             <div class="cassette__stripe"></div>
             <div class="cassette__brand"><span>DREKMOR</span><span>ARKIV</span></div>
             <div class="cassette__idrow">
               <span class="cassette__id">${r.id}</span>
               <span class="cassette__title">${escapeHtml(r.title)}</span>
             </div>
             <div class="cassette__side"><b>A</b><span>${escapeHtml(sideInfo)}</span></div>
           </div>
           <div class="cassette__window">
             ${reel("l")}
             <div class="cassette__tape"></div>
             ${reel("r")}
           </div>
           <div class="cassette__ports"><i></i><i></i><i></i><i></i><i></i></div>
         </div>
         <div class="cassette__case"></div>
         ${lock}
       </div>`
    );
  }

  function makeCase(r) {
    const b = document.createElement("button");
    b.className = "case";
    b.dataset.id = r.id;
    b.dataset.status = r.status;
    b.style.setProperty("--accent", r.accent || "#c0392b");
    b.innerHTML = cassetteHTML(r);
    b.addEventListener("click", () => loadTape(r.id));
    return b;
  }

  function render() {
    // Dela hyllan i två kolumner (vänster/höger) för att spegla scenen.
    const half = Math.ceil(RELEASES.length / 2);
    RELEASES.forEach((r, i) => {
      (i < half ? el.shelfLeft : el.shelfRight).appendChild(makeSpine(r));
    });
    RELEASES.filter((r) => r.featured).slice(0, 4).forEach((r) => {
      el.featured.appendChild(makeCase(r));
    });
    el.stCount.textContent = RELEASES.length;
    buildVU();
    buildSelMeter();
  }

  /* ========================================================================
     2.  ISÄTTNING / UTMATNING
     ==================================================================== */
  function findById(id) { return RELEASES.find((r) => r.id === id); }

  function loadTape(id) {
    const r = findById(id);
    if (!r) return;

    stopPlayback();
    current = r;

    // Markera vald kassett i hyllan och bland de liggande.
    document.querySelectorAll(".spine, .case").forEach((n) =>
      n.classList.toggle("is-loaded", n.dataset.id === id));

    // Fönstret – rendera en riktig kassett och sätt i den.
    el.deckTape.innerHTML = cassetteHTML(r);
    el.deckWindow.dataset.empty = "false";
    el.deckWindow.style.setProperty("--accent", r.accent || "#c0392b");
    el.powerLed.classList.add("on");

    // Knappar
    const playable = r.status === "available" && (r.audio || r.type !== "story");
    setEnabled(el.btnEject, true);
    setEnabled(el.btnInlay, true);
    setEnabled(el.btnPlay, playable);
    setEnabled(el.btnRew, playable);
    setEnabled(el.btnStop, playable);

    // Statusrad
    el.stState.innerHTML = `BAND ISATT <span class="dash">—</span>`;
    el.stStateSub.textContent = statusText(r);
    el.stNow.innerHTML = `REDO <span class="dash">—</span>`;
    el.stNowSub.textContent = `${r.id} · ${r.title}`;
    el.stSelection.hidden = false;
    el.stId.textContent = r.id;
    el.stId.style.color = r.accent || "var(--red)";
    el.stTitle.textContent = r.title.toUpperCase();

    // Ladda ljudkälla om det finns en fil.
    if (r.audio) { el.audio.src = r.audio; }
    else { el.audio.removeAttribute("src"); }

    if (r.status === "locked") toast(`🔒 ${r.id} – signalen är krypterad. Öppna omslaget.`);
    else if (r.status === "coming") toast(`◍ ${r.id} – ${r.title} · snart i sändning.`);
  }

  function ejectTape() {
    stopPlayback();
    current = null;
    el.deckWindow.dataset.empty = "true";
    setTimeout(() => { if (!current) el.deckTape.innerHTML = ""; }, 500);
    el.powerLed.classList.remove("on");
    document.querySelectorAll(".spine, .case").forEach((n) => n.classList.remove("is-loaded"));
    [el.btnPlay, el.btnRew, el.btnStop, el.btnInlay, el.btnEject].forEach((b) => setEnabled(b, false));
    el.stState.innerHTML = `INGET BAND ISATT <span class="dash">—</span>`;
    el.stStateSub.textContent = "Väntar på signal";
    el.stNow.innerHTML = `INGENTING <span class="dash">—</span>`;
    el.stNowSub.textContent = "Sätt i ett band för att börja";
    el.stSelection.hidden = true;
  }

  function statusText(r) {
    if (r.status === "locked") return "Krypterad signal · öppna omslaget";
    if (r.status === "coming") return "Ännu ej släppt · förhandsvisning";
    return TYPE_LABEL[r.type] === "LÅT" ? "Redo att spela" : "Redo";
  }

  /* ========================================================================
     3.  WEB AUDIO  (uppspelning + platshållarsignal + VU-mätare)
     ==================================================================== */
  let ac = null, analyser = null, masterGain = null, mediaSrc = null;
  let synthNodes = null, hasAnalyser = false, rafId = null;

  function ensureAudio() {
    if (ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ac.createAnalyser();
      analyser.fftSize = 64;
      masterGain = ac.createGain();
      masterGain.gain.value = el.volume.value / 100;
      analyser.connect(masterGain).connect(ac.destination);
      hasAnalyser = true;
    } catch (e) { hasAnalyser = false; }
  }

  function connectElement() {
    if (!ac || mediaSrc) return;
    try {
      mediaSrc = ac.createMediaElementSource(el.audio);
      mediaSrc.connect(analyser);
    } catch (e) { hasAnalyser = false; }  // t.ex. cross-origin – spela ändå
  }

  // Atmosfärisk platshållarsignal när ingen ljudfil finns än.
  function startSynth() {
    stopSynth();
    ensureAudio();
    const g = ac.createGain(); g.gain.value = 0.0;
    const o1 = ac.createOscillator(); o1.type = "sine"; o1.frequency.value = 110;
    const o2 = ac.createOscillator(); o2.type = "sine"; o2.frequency.value = 55;
    const o3 = ac.createOscillator(); o3.type = "triangle"; o3.frequency.value = 220;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.25;
    const lfoGain = ac.createGain(); lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(g.gain);
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.10, ac.currentTime + 1.2);
    [o1, o2, o3].forEach((o) => o.connect(g));
    g.connect(analyser);
    [o1, o2, o3, lfo].forEach((o) => o.start());
    synthNodes = { o1, o2, o3, lfo, g };
  }
  function stopSynth() {
    if (!synthNodes) return;
    try {
      const t = ac.currentTime;
      synthNodes.g.gain.cancelScheduledValues(t);
      synthNodes.g.gain.linearRampToValueAtTime(0, t + 0.25);
      Object.values(synthNodes).forEach((n) => n.stop && n.stop(t + 0.3));
    } catch (e) {}
    synthNodes = null;
  }

  function togglePlay() {
    if (!current) return;
    ensureAudio();
    if (ac.state === "suspended") ac.resume();
    playing ? pausePlayback() : startPlayback();
  }

  function startPlayback() {
    if (!current) return;
    playing = true;
    el.deck.classList.add("is-playing");
    el.btnPlay.classList.add("is-active");
    el.playGlyph.textContent = "❚❚"; el.playLabel.textContent = "PAUSE";
    el.stNow.innerHTML = `${current.title.toUpperCase()} <span class="dash">—</span>`;
    el.stState.innerHTML = `SPELAR <span class="dash">—</span>`;

    if (current.audio) {
      connectElement();
      el.audio.volume = 1;
      el.audio.play().catch(() => toast("Kunde inte spela ljudfilen."));
    } else {
      startSynth();      // platshållarsignal
      el.stNowSub.textContent = "Demosignal · riktig inspelning kommer";
    }
    animateVU();
  }

  function pausePlayback() {
    playing = false;
    if (current && current.audio) el.audio.pause();
    else stopSynth();
    setPausedUI();
  }

  function stopPlayback() {
    playing = false;
    try { el.audio.pause(); el.audio.currentTime = 0; } catch (e) {}
    stopSynth();
    setPausedUI();
  }

  function setPausedUI() {
    el.deck.classList.remove("is-playing");
    el.btnPlay.classList.remove("is-active");
    el.playGlyph.textContent = "▶"; el.playLabel.textContent = "PLAY";
    if (rafId) cancelAnimationFrame(rafId), (rafId = null);
    decayVU();
    if (current) el.stState.innerHTML = `PAUS <span class="dash">—</span>`;
  }

  /* ---- VU-mätare ---------------------------------------------------------- */
  const VU_N = 28;
  function buildVU() {
    el.vuBars.innerHTML = "";
    for (let i = 0; i < VU_N; i++) {
      const b = document.createElement("div");
      b.className = "vu__bar";
      el.vuBars.appendChild(b);
    }
  }
  function buildSelMeter() {
    el.stMeter.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.style.height = (20 + Math.random() * 60) + "%";
      el.stMeter.appendChild(s);
    }
  }
  let vuData = null;
  function animateVU() {
    const bars = el.vuBars.children;
    if (hasAnalyser && analyser) {
      vuData = vuData || new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(vuData);
      const step = Math.floor(vuData.length / VU_N) || 1;
      for (let i = 0; i < VU_N; i++) {
        const v = vuData[i * step] / 255;
        bars[i].style.height = Math.max(6, v * 100) + "%";
        bars[i].style.opacity = 0.5 + v * 0.5;
      }
    } else {
      // Fallback: mjuk pseudo-slumpad rörelse.
      for (let i = 0; i < VU_N; i++) {
        const base = Math.sin(Date.now() / 200 + i) * 0.3 + 0.5;
        bars[i].style.height = Math.max(6, (base + Math.random() * 0.25) * 90) + "%";
      }
    }
    if (playing) rafId = requestAnimationFrame(animateVU);
  }
  function decayVU() {
    const bars = el.vuBars.children;
    let h = 90, steps = 0;
    (function fall() {
      h *= 0.72; steps++;
      for (let i = 0; i < bars.length; i++) bars[i].style.height = Math.max(6, h * (0.5 + Math.random() * 0.5)) + "%";
      if (steps < 12) requestAnimationFrame(fall);
    })();
  }

  /* ========================================================================
     4.  OMSLAG / INLAY
     ==================================================================== */
  function openInlay() {
    if (!current) return;
    const r = current;
    // Framsida
    const cover = $("inlay-cover");
    cover.style.setProperty("--accent", r.accent || "#c0392b");
    cover.style.backgroundImage = r.cover
      ? `linear-gradient(180deg, rgba(0,0,0,.1), rgba(0,0,0,.65)), url("${r.cover}")`
      : "";
    $("inlay-cover-id").textContent = r.id;
    $("inlay-cover-title").textContent = r.title;
    $("inlay-cover-type").textContent = TYPE_LABEL[r.type] || "";

    // Papper
    $("inlay-id").textContent = r.id;
    $("inlay-title").textContent = r.title;
    const meta = [];
    if (r.releaseDate) meta.push(formatDate(r.releaseDate));
    if (r.duration) meta.push(r.duration);
    meta.push(TYPE_LABEL[r.type] || "");
    if (r.status !== "available") meta.push(r.status === "locked" ? "🔒 LÅST" : "SNART");
    $("inlay-meta").innerHTML = meta.filter(Boolean).map((m) => `<span>${m}</span>`).join("");

    $("inlay-notes").textContent = r.notes || "";

    // Credits
    const cw = $("inlay-credits-wrap"), cl = $("inlay-credits");
    const creds = (r.credits || []).filter((c) => c && c.name);
    if (creds.length) {
      cl.innerHTML = creds.map((c) => `<dt>${escapeHtml(c.role)}</dt><dd>${escapeHtml(c.name)}</dd>`).join("");
      cw.hidden = false;
    } else cw.hidden = true;

    // Text / berättelse / transkript
    const tw = $("inlay-text-wrap");
    if (r.status === "locked") {
      tw.hidden = false;
      $("inlay-text-heading").textContent = "STATUS";
      $("inlay-text").textContent = "🔒 Signalen är krypterad.\nBandet är låst tills vidare.";
    } else if (r.text && r.text.trim()) {
      tw.hidden = false;
      $("inlay-text-heading").textContent = TEXT_HEADING[r.type] || "TEXT";
      $("inlay-text").textContent = r.text;
    } else {
      tw.hidden = false;
      $("inlay-text-heading").textContent = TEXT_HEADING[r.type] || "TEXT";
      $("inlay-text").textContent = r.status === "coming"
        ? "Ännu ej publicerad. Snart i sändning."
        : "Innehåll läggs till här.";
    }

    // Länkar
    const lw = $("inlay-links");
    const links = r.links || {};
    const map = { spotify: "Spotify", youtube: "YouTube", apple: "Apple Music", bandcamp: "Bandcamp" };
    lw.innerHTML = Object.keys(map)
      .filter((k) => links[k])
      .map((k) => `<a href="${links[k]}" target="_blank" rel="noopener">${map[k]}</a>`)
      .join("");

    el.inlay.hidden = false;
    document.body.style.overflow = "hidden";
    el.inlayClose.focus();
  }
  function closeInlay() {
    el.inlay.hidden = true;
    document.body.style.overflow = "";
  }

  /* ========================================================================
     5.  HJÄLPARE + EVENT
     ==================================================================== */
  function setEnabled(btn, on) { btn.disabled = !on; }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });
  }

  let toastTimer = null;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  function wire() {
    el.btnPlay.addEventListener("click", togglePlay);
    el.btnStop.addEventListener("click", () => { stopPlayback(); });
    el.btnEject.addEventListener("click", ejectTape);
    el.btnInlay.addEventListener("click", openInlay);
    el.btnRew.addEventListener("click", () => {
      if (current && current.audio) { el.audio.currentTime = Math.max(0, el.audio.currentTime - 10); }
      else toast("◀◀ Spola");
    });
    el.inlayClose.addEventListener("click", closeInlay);
    el.inlay.addEventListener("click", (e) => { if (e.target === el.inlay) closeInlay(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.inlay.hidden) closeInlay();
      if (e.key === " " && current && !el.btnPlay.disabled && el.inlay.hidden) { e.preventDefault(); togglePlay(); }
    });
    el.volume.addEventListener("input", () => {
      if (masterGain) masterGain.gain.value = el.volume.value / 100;
      el.audio.volume = 1;
    });
    el.audio.addEventListener("ended", () => { stopPlayback(); el.stNow.innerHTML = `SLUT <span class="dash">—</span>`; });
  }

  /* --- START --------------------------------------------------------------- */
  render();
  wire();
  const yr = $("year"); if (yr) yr.textContent = new Date().getFullYear();
})();
