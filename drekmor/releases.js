/* =============================================================================
   DREKMOR – ARKIVET  ·  releases.js
   -----------------------------------------------------------------------------
   DET HÄR ÄR DEN ENDA FIL DU BEHÖVER RÖRA FÖR ATT LÄGGA TILL NYA SLÄPP.

   Varje kassett i arkivet är ett objekt i listan RELEASES nedan.
   Vill du lägga till en ny låt / intervju / berättelse?
     1.  Kopiera ett helt { ... }-block.
     2.  Klistra in det på rätt plats i listan (ordningen styr ordningen på hyllan).
     3.  Ändra fälten. Klart. Sidan bygger om sig själv automatiskt.

   ---------------------------------------------------------------------------
   FÄLTEN – vad betyder de?
   ---------------------------------------------------------------------------
   id           Kassettens etikett, t.ex. "D-01". Måste vara unik.
   title        Titeln som visas på ryggen och etiketten.
   type         "song"      = låt        (spelas upp + text i omslaget)
                "interview" = intervju   (spelas upp + transkript i omslaget)
                "story"     = berättelse (läses – text om Drekmor-världen)
   status       "available" = går att spela / läsa nu
                "coming"    = teaser, syns i arkivet men är inte släppt än
                "locked"    = låst kassett (hänglås) – mystik / kommande signal
   accent       Kassettens färg (hex). Ger varje släpp sitt eget uttryck.
   featured     true  = visas även som liggande kassett längst fram (max ~4 st)
                false = visas bara som rygg i hyllan
   releaseDate  Datum "ÅÅÅÅ-MM-DD" (visas i omslaget). Tom sträng = döljs.
   duration     Speltid "3:42" eller tom sträng.
   audio        Sökväg/URL till ljudfilen ("assets/d01.mp3") ELLER en
                streaminglänk. Lämna null så spelar en platshållar-signal
                (så att mätaren och rullarna lever redan innan låten finns).
   cover        Fyrkantig omslagsbild (1:1), t.ex. "assets/d01-cover.jpg",
                eller null. Med bild blir kassetten en "picture-kassett" (bilden
                trycks på skalet, centrerad beskärning) och hela den fyrkantiga
                bilden visas i omslaget/modalen. Är den null ritas ett snyggt
                färgomslag av accent-färgen istället.
                REKOMMENDERAT FORMAT: kvadrat, minst 1000×1000 px (gärna 1500),
                JPG. Håll motivet mot mitten så beskärningen på kassetten blir bra.
   links        Länkar som visas i omslaget. Tomma fält döljs automatiskt.
   notes        Kort blänkare överst i omslaget (1–2 meningar).
   credits      Lista med { role, name } – visas som credits i omslaget.
   text         Själva "papperet" i kassetten:
                  låt        -> texten
                  intervju   -> transkript / anteckningar
                  berättelse -> berättelsen
                Radbrytningar bevaras. Lämna tom sträng om inget finns än.
   ---------------------------------------------------------------------------
   TIPS: Håll ordningen i listan = ordningen i hyllan (D-01 överst).
   ============================================================================= */

