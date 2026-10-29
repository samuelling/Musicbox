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

  // ------------------------------------------------- Christmas: more carols
  // melodies transcribed from public-domain flutetunes.com scores (melody line only; the music box harmonises)
  {
    id: 'adeste', cat: 'Christmas', title: "O Come, All Ye Faithful (Adeste Fideles)", credit: "John Francis Wade, c. 1743", bpm: 72, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["A4:4 A4:8 E4:4 A4:4 B4:8 E4:8 C#5:4 B4:4 C#5:4 D5:4 C#5:8 B4:4 A4:4 A4:8 G#4:4 F#4:4 G#4:4 A4:4 B4:4 C#5:4 G#4:8 F#4:6 E4:2 E4:16 E5:8 D5:4 C#5:4 D5:8 C#5:8 B4:4 C#5:4 A4:4 B4:4 G#4:6 F#4:2 E4:4 A4:4 A4:4 G#4:4 A4:4 B4:4 A4:8 E4:4 C#5:4 C#5:4 B4:4 C#5:4 D5:4 C#5:8 B4:4 C#5:4 D5:4 C#5:4 B4:4 A4:4 G#4:8 A4:4 D5:4 C#5:8 B4:6 A4:2 A4:12"],
  },
  {
    id: 'hark', cat: 'Christmas', title: "Hark! The Herald Angels Sing", credit: "Felix Mendelssohn, 1840", bpm: 101, meter: [4, 4], pickup: 8, accomp: 'broken',
    voices: ["C5:4 F5:4 F5:6 E5:2 F5:4 A5:4 A5:4 G5:4 C6:4 C6:4 C6:6 Bb5:2 A5:4 G5:4 A5:8 C5:4 F5:4 F5:6 E5:2 F5:4 A5:4 A5:4 G5:4 C6:4 G5:4 G5:6 E5:2 E5:4 D5:4 C5:8 C6:4 C6:4 C6:4 F5:4 Bb5:4 A5:4 A5:4 G5:4 C6:4 C6:4 C6:4 F5:4 Bb5:4 A5:4 G5:8 D6:4 D6:4 D6:4 C6:4 Bb5:4 A5:4 Bb5:8 G5:4 A5:2 Bb5:2 C6:6 F5:2 F5:4 G5:4 A5:8 D6:6 D6:2 D6:4 C6:4 Bb5:4 A5:4 Bb5:8 G5:4 A5:2 Bb5:2 C6:6 F5:2 F5:4 G5:4 F5:8"],
  },
  {
    id: 'noel', key: 'D', cat: 'Christmas', title: "The First Noël", credit: "Cornish traditional", bpm: 86, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["F#5:2 E5:2 D5:6 E5:2 F#5:2 G5:2 A5:8 B5:2 C#6:2 D6:4 C#6:4 B5:4 A5:8 B5:2 C#6:2 D6:4 C#6:4 B5:4 A5:4 B5:4 C#6:4 D6:4 A5:4 G5:4 F#5:8 F#5:2 E5:2 D5:6 E5:2 F#5:2 G5:2 A5:8 B5:2 C#6:2 D6:4 C#6:4 B5:4 A5:8 B5:2 C#6:2 D6:4 C#6:4 B5:4 A5:4 B5:4 C#6:4 D6:4 A5:4 G5:4 F#5:8 F#5:2 E5:2 D5:6 E5:2 F#5:2 G5:2 A5:8 D6:2 C#6:2 B5:8 B5:4 A5:12 D6:4 C#6:4 B5:4 A5:4 B5:4 C#6:4 D6:4 A5:4 G5:4 F#5:8"],
  },
  {
    id: 'godrest', key: 'Em', cat: 'Christmas', title: "God Rest You Merry, Gentlemen", credit: "English traditional", bpm: 108, meter: [2, 2], pickup: 4, accomp: 'broken',
    voices: ["E4:4 E4:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:4 D4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 E4:4 E4:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:4 D4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 B4:4 C5:4 A4:4 B4:4 C5:4 D5:4 E5:4 B4:4 A4:4 G4:4 E4:4 F#4:4 G4:4 A4:8 G4:4 A4:4 B4:8 C5:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:8 G4:2 F#4:2 E4:4 A4:8 G4:4 A4:4 B4:4 C5:4 D5:4 E5:4 B4:4 A4:4 G4:4 F#4:4 E4:12 E4:4 E4:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:4 D4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 E4:4 E4:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:4 D4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 B4:4 C5:4 A4:4 B4:4 C5:4 D5:4 E5:4 B4:4 A4:4 G4:4 E4:4 F#4:4 G4:4 A4:8 G4:4 A4:4 B4:8 C5:4 B4:4 B4:4 A4:4 G4:4 F#4:4 E4:8 G4:2 F#4:2 E4:4 A4:8 G4:4 A4:4 B4:4 C5:4 D5:4 E5:4 B4:4 A4:4 G4:4 F#4:4 E4:12"],
  },
  {
    id: 'angels', key: 'F', cat: 'Christmas', title: "Angels We Have Heard on High (Gloria)", credit: "French traditional", bpm: 90, meter: [4, 4], accomp: 'broken',
    voices: ["A5:4 A5:4 A5:4 C6:4 C6:6 Bb5:2 A5:8 A5:4 G5:4 A5:4 C6:4 A5:6 G5:2 F5:8 A5:4 A5:4 A5:4 C6:4 C6:6 Bb5:2 A5:8 A5:4 G5:4 A5:4 C6:4 A5:6 G5:2 F5:8 C6:8 D6:2 C6:2 Bb5:2 A5:2 Bb5:8 C6:2 Bb5:2 A5:2 G5:2 A5:8 Bb5:2 A5:2 G5:2 F5:2 G5:6 G5:2 C5:8 F5:4 G5:4 A5:4 Bb5:4 A5:8 G5:8 C6:8 D6:2 C6:2 Bb5:2 A5:2 Bb5:8 C6:2 Bb5:2 A5:2 G5:2 A5:8 Bb5:2 A5:2 G5:2 F5:2 G5:6 G5:2 C5:8 F5:4 G5:4 A5:4 Bb5:4 A5:8 G5:8 F5:16"],
  },
  {
    id: 'bethlehem', key: 'G', cat: 'Christmas', title: "O Little Town of Bethlehem", credit: "Lewis H. Redner, 1868", bpm: 79, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["B4:4 B4:4 B4:4 A#4:4 B4:4 D5:4 C5:4 E4:4 A4:4 G4:4 F#4:2 G4:2 A4:4 D4:4 B4:12 B4:4 B4:4 B4:4 E5:4 D5:4 D5:4 C5:4 E4:4 A4:4 G4:4 F#4:2 G4:2 B4:4 A4:4 G4:12 B4:4 B4:4 B4:4 A4:4 G4:4 F#4:8 F#4:4 F#4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 B4:4 B4:4 B4:4 A#4:4 B4:4 D5:4 C5:4 E4:4 E5:4 D5:4 G4:4 B4:6 A4:2 G4:12 B4:4 B4:4 B4:4 A#4:4 B4:4 D5:4 C5:4 E4:4 A4:4 G4:4 F#4:2 G4:2 A4:4 D4:4 B4:12 B4:4 B4:4 B4:4 E5:4 D5:4 D5:4 C5:4 E4:4 A4:4 G4:4 F#4:2 G4:2 B4:4 A4:4 G4:12 B4:4 B4:4 B4:4 A4:4 G4:4 F#4:8 F#4:4 F#4:4 E4:4 F#4:4 G4:4 A4:4 B4:12 B4:4 B4:4 B4:4 A#4:4 B4:4 D5:4 C5:4 E4:4 E5:4 D5:4 G4:4 B4:6 A4:2 G4:12"],
  },
  {
    id: 'manger', key: 'F', cat: 'Christmas', title: "Away in a Manger", credit: "James R. Murray, 1887", bpm: 90, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["C6:4 C6:6 Bb5:2 A5:4 A5:4 G5:4 F5:4 F5:4 E5:4 D5:4 C5:8 C5:4 C5:6 D5:2 C5:4 C5:4 G5:4 E5:4 D5:4 C5:4 F5:4 A5:8 C6:4 C6:6 Bb5:2 A5:4 A5:4 G5:4 F5:4 F5:4 E5:4 D5:4 C5:8 C5:4 Bb5:6 A5:2 G5:4 A5:4 G5:4 F5:4 G5:4 D5:4 E5:4 F5:8 C6:4 C6:6 Bb5:2 A5:4 A5:4 G5:4 F5:4 F5:4 E5:4 D5:4 C5:8 C5:4 C5:6 D5:2 C5:4 C5:4 G5:4 E5:4 D5:4 C5:4 F5:4 A5:8 C6:4 C6:6 Bb5:2 A5:4 A5:4 G5:4 F5:4 F5:4 E5:4 D5:4 C5:8 C5:4 Bb5:6 A5:2 G5:4 A5:4 G5:4 F5:4 G5:4 D5:4 E5:4 F5:8"],
  },
  {
    id: 'midwinter', cat: 'Christmas', title: "In the Bleak Midwinter (Cranham)", credit: "Gustav Holst, 1906", bpm: 86, meter: [4, 4], accomp: 'broken',
    voices: ["A4:6 Bb4:2 C5:4 A4:4 G4:8 F4:8 G4:6 A4:2 G4:4 D4:4 G4:16 A4:6 Bb4:2 C5:4 A4:4 G4:8 F4:8 G4:4 A4:4 G4:6 F4:2 F4:16 Bb4:6 A4:2 Bb4:4 C5:4 D5:4 D5:4 A4:8 C5:4 A4:4 G4:4 F4:4 E4:16 A4:4 A4:2 Bb4:2 C5:4 A4:4 G4:8 F4:8 G4:4 A4:4 G4:6 F4:2 F4:16"],
  },
  {
    id: 'coventry', key: 'Gm', cat: 'Christmas', title: "Coventry Carol (Lully, Lullay)", credit: "English, 16th century", bpm: 86, meter: [3, 4], accomp: 'broken',
    voices: ["G5:4 G5:4 F#5:4 G5:8 Bb5:4 A5:8 G5:4 F#5:12 G5:4 A5:4 Bb5:4 C6:4 A5:8 G5:8 D6:4 C6:8 Bb5:4 A5:8 Bb5:4 A5:8 G5:4 F#5:12 G5:4 F#5:4 G5:4 C6:4 A5:8 B5:12 G5:4 G5:4 F#5:4 G5:8 Bb5:4 A5:8 G5:4 F#5:12 G5:4 A5:4 Bb5:4 C6:4 A5:8 G5:8 D6:4 C6:8 Bb5:4 A5:8 Bb5:4 A5:8 G5:4 F#5:12 G5:4 F#5:4 G5:4 C6:4 A5:8 B5:12"],
  },
  {
    id: 'dingdong', key: 'Bb', cat: 'Christmas', title: "Ding Dong Merrily on High", credit: "Thoinot Arbeau, Orchésographie, 1588", bpm: 113, meter: [4, 4], accomp: 'broken',
    voices: ["Bb4:4 Bb4:4 C5:2 Bb4:2 A4:2 G4:2 F4:12 F4:4 G4:4 Bb4:4 Bb4:4 A4:4 Bb4:8 Bb4:8 Bb4:4 Bb4:4 C5:2 Bb4:2 A4:2 G4:2 F4:12 F4:4 G4:4 Bb4:4 Bb4:4 A4:4 Bb4:8 Bb4:8 F5:6 Eb5:2 D5:2 Eb5:2 F5:2 D5:2 Eb5:6 D5:2 C5:2 D5:2 Eb5:2 C5:2 D5:6 C5:2 Bb4:2 C5:2 D5:2 Bb4:2 C5:6 Bb4:2 A4:2 Bb4:2 C5:2 A4:2 Bb4:6 A4:2 G4:2 A4:2 Bb4:2 G4:2 A4:6 G4:2 F4:4 F4:4 G4:4 Bb4:4 Bb4:4 A4:4 Bb4:8 Bb4:8"],
  },
  {
    id: 'emmanuel', key: 'Em', cat: 'Christmas', title: "O Come, O Come, Emmanuel (Veni Emmanuel)", credit: "French, 15th century", bpm: 90, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["E5:4 G5:4 B5:4 B5:4 B5:4 A5:4 C6:4 B5:4 A5:4 G5:12 A5:4 B5:4 G5:4 E5:4 G5:4 A5:4 F#5:4 E5:4 D5:4 E5:12 A5:4 A5:4 E5:4 E5:4 F#5:4 G5:8 F#5:4 E5:4 D5:12 G5:4 A5:4 B5:4 B5:4 B5:4 A5:4 C6:4 B5:4 A5:4 G5:12 D6:4 D6:12 B5:4 B5:12 B5:4 A5:4 C6:4 B5:4 A5:4 G5:12 A5:4 B5:4 G5:4 E5:4 G5:4 A5:4 F#5:4 E5:4 D5:4 E5:12"],
  },
  {
    id: 'threekings', key: 'Em', cat: 'Christmas', title: "We Three Kings", credit: "John Henry Hopkins Jr., 1857", bpm: 81, meter: [3, 8], accomp: 'broken',
    voices: ["B5:4 A5:2 G5:4 E5:2 F#5:2 G5:2 F#5:2 E5:6 B5:4 A5:2 G5:4 E5:2 F#5:2 G5:2 F#5:2 E5:6 G5:4 G5:2 A5:4 A5:2 B5:4 B5:2 D6:2 C6:2 B5:2 A5:2 B5:2 A5:2 G5:4 F#5:2 E5:6 F#5:4 A5:2 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 G5:4 G5:2 A5:4 B5:2 C6:4 B5:2 A5:4 B5:2 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 B5:4 A5:2 G5:2 A5:2 B5:2 C6:4 B5:2 A5:2 B5:2 C6:2 B5:2 A5:2 G5:2 A5:2 G5:2 F#5:2 E5:6 B5:4 A5:2 G5:4 E5:2 F#5:2 G5:2 F#5:2 E5:6 B5:4 A5:2 G5:4 E5:2 F#5:2 G5:2 F#5:2 E5:6 G5:4 G5:2 A5:4 A5:2 B5:4 B5:2 D6:2 C6:2 B5:2 A5:2 B5:2 A5:2 G5:4 F#5:2 E5:6 F#5:4 A5:2 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 G5:4 G5:2 A5:4 B5:2 C6:4 B5:2 A5:4 B5:2 G5:4 G5:2 G5:4 D5:2 G5:4 E5:2 G5:6 B5:4 A5:2 G5:2 A5:2 B5:2 C6:4 B5:2 A5:2 B5:2 C6:2 B5:2 A5:2 G5:2 A5:2 G5:2 F#5:2 E5:6"],
  },
  {
    id: 'holly', cat: 'Christmas', title: "The Holly and the Ivy", credit: "English traditional", bpm: 97, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["G4:4 G4:2 G4:2 G4:4 E5:4 D5:4 B4:6 G4:2 G4:2 G4:2 G4:4 E5:4 D5:8 D5:2 C5:2 B4:2 A4:2 G4:4 B4:2 B4:2 E4:2 E4:2 D4:4 G4:2 A4:2 B4:2 C5:2 B4:4 A4:4 G4:10 G4:2 G4:2 G4:2 G4:4 E5:4 D5:4 B4:4 G4:2 G4:2 G4:2 G4:2 G4:4 E5:4 D5:8 D5:2 C5:2 B4:2 A4:2 G4:4 B4:4 E4:2 E4:2 D4:4 G4:2 A4:2 B4:2 C5:2 B4:4 A4:4 G4:20 G4:4 G4:2 G4:2 G4:4 E5:4 D5:4 B4:6 G4:2 G4:2 G4:2 G4:4 E5:4 D5:8 D5:2 C5:2 B4:2 A4:2 G4:4 B4:2 B4:2 E4:2 E4:2 D4:4 G4:2 A4:2 B4:2 C5:2 B4:4 A4:4 G4:10 G4:2 G4:2 G4:2 G4:4 E5:4 D5:4 B4:4 G4:2 G4:2 G4:2 G4:2 G4:4 E5:4 D5:8 D5:2 C5:2 B4:2 A4:2 G4:4 B4:4 E4:2 E4:2 D4:4 G4:2 A4:2 B4:2 C5:2 B4:4 A4:4 G4:8"],
  },
  {
    id: 'threeships', cat: 'Christmas', title: "I Saw Three Ships", credit: "English traditional", bpm: 90, meter: [6, 8], pickup: 2, accomp: 'broken',
    voices: ["D4:2 G4:4 G4:2 A4:4 B4:2 D5:4 B4:2 A4:4 C5:2 B4:4 G4:2 G4:4 B4:2 A4:4 F#4:2 D4:4 D4:2 G4:4 G4:2 A4:4 B4:2 D5:4 B4:2 A4:4 C5:2 B4:4 G4:2 G4:2 A4:2 B4:2 A4:6 G4:4 D4:2 G4:4 G4:2 A4:4 B4:2 D5:4 B4:2 A4:4 C5:2 B4:4 G4:2 G4:4 B4:2 A4:4 F#4:2 D4:4 D4:2 G4:4 G4:2 A4:4 B4:2 D5:4 B4:2 A4:4 C5:2 B4:4 G4:2 G4:2 A4:2 B4:2 A4:6 G4:4"],
  },
  {
    id: 'sussex', cat: 'Christmas', title: "The Sussex Carol", credit: "English traditional", bpm: 162, meter: [6, 4], pickup: 4, accomp: 'broken',
    voices: ["D6:4 D6:8 B5:4 C6:8 D6:4 B5:4 A5:4 G5:4 A5:8 F#5:4 G5:8 G5:4 A5:4 B5:4 C6:4 B5:8 A5:4 G5:8 D6:4 D6:8 B5:4 C6:8 D6:4 B5:4 A5:4 G5:4 A5:8 F#5:4 G5:8 G5:4 A5:4 B5:4 C6:4 B5:8 A5:4 G5:12 A5:12 A5:8 G5:4 A5:4 B5:4 C6:4 D6:4 C6:4 B5:4 A5:24 D6:12 E6:12 D6:12 C6:8 B5:4 A5:4 G5:4 A5:4 G5:44 D6:4 D6:8 B5:4 C6:8 D6:4 B5:4 A5:4 G5:4 A5:8 F#5:4 G5:8 G5:4 A5:4 B5:4 C6:4 B5:8 A5:4 G5:8 D6:4 D6:8 B5:4 C6:8 D6:4 B5:4 A5:4 G5:4 A5:8 F#5:4 G5:8 G5:4 A5:4 B5:4 C6:4 B5:8 A5:4 G5:12 A5:12 A5:8 G5:4 A5:4 B5:4 C6:4 D6:4 C6:4 B5:4 A5:24 D6:12 E6:12 D6:12 C6:8 B5:4 A5:4 G5:4 A5:4 G5:28"],
  },
  {
    id: 'wexford', cat: 'Christmas', title: "The Wexford Carol", credit: "Irish traditional", bpm: 57, meter: [3, 4], pickup: 2, accomp: 'broken',
    voices: ["C5:2 F5:2 F5:1 E5:1 F5:6 G5:2 A5:2 Bb5:2 C6:6 C6:2 Bb5:2 A5:2 F5:2 C5:4 D5:2 Eb5:2 F5:2 Eb5:6 C5:2 F5:2 F5:1 E5:1 F5:6 G5:2 A5:2 Bb5:2 C6:6 A5:2 Bb5:2 C6:2 A5:2 F5:4 G5:2 F5:2 F5:2 F5:6 F5:2 F5:2 Eb6:2 C6:2 Bb5:4 G5:2 Ab5:2 Bb5:2 Ab5:6 C6:1 Bb5:1 Ab5:1.333 G5:1.333 F5:1.333 F5:2 C5:4 D5:2 Eb5:2 F5:2 Eb5:6 C5:2 F5:2 F5:1 E5:1 F5:6 G5:2 A5:2 Bb5:2 C6:6 A5:2 Bb5:2 C6:2 A5:2 F5:4 G5:2 F5:2 F5:2 F5:6"],
  },
  {
    id: 'housetop', key: 'Eb', cat: 'Christmas', title: "Up on the Housetop", credit: "Benjamin Hanby, 1864", bpm: 113, meter: [4, 4], pickup: 8, accomp: 'broken',
    voices: ["Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 F5:2 Eb5:4 G5:4 Bb5:8 C6:4 C6:4 Bb5:4 G5:4 F5:4 Bb5:4 Bb5:8 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 F5:2 Eb5:4 G5:4 Bb5:8 C6:4 C6:2 C6:2 Bb5:4 G5:2 G5:2 F5:4 Bb5:4 Eb5:8 Ab5:4 Ab5:4 C6:8 Bb5:4 Bb5:2 Bb5:2 G5:8 F5:4 Ab5:4 Ab5:8 G5:4 Bb5:2 Bb5:2 Eb5:4 G5:4 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:4 Ab5:4 Bb5:4 C6:8 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 G5:2 F5:4 Bb5:4 Eb5:8 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 F5:2 Eb5:4 G5:4 Bb5:8 C6:4 C6:4 Bb5:4 G5:4 F5:4 Bb5:4 Bb5:8 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 F5:2 Eb5:4 G5:4 Bb5:8 C6:4 C6:2 C6:2 Bb5:4 G5:2 G5:2 F5:4 Bb5:4 Eb5:8 Ab5:4 Ab5:4 C6:8 Bb5:4 Bb5:2 Bb5:2 G5:8 F5:4 Ab5:4 Ab5:8 G5:4 Bb5:2 Bb5:2 Eb5:4 G5:4 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:4 Ab5:4 Bb5:4 C6:8 Bb5:4 Bb5:2 C6:2 Bb5:4 G5:2 G5:2 F5:4 Bb5:4 Eb5:8"],
  },
  {
    id: 'jolly', key: 'G', cat: 'Christmas', title: "Jolly Old Saint Nicholas", credit: "American traditional, 1865", bpm: 86, meter: [2, 4], accomp: 'broken',
    voices: ["B5:2 B5:2 B5:2 B5:2 A5:2 A5:2 A5:4 G5:2 G5:2 G5:2 G5:2 B5:8 E5:2 E5:2 E5:2 E5:2 D5:2 D5:2 G5:4 F#5:2 G5:2 A5:2 B5:2 A5:8 B5:2 B5:2 B5:2 B5:2 A5:2 A5:2 A5:4 G5:2 G5:2 G5:2 G5:2 B5:8 E5:2 E5:2 E5:2 E5:2 D5:2 D5:2 G5:4 A5:2 G5:2 A5:2 B5:2 G5:8 B5:2 B5:2 B5:2 B5:2 A5:2 A5:2 A5:4 G5:2 G5:2 G5:2 G5:2 B5:8 E5:2 E5:2 E5:2 E5:2 D5:2 D5:2 G5:4 F#5:2 G5:2 A5:2 B5:2 A5:8 B5:2 B5:2 B5:2 B5:2 A5:2 A5:2 A5:4 G5:2 G5:2 G5:2 G5:2 B5:8 E5:2 E5:2 E5:2 E5:2 D5:2 D5:2 G5:4 A5:2 G5:2 A5:2 B5:2 G5:8"],
  },

  // ------------------------------------------------------- World Carols
  {
    id: 'tannenbaum', cat: 'World Carols', title: "O Tannenbaum", credit: "German folk melody (words Ernst Anschütz, 1824)", bpm: 72, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["D4:4 G4:3 G4:1 G4:6 A4:2 B4:3 B4:1 B4:6 B4:2 A4:2 B4:2 C5:4 F#4:4 A4:4 G4:6 D5:2 D5:2 B4:2 E5:6 D5:2 D5:2 C5:2 C5:6 C5:2 C5:2 A4:2 D5:6 C5:2 C5:2 B4:2 B4:6 D4:2 G4:3 G4:1 G4:4 A4:4 B4:3 B4:1 B4:6 B4:2 A4:2 B4:2 C5:4 F#4:4 A4:4 G4:4"],
  },
  {
    id: 'allejahre', key: 'F', cat: 'World Carols', title: "Alle Jahre wieder", credit: "Friedrich Silcher, 1842", bpm: 97, meter: [4, 4], accomp: 'broken',
    voices: ["C5:6 D5:2 C5:4 Bb4:4 A4:8 G4:8 F4:4 G4:2 A4:2 Bb4:4 A4:4 G4:16 A4:4 C5:4 D5:4 C5:4 F5:8 E5:4 D5:4 C5:4 Bb4:2 A4:2 Bb4:4 C5:4 A4:16 C5:6 D5:2 C5:4 Bb4:4 A4:8 G4:8 F4:4 G4:2 A4:2 Bb4:4 A4:4 G4:16 A4:4 C5:4 D5:4 C5:4 F5:8 E5:4 D5:4 C5:4 Bb4:2 A4:2 Bb4:4 C5:4 A4:12"],
  },
  {
    id: 'leise', cat: 'World Carols', title: "Leise rieselt der Schnee", credit: "Eduard Ebel, 1895", bpm: 97, meter: [6, 4], accomp: 'broken',
    voices: ["B4:8 B4:4 A4:4 B4:4 A4:4 G4:24 G4:8 E4:4 G4:4 F#4:4 E4:4 D4:24 A4:4 G#4:4 A4:4 C5:4 B4:4 A4:4 G4:24 A4:6 E4:2 E4:4 F#4:4 E4:4 F#4:4 G4:20"],
  },
  {
    id: 'kling', key: 'F', cat: 'World Carols', title: "Kling, Glöckchen, klingelingeling", credit: "German folk song, 19th century", bpm: 72, meter: [2, 4], accomp: 'broken',
    voices: ["C5:4 A4:2 Bb4:2 C5:1 D5:1 C5:1 D5:1 C5:4 Bb4:4 G4:2 C5:2 A4:8 G4:2 G4:2 A4:2 F4:2 A4:4 G4:4 Bb4:2 Bb4:2 C5:2 G4:2 Bb4:4 A4:4 G4:2 G4:2 A4:2 B4:2 C5:4 G4:4 A4:2 D5:2 C5:2 B4:2 D5:4 C5:4 C5:4 A4:2 Bb4:2 C5:1 D5:1 C5:1 D5:1 C5:4 Bb4:4 G4:2 C5:2 A4:8"],
  },
  {
    id: 'odufroh', cat: 'World Carols', title: "O du fröhliche", credit: "Sicilian Mariners' Hymn, 18th century", bpm: 108, meter: [2, 2], accomp: 'broken',
    voices: ["A4:8 B4:8 A4:6 G4:2 F#4:4 G4:4 A4:8 B4:8 A4:6 G4:2 F#4:4 G4:4 A4:8 A4:8 B4:8 C#5:4 D5:4 C#5:8 B4:8 A4:16 E4:6 F#4:2 E4:4 F#4:4 G4:6 A4:2 G4:8 F#4:6 G4:2 F#4:4 G4:4 A4:6 B4:2 A4:8 D5:4 C#5:4 B4:4 A4:4 D5:4 B4:4 A4:4 G4:4 F#4:8 E4:8 D4:16"],
  },
  {
    id: 'rose', cat: 'World Carols', title: "Es ist ein Ros entsprungen", credit: "German, 16th century; Michael Praetorius, 1609", bpm: 86, meter: [2, 2], pickup: 8, accomp: 'broken',
    voices: ["C6:8 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:8 C6:8 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:12 A5:4 G5:4 E5:4 F5:4 D5:4 C5:12 C6:4 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:16 C6:8 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:8 C6:8 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:12 A5:4 G5:4 E5:4 F5:4 D5:4 C5:12 C6:4 C6:4 C6:4 D6:4 C6:4 C6:8 A5:8 Bb5:8 A5:4 G5:8 F5:8 E5:4 F5:16"],
  },
  {
    id: 'dulci', cat: 'World Carols', title: "In Dulci Jubilo", credit: "German, 14th century", bpm: 135, meter: [6, 8], pickup: 2, accomp: 'broken',
    voices: ["F5:2 F5:4 F5:2 A5:4 Bb5:2 C6:4 D6:2 C6:4 C6:2 F5:4 F5:2 A5:4 Bb5:2 C6:4 D6:2 C6:6 C6:4 D6:2 C6:4 Bb5:2 A5:4 G5:2 F5:4 F5:2 G5:4 G5:2 A5:4 G5:2 F5:4 G5:2 A5:4 A5:2 C6:4 D6:2 C6:4 Bb5:2 A5:4 G5:2 F5:4 F5:2 G5:4 G5:2 A5:4 G5:2 F5:4 G5:2 A5:6 D5:4 D5:2 E5:4 E5:2 F5:6 C6:6 A5:4 A5:2 G5:4 G5:2 F5:10 F5:2 F5:4 F5:2 A5:4 Bb5:2 C6:4 D6:2 C6:4 C6:2 F5:4 F5:2 A5:4 Bb5:2 C6:4 D6:2 C6:6 C6:4 D6:2 C6:4 Bb5:2 A5:4 G5:2 F5:4 F5:2 G5:4 G5:2 A5:4 G5:2 F5:4 G5:2 A5:4 A5:2 C6:4 D6:2 C6:4 Bb5:2 A5:4 G5:2 F5:4 F5:2 G5:4 G5:2 A5:4 G5:2 F5:4 G5:2 A5:6 D5:4 D5:2 E5:4 E5:2 F5:6 C6:6 A5:4 A5:2 G5:4 G5:2 F5:6"],
  },
  {
    id: 'stillstill', cat: 'World Carols', title: "Still, Still, Still", credit: "Salzburg folk melody", bpm: 65, meter: [4, 4], accomp: 'broken',
    voices: ["C5:4 F5:4 A4:4 C5:4 F4:12 F4:2 A4:2 G4:4 G4:2 Bb4:2 E4:4 E4:2 G4:2 F4:12 A4:4 G4:4 G4:2 A4:2 Bb4:4 G4:4 A4:4 A4:2 Bb4:2 C5:4 A4:4 G4:4 G4:2 A4:2 Bb4:4 G4:4 A4:4 A4:2 Bb4:2 C5:4 A4:4 C5:4 F5:4 A4:4 C5:4 F4:12 F4:2 A4:2 G4:4 G4:2 Bb4:2 E4:4 E4:2 G4:2 F4:12"],
  },
  {
    id: 'dumpa', cat: 'World Carols', title: "Es wird scho glei dumpa", credit: "Tyrolean; Anton Reidinger, 1884", bpm: 86, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["G4:4 C5:4 C5:4 D5:4 E5:2 G5:2 G5:6 F5:2 E5:4 E5:4 D5:4 C5:8 G4:4 C5:4 C5:4 D5:4 E5:2 G5:2 G5:6 F5:2 E5:4 E5:4 D5:4 C5:8 G5:4 G5:4 E5:4 G5:4 G5:2 F5:2 D5:6 F5:2 E5:4 C5:4 E5:4 D5:8 G4:4 C5:4 C5:4 D5:4 E5:2 G5:2 G5:6 F5:2 E5:4 E5:4 D5:4 C5:8 F5:2 B4:2 C5:8 D5:2 G4:2 C5:8 C5:2 E5:2 G5:4 E5:2 C5:2 D5:2 G4:2 C5:8"],
  },
  {
    id: 'ilestne', cat: 'World Carols', title: "Il est né, le divin enfant", credit: "French traditional, 18th century", bpm: 101, meter: [4, 4], pickup: 8, accomp: 'broken',
    voices: ["F4:4 Bb4:4 Bb4:4 D5:2 Bb4:2 F4:4 Bb4:4 Bb4:8 Bb4:4 Bb4:2 C5:2 D5:4 Eb5:2 D5:2 C5:4 Bb4:4 C5:2 A4:2 F4:4 F4:4 Bb4:4 Bb4:4 D5:2 Bb4:2 F4:4 Bb4:4 Bb4:8 Bb4:4 C5:4 D5:4 Eb5:2 D5:2 C5:4 F5:4 Bb4:8 D5:4 Eb5:4 F5:4 Eb5:2 D5:2 Eb5:4 G5:4 F5:8 D5:4 Eb5:4 F5:4 G5:2 F5:2 Eb5:4 D5:4 D5:4 C5:4 D5:4 Eb5:4 F5:4 Eb5:2 D5:2 Eb5:4 G5:4 F5:8 D5:4 Eb5:4 F5:4 G5:2 F5:2 Eb5:4 D5:4 C5:8 F4:4 Bb4:4 Bb4:4 D5:2 Bb4:2 F4:4 Bb4:4 Bb4:8 Bb4:4 Bb4:2 C5:2 D5:4 Eb5:2 D5:2 C5:4 Bb4:4 C5:2 A4:2 F4:4 F4:4 Bb4:4 Bb4:4 D5:2 Bb4:2 F4:4 Bb4:4 Bb4:8 Bb4:4 C5:4 D5:4 Eb5:2 D5:2 C5:4 F5:4 Bb4:8"],
  },
  {
    id: 'torch', cat: 'World Carols', title: "Bring a Torch, Jeanette, Isabella", credit: "Provençal, 17th century", bpm: 81, meter: [3, 8], accomp: 'broken',
    voices: ["D6:4 G5:2 G5:2 F#5:2 G5:2 A5:2 B5:2 C6:2 B5:4 A5:2 D6:4 G5:2 G5:2 F#5:2 G5:2 A5:2 B5:2 A5:2 G5:6 D6:4 D6:2 D6:2 C6:2 B5:2 B5:2 A5:2 G5:2 G5:4 F#5:2 E5:2 F#5:2 G5:2 D5:4 D5:2 C6:4 C6:2 B5:4 A5:2 G5:6 A5:6 B5:2 C6:2 B5:2 A5:4 D6:2 B5:6 A5:6 G5:6 A5:6 B5:2 C6:2 B5:2 A5:4 D6:2 G5:6"],
  },
  {
    id: 'fum', key: 'Am', cat: 'World Carols', title: "Fum, Fum, Fum", credit: "Catalan traditional", bpm: 108, meter: [2, 4], accomp: 'broken',
    voices: ["A4:3 G#4:1 A4:2 C5:2 B4:2 A4:2 G#4:2 E4:2 A4:4 G#4:4 A4:8 A4:3 G#4:1 A4:2 C5:2 B4:2 A4:2 G#4:2 E4:2 A4:4 G#4:4 A4:6 B4:1 B4:1 C5:2 C5:2 B4:2 B4:2 C5:2 G4:2 G4:2 G4:2 C5:2 C5:2 B4:2 B4:2 C5:6 B4:1 C5:1 D5:3 C5:1 B4:2 A4:2 G#4:2 E4:2 A4:2 G#4:2 A4:2 C5:2 B4:2 A4:2 G#4:2 E4:2 A4:4 G#4:4 A4:8 A5:3 G#5:1 A5:2 C6:2 B5:2 A5:2 G#5:2 E5:2 A5:4 G#5:4 A5:8 A5:3 G#5:1 A5:2 C6:2 B5:2 A5:2 G#5:2 E5:2 A5:4 G#5:4 A5:6 B5:1 B5:1 C6:2 C6:2 B5:2 B5:2 C6:2 G5:2 G5:2 G5:2 C6:2 C6:2 B5:2 B5:2 C6:6 B5:1 C6:1 D6:3 C6:1 B5:2 A5:2 G#5:2 E5:2 A5:2 G#5:2 A5:2 C6:2 B5:2 A5:2 G#5:2 E5:2 A5:4 G#5:4 A5:8"],
  },
  {
    id: 'tuscendi', key: 'F', cat: 'World Carols', title: "Tu scendi dalle stelle", credit: "St Alphonsus Liguori, 1732", bpm: 76, meter: [6, 8], pickup: 2, accomp: 'broken',
    voices: ["C5:2 C5:4 D5:2 C5:4 Bb4:2 Bb4:2 A4:8 G4:2 A4:2 Bb4:2 C5:2 C5:2 Bb4:2 A4:2 G4:10 A4:2 G4:4 A4:2 Bb4:4 A4:2 G4:6 D5:6 C5:2 D5:2 C5:2 Bb4:2 A4:2 G4:2 A4:10 A4:2 G4:4 A4:2 Bb4:4 A4:2 G4:6 D5:6 C5:2 D5:2 C5:2 Bb4:2 A4:2 G4:2 F4:6 A4:2 Bb4:2 C5:2 Bb4:4 Bb4:2 G4:2 A4:2 Bb4:2 A4:4 A4:2 A4:2 Bb4:2 C5:2 Bb4:4 Bb4:2 G4:2 A4:2 Bb4:2 A4:10 G4:2 A4:2 Bb4:2 C5:2 C5:2 Bb4:2 A4:2 G4:10 A4:2 G4:4 A4:2 Bb4:4 A4:2 G4:6 D5:6 C5:2 D5:2 C5:2 Bb4:2 A4:2 G4:2 A4:10 A4:2 G4:4 A4:2 Bb4:4 A4:2 G4:6 D5:6 C5:2 D5:2 C5:2 Bb4:2 A4:2 G4:2 F4:10"],
  },
  {
    id: 'jul', key: 'D', cat: 'World Carols', title: "Jul, jul, strålande jul", credit: "Gustaf Nordqvist, 1921", bpm: 59, meter: [3, 4], accomp: 'broken',
    voices: ["D5:2 F#5:2 A5:6 F#5:2 E5:2 B5:2 G5:6 E5:2 D5:2 E5:2 G5:2 A5:2 B5:2 D6:2 C#6:12 D6:12 F#5:12 E5:12 F#5:6 G5:2 A5:4 E5:12 F#5:4 G5:4 A5:4 A5:8 G5:4 G5:12 F#5:12 B5:6 B5:2 B5:4 A5:4 E5:4 A5:4 B5:6 C#6:2 B5:4 A5:12 G5:6 G5:2 G5:4 F#5:4 C#5:4 F#5:4 G5:6 A5:2 G5:4 F#5:12 D5:6 D5:2 D5:4 A5:6 A5:2 A5:4 F#5:8 F#5:4 D5:12 E5:6 D5:2 E5:4 F#5:6 E5:2 D5:4 E5:6 D5:2 E5:4 F#5:12 F#5:12 E5:12 F#5:6 G5:2 A5:4 E5:12 F#5:4 G5:4 A5:4 A5:8 G5:4 E5:12 D5:12"],
  },
  {
    id: 'huron', key: 'Am', cat: 'World Carols', title: "The Huron Carol (Jesous Ahatonhia)", credit: "French folk tune 'Une jeune pucelle'; words Jean de Brébeuf, c. 1642", bpm: 58, meter: [2, 4], pickup: 2, accomp: 'broken',
    voices: ["E4:2 A4:2 B4:2 C5:2 D5:2 C5:2 B4:2 A4:2 G4:2 A4:2 A4:2 B4:2 G4:2 A4:4 E4:2 E4:2 A4:2 B4:2 C5:2 D5:2 C5:2 B4:2 A4:2 G4:2 A4:2 A4:2 B4:2 G4:2 A4:6 A4:2 E5:2 E5:2 B4:2 C5:2 D5:2 C5:2 B4:2 B4:2 C5:2 B4:2 A4:2 A4:2 B4:2 A4:2 G4:2 E4:2 E4:2 A4:2 A4:4 G4:2 F4:2 E4:4 A4:4 G4:2 E4:2 A4:2 A4:1 B4:1 C5:2 D5:2 E5:4 E4:4 A4:6"],
  },

  // --------------------------------------------------------------- Hanukkah
  {
    id: 'maoz', cat: 'Hanukkah', title: "Ma'oz Tzur (Rock of Ages)", credit: "Traditional Ashkenazi melody, from a 15th-century German folk song (the tune Luther used for \"Nun freut euch\")", bpm: 90, meter: [4, 4], pickup: 8, accomp: 'broken',
    voices: ["D5:4 A4:4 D5:4 G5:4 F#5:4 E5:4 D5:8 A5:4 B5:4 E5:4 F#5:2 G5:2 F#5:4 E5:4 D5:8 D5:4 A4:4 D5:4 G5:4 F#5:4 E5:4 D5:8 A5:4 B5:4 E5:4 F#5:2 G5:2 F#5:4 E5:4 D5:8 A5:6 A5:2 B5:4 C#6:4 D6:8 A5:8 D6:4 C#6:4 B5:4 A5:4 A5:2 G5:2 F#5:2 G5:2 E5:8 F#5:6 G5:2 A5:8 E5:6 F#5:2 G5:6 G5:2 F#5:4 C#5:4 D5:4 G5:4 F#5:4 G5:4 A5:8 F#5:6 G5:2 A5:8 E5:6 F#5:2 G5:6 G5:2 F#5:4 C#5:4 D5:4 G5:4 F#5:4 E5:4 D5:8"],
  },
  {
    id: 'ohchanukah', key: 'Em', cat: 'Hanukkah', title: "Oh Chanukah (Oy Khanike)", credit: "Yiddish folk song, words M. Rivesman (pub. 1912)", bpm: 113, meter: [4, 4], pickup: 2, accomp: 'broken',
    voices: ["E4:2 B4:2 B4:2 B4:2 B4:2 E5:2 E5:2 B4:2 B4:2 B4:4 A4:2 G4:2 A4:4 G4:4 B4:4 B4:2 B4:2 E5:4 B4:2 B4:2 B4:4 A4:2 G4:2 A4:4 G4:4 G4:2 A4:2 B4:2 A4:2 G4:4 G4:2 G4:2 A4:4 G4:2 F#4:2 G4:8 G4:2 A4:2 B4:2 A4:2 G4:4 G4:2 G4:2 A4:4 G4:2 F#4:2 E4:4 E4:4 B4:4 B4:8 E4:4 B4:4 B4:8 E4:4 B4:4 B4:2 B4:2 C5:4 B4:2 A4:2 B4:16 B4:4 B4:2 B4:2 C5:4 B4:2 A4:2 B4:4 B4:2 B4:2 C5:4 B4:2 A4:2 G4:4 G4:2 G4:2 A4:4 G4:2 A4:2 B4:16 B4:4 B4:2 B4:2 C5:4 B4:2 A4:2 B4:4 B4:2 B4:2 C5:4 B4:2 A4:2 G4:4 G4:2 G4:2 A4:4 G4:2 F#4:2 E4:12"],
  },
  {
    id: 'dreidel', key: 'C', cat: 'Hanukkah', title: "I Have a Little Dreidel", credit: "Samuel E. Goldfarb, 1927 (Yiddish: Mikhl Gelbart)", bpm: 94, meter: [4, 4], pickup: 2, accomp: 'broken',
    voices: ["G4:2 C5:2 C5:2 D5:2 D5:2 E5:2 C5:4 E5:2 G5:2 G5:2 F5:2 E5:2 D5:6 G4:2 D5:2 D5:2 E5:2 E5:2 F5:2 D5:4 D5:2 G5:2 F5:2 E5:2 D5:2 C5:4 G5:4 G5:2 E5:2 G5:2 E5:2 G5:2 E5:4 E5:2 G5:2 G5:2 F5:2 E5:2 D5:6 D5:2 F5:2 D5:2 F5:2 D5:2 F5:2 D5:4 D5:2 G5:2 F5:2 E5:2 D5:2 C5:6 G4:2 C5:2 C5:2 D5:2 D5:2 E5:2 C5:4 E5:2 G5:2 G5:2 F5:2 E5:2 D5:6 G4:2 D5:2 D5:2 E5:2 E5:2 F5:2 D5:4 D5:2 G5:2 F5:2 E5:2 D5:2 C5:4 G5:4 G5:2 E5:2 G5:2 E5:2 G5:2 E5:4 E5:2 G5:2 G5:2 F5:2 E5:2 D5:6 D5:2 F5:2 D5:2 F5:2 D5:2 F5:2 D5:4 D5:2 G5:2 G5:2 A5:2 B5:2 C6:6"],
  },
  {
    id: 'sevivon', key: 'Dm', cat: 'Hanukkah', title: "S'vivon, Sov Sov Sov", credit: "Hebrew folk melody, words Levin Kipnis", bpm: 76, meter: [2, 4], pickup: 4, accomp: 'broken',
    voices: ["D5:2 D5:2 E5:4 F5:2 F5:2 E5:4 A5:2 A5:2 G5:1 F5:1 E5:1 D5:1 F5:2 F5:2 E5:4 D5:2 D5:2 E5:4 F5:2 F5:2 G5:4 A5:2 A5:2 A5:2 A4:2 D5:2 D5:2 D5:4 G5:2 G5:2 G5:2 Bb5:2 A5:2 A5:2 F5:1 E5:1 D5:2 C#5:2 C#5:2 A4:2 C#5:2 D5:3 E5:1 F5:1 E5:1 D5:2 G5:2 G5:2 G5:2 Bb5:2 A5:4 F5:1 E5:1 D5:2 C#5:2 C#5:2 A4:2 C#5:2 D5:2 D5:2 D5:4"],
  },
  {
    id: 'hanerot', key: 'D', cat: 'Hanukkah', title: "Hanerot Halalu (These Candles)", credit: "Traditional; sung after kindling the lights", bpm: 90, meter: [4, 4], pickup: 2, accomp: 'broken',
    voices: ["A4:2 F#5:4 F#5:3 F#5:1 F#5:4 F#5:3 F#5:1 F#5:2 E5:2 D5:2 E5:2 F#5:4 D5:3 D5:1 A5:4 A5:3 A5:1 A5:4 A5:3 A5:1 A5:2 G5:2 F#5:2 G5:2 A5:4 F#5:4 A5:2 D6:2 F#5:2 G5:2 A5:6 A5:2 A5:2 D6:2 F#5:2 G5:2 A5:6 A5:2 B5:2 A5:2 G5:2 F#5:2 E5:4 A5:4 F#5:2 F#5:2 E5:2 E5:2 D5:6 A4:2 F#5:4 F#5:4 F#5:4 F#5:4 F#5:2 E5:2 D5:2 E5:2 F#5:4 D5:4 A5:4 A5:4 A5:4 A5:4 A5:2 G5:2 F#5:2 G5:2 A5:4 F#5:4 A5:2 D6:2 F#5:2 G5:2 A5:8 A5:2 D6:2 F#5:2 G5:2 A5:8 B5:2 A5:2 G5:2 F#5:2 E5:4 A5:4 F#5:8 E5:8 D5:12"],
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

export const CATEGORIES = ['Classics', 'Christmas', 'World Carols', 'Hanukkah', 'Swiss', 'Ambient', 'My tunes'];
