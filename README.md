# Musicbox

A music box you can crank with your finger or wind up, and every sound it makes is
physically modelled: tuned steel tines, pins on a brass cylinder, the governor fan,
the wooden box, the table it sits on, the room, and your head.

**Play it:** open `index.html` from any static web server (GitHub Pages works; no
build step). On a phone, draw circles on the round pad to crank it.

## What you can do

* **Hand crank** — circle clockwise on the pad. The cylinder follows your hand
  through a ratchet; turn faster and the tune runs faster.
* **Wind-up** — circle to wind the key (the ratchet clicks), then pull the lever. A
  fan governor keeps time, and the tune slows as the spring runs down.
* **Tines** — 15-tine diatonic, 30-tine chromatic, 50-tine Swiss with lead-weighted
  bass, or combs built to fit the tune (18 or 72 tines). Steel, brass, phosphor
  bronze, beryllium copper, titanium, aluminium or glass. Adjust the thickness, the
  pin engagement, how worn the pins are, the comb tilt, A4 and how "aged"
  (detuned) the comb is. Tap any tine to see its mode shapes, overtone ratios and
  what makes it stop ringing.
* **Box** — bare movement, plastic toy, walnut jewelry box, maple box with a spruce
  soundboard, or a Swiss rosewood cabinet. Lid open or closed. Set it on oak (with
  or without felt feet), glass, marble or a spruce resonance box, or hold it in
  your hand.
* **Listen** — drag your head around a nursery, living room, parlour, stone chapel,
  garden or anechoic chamber; turn it with two fingers. Distance, direction,
  reflections, Doppler and head shadow are all simulated. The header shows the dB
  SPL at your ears.
* **Tunes** — classics (Brahms, Beethoven, Pachelbel, Greensleeves, a three-voice
  Frère Jacques round…), **Christmas** (Jingle Bells, Silent Night, Deck the Halls,
  We Wish You a Merry Christmas, Good King Wenceslas, Joy to the World, Carol of the
  Bells), and **Hanukkah** (Ma'oz Tzur). Import MIDI files, or compose on the pin
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

Vendored: three.js r170 (MIT) in `vendor/`.
