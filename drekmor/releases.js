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
   audio        Sökväg till ljudfilen, t.ex. "assets/d01-blacked-out-beacon.mp3".
                Direktlänk till en fil – inte Spotify/YouTube (de hör hemma i
                links). Saknas filen spelar däcket en demosignal istället.
   cover        Fyrkantig omslagsbild (1:1), t.ex. "assets/d01-cover.jpg",
                eller null. Med bild blir kassetten en "picture-kassett" (bilden
                trycks på skalet, centrerad beskärning) och hela den fyrkantiga
                bilden visas i omslaget/modalen. Är den null ritas ett snyggt
                färgomslag av accent-färgen istället.
                REKOMMENDERAT FORMAT: kvadrat, minst 1000×1000 px (gärna 1500),
                JPG. Håll motivet mot mitten så beskärningen på kassetten blir bra.
   links        Länkar i omslaget: spotify, apple, youtube, tidal, deezer,
                bandcamp. Tomma fält döljs automatiskt.
   notes        Kort blänkare överst i omslaget (1–2 meningar).
   credits      Lista med { role, name } – visas som credits i omslaget.
   text         Själva "papperet" i kassetten (visas först när status är
                "available" – för "coming" hålls texten tillbaka):
                  låt        -> texten
                  intervju   -> transkript / anteckningar
                  berättelse -> berättelsen
                Radbrytningar bevaras. Lämna tom sträng om inget finns än.
   ---------------------------------------------------------------------------
   TIPS: Håll ordningen i listan = ordningen i hyllan (D-01 överst).
   ============================================================================= */

