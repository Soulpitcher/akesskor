# assets/ – omslag och ljud

## Omslag (på plats)

| Fil             | Släpp               | Källa (Google Drive)                                       |
|-----------------|---------------------|------------------------------------------------------------|
| `d01-cover.jpg` | Blacked Out Beacon  | Blacked Out Beacon - Omslag Green.jpg                      |
| `d02-cover.jpg` | Midnight Call       | Drekmor - Midnight Call 3000 x 3000.jpg                    |
| `d03-cover.jpg` | Silent Alarm        | Drekmor - Silent Alarm - Album Cover - 3000 x 3000.jpg     |

Nedskalade till 1500×1500 JPG. Nya omslag: kvadrat, minst 1000×1000.

## Ljud – exakta filnamn som releases.js väntar sig

| Fil                                 | Släpp               |
|-------------------------------------|---------------------|
| `d01-blacked-out-beacon.mp3` (på plats) | Blacked Out Beacon  |
| `d02-midnight-call.mp3` (på plats)  | Midnight Call       |
| `d03-silent-alarm.mp3` (på plats)   | Silent Alarm        |

Så länge en fil saknas spelar däcket en demosignal istället, så inget går
sönder. MP3 i 256–320 kbps räcker gott. Filerna blir nedladdningsbara för
besökare (medvetet val).

Ett band med `status: "coming"` spelas aldrig och visar inte texten, även om
ljudfilen och texten redan finns – ändra till `"available"` på släppdagen.

## Övrigt

| Fil                                   | Innehåll                                                   |
|---------------------------------------|------------------------------------------------------------|
| `crew-*.jpg`, `drekmor-pressrelease.pdf`, `drekmor-favicon.jpg` | Från drekmor.com (id-korten, pressrelease, ikon). |
| `sfx-tape-rewind.mp3`, `sfx-tape-message.mp3` | Rullbandspelaren: bandet som spolas tillbaka och meddelandet "Is there anyone listening?" (bandets filer "Madman – Anyone listening", mono 96 kbps). Undertexterna och deras tider står i `TAPE` i `js/kr/eggs.js`. |
| `monitor-d.png`                       | D:et ur bandets gröna logga, med genomskinlig bakgrund. Rutnätet ritas i koden och D:et vänds där (`js/kr/ident.js`). |
| `kontrollrum.webp`                    | Kontrollrummet (bandets egen bild, med bildskärmen målad i bortre väggen). Byts bilden måste den vara 1672 × 941 och ha allt på samma plats, annars behöver koordinaterna i `js/kr/live.js` och `js/kr/eggs.js` ses över. |
