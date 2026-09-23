# DREKMOR – Arkivet

En realtids-3D-upplevelse (WebGL/three.js): ett mörkt rum, ett 80-tals
kassettdäck och bandarkivet. Varje släpp är ett riktigt kassettfodral.
Klicka på ett fodral → locket öppnas, kassetten lyfts ur, flyger in i däckets
lucka och luckan slår igen. Sedan kan man **spela** signalen eller öppna
**omslaget** (J-kortet viks ut) och läsa text, credits och berättelser.

Allt – omslag, ryggar, kassettetiketter, frontpanel, ljudeffekter och
demosignal – genereras i koden från `releases.js`. Inga byggsteg, inga CDN:er.

## Filer

| Fil / mapp          | Innehåll                                                              |
|---------------------|-----------------------------------------------------------------------|
| **`releases.js`**   | **Datan – den enda fil du behöver ändra för nya släpp.**              |
| `assets/`           | Omslagsbilder (`d01-cover.jpg` …) och ljudfiler. Se `assets/README.md`. |
| `index.html`        | Stomme: laddare, meny, HUD, arkivlista, omslag.                       |
| `css/site.css`      | Gränssnittet ovanpå scenen.                                           |
| `js/main.js`        | Scen, ljussättning, kamera, interaktion och koreografi.               |
| `js/models.js`      | 3D-modeller: däck, kassett, fodral.                                   |
| `js/textures.js`    | Procedurella texturer: omslag, ryggar, etiketter, borstad metall.    |
| `js/audio.js`       | Ljudmotor: uppspelning, demosignal, bandbrus, VU, mekaniska ljud.     |
| `js/ui.js`, `js/tween.js` | DOM-lager och animationer.                                      |
| `vendor/three/`     | three.js r170 (MIT), självhostad.                                     |
| `fonts/`            | Space Grotesk, Space Mono, Bebas Neue (OFL), självhostade.            |

## Lägg till ett nytt släpp

1. Öppna `releases.js`, kopiera ett `{ … }`-block och ändra fälten.
2. Lägg omslaget i `assets/` (kvadrat, minst 1000×1000, JPG) och peka på det
   med `cover: "assets/d03-cover.jpg"`.
3. Lägg ljudfilen i `assets/` och peka på den med `audio: "assets/d03.mp3"`.

Klart. Fodralet, J-kortet, ryggen, kassettetiketten och displaytexten skapas
automatiskt. `featured: true` lägger fodralet framför däcket (max 4 st);
alla släpp hamnar i staplarna och i listan under **Arkivet**.

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

## Tangentbord och tillgänglighet

Mellanslag = spela/paus · ←/→ = spola · ↑/↓ = volym · E = mata ut ·
O = omslag · I = arkivet · Esc = stäng. Hela arkivet finns även som vanlig
lista (knappen **Arkivet**) för tangentbord, skärmläsare och webbläsare utan
WebGL. `prefers-reduced-motion` förkortar animationerna.
