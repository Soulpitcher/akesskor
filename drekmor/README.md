# DREKMOR – Arkivet

En mörk, filmisk kassettsida. Varje släpp är en kassett i ett arkiv. Man
trycker på en kassett – antingen en liggande framför spelaren eller en **rygg**
i hyllan – så laddas bandet in i kassettspelaren. Därifrån kan man:

- **Spela** signalen (låt / intervju / uppläsning), eller
- **Öppna omslaget** ("papperet") och läsa titel, credits, text/berättelse och länkar.

Sidan är helt statisk (HTML/CSS/JS, inga byggsteg) och **datadriven** – hela
arkivet bor i `releases.js`.

## Filer

| Fil            | Vad den gör                                                        |
|----------------|--------------------------------------------------------------------|
| `index.html`   | Stommen: header, spelare, hyllor, statusrad, omslags-modal.        |
| `drekmor.css`  | All design. Färger/mått ligger som variabler högst upp (`:root`).  |
| `drekmor.js`   | All logik: isättning, uppspelning, VU-mätare, omslag. Rör sällan.  |
| **`releases.js`** | **Datan – den enda fil du behöver ändra för nya släpp.**        |

## Lägg till ett nytt släpp

1. Öppna `releases.js`.
2. Kopiera ett helt `{ ... }`-block.
3. Klistra in på rätt plats i listan (ordningen = ordningen i hyllan).
4. Ändra fälten. Spara. Klart – sidan bygger om sig själv.

Varje kassett har ett `type`:

- `"song"` – låt. Spelas upp; omslaget visar **texten**.
- `"interview"` – inspelad intervju. Spelas upp; omslaget visar **transkript**.
- `"story"` – berättelse ur Drekmor-världen. Läses i omslaget.

…och en `status`:

- `"available"` – går att spela/läsa nu.
- `"coming"` – syns i arkivet men är inte släppt än (teaser).
- `"locked"` – låst kassett med hänglås (mystik / kommande signal).

`accent` (hex-färg) ger varje kassett sitt eget uttryck. `featured: true` gör
att den även visas som liggande kassett längst fram (max ~4 st).

### Lägga till riktigt ljud

Lägg ljudfilen i `drekmor/assets/` och peka på den:

```js
audio: "assets/d01.mp3",
```

Finns ingen fil (`audio: null`) spelas en atmosfärisk platshållarsignal så att
mätaren och rullarna lever redan innan låten finns. Streaminglänkar (Spotify,
YouTube) hör hemma i `links`, inte i `audio`.

### Omslagsbild

Lägg en bild i `assets/` och sätt `cover: "assets/d01-cover.jpg"`. Utan bild
ritas ett snyggt färgomslag av `accent`-färgen automatiskt.

## Köra lokalt

Öppna `index.html` i en webbläsare, eller kör en enkel server i mappen:

```bash
cd drekmor && python3 -m http.server 8080
# öppna http://localhost:8080
```

## Tillgänglighet & prestanda

- Fungerar med tangentbord (Tab + Enter, `Esc` stänger omslaget, mellanslag = play/paus).
- Respekterar `prefers-reduced-motion` (stänger av rullar/animationer).
- Inga ramverk, inga byggsteg, ~en handfull kB. Endast typsnitt laddas externt.
