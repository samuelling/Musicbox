# Frisky

Named for Frisky, a golden hamster from a boyhood long ago.

A music box you can crank with your finger or wind up, and every sound it makes is
physically modelled: tuned steel tines, pins on a brass cylinder, the governor fan,
the wooden box, the table it sits on, the room, and your head.

**Play it:** open `index.html` from any static web server (GitHub Pages works; no
build step). Tap the candle to light it — the struck match is what starts the
sound (browsers only allow audio after a tap). If the browser suspends audio, the
candle goes out; tap it to relight. On a phone, draw circles on the round pad to crank it.

## What you can do

* **Hand crank** — circle clockwise on the pad. The cylinder follows your hand
  through a ratchet; turn faster and the tune runs faster.
* **Wind-up** — circle to wind the key (the ratchet clicks), then pull the lever. A
  fan governor keeps time, and the tune slows as the spring runs down.
* **Hamster** — a golden hamster lives in a glass tank beside the box. He sleeps, eats,
  stuffs his cheek pouches and hoards, drinks, grooms, digs, explores and runs. "Hamster" mode
  belts his wheel to the crank through a quarter-twist O-ring; "Place him in the wheel" when
  he isn't in the mood, "Wheel lover" for a hamster who'd rather run, "Mutant diurnal" for one whose clock is flipped (up by day, asleep by night), and a belt-ratio slider
  for tempo. His gait (walk, trot, half-bound), the forces from his paws, how
  far up the wheel he rides, his bouts and rests (he's nocturnal), heart rate and metabolic
  power are all simulated. His pace is the tempo. "Watch him" leans you in close; "Tap his cage" (or tap the glass) wakes him, and then he does as he likes:
  maybe the wheel, maybe a snack, maybe a pee in his toilet corner. He keeps a toilet corner away from his nest and food. He also yawns, scratches behind his ears, gnaws his
  chew stick, builds up his nest with bedding, peeks out of his house, paces the glass on
  his hind legs, scent-marks along the house, creeps about stretched out when wary, and climbs the ramp to the
  half tier over his house to look around, roll in his sand bath, or doze up there.
* **Music Box** (Tines · Box · Physics) — start from a **box type**: keepsake 30-note, child's plastic
  toy, wooden jewellery box, Swiss 50-note cabinet, grand 72-note, a century-old antique (worn pins, A = 435) or a brass-comb vintage box —
  then change anything. **Tines**: 15-tine diatonic, 30-tine chromatic, 50-tine Swiss with lead-weighted
  bass, or combs built to fit the tune (18 or 72 tines). Steel, brass, phosphor
  bronze, beryllium copper, titanium, aluminium or glass. Adjust the tine length (thickness follows to stay
  in tune), the thickness, the pin engagement, how worn the pins are, the comb tilt, A4 and how "aged"
  (detuned) the comb is. Tap any tine to see its mode shapes, overtone ratios and
  what makes it stop ringing.
* **Box** — lacquered woods with real grain, velvet lining and a mother-of-pearl inlaid lid. Plastic toy, walnut jewelry box, maple box with a spruce
  soundboard, or a Swiss rosewood cabinet. Lid open or closed. Set it on oak (with
  or without felt feet), glass, marble or a spruce resonance box, or hold it in
  your hand.
* **Listener** — by default you're in a timber hut in the Alps, snowed in by a storm: a fire you light
  with the candle, an oak regulator on the wall, a watercolour over the mantel and an alphorn in the corner.
  Settings slide in from ☰ Settings (Tab on a keyboard): a side panel on a wide screen, the whole screen on a phone.
  Or play in a nursery (a cuckoo clock), a living room (a mantel clock), a wood-panelled parlour
  (a longcase clock with the real phase of the moon), a stone chapel (a great painted dial) or an
  anechoic chamber (a lab clock). Every clock shows the real time. Every door is locked from the inside (the hut's barred with a beam; the nursery's chained,
  deadbolted and a chair wedged under the knob; the chapel's barred and chained; the anechoic chamber has only a
  ladder up to a sealed, padlocked hatch). From 1 December to Epiphany the hut has a Swiss Christmas tree in the
  corner, strung with C9 bulbs, and a garland on the mantel (Listener → 🎄 Christmas decorations, any time of year); it's at its coziest — stockings (one tiny one for Frisky),
  an Advent wreath lit for the Sundays so far, a paper star in the window — and the other rooms get theirs too. 🕎 Hanukkah
  decorations come out by themselves for the eight days (from the Hebrew calendar), alone or alongside Christmas: a
  hanukkiah in every window, lit for the night it is, dreidels and gelt, blue-and-white lights in the hut. Candles in
  iron sconces warm the hut's far corner whenever the fire is lit. Moving about borrows Ashland's
  controls. At a desk: W A S D walks (Shift hurries), and a click on an empty part of the room hands it the mouse,
  so the mouse looks around and a click acts on whatever the dot in the middle is on; Esc frees the mouse, and Tab
  opens the settings (letting go of it) and closes them again (taking it back). ← → ↑ ↓ turn and look too, and the
  wheel or a two-finger scroll zooms. On a phone: a floating thumbstick on the left walks (it jumps to wherever your
  thumb lands; carry on past its rim to hurry) and a drag anywhere else looks. Walking and turning ease in and out.
  Stand (Space) or crouch (C); zoom in with E and out with Q (or + −). The view is your own eyes by default (👁 toggles it); double-tap the box to lean over
  the table and look in, and again to sit back. Esc (or a tap on the room) hands the keys back from the menus.
  Sound is rendered binaurally with a structural HRTF (head, pinna, shoulder) on every path — choose in-ear (AirPods), over-ear or speakers, set your head and ear size, and turn your device to turn your head. Or drag your head on the room map; turn it with two fingers. Distance, direction,
  reflections, Doppler and head shadow are all simulated. The header shows the dB
  SPL at your ears.
* **Tunes** — classics (Brahms, Beethoven, Pachelbel, Greensleeves, a three-voice
  Frère Jacques round…), **Christmas** (Jingle Bells, Silent Night, Deck the Halls,
  We Wish You a Merry Christmas, Good King Wenceslas, Joy to the World, Carol of the
  Bells), **Hanukkah** (Ma'oz Tzur, Oh Chanukah), **Swiss** (Rufst du, mein Vaterland; an original
  Ländler; an alphorn call on the natural notes) and **Ambient** — generative pieces of short phrases
  looping on prime-numbered periods, so they drift apart and never line up the same way; a new piece
  every time you choose one. Import MIDI files, or compose on the pin
  roll while the box plays, save to *My tunes*, and share as a link.

## The physics

See **[PHYSICS.md](PHYSICS.md)** for the full derivations: FEM tine tuning,
thermoelastic and air damping, compliant pin contact, governor dynamics,
bedplate–soundboard–cavity–table coupling, multipole radiation, image-source
acoustics and binaural rendering.

## Development

```
node tests/beam.test.mjs          # FEM vs analytic cantilever, tuning solver
node tests/songs.test.mjs         # every tune compiles and fits every comb
node tools/render-song.mjs brahms c30 classic oak living 30 out.wav spring
```

`tools/render-song.mjs` runs the exact AudioWorklet code offline in Node, which is
how the model was checked for stability and level.

Vendored: three.js r170 (MIT) in `vendor/`, loaded through an import map.

* **Compose in a scale** — the pin roll can be quantised to 24 scales (major/minor, modes,
  pentatonics and blues, Freygish and other Jewish and Middle Eastern modes, Japanese and
  symmetric scales) on any root; "Match tune's key" and "Snap notes to scale" help.

- **Holiday tunes, dug deep:** 25 Christmas carols (from Adeste Fideles, Mendelssohn's Hark! and Holst's Cranham to the Coventry Carol, Arbeau's Ding Dong Merrily and the Wexford Carol), a new *World Carols* shelf (O Tannenbaum, Alle Jahre wieder, Leise rieselt der Schnee, Es wird scho glei dumpa, Still Still Still, Es ist ein Ros, In Dulci Jubilo, Il est né, Bring a Torch, Fum Fum Fum, Tu scendi dalle stelle, Jul jul strålande jul, the Huron Carol…), and Hanukkah's Ma'oz Tzur, Oy Khanike, I Have a Little Dreidel, S'vivon and Hanerot Halalu. Melodies are public domain, transcribed from flutetunes.com scores (melody only); the music box harmonises them itself.
