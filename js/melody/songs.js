// Built-in tunes. All melodies are public domain or traditional.
// Notation: see notation.js (durations in sixteenth notes).
// accomp: 'broken' | 'root' | 'none' — melody-only tunes get a generated
// music-box accompaniment from the harmoniser.

import { ambient } from './ambient.js';

const rep = (s, n) => Array(n).fill(s).join(' ');

export const SONGS = [
  // ---------------------------------------------------------------- classics
  {
    id: 'twinkle', key: 'C', cat: 'Classics', title: 'Twinkle, Twinkle, Little Star', credit: 'French traditional', bpm: 100, meter: [4, 4], accomp: 'broken',
    voices: ['C5:4 C5 G5 G5 | A5 A5 G5:8 | F5:4 F5 E5 E5 | D5 D5 C5:8 | G5:4 G5 F5 F5 | E5 E5 D5:8 | G5:4 G5 F5 F5 | E5 E5 D5:8 | C5:4 C5 G5 G5 | A5 A5 G5:8 | F5:4 F5 E5 E5 | D5 D5 C5:8'],
  },
  {
    id: 'brahms', key: 'C', cat: 'Classics', title: 'Lullaby (Wiegenlied)', credit: 'Johannes Brahms, 1868', bpm: 84, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['E5:2 E5:2 | G5:6 E5:2 E5:4 | G5:8 E5:2 G5:2 | C6:4 B5:6 A5:2 | A5:4 G5:4 D5:2 E5:2 | F5:4 D5:4 D5:2 E5:2 | F5:8 D5:2 F5:2 | B5:2 A5:2 G5:4 B5:4 | C6:8 C5:2 C5:2 | C6:8 A5:2 F5:2 | G5:8 E5:2 C5:2 | F5:4 G5:4 A5:4 | G5:8 C5:2 C5:2 | C6:8 A5:2 F5:2 | G5:8 E5:2 C5:2 | F5:4 E5:4 D5:4 | C5:8'],
  },
  {
    id: 'ode', key: 'C', cat: 'Classics', title: 'Ode to Joy', credit: 'Ludwig van Beethoven, 1824', bpm: 112, meter: [4, 4], accomp: 'broken',
    voices: ['E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | E5:6 D5:2 D5:8 | E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:6 C5:2 C5:8 | D5:4 D5 E5 C5 | D5:4 E5:2 F5:2 E5:4 C5:4 | D5:4 E5:2 F5:2 E5:4 D5:4 | C5:4 D5:4 G4:8 | E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:6 C5:2 C5:8'],
  },
  {
    id: 'elise', cat: 'Classics', title: 'Für Elise (opening)', credit: 'Ludwig van Beethoven, 1810', bpm: 62, meter: [3, 8], accomp: 'none',
    voices: [
      'E5:1 D#5:1 | E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:3 C4:1 E4:1 A4:1 | B4:3 E4:1 G#4:1 B4:1 | C5:3 E4:1 E5:1 D#5:1 | E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:3 C4:1 E4:1 A4:1 | B4:3 E4:1 C5:1 B4:1 | A4:4',
      'r:2 | r:6 | A2:1 E3:1 A3:1 r:3 | E2:1 E3:1 G#3:1 r:3 | A2:1 E3:1 A3:1 r:3 | r:6 | A2:1 E3:1 A3:1 r:3 | E2:1 E3:1 G#3:1 r:3 | A2:1 E3:1 A3:1 r:1',
    ],
  },
  {
    id: 'greensleeves', key: 'Am', cat: 'Classics', title: 'Greensleeves', credit: 'English traditional', bpm: 100, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['A4:4 | C5:8 D5:4 | E5:6 F5:2 E5:4 | D5:8 B4:4 | G4:6 A4:2 B4:4 | C5:8 A4:4 | A4:6 G#4:2 A4:4 | B4:8 G#4:4 | E4:8 A4:4 | C5:8 D5:4 | E5:6 F5:2 E5:4 | D5:8 B4:4 | G4:6 A4:2 B4:4 | C5:6 B4:2 A4:4 | G#4:6 F#4:2 G#4:4 | A4:12 | A4:12 | G5:12 | G5:6 F#5:2 E5:4 | D5:8 B4:4 | G4:6 A4:2 B4:4 | C5:8 A4:4 | A4:6 G#4:2 A4:4 | B4:8 G#4:4 | E4:12 | G5:12 | G5:6 F#5:2 E5:4 | D5:8 B4:4 | G4:6 A4:2 B4:4 | C5:6 B4:2 A4:4 | G#4:6 F#4:2 G#4:4 | A4:12 | A4:8'],
  },
  {
    id: 'jacques', cat: 'Classics', title: 'Frère Jacques (three-voice round)', credit: 'French traditional', bpm: 116, meter: [4, 4], accomp: 'none',
    canon: [[32, -12], [64, 0]],
    voices: ['C5:4 D5 E5 C5 | C5 D5 E5 C5 | E5 F5 G5:8 | E5:4 F5 G5:8 | G5:2 A5 G5 F5 E5:4 C5 | G5:2 A5 G5 F5 E5:4 C5 | C5:4 G4 C5:8 | C5:4 G4 C5:8'],
  },
  {
    id: 'birthday', key: 'C', cat: 'Classics', title: 'Happy Birthday', credit: 'Mildred & Patty Hill, 1893', bpm: 108, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['G4:3 G4:1 | A4:4 G4:4 C5:4 | B4:8 G4:3 G4:1 | A4:4 G4:4 D5:4 | C5:8 G4:3 G4:1 | G5:4 E5:4 C5:4 | B4:4 A4:4 F5:3 F5:1 | E5:4 C5:4 D5:4 | C5:8'],
  },
  {
    id: 'canon', cat: 'Classics', title: 'Canon in D (excerpt)', credit: 'Johann Pachelbel, c. 1680', bpm: 84, meter: [4, 4], accomp: 'none',
    voices: [
      'F#5:8 E5:8 | D5:8 C#5:8 | B4:8 A4:8 | B4:8 C#5:8 | D5:8 C#5:8 | B4:8 A4:8 | G4:8 F#4:8 | G4:8 E4:8 | D5:4 F#5:4 A5:4 G5:4 | F#5:4 D5:4 F#5:4 E5:4 | D5:4 B4:4 D5:4 A5:4 | G5:4 B5:4 A5:4 G5:4 | F#5:4 D5:4 E5:4 C#6:4 | D6:4 F#6:4 A6:4 A5:4 | B5:4 G5:4 A5:4 F#5:4 | D5:4 D6:4 D6:6 C#6:2',
      rep('D3:8 A2:8 | B2:8 F#2:8 | G2:8 D2:8 | G2:8 A2:8 |', 4),
    ],
  },

  // -------------------------------------------------------------- Christmas
  {
    id: 'jingle', key: 'C', cat: 'Christmas', title: 'Jingle Bells', credit: 'James Lord Pierpont, 1857', bpm: 132, meter: [4, 4], accomp: 'broken',
    voices: ['E5:4 E5 E5:8 | E5:4 E5 E5:8 | E5:4 G5 C5:6 D5:2 | E5:16 | F5:4 F5 F5:6 F5:2 | F5:4 E5 E5 E5:2 E5:2 | E5:4 D5 D5 E5 | D5:8 G5:8 | E5:4 E5 E5:8 | E5:4 E5 E5:8 | E5:4 G5 C5:6 D5:2 | E5:16 | F5:4 F5 F5:6 F5:2 | F5:4 E5 E5 E5:2 E5:2 | G5:4 G5 F5 D5 | C5:16'],
  },
  {
    id: 'silent', key: 'C', cat: 'Christmas', title: 'Silent Night', credit: 'Franz Xaver Gruber, 1818', bpm: 80, meter: [6, 8], accomp: 'broken',
    voices: ['G4:3 A4:1 G4:2 E4:6 | G4:3 A4:1 G4:2 E4:6 | D5:4 D5:2 B4:6 | C5:4 C5:2 G4:6 | A4:4 A4:2 C5:3 B4:1 A4:2 | G4:3 A4:1 G4:2 E4:6 | A4:4 A4:2 C5:3 B4:1 A4:2 | G4:3 A4:1 G4:2 E4:6 | D5:4 D5:2 F5:3 D5:1 B4:2 | C5:6 E5:6 | C5:3 G4:1 E4:2 G4:3 F4:1 D4:2 | C4:12'],
  },
  {
    id: 'deck', key: 'C', cat: 'Christmas', title: 'Deck the Halls', credit: 'Welsh traditional', bpm: 126, meter: [4, 4], accomp: 'broken',
    voices: ['G5:6 F5:2 E5:4 D5:4 | C5:4 D5:4 E5:4 C5:4 | D5:2 E5:2 F5:2 D5:2 E5:6 D5:2 | C5:4 B4:4 C5:8 | G5:6 F5:2 E5:4 D5:4 | C5:4 D5:4 E5:4 C5:4 | D5:2 E5:2 F5:2 D5:2 E5:6 D5:2 | C5:4 B4:4 C5:8 | D5:6 E5:2 F5:4 D5:4 | E5:6 F5:2 G5:4 D5:4 | E5:2 F#5:2 G5:4 A5:2 B5:2 C6:4 | B5:4 A5:4 G5:8 | G5:6 F5:2 E5:4 D5:4 | C5:4 D5:4 E5:4 C5:4 | A5:2 A5:2 A5:2 A5:2 G5:6 F5:2 | E5:4 D5:4 C5:8'],
  },
  {
    id: 'wish', key: 'C', cat: 'Christmas', title: 'We Wish You a Merry Christmas', credit: 'English traditional', bpm: 132, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['G4:4 | C5:4 C5:2 D5:2 C5:2 B4:2 | A4:4 A4:4 A4:4 | D5:4 D5:2 E5:2 D5:2 C5:2 | B4:4 G4:4 G4:4 | E5:4 E5:2 F5:2 E5:2 D5:2 | C5:4 A4:4 G4:2 G4:2 | A4:4 D5:4 B4:4 | C5:8 G4:4 | C5:4 C5:4 C5:4 | B4:8 B4:4 | C5:4 B4:4 A4:4 | G4:8 D5:4 | E5:4 D5:4 C5:4 | G5:4 G4:4 G4:2 G4:2 | A4:4 D5:4 B4:4 | C5:8'],
  },
  {
    id: 'wenceslas', key: 'G', cat: 'Christmas', title: 'Good King Wenceslas', credit: 'Piae Cantiones, 1582', bpm: 112, meter: [4, 4], accomp: 'broken',
    voices: ['G4:4 G4 G4 A4 | G4 G4 D4:8 | E4:4 D4 E4 F#4 | G4:8 G4:8 | G4:4 G4 G4 A4 | G4 G4 D4:8 | E4:4 D4 E4 F#4 | G4:8 G4:8 | D5:4 C5 B4 A4 | B4 A4 G4:8 | E4:4 D4 E4 F#4 | G4:8 G4:8 | D4:4 D4 E4 F#4 | G4 G4 A4:8 | D5:4 C5 B4 A4 | G4:8 C5:8 | G4:16'],
  },
  {
    id: 'joy', key: 'C', cat: 'Christmas', title: 'Joy to the World', credit: 'arr. Lowell Mason, 1839', bpm: 100, meter: [2, 4], accomp: 'broken',
    voices: ['C6:4 B5:3 A5:1 | G5:6 F5:2 | E5:4 D5:4 | C5:6 G5:2 | A5:6 A5:2 | B5:6 B5:2 | C6:6 C6:2 | C6:2 B5:2 A5:2 G5:2 | G5:3 F5:1 E5:4 | E5:2 E5:2 E5:2 E5:2 | E5:3 F5:1 G5:6 F5:2 | E5:2 D5:2 D5:2 D5:3 E5:1 F5:6 | E5:2 D5:2 C5:2 C6:4 A5:2 | G5:3 F5:1 E5:2 F5:2 E5:4 D5:4 | C5:8'],
  },
  {
    id: 'bells', cat: 'Christmas', title: 'Carol of the Bells (Shchedryk ostinato)', credit: 'Mykola Leontovych, 1916 — music box arrangement', bpm: 150, meter: [3, 4], accomp: 'none',
    voices: [
      rep('Bb4:4 A4:2 Bb4:2 G4:4 |', 16),
      'r:48 | ' + rep('G3:12 F3:12 Eb3:12 D3:12 |', 3),
      'r:96 | ' + rep('D5:4 C5:2 D5:2 Bb4:4 |', 4) + ' G5:12 | F5:12 | Eb5:12 | D5:12',
    ],
  },

  // --------------------------------------------------------------- Hanukkah
  {
    id: 'maoz', key: 'F', cat: 'Hanukkah', title: "Ma'oz Tzur (Rock of Ages)", credit: 'Traditional Ashkenazi melody', bpm: 104, meter: [4, 4], accomp: 'broken',
    voices: ['F4:4 C4:4 F4:4 Bb4:4 | A4:4 G4:4 F4:8 | C5:4 D5:4 G4:4 Bb4:4 | A4:4 G4:4 F4:8 | F4:4 C4:4 F4:4 Bb4:4 | A4:4 G4:4 F4:8 | C5:4 D5:4 G4:4 Bb4:4 | A4:4 G4:4 F4:8 | C5:4 C5:4 D5:4 E5:4 | F5:8 C5:8 | F5:4 E5:4 D5:4 C5:4 | C5:2 Bb4:2 A4:2 Bb4:2 G4:8 | A4:6 Bb4:2 C5:8 | G4:6 A4:2 Bb4:8 | A4:4 G4:4 F4:4 Bb4:4 | A4:4 G4:4 F4:8 | C5:4 C5:4 D5:4 E5:4 | F5:8 C5:8 | F5:4 E5:4 D5:4 C5:4 | C5:2 Bb4:2 A4:2 Bb4:2 G4:8 | A4:6 Bb4:2 C5:8 | G4:6 A4:2 Bb4:8 | A4:4 G4:4 F4:4 Bb4:4 | A4:8 G4:6 F4:2 | F4:16'],
  },
  {
    id: 'ohchanukah', key: 'Dm', cat: 'Hanukkah', title: 'Oh Chanukah (Oy Khanike)', credit: 'Yiddish folk song, pub. 1912 (M. Rivesman)', bpm: 120, meter: [4, 4], pickup: 2, accomp: 'broken',
    voices: ['D4:2 | A4:2 A4 A4 A4 D5 A4 A4 A4 | A4:4 G4:2 F4 G4:4 E4:2 E4 | A4:2 A4 A4 A4 D5 D5 A4 A4 | A4:4 G4:2 F4 G4:4 E4:4 | F4:2 G4 A4 G4 F4:4 F4:2 F4 | G4:4 F4:2 E4 F4:8 | F4:2 G4 A4 G4 F4:4 F4 | G4:4 F4:2 E4 D4:8 | A4:4 A4:8 D4:4 | A4:4 A4:8 D4:4 | A4:2 A4 A4 A4 G4:4 Bb4 | A4:16 | A4:2 A4 A4 A4 Bb4:4 A4:2 G4 | A4:4 A4:2 A4 Bb4:4 A4:2 G4 | F4:4 F4:2 F4 G4:4 F4:2 G4 | A4:16 | A4:2 A4 A4 A4 Bb4:4 A4:2 G4 | A4:4 A4:2 A4 Bb4:4 A4:2 G4 | F4:4 F4:2 F4 G4:4 F4:2 E4 | D4:8 r:8'],
  },

  // ---------------------------------------------------------------- Swiss
  {
    id: 'rufstdu', key: 'G', cat: 'Swiss', title: 'Rufst du, mein Vaterland', credit: 'Swiss anthem 1811–1961 (J. R. Wyss), sung to the old tune of God Save the King', bpm: 76, meter: [3, 4], accomp: 'broken',
    voices: ['G5:4 G5:4 A5:4 | F#5:6 G5:2 A5:4 | B5:4 B5:4 C6:4 | B5:6 A5:2 G5:4 | A5:4 G5:4 F#5:4 | G5:12 | D6:4 D6:4 D6:4 | D6:6 C6:2 B5:4 | C6:4 C6:4 C6:4 | C6:6 B5:2 A5:4 | B5:4 C6:2 B5:2 A5:2 G5:2 | B5:6 C6:2 D6:4 | E6:2 C6:2 B5:4 A5:4 | G5:12'],
  },
  {
    id: 'laendler', key: 'F', cat: 'Swiss', title: 'Ländler for a Snowed-in Night', credit: 'Original, in the style of a Swiss Ländler', bpm: 132, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['C5:4 | F5:4 A5:4 C6:4 | A5:8 F5:4 | E5:4 G5:4 Bb5:4 | G5:8 E5:4 | C5:4 E5:4 G5:4 | Bb5:4 A5:4 G5:4 | F5:4 A5:4 G5:4 | F5:8 C5:4 | F5:4 A5:4 C6:4 | D6:8 C6:4 | Bb5:4 A5:4 G5:4 | C6:8 A5:4 | G5:4 Bb5:4 D6:4 | C6:4 A5:4 F5:4 | G5:4 E5:4 G5:4 | F5:8'],
  },
  {
    id: 'alpcall', key: 'F', cat: 'Swiss', title: 'Alphorn Call (on the natural notes)', credit: "Original, on an F alphorn's harmonics, with its sharp 'alphorn fa'", bpm: 60, meter: [4, 4], accomp: 'root',
    voices: ['C5:4 F5:8 A5:4 | C6:12 A5:4 | B5:2 C6:2 B5:2 A5:2 G5:8 | F5:16 | C5:4 F5:4 A5:4 C6:4 | G5:8 A5:4 B5:4 | C6:4 A5:4 F5:4 G5:4 | F5:16'],
  },

  // ---------------------------------------------------------------- Ambient (generative)
  {
    id: 'amb-snow', cat: 'Ambient', title: 'Snow on the Window', credit: 'Generative: a new piece each time you choose it', bpm: 54, meter: [4, 4],
    generate: () => ambient({ pitches: [65, 67, 69, 72, 74, 77, 79, 81, 84, 86], bars: 48, loops: 6, phrase: [1, 3], minGap: 10, bass: [65, 60] }),
  },
  {
    id: 'amb-ember', cat: 'Ambient', title: 'Embers', credit: 'Generative: slow, low and warm (a new piece each time)', bpm: 46, meter: [4, 4],
    generate: () => ambient({ pitches: [62, 65, 67, 69, 72, 74, 77, 79], bars: 40, loops: 6, phrase: [1, 2], minGap: 14, minP: 59, maxP: 137, bass: [62, 57] }),
  },
  {
    id: 'amb-glacier', cat: 'Ambient', title: 'Glacier Light', credit: 'Generative: high and glassy, Lydian (a new piece each time)', bpm: 58, meter: [4, 4],
    generate: () => ambient({ pitches: [72, 74, 76, 78, 79, 83, 84, 86, 88, 90, 91], bars: 48, loops: 7, phrase: [2, 3], minGap: 8, minP: 37, maxP: 113 }),
  },
  {
    id: 'amb-hours', cat: 'Ambient', title: 'The Long Hours', credit: 'Generative: sparse minor pentatonic (a new piece each time)', bpm: 50, meter: [4, 4],
    generate: () => ambient({ pitches: [69, 72, 74, 76, 79, 81, 84, 86, 88], bars: 56, loops: 5, phrase: [1, 2], minGap: 12, minP: 53, maxP: 137, bass: [57, 64] }),
  },


];

export const CATEGORIES = ['Classics', 'Christmas', 'Hanukkah', 'Swiss', 'Ambient', 'My tunes'];
