# DREKMOR – Arkivet

En realtids-3D-upplevelse (WebGL/three.js): en industrihall på natten med vått
golv som speglar neonljuset, ett rostigt kassettdäck under DREKMOR-skylten och
kassetterna liggande på golvet framför, fyra i taget (pilarna bläddrar). Varje
släpp är ett riktigt kassettfodral.
Klicka på ett fodral → locket öppnas, kassetten lyfts ur, flyger in i däckets
lucka och luckan slår igen. Sedan kan man **spela** signalen eller öppna
**omslaget** (J-kortet viks ut) och läsa text, credits och berättelser.

Allt – omslag, ryggar, kassettetiketter, frontpanel, ljudeffekter och
demosignal – genereras i koden från `releases.js`. Inga byggsteg, inga CDN:er.

## Filer

| Fil / mapp          | Innehåll                                                              |
|---------------------|-----------------------------------------------------------------------|
| **`releases.js`**   | **Datan – den enda fil du behöver ändra för nya släpp.**              |
| `assets/`           | Omslagsbilder (`d01-cover.jpg` …), ljudfiler och laddarens stillbild. Se `assets/README.md`. |
| `index.html`        | Stomme: laddare, meny, statusrad, arkivlista, omslag.                 |
| `css/site.css`      | Gränssnittet ovanpå scenen.                                           |
| `js/main.js`        | Scen, ljussättning, kamera, bläddring, interaktion och koreografi.    |
| `js/hall.js`        | Hallen: speglande golv, plåtvägg med rör och neonskylt, lampor, rök.  |
| `js/models.js`      | 3D-modeller: däck, kassett, fodral (skalet tonas i släppets färg).    |
| `js/textures.js`    | Procedurella texturer: omslag, ryggar, etiketter, borstad metall.    |
| `js/audio.js`       | Ljudmotor: uppspelning, demosignal, bandbrus, VU, mekaniska ljud.     |
| `js/ui.js`, `js/tween.js` | DOM-lager och animationer.                                      |
| `vendor/three/`     | three.js r170 (MIT) med de tillägg som används, självhostat.          |
| `fonts/`            | Space Grotesk, Space Mono, Bebas Neue (OFL), självhostade.            |

## Lägg till ett nytt släpp

1. Öppna `releases.js`, kopiera ett `{ … }`-block och ändra fälten.
2. Lägg omslaget i `assets/` (kvadrat, minst 1000×1000, JPG) och peka på det
   med `cover: "assets/d03-cover.jpg"`.
3. Lägg ljudfilen i `assets/` och peka på den med `audio: "assets/d03.mp3"`.

Klart. Fodralet, J-kortet, ryggen, kassettetiketten och displaytexten skapas
automatiskt. Släppen står framför däcket i den ordning de ligger i filen, fyra
per sida, och finns även i listan under **Arkivet**.

- `status: "available"` – går att sätta i och spela.
- `status: "coming"` – går att sätta i och läsa omslaget, men "ingen signal ännu".
- `status: "locked"` – hänglås; klick ger en glitch och "signal krypterad".
- `type`: `"song"`, `"interview"` eller `"story"` styr rubriken i omslaget.
- Saknas `audio` spelar däcket en generativ demosignal så att allt lever ändå.

## Köra lokalt

ES-moduler kräver en webbserver (inte `file://`):

```bash
cd drekmor && python3 -m http.server 8080   # öppna http://localhost:8080
```

## Laddaren och stillbilden

Medan scenen byggs visas en stillbild av den (`assets/still.jpg`, 2,4:1) och
laddningen spelas upp på däckets display i bilden, i perspektiv. Hörnen för
displayen ligger i `assets/still.json`. Vid "klicka för att gå in" tar den
levande scenen över med en störningsblixt. Ljud på/av väljs i samma steg.

Ändrar du kameran (`FRAME` i `js/main.js`), hallen, däcket eller ljuset: ta en ny bild.
`index.html?still=1&3d=1` ritar scenen utan gränssnitt och lägger displayens
hörn i `window.__still`. Fotografera i 2400×1000, spara som `assets/still.jpg`
och skriv `window.__still` till `assets/still.json`.

## Lo-fi

Datorer som ritar WebGL i mjukvara (utan grafikkort) och webbläsare utan WebGL
får automatiskt lo-fi-versionen: samma arkiv som lista, spelare och omslag.
`?lofi=1` tvingar lo-fi, `?3d=1` tvingar 3D. Länken till lo-fi-versionen finns
under **Om**.

## Tangentbord och tillgänglighet

1–4 = sätt i ett band · ←/→ = bläddra bland banden · Mellanslag = spela/paus ·
J/L = spola · ↑/↓ = volym · Z = nära däcket · E = mata ut · O = omslag ·
I = arkivet · Esc = tillbaka/stäng. Hela arkivet finns även som vanlig lista (knappen **Arkivet**) för tangentbord
och skärmläsare. `prefers-reduced-motion` förkortar animationerna.
