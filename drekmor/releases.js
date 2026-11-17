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
                "coming"    = teaser, syns i arkivet men är inte släppt än.
                              Med releaseDate ifyllt räknar tablån ner dagarna.
                "locked"    = låst kassett (hänglås) – mystik / kommande signal
   accent       Kassettens färg (hex). Ger varje släpp sitt eget uttryck.
   featured     används inte längre: alla släpp står på rad framför däcket, fyra per sida, i filens ordning
                false = visas bara som rygg i hyllan
   releaseDate  Datum "ÅÅÅÅ-MM-DD" (visas i omslaget). Tom sträng = döljs.
   duration     Speltid "3:42" eller tom sträng.
   video        YouTube-videons id (det som står efter watch?v= i länken), t.ex.
                "cH26pRl3Q54". Visas på bildskärmen i kontrollrummet. Utelämna om
                det inte finns någon video.
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
   links        Länkar i omslaget: spotify, apple, youtube, youtube_video, tidal,
                deezer, amazon, bandcamp. Tomma fält döljs automatiskt.
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
    video: "d3er-VK97C0",
    links: {
      spotify: "https://open.spotify.com/artist/1LW39JZPbzFi1peIuaPm0e",
      apple: "https://music.apple.com/us/artist/drekmor/6782703112",
      youtube: "https://www.youtube.com/@Drekmor-Official",
      tidal: "https://tidal.com/artist/81451660",
      deezer: "https://www.deezer.com/en/artist/398094771",
      amazon: "https://music.amazon.com/artists/B0H68HV4YW/drekmor",
      youtube_video: "https://www.youtube.com/watch?v=d3er-VK97C0"
    },
    notes: "The first signal. Dark, heavy synth about a world after the collapse – with the blacked-out beacon at its centre: a broken signal, a warning that never came, perhaps the last remnant of hope.",
    credits: [
      { role: "Lead vocals", name: "Linus Nyman" },
      { role: "Vocals", name: "Tomas Vasseur" },
      { role: "Keyboards & guitars", name: "Johan Brinkman" },
      { role: "Production", name: "Drekmor" },
      { role: "Music & lyrics", name: "Drekmor" },
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
    releaseDate: "2026-08-21",
    duration: "4:52",
    audio: "assets/d02-midnight-call.mp3",
    cover: "assets/d02-cover.jpg",
    links: {
      spotify: "https://open.spotify.com/artist/1LW39JZPbzFi1peIuaPm0e",
      apple: "https://music.apple.com/us/artist/drekmor/6782703112",
      youtube: "https://www.youtube.com/@Drekmor-Official",
      tidal: "https://tidal.com/artist/81451660",
      deezer: "https://www.deezer.com/en/artist/398094771",
      amazon: "https://music.amazon.com/artists/B0H68HV4YW/drekmor"
    },
    notes: "The second signal. A call in the middle of the night – the line is open. Pick up.",
    credits: [
      { role: "Lead vocals", name: "Tomas Vasseur" },
      { role: "Vocals", name: "Linus Nyman" },
      { role: "Keyboards & guitars", name: "Johan Brinkman" },
      { role: "Production", name: "Drekmor" },
      { role: "Music & lyrics", name: "Drekmor" },
      { role: "Mix & mastering", name: "Lars Norgren" }
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
     Tredje singeln, släppt 9 oktober 2026.                                  */
  {
    id: "D-03",
    title: "Silent Alarm",
    type: "song",
    status: "available",
    accent: "#8e44ad",
    featured: true,
    releaseDate: "2026-10-09",
    duration: "3:53",
    audio: "assets/d03-silent-alarm.mp3",
    cover: "assets/d03-cover.jpg",
    video: "cH26pRl3Q54",
    links: {
      spotify: "https://open.spotify.com/artist/1LW39JZPbzFi1peIuaPm0e",
      apple: "https://music.apple.com/se/search?term=Drekmor%20Silent%20Alarm",
      youtube_video: "https://www.youtube.com/watch?v=cH26pRl3Q54",
      tidal: "https://tidal.com/search?q=Drekmor%20Silent%20Alarm",
      deezer: "https://www.deezer.com/search/Drekmor%20Silent%20Alarm",
      amazon: "https://music.amazon.com/search/Drekmor+Silent+Alarm"
    },
    notes: "The third signal. There was a silent alarm – and it was noticed far too late.",
    credits: [
      { role: "Music & lyrics", name: "Drekmor" },
      { role: "Lead vocals", name: "Tomas Vasseur" },
      { role: "Mix & mastering", name: "Lars Norgren" },
      { role: "Drekmor", name: "Linus Nyman, Tomas Vasseur & Johan Brinkman" }
    ],
    text: `There was a silent alarm
I realized it far too late
I can’t move my body, move my body, move my body no more
I can’t fight it now
I can’t take it anymore
I can’t move my body, move my body, move my body no more

We’re not going back

We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same
We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same

I was blinded by the light
Forever frozen by your sight
I can’t move my body, move my body, move my body no more

We’re not going back

We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same
We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same

Never, never, never, never....

We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same
We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same
It will never, never, never be the same
We did what we could to make it last
A moment we knew would slip too fast
We burned like flames too wild to tame
It will never, never, never be the same`
  },

  /* ------------------------------------------------------------------ D-04
     Nästa singel. Inget datum bekräftat än: lämna releaseDate tom så står det
     "Date TBA". Fyll i datumet ("ÅÅÅÅ-MM-DD") när det är klart, så räknar
     tablån ner dagarna. Titel, omslag, ljud och text läggs in först på
     släppdagen, samtidigt som status ändras till "available".               */
  { id: "D-04", title: "Unknown Signal", type: "song", status: "coming", accent: "#5b6169", featured: true, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "The next signal. The date is not confirmed yet.", credits: [], text: "" },

  /* ------------------------------------------------------------------ D-05…
     Platser för berättelser, intervjuer och kommande låtar.
     Byt titel/typ och ändra status när innehållet finns.                     */
  { id: "D-05", title: "Static Memories",    type: "story",     status: "coming", accent: "#9aa0a6", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "A story from the world of Drekmor.", credits: [], text: "" },
  { id: "D-06", title: "Echoes In The Void", type: "interview", status: "coming", accent: "#4b7f52", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "A recorded interview with Drekmor.", credits: [], text: "" },
  { id: "D-07", title: "Signals Fade",       type: "song",      status: "locked", accent: "#b23b3b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-08", title: "Night Window",       type: "song",      status: "locked", accent: "#3f6f8f", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-09", title: "Distant Coast",      type: "song",      status: "locked", accent: "#c47a2c", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-10", title: "Empty Frequencies",  type: "story",     status: "locked", accent: "#8a8f96", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-11", title: "Subsurface",         type: "song",      status: "locked", accent: "#7d5ba6", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" },
  { id: "D-12", title: "Afterlight",         type: "song",      status: "locked", accent: "#c9a24b", featured: false, releaseDate: "", duration: "", audio: null, cover: null, links: {}, notes: "", credits: [], text: "" }

];

if (typeof window !== "undefined") { window.RELEASES = RELEASES; }
