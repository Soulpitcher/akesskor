# DREKMOR – Kontrollrummet (prototyp: `kontrollrum.html`)

Ett övergivet kontrollrum. Rummet är **en bild** (`assets/kontrollrum.webp`,
1672 × 941) som ritas med WebGL så att den kan leva: varje lampa i bilden kan
släckas och tändas för sig, golvet skimrar och damm svävar i ljusstrålen.

- **Välja signal:** larmtablån (klicka på tablån i pulten, eller knapparna 1–8).
  Varje släpp i `releases.js` är en ruta. Släppta lyser, nästa kommande blinkar
  rött med lappen "Ej i drift", låsta är tomma.
- **När en signal spelas** startar anläggningen: lysrören flimrar igång,
  oscilloskopet ritar ljudet, nålarna rör sig och varningslamporna följer basen.
  När den stannar slocknar rummet igen.
- **Låtinformationen:** de två skrivarfönstren på väggen. *Signal* visar
  omslaget, titeln och kurvan som pennan ritar. *Journal* visar medverkande,
  datum, länkar och texten.

| Fil                    | Innehåll                                                        |
|------------------------|-----------------------------------------------------------------|
| `kontrollrum.html`     | Stomme: rummet, statusrad, tablå, skrivare, anslag, entré.      |
| `css/kontrollrum.css`  | Skyltar, lysrutor, skrivarpapper.                               |
| `js/kr/main.js`        | Tillstånd, ljusets koreografi, vy, tangenter.                   |
| `js/kr/plate.js`       | Bildmotorn (WebGL): ljuskällorna och deras lägen i bilden.      |
| `js/kr/live.js`        | Det som rör sig i bilden: kurva, nålar, papper, knappar. Här står också klickytornas lägen. |
| `js/kr/panels.js`      | Närbilderna: tablån, skrivarna och anslaget (vanlig HTML).      |

Delar `releases.js`, `js/audio.js`, `fonts/` och omslagen med arkivsidan nedan.

**Byta bild:** en ny version av bilden kan läggas in rakt av så länge motivet
ligger på samma ställe (samma komposition och proportioner 16:9). Flyttas något
måste måtten i `js/kr/live.js` (klickytor, skärm, knappar) och `js/kr/plate.js`
(lampor) justeras. Alla mått är i bildens pixlar vid 1672 × 941. Den nuvarande
filen är retuscherad: kassetterna är borttagna och kassettdäcket i pulten är
ersatt med DREKMOR-skylten.

Tangenter: 1–8 välj · Mellanslag spela/paus · T tablå · S skrivare · O om ·
←/→ föregående/nästa · J/L spola · ↑/↓ volym · M ljud · Esc stäng.

---

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