const RELEASES = [

  /* ------------------------------------------------------------------ D-01
     Debutsingeln, släppt 10 juli 2026.                                     */
  {
    id: "D-01",
    title: "Blacked Out Beacon",
    type: "song",
    status: "available",
    accent: "#2bb6c9",
    featured: true,
    releaseDate: "2026-07-10",
    duration: "5:04",
    audio: "assets/d01-blacked-out-beacon.mp3",
    cover: "assets/d01-cover.jpg",
    links: {
      spotify: "https://open.spotify.com/artist/1LW39JZPbzFi1peIuaPm0e",
      apple: "https://music.apple.com/us/artist/drekmor/6782703112",
      youtube: "https://www.youtube.com/@Drekmor-Official",
      tidal: "https://tidal.com/artist/81451660",
      deezer: "https://www.deezer.com/en/artist/398094771"
    },
    notes: "Den första signalen. Mörk, tung synth om en värld efter kollapsen – med den mörklagda fyren i centrum: en trasig signal, en utebliven varning, kanske den sista resten av hopp.",
    credits: [
      { role: "Leadsång", name: "Linus Nyman" },
      { role: "Sång", name: "Tomas Vasseur" },
      { role: "Keyboards & gitarr", name: "Johan Brinkman" },
      { role: "Produktion", name: "Drekmor" },
      { role: "Musik & text", name: "Drekmor" },
      { role: "Mix & mastering", name: "Lars Norgren" }
    ],
    text: `Can't make out the lines
In this dusty story book
Imagine the time
And effort that the writing took
Around me shrapnel
Line the parks and fields
As creatures move in agony
With their naked feet

The sun has given up
It did what it could
And mankind did
What we knew she would

Under the cold
Blacked out beacon
We scurry
We scurry
But there's no need to hurry
No need to hurry

Truth be told
Be told it
It was too weird a feeling
To imagine
The Blacked out beacon

I wash myself dirty
In a puddle amongst the rubble
The smell of waste
And a faint sound of bubbles

The critters that are here
Are my only company
But the apex ones are new
So I strive to stay lonely

The night is when I sleep
And that is when I dream
I dream but of regret
And of what used to be

Under the cold
Blacked out beacon
We scurry
We scurry
But there's no need to hurry
No need to hurry

Truth be told
Be told it
It was too weird a feeling
To imagine
The Blacked out beacon

Under the cold
Under the cold
Blacked out beacon
Blacked out beacon
We scurry
But there's no need to hurry
No need to hurry

Truth be told
It was too weird a feeling
To imagine
The Blacked out beacon`
  },

  /* ------------------------------------------------------------------ D-02 */
  {
    id: "D-02",
    title: "Midnight Call",
    type: "song",
    status: "available",
    accent: "#a12bd0",
    featured: true,
    releaseDate: "",
    duration: "4:52",
    audio: "assets/d02-midnight-call.mp3",
    cover: "assets/d02-cover.jpg",
    links: {
      spotify: "https://open.spotify.com/artist/1LW39JZPbzFi1peIuaPm0e",
      apple: "https://music.apple.com/us/artist/drekmor/6782703112",
      youtube: "https://www.youtube.com/@Drekmor-Official",
      tidal: "https://tidal.com/artist/81451660",
      deezer: "https://www.deezer.com/en/artist/398094771"
    },
    notes: "Andra signalen. Ett samtal mitt i natten – plocka upp luren.",
    credits: [
      { role: "Musik & text", name: "Drekmor" },
      { role: "Produktion", name: "Drekmor" }
    ],
    text: `City fading away
too fast
no turning back

Shadows fall on the road
so deep
I can’t escape, I can’t let go

Burning fire behind
… my life
is haunting me

Got a feeling inside of me
it breaks my ground and tears my sky

Hold on, don’t break, I am falling down

Hold on, don’t break, I am falling down
So close, so far, I reach for you now
Hold tight, don’t fall, I am breaking down
One word, one sound, I reach for you now

I got blood on my hands
Too dark
tell me who I am

…and stories of lies
so loud
they speak my name, they cloud my fame

Hold on, don’t break, I am falling down
So close, so far, I reach for you now
Hold tight, don’t fall, I am breaking down
One word, one sound, I reach for you now

This is my midnight call — pick up now
This is my midnight call
This is my midnight call — pick up now
This is my midnight call

Hold on, don’t break, I am falling down
So close, so far, I reach for you now
Hold tight, don’t fall, I am breaking down
One word, one sound, I reach for you now

This is my midnight call — pick up now
This is my midnight call
This is my midnight call — pick up now
This is my midnight call

This is my midnight call
This is my midnight call
This is my midnight call
This is my midnight call`
  },

  /* ------------------------------------------------------------------ D-03
     Ej släppt. Lägg in cover, audio och text på släppdagen och ändra
     status till "available".                                              */
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
    links: {},
    notes: "Nästa signal. Snart i sändning.",
    credits: [],
    text: ""
  },

  /* ------------------------------------------------------------------ D-04
     Låst kassett – mysterium / nästa hemlighet.                             */
  { id: "D-04", title: "Locked / Unknown Signal", type: "story", status: "locked", accent: "#5b6169", featured: true, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "Signalen är krypterad. Ännu.", credits: [], text: "" },

  /* ------------------------------------------------------------------ D-05…
     Platser för berättelser, intervjuer och kommande låtar.
     Byt titel/typ och ändra status när innehållet finns.                     */
  { id: "D-05", title: "Static Memories",    type: "story",     status: "coming", accent: "#9aa0a6", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "En berättelse ur Drekmor-världen.", credits: [], text: "" },
  { id: "D-06", title: "Echoes In The Void", type: "interview", status: "coming", accent: "#4b7f52", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "Inspelad intervju med Drekmor.", credits: [], text: "" },
  { id: "D-07", title: "Signals Fade",       type: "song",      status: "locked", accent: "#b23b3b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-08", title: "Night Window",       type: "song",      status: "locked", accent: "#3f6f8f", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-09", title: "Distant Coast",      type: "song",      status: "locked", accent: "#c47a2c", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-10", title: "Empty Frequencies",  type: "story",     status: "locked", accent: "#8a8f96", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-11", title: "Subsurface",         type: "song",      status: "locked", accent: "#7d5ba6", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-12", title: "Afterlight",         type: "song",      status: "locked", accent: "#c9a24b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" }

];

if (typeof window !== "undefined") { window.RELEASES = RELEASES; }