const RELEASES = [

  /* --------------------------------------------------------------------- D-01
     EXEMPEL PÅ ETT RIKTIGT, SLÄPPT SPÅR.
     Byt ut text, credits, audio och länkar mot ert riktiga släpp.        */
  {
    id: "D-01",
    title: "Blacked Out Beacon",
    type: "song",
    status: "available",
    accent: "#2bb6c9",              // turkos – matchar omslaget
    featured: true,
    releaseDate: "2026-05-01",
    duration: "3:42",
    audio: null,                    // <- lägg in "assets/d01.mp3" när filen finns
    cover: "assets/d01-cover.jpg",  // <- fyrkantig omslagsbild (1:1)
    links: {
      spotify: "",
      youtube: "",
      apple: "",
      bandcamp: ""
    },
    notes: "Den första signalen ur arkivet. En sång om fyrljuset som slocknar.",
    credits: [
      { role: "Musik & text", name: "Drekmor" },
      { role: "Produktion",   name: "Drekmor" },
      { role: "Mix & master", name: "" }
    ],
    text:
`Första versen skrivs här.
Varje radbrytning behålls precis som du skriver den.

Refräng:
Skriv refrängen här ...`
  },

  /* --------------------------------------------------------------------- D-02
     LÅTEN SOM ÄR PÅ GÅNG. status: "coming" -> syns men går inte att spela.
     Ändra till "available" och lägg in audio när den släpps.             */
  {
    id: "D-02",
    title: "Midnight Call",
    type: "song",
    status: "coming",
    accent: "#a12bd0",              // lila/magenta – matchar omslaget
    featured: true,
    releaseDate: "",
    duration: "",
    audio: null,
    cover: "assets/d02-cover.jpg",  // <- fyrkantig omslagsbild (1:1)
    links: { spotify: "", youtube: "", apple: "", bandcamp: "" },
    notes: "Nästa signal. Snart i sändning.",
    credits: [{ role: "Musik & text", name: "Drekmor" }],
    text: ""
  },

  /* --------------------------------------------------------------------- D-03 */
  {
    id: "D-03",
    title: "Silent Alarm",
    type: "song",
    status: "coming",
    accent: "#8e44ad",
    featured: true,
    releaseDate: "",
    duration: "",
    audio: null,
    cover: null,
    links: { spotify: "", youtube: "", apple: "", bandcamp: "" },
    notes: "",
    credits: [{ role: "Musik & text", name: "Drekmor" }],
    text: ""
  },

  /* --------------------------------------------------------------------- D-04
     LÅST KASSETT. Perfekt som mysterium / förhandsvisning av något kommande.
     Hänglåset visas automatiskt när status = "locked".                    */
  {
    id: "D-04",
    title: "Locked / Unknown Signal",
    type: "story",
    status: "locked",
    accent: "#5b6169",
    featured: true,
    releaseDate: "",
    duration: "",
    audio: null,
    cover: null,
    links: { spotify: "", youtube: "", apple: "", bandcamp: "" },
    notes: "Signalen är krypterad. Ännu.",
    credits: [],
    text: ""
  },

  /* --------------------------------------------------------------------- D-05
     EXEMPEL PÅ EN BERÄTTELSE (type: "story").
     Ingen låt – ett "papper" man öppnar och läser. Bra för Drekmor-lore.  */
  {
    id: "D-05",
    title: "Static Memories",
    type: "story",
    status: "available",
    accent: "#9aa0a6",
    featured: false,
    releaseDate: "2026-05-01",
    duration: "",
    audio: null,                    // en berättelse kan även ha inspelad uppläsning
    cover: null,
    links: { spotify: "", youtube: "", apple: "", bandcamp: "" },
    notes: "En berättelse ur Drekmor-världen.",
    credits: [{ role: "Text", name: "Drekmor" }],
    text:
`Skriv berättelsen här.

Det här är kassetten för det som händer runt musiken –
världen, karaktärerna, det som förklarar signalerna.`
  },

  /* --------------------------------------------------------------------- D-06
     EXEMPEL PÅ EN INTERVJU (type: "interview").
     Spelas upp som ljud + transkript/anteckningar i omslaget.             */
  {
    id: "D-06",
    title: "Echoes In The Void",
    type: "interview",
    status: "coming",
    accent: "#4b7f52",
    featured: false,
    releaseDate: "",
    duration: "",
    audio: null,
    cover: null,
    links: { spotify: "", youtube: "", apple: "", bandcamp: "" },
    notes: "Inspelad intervju med Drekmor.",
    credits: [{ role: "Medverkande", name: "Drekmor" }],
    text: ""
  },

  /* --------------------------------------------------------------------- D-07…
     Framtida platser i arkivet. Lägg till fler block precis så här.
     Ta bort dem du inte vill visa än.                                     */
  { id: "D-07", title: "Signals Fade",      type: "song",  status: "locked", accent: "#b23b3b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-08", title: "Night Window",      type: "song",  status: "locked", accent: "#3f6f8f", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-09", title: "Distant Coast",     type: "song",  status: "locked", accent: "#c47a2c", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-10", title: "Empty Frequencies", type: "story", status: "locked", accent: "#8a8f96", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-11", title: "Subsurface",        type: "song",  status: "locked", accent: "#7d5ba6", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-12", title: "Afterlight",        type: "song",  status: "locked", accent: "#c9a24b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" }

];

/* Gör listan tillgänglig för app.js (funkar både som <script> och modul). */
if (typeof window !== "undefined") { window.RELEASES = RELEASES; }
