# Omslag (covers)

Här bor omslagen som blir **förvalda motiv** i Merch Studion.

Studion läser `manifest.json` i den här mappen och visar varje omslag som en
klickbar miniatyr. Saknas en fil döljs den automatiskt — inget kraschar.

## Så lägger du in alla omslag

1. Öppna omslagsmappen i Google Drive (t.ex. **Omslag** / **Album Covers**).
2. Markera omslagen → **Ladda ner** (Drive zippar dem åt dig).
3. Packa upp och lägg bildfilerna här i `gn/covers/`.
4. Bygg om listan:

   ```
   node gn/build-covers.mjs
   ```

   Det skannar mappen och skriver om `manifest.json` från de filer som finns —
   filnamnen spelar ingen roll, skriptet gissar fram snygga etiketter.

5. Committa både bilderna och `manifest.json`.

Klart — alla omslag dyker upp som ett-klicks-motiv i studion.

> Det redan ifyllda `manifest.json` matchar originalfilnamnen från er Drive,
> så om du bara droppar filerna med sina ursprungsnamn funkar det direkt även
> utan att köra skriptet.
