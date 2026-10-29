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
    id: 'brahms', key: 'C', cat: 'Classical', title: 'Lullaby (Wiegenlied)', credit: 'Johannes Brahms, 1868', bpm: 84, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ['E5:2 E5:2 | G5:6 E5:2 E5:4 | G5:8 E5:2 G5:2 | C6:4 B5:6 A5:2 | A5:4 G5:4 D5:2 E5:2 | F5:4 D5:4 D5:2 E5:2 | F5:8 D5:2 F5:2 | B5:2 A5:2 G5:4 B5:4 | C6:8 C5:2 C5:2 | C6:8 A5:2 F5:2 | G5:8 E5:2 C5:2 | F5:4 G5:4 A5:4 | G5:8 C5:2 C5:2 | C6:8 A5:2 F5:2 | G5:8 E5:2 C5:2 | F5:4 E5:4 D5:4 | C5:8'],
  },
  {
    id: 'ode', key: 'C', cat: 'Classical', title: 'Ode to Joy', credit: 'Ludwig van Beethoven, 1824', bpm: 112, meter: [4, 4], accomp: 'broken',
    voices: ['E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | E5:6 D5:2 D5:8 | E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:6 C5:2 C5:8 | D5:4 D5 E5 C5 | D5:4 E5:2 F5:2 E5:4 C5:4 | D5:4 E5:2 F5:2 E5:4 D5:4 | C5:4 D5:4 G4:8 | E5:4 E5 F5 G5 | G5 F5 E5 D5 | C5 C5 D5 E5 | D5:6 C5:2 C5:8'],
  },
  {
    id: 'elise', cat: 'Classical', title: 'Für Elise (opening)', credit: 'Ludwig van Beethoven, 1810', bpm: 62, meter: [3, 8], accomp: 'none',
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
    id: 'canon', cat: 'Classical', title: 'Canon in D (excerpt)', credit: 'Johann Pachelbel, c. 1680', bpm: 84, meter: [4, 4], accomp: 'none',
    voices: [
      'F#5:8 E5:8 | D5:8 C#5:8 | B4:8 A4:8 | B4:8 C#5:8 | D5:8 C#5:8 | B4:8 A4:8 | G4:8 F#4:8 | G4:8 E4:8 | D5:4 F#5:4 A5:4 G5:4 | F#5:4 D5:4 F#5:4 E5:4 | D5:4 B4:4 D5:4 A5:4 | G5:4 B5:4 A5:4 G5:4 | F#5:4 D5:4 E5:4 C#6:4 | D6:4 F#6:4 A6:4 A5:4 | B5:4 G5:4 A5:4 F#5:4 | D5:4 D6:4 D6:6 C#6:2',
      rep('D3:8 A2:8 | B2:8 F#2:8 | G2:8 D2:8 | G2:8 A2:8 |', 4),
    ],
  },

  // ------------------------------------------------- Classics: folk songs
  // melodies transcribed from public-domain flutetunes.com scores (melody line only; the music box harmonises)
  {
    id: 'scarborough', key: 'Em', cat: 'Classics', title: "Scarborough Fair", credit: "English traditional", bpm: 119, meter: [3, 4], accomp: 'broken',
    voices: ["E4:8 E4:4 B4:8 B4:4 F#4:6 G4:2 F#4:4 E4:16 B4:4 D5:4 E5:8 D5:4 B4:4 C#5:4 A4:4 B4:20 E5:4 E5:8 E5:4 D5:8 B4:4 B4:4 A4:4 G4:4 F#4:4 D4:20 E4:8 B4:4 A4:8 G4:4 F#4:4 E4:4 D4:4 E4:24"],
  },
  {
    id: 'dannyboy', cat: 'Classics', title: "Danny Boy (Londonderry Air)", credit: "Irish traditional", bpm: 65, meter: [4, 4], pickup: 6, accomp: 'broken',
    voices: ["E4:2 F4:2 G4:2 A4:6 G4:2 A4:2 D5:2 C5:2 A4:2 G4:2 F4:2 D4:6 F4:2 A4:2 Bb4:2 C5:6 D5:2 C5:2 A4:2 F4:2 A4:2 G4:10 E4:2 F4:2 G4:2 A4:6 G4:2 A4:2 D5:2 C5:2 A4:2 G4:2 F4:2 D4:6 E4:2 F4:2 G4:2 A4:6 Bb4:2 A4:2 G4:2 F4:2 G4:2 F4:10 C5:2 D5:2 E5:2 F5:6 E5:2 E5:2 D5:2 C5:2 D5:2 C5:2 A4:2 F4:6 C5:2 D5:2 E5:2 F5:6 E5:2 E5:2 D5:2 C5:2 A4:2 G4:10 C5:2 C5:2 C5:2 A5:6 G5:2 G5:2 F5:2 D5:2 F5:2 C5:2 A4:2 F4:6 E4:2 F4:2 G4:2 A4:2 D5:2 C5:2 A4:2 G4:2 F4:2 D4:2 E4:2 F4:10 E5:2 F5:2 G5:2 A5:6 G5:2 A5:2 D6:2 C6:2 A5:2 G5:2 F5:2 D5:6 F5:2 A5:2 Bb5:2 C6:6 D6:2 C6:2 A5:2 F5:2 A5:2 G5:10 E5:2 F5:2 G5:2 A5:6 G5:2 A5:2 D6:2 C6:2 A5:2 G5:2 F5:2 D5:6 E5:2 F5:2 G5:2 A5:6 Bb5:2 A5:2 G5:2 F5:2 G5:2 F5:10 C6:2 D6:2 E6:2 F6:6 E6:2 E6:2 D6:2 C6:2 D6:2 C6:2 A5:2 F5:6 C6:2 D6:2 E6:2 F6:6 E6:2 E6:2 D6:2 C6:2 A5:2 G5:10 C6:2 C6:2 C6:2 A6:6 G6:2 G6:2 F6:2 D6:2 F6:2 C6:2 A5:2 F5:6 E5:2 F5:2 G5:2 A5:2 D6:2 C6:2 A5:2 G5:2 F5:2 D6:2 E6:2 F6:16"],
  },
  {
    id: 'shenandoah', key: 'D', cat: 'Classics', title: "Shenandoah", credit: "American folk song, 19th century", bpm: 68, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["A4:4 D5:2 D5:2 D5:6 E5:2 F#5:2 G5:2 B5:2 A5:10 D6:2 C#6:2 B5:10 A5:2 B5:2 A5:2 F#5:2 A5:10 A5:4 B5:2 B5:2 B5:6 F#5:2 A5:2 F#5:2 E5:2 D5:10 E5:4 F#5:10 D5:2 F#5:2 B5:2 A5:12 D5:2 E5:2 F#5:10 D5:2 E5:4 D5:12"],
  },
  {
    id: 'amazing', key: 'C', cat: 'Classics', title: "Amazing Grace (New Britain)", credit: "American folk hymn tune, 1829", bpm: 90, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 C5:8 A4:4 G4:8 G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 G5:8 E5:4 G5:6 E5:2 G5:2 E5:2 C5:8 G4:4 A4:6 C5:2 C5:2 A4:2 G4:8 G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 C5:8 G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 C5:8 A4:4 G4:8 G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 G5:8 E5:4 G5:6 E5:2 G5:2 E5:2 C5:8 G4:4 A4:6 C5:2 C5:2 A4:2 G4:8 G4:4 C5:8 E5:2 C5:2 E5:8 D5:4 C5:8"],
  },
  {
    id: 'auldlang', key: 'G', cat: 'Classics', title: "Auld Lang Syne", credit: "Scottish traditional", bpm: 86, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["D4:4 G4:6 G4:2 G4:4 B4:4 A4:6 G4:2 A4:4 B4:4 G4:6 G4:2 B4:4 D5:4 E5:12 E5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 B4:4 G4:6 E4:2 E4:4 D4:4 G4:12 E5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 E5:4 D5:6 B4:2 B4:4 D5:4 E5:12 G5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 B4:2 A4:2 G4:6 E4:2 E4:4 D4:4 G4:12 D4:4 G4:6 G4:2 G4:4 B4:4 A4:6 G4:2 A4:4 B4:4 G4:6 G4:2 B4:4 D5:4 E5:12 E5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 B4:4 G4:6 E4:2 E4:4 D4:4 G4:12 E5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 E5:4 D5:6 B4:2 B4:4 D5:4 E5:12 G5:4 D5:6 B4:2 B4:4 G4:4 A4:6 G4:2 A4:4 B4:2 A4:2 G4:6 E4:2 E4:4 D4:4 G4:12"],
  },
  {
    id: 'redriver', key: 'D', cat: 'Classics', title: "Red River Valley", credit: "North American folk song", bpm: 65, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["A4:2 D5:2 F#5:4 F#5:2 F#5:2 F#5:4 E5:2 F#5:2 E5:2 D5:10 A4:2 D5:2 F#5:4 D5:2 F#5:2 A5:4 G5:2 F#5:2 E5:12 A5:2 G5:2 F#5:4 F#5:2 E5:2 D5:4 E5:2 F#5:2 A5:2 G5:10 B4:2 A#4:2 A4:4 C#5:2 D5:2 E5:4 F#5:2 E5:2 D5:12"],
  },
  {
    id: 'susanna', key: 'G', cat: 'Classics', title: "Oh! Susanna", credit: "Stephen Foster, 1848", bpm: 90, meter: [2, 4], pickup: 2, accomp: 'broken',
    voices: ["G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:3 E5:1 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 A4:2 G4:6 G4:1 A4:1 B4:2 D5:2 D5:3 E5:1 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:3 A4:1 B4:1 B4:3 A4:3 A4:1 G4:8 C5:4 C5:4 E5:2 E5:4 E5:2 D5:2 D5:2 B4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:2 A4:2 B4:2 B4:2 A4:2 A4:2 G4:70 G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:3 E5:1 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 A4:2 G4:6 G4:1 A4:1 B4:2 D5:2 D5:3 E5:1 D5:2 B4:2 G4:3 A4:1 B4:2 B4:2 A4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:3 A4:1 B4:1 B4:3 A4:3 A4:1 G4:8 C5:4 C5:4 E5:2 E5:4 E5:2 D5:2 D5:2 B4:2 G4:2 A4:6 G4:1 A4:1 B4:2 D5:2 D5:2 E5:2 D5:2 B4:2 G4:2 A4:2 B4:2 B4:2 A4:2 A4:2 G4:4"],
  },
  {
    id: 'skye', key: 'G', cat: 'Classics', title: "The Skye Boat Song", credit: "Scottish air", bpm: 57, meter: [6, 8], accomp: 'broken',
    voices: ["D5:3 E5:1 D5:2 G5:4 G5:2 A5:3 B5:1 A5:2 D6:6 B5:3 A5:1 B5:2 E5:4 E5:2 D5:12 D5:3 E5:1 D5:2 G5:4 G5:2 A5:3 B5:1 A5:2 D6:6 B5:3 A5:1 B5:2 E5:4 E5:2 D5:12 B5:3 G5:1 B5:2 B5:6 A5:3 E5:1 A5:2 A5:6 G5:3 E5:1 G5:2 G5:4 G5:2 E5:12 B5:3 G5:1 B5:2 B5:6 A5:3 E5:1 A5:2 A5:6 G5:3 E5:1 G5:2 G5:4 G5:2 E5:12 D5:3 E5:1 D5:2 G5:4 G5:2 A5:3 B5:1 A5:2 D6:6 B5:3 A5:1 B5:2 E5:4 E5:2 D5:12 D5:3 E5:1 D5:2 G5:4 G5:2 A5:3 B5:1 A5:2 D6:6 B5:3 A5:1 B5:2 E5:4 E5:2 G5:12"],
  },
  {
    id: 'waterwide', key: 'G', cat: 'Classics', title: "The Water Is Wide", credit: "English and Scottish traditional", bpm: 65, meter: [4, 4], pickup: 6, accomp: 'broken',
    voices: ["B4:2 A4:1.333 G4:1.333 A4:1.333 B4:10 A4:2 G4:2 E4:2 D4:12 G4:2 F#4:2 G4:10 A4:2 B4:2 C5:1 B4:1 A4:10 A4:2 B4:2 C5:2 D5:10 C5:1 B4:1 A4:1 G4:3 B4:10 A4:2 G4:2 E4:2 D4:10 D4:2 E4:1.333 G4:1.333 A4:1.333 G4:10 B4:2 A4:1.333 G4:1.333 A4:1.333 B4:10 A4:2 G4:2 E4:2 D4:12 G4:2 F#4:2 G4:10 A4:2 B4:2 C5:1 B4:1 A4:10 A4:2 B4:2 C5:2 D5:10 C5:1 B4:1 A4:1 G4:3 B4:10 A4:2 G4:2 E4:2 D4:10 D4:2 E4:1.333 G4:1.333 A4:1.333 G4:10"],
  },
  {
    id: 'sally', key: 'G', cat: 'Classics', title: "Down by the Sally Gardens", credit: "Irish air ('The Maids of Mourne Shore')", bpm: 86, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["G4:2 A4:2 B4:4 A4:2 G4:2 A4:4 B4:2 D5:2 E5:8 D5:4 G5:2 D5:2 E5:4 D5:2 B4:2 A4:6 G4:2 E4:8 D4:4 G4:2 A4:2 B4:4 A4:2 G4:2 A4:2 G4:2 A4:2 B4:2 D5:8 E5:4 G5:2 D5:2 E5:4 D5:2 B4:2 A4:6 G4:2 G4:12 D5:4 G5:4 F#5:2 D5:2 E5:4 F#5:2 G5:2 F#5:6 E5:2 D5:4 B4:2 D5:2 E5:4 D5:2 B4:2 D5:2 E5:2 G5:2 A5:2 G5:12 G4:2 A4:2 B4:4 A4:2 G4:2 A4:4 B4:2 D5:2 E5:8 D5:4 G5:2 D5:2 E5:4 D5:2 B4:2 A4:6 G4:2 G4:12"],
  },
  {
    id: 'lochlomond', key: 'D', cat: 'Classics', title: "Loch Lomond", credit: "Scottish traditional", bpm: 72, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["A4:2 B4:2 D5:4 D5:2 E5:2 F#5:4 E5:2 D5:2 E5:4 E5:2 D5:2 B4:4 A4:2 A4:2 D5:4 D5:4 D5:4 F#5:2 A5:2 B5:8 A5:4 A5:4 B5:4 B5:2 A5:2 F#5:4 F#5:2 A5:2 G5:2 F#5:2 E5:2 D5:2 B4:4 A4:2 B4:2 D5:2 D5:2 F#5:2 A5:2 B5:4 A5:2 F#5:2 E5:8 D5:4 A4:4 D5:4 D5:3 E5:1 F#5:4 F#5:2 E5:2 D5:4 D5:3 B4:1 A4:4 A4:2 A4:2 D5:4 D5:2 D5:2 D5:4 F#5:2 A5:2 B5:8 A5:4 A5:4 B5:4 B5:2 A5:2 F#5:4 F#5:2 A5:2 G5:2 F#5:2 E5:2 D5:2 B4:4 A4:2 B4:2 D5:2 D5:2 F#5:2 A5:2 B5:4 A5:2 F#5:2 E5:8 D5:4"],
  },
  {
    id: 'molly', key: 'G', cat: 'Classics', title: "Molly Malone", credit: "James Yorkston, 1883", bpm: 101, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["D4:4 G4:4 G4:6 G4:2 G4:2 B4:6 G4:4 A4:4 A4:6 A4:2 A4:2 C5:6 A4:4 B4:4 A4:4 G4:4 D5:4 C5:4 B4:4 B4:2 A4:6 G4:4 A4:8 D4:2 D4:2 G4:4 G4:6 G4:2 G4:2 B4:6 G4:4 A4:4 A4:6 A4:2 A4:2 C5:6 A4:2 A4:2 B4:2 D5:6 C5:4 B4:2 D5:6 C5:4 B4:6 G4:2 A4:4 G4:8 D4:4 G4:6 G4:2 G4:4 G4:2 B4:6 G4:4 A4:6 A4:2 A4:4 A4:2 C5:6 A4:2 A4:2 B4:2 D5:6 C5:4 B4:2 D5:6 C5:4 B4:6 G4:2 A4:4 G4:8"],
  },
  {
    id: 'auralee', key: 'G', cat: 'Classics', title: "Aura Lee", credit: "George R. Poulton, 1861", bpm: 79, meter: [4, 4], accomp: 'broken',
    voices: ["D4:4 G4:4 F#4:4 G4:4 A4:4 E4:4 A4:8 G4:4 F#4:4 E4:4 F#4:4 G4:16 D4:4 G4:4 F#4:4 G4:4 A4:4 E4:4 A4:8 G4:4 F#4:4 E4:4 F#4:4 G4:16 B4:6 B4:2 B4:8 B4:6 B4:2 B4:8 B4:4 A4:4 G4:4 A4:4 B4:16 B4:4 B4:4 C5:4 B4:4 A4:4 E4:4 A4:6 G4:2 G4:4 F#4:4 B4:6 A4:2 G4:16"],
  },
  {
    id: 'arirang', key: 'G', cat: 'Classics', title: "Arirang", credit: "Korean traditional", bpm: 72, meter: [3, 4], accomp: 'broken',
    voices: ["D5:6 E5:2 D5:2 E5:2 G5:6 A5:2 G5:2 A5:2 B5:4 A5:2 B5:2 G5:2 E5:2 D5:6 E5:2 D5:2 E5:2 G5:6 A5:2 G5:2 A5:2 B5:6 A5:2 D5:2 E5:2 G5:6 A5:2 G5:4 G5:12 D6:8 D6:4 D6:4 B5:4 A5:4 D6:4 B5:2 A5:2 G5:2 E5:2 D5:12 G5:6 G5:2 G5:2 A5:2 B5:6 A5:2 D5:2 E5:2 G5:6 A5:2 G5:4 G5:8"],
  },
  {
    id: 'range', key: 'G', cat: 'Classics', title: "Home on the Range", credit: "Daniel E. Kelley, 1872", bpm: 108, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["D4:4 D4:4 G4:4 A4:4 B4:8 G4:2 F#4:2 E4:4 C5:4 C5:4 C5:8 C5:2 C5:2 D5:8 G4:2 G4:2 G4:4 F#4:4 G4:4 A4:20 D4:4 D4:4 G4:4 A4:4 B4:8 G4:2 F#4:2 E4:4 C5:4 C5:4 C5:8 C5:2 C5:2 B4:6 A4:2 G4:4 F#4:4 G4:4 A4:4 G4:24 D5:12 C5:4 B4:6 A4:2 B4:20 A4:2 A4:2 G4:4 G4:4 G4:4 G4:4 F#4:4 G4:4 A4:20 D4:4 D4:4 G4:4 A4:4 B4:8 G4:2 F#4:2 E4:4 C5:4 C5:4 C5:8 C5:2 C5:2 B4:6 A4:2 G4:4 F#4:4 G4:4 A4:4 G4:20"],
  },
  {
    id: 'dreamer', key: 'Eb', cat: 'Classics', title: "Beautiful Dreamer", credit: "Stephen Foster, 1864", bpm: 70, meter: [9, 8], pickup: 17.667, accomp: 'broken',
    voices: ["Eb5:2 D5:2 Eb5:2 Bb4:6 G4:6 F4:2 E4:2 F4:2 C5:12 Bb4:2 D5:2 C5:2 C5:2 Bb4:2 Ab4:2 Ab4:2 G4:2 F4:2 G4:18 Eb5:2 D5:2 Eb5:2 Bb4:6 G4:6 F4:2 E4:2 F4:2 C5:12 Bb4:2 D5:2 C5:2 C5:2 Bb4:2 Ab4:2 Ab4:2 G4:2 F4:2 Eb4:18 Bb4:2 Ab4:2 F4:2 D4:6 C5:6 C5:2 Bb4:2 G4:2 Eb4:12 Eb5:2 D5:2 Eb5:2 C5:6 F5:4 Eb5:2 D5:2 Eb5:2 C5:2 Bb4:12 Eb5:2 D5:2 Eb5:2 Bb4:6 G4:6 F4:2 E4:2 F4:2 C5:12 Bb4:2 D5:2 C5:2 C5:2 Bb4:2 Ab4:2 Ab4:2 G4:2 F4:2 G4:18 C5:2 D5:2 Eb5:2 Eb5:2 Bb4:2 G4:1.667 Bb4:0.333 Ab4:2 G4:2 F4:2 Eb4:18"],
  },
  {
    id: 'partingglass', key: 'G', cat: 'Classics', title: "The Parting Glass", credit: "Irish and Scottish traditional", bpm: 101, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["B4:2 A4:2 G4:4 E4:4 E4:4 D4:2 E4:2 G4:4 G4:4 A4:4 G4:2 A4:2 B4:4 B4:4 B4:2 A4:2 G4:2 A4:2 B4:4 D4:4 D4:4 B4:2 A4:2 G4:4 E4:4 E4:4 D4:2 E4:2 G4:4 G4:4 A4:4 G4:2 A4:2 B4:4 E5:4 D5:2 B4:2 A4:2 B4:2 G4:4 E4:4 E4:6 B4:2 D5:2 B4:2 D5:2 E5:2 D5:6 B4:2 D5:2 B4:2 D5:2 E5:2 D5:6 B4:2 C5:4 B4:4 A4:4 G4:2 A4:2 B4:4 D4:4 D4:4 B4:2 A4:2 G4:4 E4:4 E4:4 D4:2 E4:2 G4:4 G4:4 A4:4 G4:2 A4:2 B4:4 E5:4 D5:2 B4:2 A4:2 B4:2 G4:4 E4:4 E4:4"],
  },
  {
    id: 'wayfaring', key: 'Dm', cat: 'Classics', title: "Wayfaring Stranger", credit: "American folk hymn", bpm: 83, meter: [4, 4], pickup: 6, accomp: 'broken',
    voices: ["D5:2 D5:2 A5:2 A5:10 G5:2 A5:2 G5:2 F5:2 D5:8 D5:2 D5:2 A5:2 G5:10 D5:2 F5:2 G5:2 A5:10 D5:2 D5:2 A5:2 A5:10 G5:2 A5:2 G5:2 F5:2 D5:8 D5:2 D5:2 A5:2 G5:10 F5:2 D5:2 C5:2 D5:10 A5:2 A5:2 C6:2 D6:10 C6:2 D6:2 C6:2 Bb5:2 A5:8 A5:2 A5:2 C6:2 D6:10 C6:2 D6:2 C6:2 A5:10 A5:2 Bb5:2 C6:2 A5:10 F5:2 G5:2 A5:2 F5:2 D5:8 D5:2 D5:2 A5:2 G5:10 F5:2 E5:2 C5:2 D5:10"],
  },
  {
    id: 'kalinka', key: 'Am', cat: 'Classics', title: "Kalinka", credit: "Ivan Larionov, 1860", bpm: 119, meter: [2, 2], pickup: 8, accomp: 'broken',
    voices: ["E5:8 D5:8 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:4 E5:4 D5:4 D5:4 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:8 D5:8 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:4 E5:4 D5:4 D5:4 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:16 E5:8 G5:8 F5:8 E5:4 D5:4 C5:16 G4:16 E5:8 G5:8 F5:8 E5:4 D5:4 C5:16 G4:16 A4:8 A4:4 B4:4 D5:4 C5:4 B4:4 A4:4 G4:8 F4:8 E4:8 E5:8 E5:8 G5:8 F5:8 E5:4 D5:4 C5:16 G4:16 E5:8 G5:8 F5:8 E5:4 D5:4 C5:16 G4:16 A4:8 A4:4 B4:4 D5:4 C5:4 B4:4 A4:4 G5:8 F5:8 E5:8 E5:8 D5:8 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:4 E5:4 D5:4 D5:4 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:8 D5:8 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4 A4:8 E5:4 E5:4 D5:4 D5:4 B4:4 C5:4 D5:8 B4:4 C5:4 D5:8 C5:4 B4:4"],
  },
  {
    id: 'avignon', key: 'C', cat: 'Classics', title: "Sur le pont d'Avignon", credit: "French traditional", bpm: 86, meter: [2, 4], pickup: 4, accomp: 'broken',
    voices: ["C5:2 C5:2 C5:4 D5:2 D5:2 D5:4 E5:2 F5:2 G5:2 C5:2 B4:2 C5:2 D5:2 G4:2 C5:2 C5:2 C5:4 D5:2 D5:2 D5:4 E5:2 F5:2 G5:2 C5:2 D5:2 B4:2 C5:4 C5:2 C5:1 C5:1 C5:2 C5:2 D5:4 C5:4 C5:3 C5:1 C5:2 C5:2 D5:2 D5:2 C5:4 C5:2 C5:2 C5:4 D5:2 D5:2 D5:4 E5:2 F5:2 G5:2 C5:2 B4:2 C5:2 D5:2 G4:2 C5:2 C5:2 C5:4 D5:2 D5:2 D5:4 E5:2 F5:2 G5:2 C5:2 D5:2 B4:2 C5:4"],
  },
  {
    id: 'sakura', cat: 'None', title: "Sakura, Sakura", credit: "Japanese traditional", bpm: 61, meter: [4, 4], accomp: 'broken',
    voices: ["B5:4 B5:4 C#6:8 B5:4 B5:4 C#6:8 B5:4 C#6:4 D6:4 C#6:4 B5:4 C#6:2 B5:2 G5:8 F#5:4 D5:4 F#5:4 G5:4 F#5:4 F#5:2 D5:2 C#5:8 B5:4 C#6:4 D6:4 C#6:4 B5:4 C#6:2 B5:2 G5:8 F#5:4 D5:4 F#5:4 G5:4 F#5:4 F#5:2 D5:2 C#5:8 B5:4 B5:4 C#6:8 B5:4 B5:4 C#6:8 F#5:2 F#5:2 G5:2 G5:2 C#6:2 B5:2 G5:4 F#5:16 B5:4 B5:4 C#6:8 B5:4 B5:4 C#6:8 B5:4 C#6:4 D6:4 C#6:4 B5:4 C#6:2 B5:2 G5:8 F#5:4 D5:4 F#5:4 G5:4 F#5:4 F#5:2 D5:2 C#5:8 B5:4 C#6:4 D6:4 C#6:4 B5:4 C#6:2 B5:2 G5:8 F#5:4 D5:4 F#5:4 G5:4 F#5:4 F#5:2 D5:2 C#5:8 B5:4 B5:4 C#6:8 B5:4 B5:4 C#6:8 F#5:2 F#5:2 G5:2 G5:2 C#6:2 B5:2 G5:4 F#5:16"],
  },

  // ------------------------------------------------------------ Classical
  {
    id: 'sugarplum', key: 'Em', cat: 'Classical', title: "Dance of the Sugar Plum Fairy", credit: "Pyotr Ilyich Tchaikovsky, The Nutcracker, 1892", bpm: 54, meter: [2, 4], pickup: 6, accomp: 'broken',
    voices: ["G6:1 E6:1 G6:2 F#6:2 D#6:2 E6:2 D6:1 D6:1 D6:2 C#6:1 C#6:1 C#6:2 C6:1 C6:1 C6:2 B5:1 E6:1 C6:1 E6:1 B5:6 G5:1 E5:1 G5:2 F#5:2 C6:2 B5:2 G6:1 G6:1 G6:2 F#6:1 F#6:1 F#6:2 E6:1 E6:1 E6:2 D#6:1 F#6:1 E6:1 F#6:1 D#6:6 G6:1 E6:1 G6:2 F#6:2 D#6:2 E6:2 D6:1 D6:1 D6:2 C#6:1 C#6:1 C#6:2 C6:1 C6:1 C6:2 B5:1 E6:1 C6:1 E6:1 B5:6 E6:1 C#6:1 E6:2 D#6:4 D6:1 B5:1 D6:2 C#6:4 C6:1 A5:1 C6:2 B5:4 B5:0.667 D#6:0.333 F#6:0.333 B6:0.667 E6:5 C#6:2 D#6:2 E6:2 F#6:2 G6:2 E6:2 D#6:20 C#6:2 D#6:2 E6:2 F#6:2 G6:2 E6:2 D#6:20 C#6:2 D#6:2 E6:4 D#6:2 E6:2 F#6:4 E6:2 F#6:2 G6:2 G6:1 A6:1 A6:2 A6:1 B6:2 D4:0.333 F#4:0.333 C5:0.333 D5:0.333 A5:0.333 C6:0.333 D#4:0.333 F#4:0.333 B4:0.333 D#5:0.333 A5:0.333 B5:0.333 D4:0.333 F#4:0.333 C5:0.333 D5:0.333 A5:0.333 C6:0.333 D#4:0.333 F#4:0.333 B4:0.333 D#5:0.333 A5:0.333 B5:0.333 F4:0.333 A4:0.333 E5:0.333 F5:0.333 C6:0.333 E6:0.333 F#4:0.333 A4:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 F4:0.333 A4:0.333 E5:0.333 F5:0.333 C6:0.333 E6:0.333 F#4:0.333 A4:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 A4:0.333 C5:0.333 G5:0.333 A5:0.333 D#6:0.333 G6:0.333 B4:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 F#6:0.333 A4:0.333 C5:0.333 G5:0.333 A5:0.333 D#6:0.333 G6:0.333 B4:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 F#6:0.333 D5:0.333 F#5:0.333 C6:0.333 D6:0.333 A6:0.333 C7:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 A6:0.333 B6:0.333 D5:0.333 F#5:0.333 C6:0.333 D6:0.333 A6:0.333 C7:0.333 D#5:0.333 F#5:0.333 B5:0.333 D#6:0.333 A6:0.333 B6:4.333 G6:1 E6:1 G6:2 F#6:2"],
  },
  {
    id: 'flowers', key: 'D', cat: 'Classical', title: "Waltz of the Flowers", credit: "Tchaikovsky, The Nutcracker, 1892", bpm: 162, meter: [3, 4], accomp: 'broken',
    voices: ["A4:4 D5:4 F#5:4 G5:11 F#5:1 F#5:24 A4:4 D5:4 F#5:4 G5:4 F#5:7 E5:1 A5:8 D5:8 A4:2 B4:2 C#5:2 D5:2 D#5:2 F#5:2 D#5:2 F#5:2 E5:8 C5:2 D5:2 D#5:2 E5:2 F#5:2 A5:2 F#5:2 A5:2 G5:8 E5:2 F#5:2 G5:2 A5:2 A#5:2 C#6:2 B5:2 A#5:2 B5:2 C#6:2 E6:2 D6:2 C#6:2 D6:2 B5:2 G5:2 F#5:8 E5:6 D#5:2 D5:2 C#5:2 B4:2 A#4:2 A4:4 D5:4 F#5:4 G5:11 F#5:1 F#5:24 A4:4 D5:4 F#5:4 G5:4 F#5:7 E5:1 A5:8 D5:8 D4:2 E4:2 F#4:2 G#4:2 A4:2 B4:2 G#4:2 B4:2 A4:8 F#4:2 G#4:2 A4:2 B4:2 C#5:2 D5:2 C5:2 D5:2 C#5:8 C5:2 C#5:2 D#5:2 F5:2 F#5:2 G#5:2 A5:2 F5:2 G#5:2 F#5:2 A5:2 F5:2 G#5:2 F#5:2 A5:2 F#5:2 A5:2 F#5:2 A5:2 F#5:2 A5:2 F5:2 F#5:2 A4:2 B4:2 C#5:2 D5:2 E5:2 F#5:8 C#5:4 E5:8 B4:4 D5:8 G4:4 C#6:0.667 D6:1 C#6:0.667 D6:1 C#6:0.667 C6:4 C#6:4 G5:8 D5:4 F#5:8 C#5:4 E5:8 A4:4 D6:0.667 E6:1 D6:0.667 E6:1 D6:0.667 C#6:4 D6:4 F#5:8 C#5:4 E5:8 B4:4 D5:8 G4:4 C#6:0.667 D6:1 C#6:0.667 D6:1 C#6:0.667 C6:4 C#6:4 G5:8 D5:4 G5:8 D#5:4 G5:8 E5:4 A5:2 A4:2 B4:2 C#5:2 D5:2 E5:2 F#5:8 C#5:4 E5:8 B4:4 D5:8 G4:4 C#6:0.667 D6:1 C#6:0.667 D6:1 C#6:0.667 C6:4 C#6:4 G5:8 D5:4 F#5:8 C#5:4 E5:8 A4:4 D6:0.667 E6:1 D6:0.667 E6:1 D6:0.667 C#6:4 D6:4 F#5:8 C#5:4 E5:8 B4:4 D5:8 G4:4 C#6:0.667 D6:1 C#6:0.667 D6:1 C#6:0.667 C6:4 C#6:4"],
  },
  {
    id: 'danube', key: 'D', cat: 'Classical', title: "The Blue Danube", credit: "Johann Strauss II, 1866", bpm: 162, meter: [3, 4], accomp: 'broken',
    voices: ["D4:4 F#4:4 A4:4 A4:7.667 A4:0.333 A5:4 A5:7.667 A4:0.333 F#5:4 F#5:8 D4:4 D4:4 F#4:4 A4:4 A4:7.667 A4:0.333 A5:4 A5:7.667 A4:0.333 G5:4 G5:8 C#4:4 C#4:4 E4:4 B4:4 B4:7.667 C#5:0.333 B5:4 B5:7.667 C#5:0.333 G5:4 G5:8 C#4:4 C#4:4 E4:4 B4:4 B4:7.667 D5:0.333 B5:4 B5:7.667 D5:0.333 F#5:4 F#5:8 D4:4 D4:4 F#4:4 A4:4 D5:7.667 D5:0.333 D6:4 D6:7.667 D5:0.333 A5:4 A5:8 D4:4 D4:4 F#4:4 A4:4 D5:7.667 D5:0.333 D6:4 D6:7.667 D5:0.333 B5:4 B5:8 E5:4 E5:4 G5:4 B5:4 B5:16 G#5:4 A5:4 F#6:16 D6:4 F#5:4 F#5:8 E5:4 B5:8 A5:4 D5:6 D5:2 D5:8 D6:4 C#6:4 C#6:4 B5:4 B5:8 B5:4 A#5:4 A#5:4 B5:4 B5:8 E5:4 E5:4 F#5:8 E5:8 E5:4 E5:4 B5:8 A5:8 D6:4 C#6:4 C#6:4 B5:4 B5:8 B5:4 C#6:4 E6:4 D6:4 D6:8 G#5:4 B5:4 B5:8 A5:4 G#5:6 F#5:2 D5:2 B4:2 F#5:2 F#5:2 F#5:4 E5:4 A4:4 D6:4 C#6:4 C#6:4 B5:4 B5:8 B5:4 A#5:4 A#5:4 B5:4 B5:8 E5:4 E5:4 F#5:8 E5:8 E5:4 E5:4 B5:8 A5:8 D6:4 C#6:4 C#6:4 B5:4 B5:8 B5:4 C#6:4 E6:4 D6:4 D6:8 G#5:4 B5:4 B5:8 A5:4 G#5:6 F#5:2 D5:2 B4:2 F#5:2 F#5:2 F#5:4 E5:4 A4:4"],
  },
  {
    id: 'swan', key: 'G', cat: 'Classical', title: "The Swan", credit: "Camille Saint-Saëns, The Carnival of the Animals, 1886", bpm: 63, meter: [6, 4], accomp: 'broken',
    voices: ["G5:4 F#5:4 B4:4 E5:4 D5:4 G4:4 A4:10 B4:2 C5:12 E4:8 F#4:2 G4:2 A4:2 B4:2 C5:2 D5:2 E5:2 F#5:2 B5:24 G5:4 F#5:4 B4:4 E5:4 D5:4 G4:4 A#4:10 B4:2 C#5:12 F#4:6 G#4:2 A#4:2 B4:2 C#5:2 D5:2 E5:2 F#5:2 G#5:2 A#5:2 D6:24 D6:4 B5:4 G5:4 E5:4 F#5:4 G5:4 D5:10 E5:2 F#5:12 C6:4 A5:4 F5:4 D5:4 E5:4 F5:4 C5:10 D5:2 E5:12 E5:4 A4:4 B4:4 C5:8 D5:2 E5:2 F#5:12 E5:12 E5:4 A4:4 B4:4 C#5:8 D5:2 E5:2 F5:12 F#5:12 G5:4 F#5:4 B4:4 E5:4 D5:4 G4:4 A4:10 B4:2 C5:12 E4:8 F#4:2 G4:2 A4:2 B4:2 C5:2 D5:2 E5:2 F#5:2 B5:24"],
  },
  {
    id: 'swanlake', key: 'Bm', cat: 'Classical', title: "Swan Lake (Scene)", credit: "Tchaikovsky, 1876", bpm: 76, meter: [4, 4], accomp: 'broken',
    voices: ["F#5:8 B4:2 C#5:2 D5:2 E5:2 F#5:6 D5:2 F#5:6 D5:2 F#5:6 B4:2 D5:2 B4:2 G4:2 D5:2 B4:10 E5:2 D5:2 C#5:2 F#5:8 B4:2 C#5:2 D5:2 E5:2 F#5:6 D5:2 F#5:6 D5:2 F#5:6 B4:2 D5:2 B4:2 G4:2 D5:2 B4:12 B4:4 C#5:4 D5:4 E5:4 F#5:2 G5:2 A5:6 G5:2 F#5:4 G5:2 A5:2 B5:6 A5:2 G5:4 A5:2 B5:2 C#6:6 B5:2 F#5:2 D5:2 C#5:2 B4:2 C#5:4 D5:4 E5:4 F#5:2 G5:2 A5:6 G5:2 F#5:4 G5:2 A5:2 B5:6 A5:2 G5:4 A5:2 B5:2 C6:6 G5:2 E5:4 G5:2 C6:2 C#6:6 G#5:2 C#6:6 F#5:2 B5:4"],
  },
  {
    id: 'nocturne', key: 'Eb', cat: 'Classical', title: "Nocturne in E♭, Op. 9 No. 2", credit: "Frédéric Chopin, 1832", bpm: 59, meter: [12, 8], pickup: 2, accomp: 'broken',
    voices: ["Bb4:2 G5:8 F5:2 G5:2 F5:6 Eb5:4 Bb4:2 G5:4 C5:1 C#5:0.333 B4:0.333 C5:0.333 C6:4 G5:2 Bb5:6 Ab5:4 G5:2 F5:6 G5:4 D5:2 Eb5:6 C5:6 Bb4:2 D6:2 C6:2 Bb5:1 Ab5:1 G5:1 Ab5:1 C5:1 D5:1 Eb5:10 Bb4:2 G5:6 F5:1 G5:1 F5:0.333 G5:0.333 F5:0.333 E5:1 F5:1 G5:1 F5:2 Eb5:5 F5:1 Eb5:0.333 F5:0.333 Eb5:0.333 D5:1 Eb5:1 F5:1 G5:1 B4:1 C5:1 C#5:1 C5:1 F5:1 E5:1 Ab5:1 G5:1 C#6:1 C6:1 G5:1 Bb5:6 Ab5:4 G5:2 F5:1 G5:0.333 F5:0.333 G5:0.333 F5:0.667 G5:0.333 F5:0.333 G5:0.667 F5:0.333 G5:0.333 F5:0.333 E5:0.667 F5:0.333 G5:2 G5:2 D5:2 Eb5:6 C5:6 Bb4:2 D6:2 C6:2 Bb5:1 Ab5:1 G5:1 Ab5:1 C5:1 D5:1 Eb5:8 D5:2 Eb5:2 F5:6 G5:4 F5:2 F5:6 C5:6 Eb5:2 Eb5:2 Eb5:2 Eb5:2 D5:1 Eb5:1 F5:1.333 Eb5:0.667 Eb5:6 Bb4:6 Bb5:6 A5:4 G5:2 F5:6 D5:6 Eb5:6 D5:2 C5:2 D5:2 Bb4:2 B4:2 B4:2 C5:2 C5:2 D5:2 G5:4 A4:1 Bb4:1 B4:1 Bb4:1 C#5:1 D5:1 G5:1.333 F5:0.667 F5:4 Eb5:3 F5:1 Eb5:0.333 F5:0.333 Eb5:0.333 D5:1 Eb5:1 F5:1 G5:1 B4:1 C5:1 C#5:1 C5:1 F5:1 E5:1 Ab5:1 G5:1 C#6:1 C6:1 G5:1 Bb5:6 Ab5:4 G5:2 F5:1 G5:0.333 F5:0.333 G5:0.333 F5:0.667 G5:0.333 F5:0.333 G5:0.667 F5:0.333 G5:0.333 F5:0.333 E5:0.667 F5:0.333 G5:2 G5:2 D5:2 Eb5:6 C5:6 Bb4:2 D6:2 C6:2 Bb5:1 Ab5:1 G5:1 Ab5:1 C5:1 D5:1 Eb5:8 D5:2 Eb5:2 F5:6 G5:4 F5:2 F5:6 C5:6 Eb5:1.333 Eb5:1.667 Eb5:1.667 Eb5:1.333 Eb5:2 D5:1 Eb5:1 F5:1.333 Eb5:0.667 Eb5:6 Bb4:6"],
  },
  {
    id: 'moonlight', key: 'C#m', cat: 'Classical', title: "Moonlight Sonata (Adagio)", credit: "Ludwig van Beethoven, 1801", bpm: 40, meter: [2, 2], pickup: 4, accomp: 'broken',
    voices: ["G#4:3 G#4:1 G#4:12 G#4:3 G#4:1 G#4:8 A4:8 G#4:8 F#4:4 B4:4 E4:28 G4:3 G4:1 G4:12 G4:3 G4:1 G4:12 F#4:4 F#4:8 G4:4 E4:4 F#4:8 F#4:8 B4:12 B5:4 C6:12 A#5:4 B5:12 B5:4 C6:12 A#5:4 B5:8 B5:8 B5:8 A5:8 G5:8 F#5:8 C#5:8 C#5:4 C#5:4 F#4:12 C#6:3 C#6:1 C#6:12 C#6:3 C#6:1 C#6:8 C6:4 C#6:4"],
  },
  {
    id: 'traumerei', key: 'F', cat: 'Classical', title: "Träumerei", credit: "Robert Schumann, Kinderszenen, 1838", bpm: 54, meter: [4, 4], pickup: 4, accomp: 'broken',
    voices: ["C4:4 F4:10 E4:2 F4:2 A4:2 C5:2 F5:2 F5:8 E5:2 D5:2 C5:2 F5:2 G4:2 A4:2 Bb4:2 D5:2 F4:2 G4:2 A4:2 C5:2 G4:8 C4:4 F4:10 E4:2 F4:2 A4:2 C5:2 A5:2 A5:6 G5:2 F5:2 E5:2 F5:2 A5:2 D5:2 F5:2 E5:6 Eb5:2 D5:4 E5:4 C5:6 C4:2 F4:10 E4:2 F4:2 A4:2 C5:2 F5:2 F5:8 E5:2 D5:2 C5:2 F5:2 G4:2 A4:2 Bb4:2 D5:2 F4:2 G4:2 A4:2 C5:2 G4:8 C4:4 F4:10 E4:2 F4:2 A4:2 C5:2 A5:2 A5:6 G5:2 F5:2 E5:2 F5:2 A5:2 D5:2 F5:2 E5:6 Eb5:2 D5:4 E5:4 C5:6 C4:2 F4:10 E4:2 F4:2 A4:2 C5:2 Eb5:2 Eb5:8 D5:2 C5:2 Bb4:2 D5:2 G4:2 A4:2 Bb4:6 A4:2 G4:6 D4:8 F4:2 Bb4:10 A4:2 Bb4:2 D5:2 F5:2 Bb5:2 Bb5:8 A5:2 G5:2 F5:2 A5:2 D5:2 E5:2 F5:6 E5:2 D5:6 A4:6 G4:3.667 C4:0.333 F4:10 E4:2 F4:2 A4:2 C5:2 F5:2 F5:8 E5:2 D5:2 C5:2 F5:2 G4:2 A4:2 Bb4:2 D5:2 F4:2 G4:2 A4:2 C5:2 G4:8 C4:4"],
  },
  {
    id: 'liebestraum', key: 'Ab', cat: 'Classical', title: "Liebestraum No. 3", credit: "Franz Liszt, 1850", bpm: 54, meter: [6, 4], pickup: 4, accomp: 'broken',
    voices: ["Eb4:4 C5:12 C5:12 C5:20 C5:4 C5:8 C5:4 C#5:8 C5:4 C5:12 F4:8 F4:4 F4:4 G4:4 Ab4:4 C5:8 Bb4:4 Ab4:20 Eb4:4 C5:12 C5:12 C5:20 C5:4 C5:8 C5:4 C#5:8 C5:4 F5:20 F4:4 F4:4 G4:4 Ab4:4 C5:8 Bb4:4 Ab4:22 Ab4:2 Ab4:10 G4:2 Ab4:10 Bb4:2 C5:22 C5:2 C5:10 B4:2 C5:10 D5:2 E5:12 E5:12 E5:12 E5:12"],
  },
  {
    id: 'airg', key: 'D', cat: 'Classical', title: "Air on the G String", credit: "Johann Sebastian Bach, c. 1730", bpm: 36, meter: [4, 4], accomp: 'broken',
    voices: ["F#5:18 B5:1 G5:1 E5:1 D5:1 C#5:1 D5:1 C#5:4 B4:1 A4:3 A5:9 F#5:1 C5:1 B4:1 E5:1 D#5:1 A5:1 G5:1 G5:9 E5:1 B4:1 A4:1 D5:1 C#5:1 G5:1 F#5:1 F#5:6 G#5:1 A5:1 D5:2 D5:0.667 E5:0.333 F#5:2 E5:1 E5:1 D5:1 C#5:1 B4:1 B4:0.667 C#5:0.333 D5:3 C#5:1 B4:1 A4:8 F#5:18 B5:1 G5:1 E5:1 D5:1 C#5:1 D5:1 C#5:4 B4:1 A4:3 A5:9 F#5:1 C5:1 B4:1 E5:1 D#5:1 A5:1 G5:1 G5:9 E5:1 B4:1 A4:1 D5:1 C#5:1 G5:1 F#5:1 F#5:6 G#5:1 A5:1 D5:2 D5:0.667 E5:0.333 F#5:2 E5:1 E5:1 D5:1 C#5:1 B4:1 B4:0.667 C#5:0.333 D5:3 C#5:1 B4:1 A4:8 C#5:5 D5:0.333 C#5:0.667 B4:0.667 C#5:0.333 A4:1 A5:6 C5:2 B4:2 B5:3 A5:1 G5:1 F#5:1 F#5:1 G5:3.667 F#5:0.333 E5:0.333 D5:0.667 C#5:1 B4:1 A#4:1 B4:1 C#5:3 D5:1 E5:3 F#5:1 G5:4 F#5:2 E5:1 D5:1 C#5:1 B4:1 C#5:1 D5:0.333 E5:0.667 D5:2 C#5:2 B4:6 D5:5 F#5:1 E5:1 D5:1 B5:6 A5:1 G#5:1 E5:1 A5:1 A4:2 B4:3 C#5:0.333 D5:0.667 C#5:3 B4:1 A4:4"],
  },
  {
    id: 'jesujoy', key: 'G', cat: 'Classical', title: "Jesu, Joy of Man's Desiring", credit: "J. S. Bach, 1723", bpm: 72, meter: [3, 4], pickup: 10.667, accomp: 'broken',
    voices: ["G4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 C5:1.333 D5:1.333 E5:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 F#4:1.333 G4:1.333 A4:1.333 D4:1.333 F#4:1.333 A4:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 E4:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 G4:1.333 D4:1.333 G4:1.333 F#4:1.333 G4:1.333 B4:1.333 D5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 B4:1.333 D5:1.333 G5:4 B4:4 C5:4 D5:8 D5:4 C5:8 B4:4 A4:1.333 D4:1.333 E4:1.333 F#4:1.333 A4:1.333 G4:1.333 A4:1.333 C5:1.333 B4:1.333 C5:1.333 A4:1.333 F#4:1.333 D4:1.333 F#4:1.333 A4:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 E4:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 G4:1.333 D4:1.333 G4:1.333 F#4:1.333 G4:1.333 B4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 C5:1.333 D5:1.333 E5:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 F#4:1.333 G4:1.333 A4:1.333 D4:1.333 F#4:1.333 A4:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 E4:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 G4:1.333 D4:1.333 G4:1.333 F#4:1.333 G4:4 B4:4 C5:4 D5:8 D5:4 C5:8 B4:4 A4:1.333 D4:1.333 E4:1.333 F#4:1.333 A4:1.333 G4:1.333 A4:1.333 C5:1.333 B4:1.333 C5:1.333 A4:1.333 F#4:1.333 D4:1.333 F#4:1.333 A4:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 E4:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 G4:1.333 D4:1.333 G4:1.333 F#4:1.333 G4:1.333 B4:1.333 A4:1.333 B4:1.333 D5:1.333 C5:1.333 C5:1.333 E5:1.333 D5:1.333 D5:1.333 G5:1.333 F#5:1.333 G5:1.333 D5:1.333 B4:1.333 G4:1.333 A4:1.333 B4:1.333 C5:1.333 D5:1.333 E5:1.333 D5:1.333 C5:1.333 B4:1.333 A4:1.333 B4:1.333 G4:1.333"],
  },
  {
    id: 'sheep', key: 'Bb', cat: 'Classical', title: "Sheep May Safely Graze", credit: "J. S. Bach, 1713", bpm: 50, meter: [4, 4], accomp: 'broken',
    voices: ["F5:2 F5:1 D5:1 F5:2 F5:1 D5:1 F5:2 G5:2 G5:2 Bb5:2 Eb5:2 Eb5:1 C5:1 Eb5:2 Eb5:1 C5:1 Eb5:2 A5:2 A5:2 C6:2 Bb5:2.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 A5:1 Bb5:2.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 F5:1 Bb5:2 D6:0.667 Eb6:0.333 F6:1 D6:1 Bb5:1 C6:1 A5:1 Bb5:2 D6:0.667 Eb6:0.333 F6:1 D6:1 Bb5:1 C6:1 A5:1 Bb5:64 F5:2 F5:1 D5:1 F5:2 F5:1 D5:1 F5:2 G5:2 G5:2 Bb5:2 G5:2 G5:1 Eb5:1 G5:2 G5:1 Eb5:1 G5:2 A5:2 A5:2 C6:4 Bb5:0.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 A5:1 Bb5:10 Bb5:0.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 A5:1 Bb5:32 F5:2 F5:1 D5:1 F5:2 F5:1 D5:1 F5:2 G5:2 G5:2 Bb5:2 Eb5:2 Eb5:1 C5:1 Eb5:2 Eb5:1 C5:1 A5:2 Bb5:2 Bb5:2 C6:4 D6:0.667 Eb6:0.333 F6:1 D6:1 Bb5:1 F5:1 A5:1 Bb5:2 F5:1 D5:1 F5:2 F5:1 D5:1 F5:2 G5:2 G5:2 Bb5:2 Eb5:2 Eb5:1 C5:1 Eb5:2 Eb5:1 C5:1 Eb5:2 A5:2 A5:2 C6:2 Bb5:2.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 F5:1 Bb5:2.667 C6:0.333 D6:1 Bb5:1 D6:1 C6:1 F5:1 Bb5:2 D6:0.667 Eb6:0.333 F6:1 D6:1 Bb5:1 C6:1 A5:1 Bb5:2 D6:0.667 Eb6:0.333 F6:1 D6:1 Bb5:1 C6:1 A5:1 Bb5:88 G5:2 G5:1 Eb5:1 G5:2 G5:1 Eb5:1 G5:2 Ab5:2 Ab5:2 C6:2 F5:2 F5:1 D5:1 F5:2 F5:1 D5:1 F5:2 B5:2 B5:2 D6:2 C6:2.667 D6:0.333 Eb6:1 C6:1 Eb6:1 D6:1 G5:1 C6:2.667 D6:0.333 Eb6:1 C6:1 Eb6:1 D6:1 G5:1 C6:2 Eb6:0.667 F6:0.333 G6:1 Eb6:1 C6:1 D6:1 B5:1 C6:2 Eb6:0.667 F6:0.333 G6:1 Eb6:1 C6:1 D6:1 B5:1 C6:32 A5:2 A5:1 F5:1 A5:2 A5:1 F5:1"],
  },
  {
    id: 'minuetg', key: 'G', cat: 'Classical', title: "Minuet in G", credit: "Christian Petzold, c. 1725 (Anna Magdalena Notebook)", bpm: 108, meter: [3, 4], accomp: 'broken',
    voices: ["D5:4 G4:2 A4:2 B4:2 C5:2 D5:4 G4:4 G4:4 E5:4 C5:0.333 B4:0.333 C5:1.333 D5:2 E5:2 F#5:2 G5:4 G4:4 G4:4 C5:0.667 B4:0.333 C5:3 D5:2 C5:2 B4:2 A4:2 B4:4 C5:2 B4:2 A4:2 G4:2 F#4:4 G4:2 A4:2 B4:2 G4:2 B4:4 A4:8 D5:4 G4:2 A4:2 B4:2 C5:2 D5:4 G4:4 G4:4 E5:4 C5:0.667 B4:0.333 C5:1 D5:2 E5:2 F#5:2 G5:4 G4:4 G4:4 C5:0.667 B4:0.333 C5:3 D5:2 C5:2 B4:2 A4:2 B4:4 C5:2 B4:2 A4:2 G4:2 A4:4 B4:2 A4:2 G4:2 F#4:2 G4:12 D5:4 G4:2 A4:2 B4:2 C5:2 D5:4 G4:4 G4:4 E5:4 C5:0.333 B4:0.333 C5:1.333 D5:2 E5:2 F#5:2 G5:4 G4:4 G4:4 C5:0.667 B4:0.333 C5:3 D5:2 C5:2 B4:2 A4:2 B4:4 C5:2 B4:2 A4:2 G4:2 F#4:4 G4:2 A4:2 B4:2 G4:2 B4:4 A4:8 D5:4 G4:2 A4:2 B4:2 C5:2 D5:4 G4:4 G4:4 E5:4 C5:0.667 B4:0.333 C5:1 D5:2 E5:2 F#5:2 G5:4 G4:4 G4:4 C5:0.667 B4:0.333 C5:3 D5:2 C5:2 B4:2 A4:2 B4:4 C5:2 B4:2 A4:2 G4:2 A4:4 B4:2 A4:2 G4:2 F#4:2 G4:12 B5:4 G5:2 A5:2 B5:2 G5:2 A5:4 D5:2 E5:2 F#5:2 D5:2 G5:4 E5:2 F#5:2 G5:2 D5:2 C#5:4 B4:2 C#5:2 A4:4 A4:2 B4:2 C#5:2 D5:2 E5:2 F#5:2 G5:4 F#5:4 E5:4 F#5:4 A4:4 C#5:4 D5:12 D5:4 G4:2 F#4:2 G4:4 E5:4 G4:2 F#4:2 G4:4 D5:4 C5:4 B4:4 A4:2 G4:2 F#4:2 G4:2 A4:4 D4:2 E4:2 F#4:2 G4:2 A4:2 B4:2 C5:4 B4:0.667 C5:0.333 B4:3 A4:4"],
  },
  {
    id: 'morning', key: 'E', cat: 'Classical', title: "Morning Mood", credit: "Edvard Grieg, Peer Gynt, 1875", bpm: 78, meter: [6, 8], accomp: 'broken',
    voices: ["B5:2 G#5:2 F#5:2 E5:2 F#5:2 G#5:2 B5:1.667 A5:0.333 G#5:2 F#5:2 E5:2 F#5:1 G#5:1 F#5:1 G#5:0.667 A5:0.333 B5:2 G#5:2 B5:2 C#6:2 G#5:2 C#6:2 B5:2 G#5:2 F#5:2 E5:6 B4:2 G#4:2 F#4:2 E4:2 F#4:2 G#4:2 B4:1.667 A4:0.333 G#4:2 F#4:2 E4:2 F#4:1 G#4:1 F#4:1 G#4:0.667 A4:0.333 B4:2 G#4:2 B4:2 C#5:2 G#4:2 C#5:2 D#5:2 C5:2 A#4:2 G#4:6 D#6:2 C6:2 A#5:2 G#5:2 A#5:2 C6:2 D#6:1.667 C#6:0.333 C6:2 A#5:2 G#5:2 A#5:1 C6:1 A#5:1 C6:0.667 C#6:0.333 D#6:2 C6:2 D#6:2 E6:2 C6:2 E6:2 D#6:2 C6:2 A#5:2 G#5:6 D#5:2 C5:2 A#4:2 G#4:2 A#4:2 C5:2 D#5:1.667 C#5:0.333 C5:2 A#4:2 G#4:2 A#4:1 C5:1 A#4:1 C5:0.667 C#5:0.333 D#5:2 C5:2 D#5:2 E5:2 C#5:2 E5:2 F#5:2 D#5:2 C#5:2 B4:6 F#6:2 D#6:2 C#6:2 B5:2 C#6:1 D#6:1 C#6:1 D#6:13 F#6:2 D#6:2 B5:8 F#6:2 D#6:2 B5:2 B4:6 B5:2 G#5:2 F#5:2 E5:2 F#5:2 G#5:2 B5:1.667 A5:0.333 G#5:2 F#5:2 E5:2 F#5:1 G#5:1 F#5:1 G#5:0.667 A5:0.333 B5:2 G#5:2 B5:2 C#6:2 G#5:2 C#6:2 C#6:2 A5:2 G#5:2 F#5:6 C#6:2 A5:2 G#5:2 F#5:2 G#5:2 A5:2 C#6:1.667 B5:0.333 A5:2 G#5:2 F#5:2 G#5:1 A5:1 G#5:1 A5:0.667 B5:0.333 C#6:2 A5:2 C#6:2 D#6:2 A5:2 D#6:1.667 E6:0.333 D#6:2 B5:2 D#6:2 E6:2 B5:2 E6:1.667 F#6:0.333 E6:2 C#6:2 E6:2 F#6:2 C#6:2 F#6:2 G#6:6 G#5:1 D#5:1 C5:1 G#4:1 C5:1 D#5:1 D#5:1 C5:1 G#4:1 D#4:1 G#4:1 C5:1 C5:1 G#4:1 D#4:1 C4:1 D#4:1 G#4:1 G#4:6 F#4:6"],
  },
  {
    id: 'solveig', key: 'Am', cat: 'Classical', title: "Solveig's Song", credit: "Edvard Grieg, Peer Gynt, 1875", bpm: 65, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["E5:8 C5:2 E5:2 A5:2 B5:1.667 A5:0.333 G5:16 G5:8 E5:2 G5:2 C6:2 D6:2 B5:4 E6:12 B4:4 E5:72 E4:4 A4:4 B4:2 C5:2 D5:4 E5:2 F5:2 F5:2 E5:2 E5:2 C5:2 A4:4 A4:2 C5:2 C5:2 B4:2 B4:2 G#4:2 G#4:1 E4:19 E4:4 A4:2 A4:2 B4:2 C5:2 D5:4 E5:2 F5:2 F5:2 E5:2 E5:2 C5:2 A4:4 A4:2 C5:2 C5:2 B4:2 B4:2 G4:2 G4:1 E4:21 E4:2 E4:2 G#4:2 B4:2 C5:2 A4:4 E5:2 D#5:2 B4:4 D5:2 C#5:2 A4:6 A4:2 C5:2 B4:2 B4:2 A4:2 E5:6 E4:2 E4:2 G#4:2 B4:2 C5:2 A4:2 E5:2 E5:2 D#5:2 B4:2 B4:2 D5:2 C#5:2 A4:6 A4:2 C5:6 B4:1.667 C5:0.333 B4:6 A4:1.667 B4:0.333 A4:12 E5:7 F#5:1 E5:3 D5:1 C#5:3 D5:1 E5:4 E5:11 F#5:1 E5:3 D5:1 C#5:3 D5:1 E5:16 F#5:10 E5:1.667 F#5:0.333 E5:2 C#5:2 A4:4 C#5:2 B4:1.667 C#5:0.333 B4:2 G#4:2 E4:2 G#4:2 A4:2 C#5:2 E5:12"],
  },
  {
    id: 'anitra', key: 'Am', cat: 'Classical', title: "Anitra's Dance", credit: "Edvard Grieg, Peer Gynt, 1875", bpm: 144, meter: [3, 4], pickup: 4, accomp: 'broken',
    voices: ["E4:3.667 B4:0.333 A4:2 G#4:2 A4:2 B4:2 C5:2 D5:2 E5:2 A5:2 E5:4 D5:0.667 E5:1 D5:0.667 E5:1 D5:0.667 C5:2 A5:2 C5:4 B4:0.667 C5:1 B4:0.667 C5:1 B4:0.667 A4:12 A4:2 C5:2 A4:4 G4:0.667 A4:1 G4:0.667 A4:1 G4:0.667 F#4:2 C5:2 F#4:8 F4:2 C5:2 F4:4 E4:0.667 F4:1 E4:0.667 F4:1 E4:0.667 D#4:2 B4:2 D#4:8 B3:8 B5:4 B4:8 B5:4 B3:8 B5:4 B4:8 B5:4 E4:24 E4:2 F#4:2 G4:2 A4:2 B4:4 E5:8 E4:3.667 B4:0.333 A4:2 G#4:2 A4:2 B4:2 C5:2 D5:2 E5:2 A5:2 E5:4 D5:0.667 E5:1 D5:0.667 E5:1 D5:0.667 C5:2 A5:2 C5:4 B4:0.667 C5:1 B4:0.667 C5:1 B4:0.667 A4:12 A4:2 C5:2 A4:4 G4:0.667 A4:1 G4:0.667 A4:1 G4:0.667 F#4:2 C5:2 F#4:8 F4:2 C5:2 F4:4 E4:0.667 F4:1 E4:0.667 F4:1 E4:0.667 D#4:2 B4:2 D#4:8 B3:8 B5:4 B4:8 B5:4 B3:8 B5:4 B4:8 B5:4 E4:24 E4:2 F#4:2 G4:2 A4:2 B4:4 E5:12 F5:6 E5:2 E5:2 D5:2 D5:6 E5:2 E5:2 F5:2 F5:12 E5:22 F5:2 D5:2 C5:2 B4:10 D5:2 B4:2 A4:2 G#4:16 A#5:6 A5:2 A5:2 G5:2 G5:6 A5:2 A5:2 A#5:2 A#5:12 A5:22 A#5:2 G5:2 F5:2 E5:10 G5:2 E5:2 D5:2 C#5:48 A4:3.667 E5:0.333 D5:2 C#5:2 D5:2 E5:2 F#5:2 G5:2 A5:2 D6:2 A5:4 G5:0.667 A5:1 G5:0.667 A5:1 G5:0.667 F#5:2 D6:2 F#5:4 E5:0.667 F#5:1 E5:0.667 F#5:1 E5:0.667 D5:44 A4:3.667 E5:0.333 D5:2 C#5:2 D5:2 E5:2 F5:2 G5:2 A5:2 D6:2 A5:4 G5:0.667 A5:1 G5:0.667 A5:1 G5:0.667 F5:2 D6:2 F5:4 E5:0.667 F5:1 E5:0.667 F5:1 E5:0.667 D5:22 C5:1.667 G5:0.333 F5:2 E5:2 F5:2 G5:2 A5:2 A#5:2 C6:2 F6:2 C6:30 E5:1.667 B5:0.333 A5:2 G#5:2 A5:2 B5:2 C6:2 D6:2 E6:2 A6:2 E6:30 B4:1.667 G5:0.333 F#5:2 F5:2 F#5:2 G5:2 A5:2 B5:2 C6:2 C5:2 F#5:30 E4:1.667 C5:0.333 B4:2 A#4:2 B4:2 C5:2 D5:2 E5:2 F5:2 F4:2 B4:16 E5:3.667"],
  },
  {
    id: 'hungarian5', key: 'F#m', cat: 'Classical', title: "Hungarian Dance No. 5", credit: "Johannes Brahms, 1869", bpm: 119, meter: [2, 4], accomp: 'broken',
    voices: ["C#5:6 F#5:2 A5:6 F#5:2 F5:6 F#5:1 G#5:1 F#5:8 D5:6 E5:1 F#5:1 C#5:8 B4:1 A4:1 A4:1 G#4:1 G#4:3 C#5:1 F#4:8 C#5:6 F#5:1 A5:1 C#6:6 A5:2 G#5:6 A5:1 B5:1 A5:8 D5:1 E5:1 F#5:1 D5:1 C#5:1 D5:1 E5:1 C#5:1 B4:1 C#5:1 D5:1 B4:1 A4:1 B4:1 C#5:1 A4:1 B4:1 A4:1 A4:1 G#4:1 G#4:3 C#5:1 F#4:4 F#5:4 C#5:6 F#5:2 A5:6 F#5:2 F5:6 F#5:1 G#5:1 F#5:8 D5:6 E5:1 F#5:1 C#5:8 B4:1 A4:1 A4:1 G#4:1 G#4:3 C#5:1 F#4:8 C#4:3 F#4:1 A4:1 C#5:1 F#5:1 A5:1 C#6:6 A5:2 G#5:6 A5:1 B5:1 A5:8 D6:1 E6:1 F#6:1 D6:1 C#6:1 D6:1 E6:1 C#6:1 B5:1 C#6:1 D6:1 B5:1 A5:1 B5:1 C#6:1 A5:1 B5:1 A5:1 A5:1 G#5:1 G#5:3 C#6:1 F#5:3.667 C#6:0.333 F#6:4 C#6:4 C#6:4 D6:6 C#6:4 B5:4 A#5:1 B5:1 C#6:1 B5:1 A#5:1 C#6:1 B5:4 B5:4 B5:4 C#6:6 B5:4 A5:4 G#5:1 A5:1 B5:1 A5:1 G#5:1 B5:1 A5:4 G#5:4 G#5:4 B5:2 A5:4 G#5:4 F#5:4 F5:1 F#5:1 G#5:1 F#5:1 F5:1 G#5:1 F#5:4 C#6:7 C#5:1 D#5:4 F5:3.667 G#5:0.333 F#5:2 F#5:4 F5:1 F#5:1 G#5:1 F#5:1 F5:0.667 F#5:0.667 G#5:0.667 F#5:4 C#6:4 C#6:4 D6:6 C#6:4 B5:4 A#5:1 B5:1 C#6:1 B5:1 A#5:1 C#6:1 B5:4 B5:4 B5:4 C#6:6 B5:4 A5:4 G#5:1 A5:1 B5:1 A5:1 G#5:1 B5:1 A5:4 G#5:4 G#5:4 B5:2 A5:4 G#5:4 F#5:4 F5:1 F#5:1 G#5:1 F#5:1 F5:1 G#5:1 F#5:4 C#6:7 C#5:1 D#5:4 F5:3.667 G#5:0.333 F#5:2 F#5:4 F5:1 F#5:1 G#5:1 F#5:1 F5:0.667 F#5:0.667 G#5:0.667 F#5:4"],
  },
  {
    id: 'barcarolle', key: 'D', cat: 'Classical', title: "Barcarolle", credit: "Jacques Offenbach, The Tales of Hoffmann, 1881", bpm: 76, meter: [6, 8], accomp: 'broken',
    voices: ["A5:4 B5:2 B5:4 C#6:2 C#6:4 D6:2 D6:4 C#6:2 C#6:4 B5:1.667 C#6:0.333 B5:4 A5:2 A5:12 A5:4 B5:2 B5:4 C#6:2 C#6:4 D6:2 D6:4 C#6:2 C#6:4 B5:1.667 C#6:0.333 B5:4 A5:2 A5:10 A5:2 A5:4 B5:2 B5:4 C6:2 D6:14 A5:2 B5:2 C6:2 B5:2 A5:2 B5:6 B5:4 B5:2 B5:4 C#6:2 C#6:4 D6:2 E6:14 B5:2 C#6:2 D6:2 C#6:2 B5:2 A5:12 A5:8 C#6:2 B5:2 A5:12 A5:8 C#6:2 B5:2 A5:6 A5:18 F#5:4 G5:2 G5:4 F#5:2 F#5:2 E5:2 G5:2 G5:4 F#5:2 F#5:2 E5:2 G5:2 G5:4 F#5:2 F#5:12 F#5:4 G5:2 G5:4 F#5:2 F#5:2 E5:2 G5:2 G5:4 F#5:2 F#5:2 E5:2 G5:2 G5:4 F#5:2 A5:30 A5:8 A5:2 B5:2 C#6:2 D6:2 E6:2 F#6:14 E6:2 D6:2 C#6:2 D6:2 B5:2 A5:10 B5:2 C#6:10 C#6:2 D6:6 A5:2 D6:4 A5:2 E6:10 D6:2 F#6:4 A5:2 D6:4 A5:2 E6:10 D6:2 F#6:10 D6:2 F#6:10 A5:2 D6:10 F#5:2 A5:10 A5:6 F#5:6 D5:52"],
  },
  {
    id: 'habanera', key: 'Dm', cat: 'Classical', title: "Habanera", credit: "Georges Bizet, Carmen, 1875", bpm: 65, meter: [2, 4], pickup: 4, accomp: 'broken',
    voices: ["D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:2 A5:1 A5:1 Ab5:2 G5:2 F5:0.667 G5:0.667 F5:0.667 E5:1 F5:1 G5:2 F5:2 E5:4 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:1 A5:2 A5:1 G5:2 F5:2 E5:0.667 F5:0.667 E5:0.667 D5:1 E5:1 F5:2 E5:2 D5:4 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:1 A5:2 A5:1 Ab5:2 G5:2 F5:0.667 G5:0.667 F5:0.667 E5:1 F5:1 G5:2 F5:2 E5:4 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:1 A5:2 A5:1 G5:2 F5:2 E5:0.667 F5:0.667 E5:0.667 D5:1 E5:1 F5:2 E5:2 D5:12 F#5:4 A5:12 D6:4 B5:12 E5:4 E6:12 A5:4 D6:3 A5:1 D5:2 E5:2 F#5:3 A5:1 F#5:2 E5:2 D5:3 E5:1 F#5:2 G5:2 A5:1 A5:1 A5:1 A5:1 B5:2 A5:2 G5:3 B5:1 E5:2 F#5:2 G5:3 B5:1 G5:2 F#5:2 E5:3 F#5:1 G5:2 A5:2 B5:1 B5:1 B5:1 B5:1 C#6:2 B5:2 A5:11 A5:1 F#5:2 E5:2 D5:3 E5:1 F#5:2 G5:2 A5:1 A5:1 A5:1 A5:1 D6:2 C#6:1.667 C#6:0.333 G5:11 B5:1 G5:2 F#5:2 E5:2 F#5:2 G5:2 A5:2 C#6:1.333 B5:1.333 A5:1.333 G5:1 A5:0.333 F#5:2 E5:0.667 D5:36 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:2 A5:1 A5:1 Ab5:2 G5:2 F5:0.667 G5:0.667 F5:0.667 E5:1 F5:1 G5:2 F5:2 E5:4 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2 A5:1 A5:2 A5:1 G5:2 F5:2 E5:0.667 F5:0.667 E5:0.667 D5:1 E5:1 F5:2 E5:2 D5:4 D6:2 C#6:2 C6:1.333 C6:1.333 C6:1.333 B5:2 Bb5:2"],
  },
  {
    id: 'meditation', key: 'D', cat: 'Classical', title: "Méditation", credit: "Jules Massenet, Thaïs, 1894", bpm: 59, meter: [4, 4], accomp: 'broken',
    voices: ["F#5:10 D5:2 A4:1.333 D5:1.333 F#5:1.333 B5:8 C#6:4 D6:4 D5:6 E5:2 F#5:0.667 G5:1 F#5:0.667 E5:1 F#5:0.667 A5:2 A4:2 B4:12 C#5:2 D5:2 F#5:2 E5:2 G5:8 D#5:2 E5:2 F#5:2 G5:2 A5:2 B5:2 B5:4 B4:4 C#5:8 D5:4 E5:1 D5:1 C#5:1 D5:1 E5:8 F5:8 F#5:10 D5:2 A4:1.333 D5:1.333 F#5:1.333 B5:8 C#6:4 D6:4 F#5:11 D5:1 A4:1 D5:1 F#5:1 A5:1 C6:8 D6:4 E6:4 F#6:10 D#6:2 B5:1.333 F#5:1.333 D#5:1.333 A5:2.667 G5:1.333 E5:1.333 B4:1.333 G4:1.333 F#5:2.667 E5:1.333 B4:1.333 G4:1.333 E4:1.333 D5:2.667 A4:1.333 F#4:1.333 G4:1.333 A4:1.333 B4:4 C#5:2 D5:2 E5:8 F#5:4 G5:4 E5:4 F#5:4 B4:4 E5:4 D5:8 C#5:8 D5:16 C5:10 G4:2 A4:2 E4:2 G4:4 F#4:8 A#4:1.333 C#5:1.333 E5:1.333 E5:10 B4:2 C#5:2 G4:2 B4:4 A4:8 C#5:1.333 E5:1.333 G5:1.333 G5:6 A5:2 B5:2 F#5:2 D5:2 B4:2 E5:3 F#5:1 E5:0.667 D#5:1 E5:0.667 F#5:1 G5:0.667 G5:2 E5:2 C5:2 G4:2 A#4:8 A4:4 G4:4 A5:4 G5:2 F5:2 E5:4 D5:2 C5:2 D6:6 C6:2 A5:6 C6:2 E6:6 D6:2 C6:4 A5:2 C6:2 F6:6 E6:2 G6:2 F6:2 C6:2 G#5:2 F5:2 E5:2 G5:2 F5:4 C5:2 G#4:2 F4:2 F4:3.333 E4:0.667 E4:6 F4:4 F4:2 F4:3.333 E4:0.667 E4:6 F4:4 F4:2 F4:3.333 E4:0.667 E4:6 G4:4 A#4:2 A#4:3 G4:1 E4:1 G4:1 A#4:1 C#5:1 E5:2 F5:2 F#5:2 G5:2 G5:2 F#5:2 F5:2 E5:2 G5:2 A5:2 A#5:2 B5:2"],
  },
  {
    id: 'humoresque', key: 'G', cat: 'Classical', title: "Humoresque", credit: "Antonín Dvořák, 1894", bpm: 43, meter: [2, 4], accomp: 'broken',
    voices: ["G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.333 E5:0.333 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.333 B4:0.333 D5:1.333 D5:0.667 E5:1.333 D5:0.667 G5:1.333 E5:0.667 D5:1.333 B4:0.667 A4:8 G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.667 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.667 D5:1.333 D5:0.667 G5:1.333 G4:0.667 A4:2 D5:2 G4:8 G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.333 E5:0.333 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.333 B4:0.333 D5:1.333 D5:0.667 E5:1.333 D5:0.667 G5:1.333 E5:0.667 D5:1.333 B4:0.667 A4:8 G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.667 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.667 D5:1.333 D5:0.667 G5:1.333 G4:0.667 A4:2 D5:2 G4:8 B4:2 B5:1.333 A5:0.667 A5:2 G5:2 G5:2 F#5:1.333 E5:0.667 E5:2 D5:2 D5:2 C5:1 E5:1 D5:2 C5:2 B4:1 A4:1 G4:4 G4:1 A4:1 B4:2 B5:1.333 A5:0.667 A5:2 G5:2 G5:2 F#5:1.333 E5:0.667 E5:2 D5:2 D5:1 C5:1 D5:1 E5:1 B4:1 A4:1 B4:0.667 D5:0.333 C5:1 B4:2 A#4:4 A4:2 G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.333 E5:0.333 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.333 B4:0.333 D5:1.333 D5:0.667 E5:1.333 D5:0.667 G5:1.333 E5:0.667 D5:1.333 B4:0.667 A4:8 G4:1.333 A4:0.667 G4:1.333 A4:0.667 B4:1.333 D5:0.667 E5:1.333 D5:0.333 E5:0.333 G5:1.333 F#5:0.667 A5:1.333 G5:0.667 F#5:1.333 A5:0.667 G5:1.333 E5:0.667 D5:1.333 D5:0.667 A#5:1.333 D5:0.667 C#5:1.333 A#5:0.667 A5:1.333 E5:0.333 D5:0.333 G5:8 G5:1 A5:1 A#5:1 A5:1 A#5:2 A5:1 G5:1 F5:2 C5:2 D5:1 F5:3"],
  },
  {
    id: 'salut', key: 'E', cat: 'Classical', title: "Salut d'Amour", credit: "Edward Elgar, 1888", bpm: 72, meter: [2, 4], accomp: 'broken',
    voices: ["G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 A5:4 A5:4 A5:4 B4:4 G#5:4 C5:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 F#5:4 F#5:4 F#5:6 G5:2 G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 C#6:4 C#6:4 C#6:4 B5:2 A5:2 G#5:4 F#5:2 E5:1.667 E5:0.333 C#5:4 D#5:4 E5:12 B4:4 G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 A5:4 A5:4 A5:4 B4:4 G#5:4 C5:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 F#5:4 F#5:4 F#5:6 G5:2 G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 C#6:4 C#6:4 C#6:4 B5:2 A5:2 G#5:4 F#5:2 E5:1.667 E5:0.333 C#5:4 D#5:4 E5:16 G5:4 F#5:2 E5:2 C5:4 D5:2 E5:2 F#5:4 E5:2 D5:2 B4:4 C5:2 D5:2 E5:4 F#5:2 G5:2 A5:4 B5:2 C6:2 D6:4 F#6:2 E6:2 D6:6 C6:2 B5:4 A5:2 G5:2 E5:4 F#5:2 G5:1.667 G5:0.333 B5:2 A5:2 G5:2 F#5:2 D#5:4 E5:2 F#5:2 G5:4 A5:2 B5:2 C6:4 G6:3 F#6:1 E6:8 B5:8 E5:8 B4:8 E6:8 B5:8 C#6:12 B5:2 A5:2 G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 A5:4 A5:4 A5:4 B4:4 G#5:4 C5:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 F#5:4 F#5:4 F#5:6 G5:2 G#5:4 B4:2 G#5:2 F#5:2 E5:2 D#5:2 E5:2 C#6:4 C#6:4 C#6:4 D#6:2 E6:2"],
  },
  {
    id: 'avemaria', key: 'C', cat: 'Classical', title: "Ave Maria", credit: "Bach–Gounod, 1853", bpm: 58, meter: [4, 4], accomp: 'broken',
    voices: ["E5:16 F5:14 F5:2 G5:12 D5:4 E5:16 A5:10 A4:2 B4:2 C5:2 D5:6 E5:2 D5:8 G5:10 G4:2 A4:2 B4:2 C5:6 D5:2 C5:8 C6:10 C5:2 D5:2 E5:2 F#5:6 E5:2 D5:4 A4:4 B4:12 D5:4 E5:10 E5:2 F5:2 G5:2 A5:7 A4:1 A4:8 D5:10 D5:2 E5:2 F5:2 G5:8 G4:8 C5:10 C5:2 D5:2 E5:2 F5:10 F5:2 G5:2 A5:2 B5:6 A5:2 G5:4 D5:4 E5:16 G5:8 E5:7 E5:1 A5:8 A4:8 A5:8 C5:7 A5:1 C6:8 D#5:7 C6:1 C6:8 D5:8 D5:10 D5:2 C5:2 B4:2 G5:6 E5:2 C5:8 F5:10 F5:2 E5:2 D5:2 D6:6 B5:2 G5:8"],
  },
  {
    id: 'schubertwiegen', key: 'Ab', cat: 'Classical', title: "Wiegenlied", credit: "Franz Schubert, 1816", bpm: 47, meter: [4, 4], pickup: 8, accomp: 'broken',
    voices: ["C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 Ab4:1 G4:1 Ab4:1 Bb4:4 Eb4:4 C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 C5:1 C#5:1 Bb4:1 Ab4:8 Bb4:6 Bb4:2 C5:3 Bb4:1 Ab4:4 Eb5:3 F5:0.667 Eb5:0.333 C#5:2 C5:2 Bb4:4 Eb4:4 C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 C5:1 C#5:1 Bb4:1 Ab4:40 C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 Ab4:1 G4:1 Ab4:1 Bb4:4 Eb4:4 C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 C5:1 C#5:1 Bb4:1 Ab4:8 Bb4:6 Bb4:2 C5:3 Bb4:1 Ab4:4 Eb5:3 F5:0.667 Eb5:0.333 C#5:2 C5:2 Bb4:4 Eb4:4 C5:4 Eb5:4 Bb4:3 C5:1 C#5:4 C5:2 C5:2 Bb4:1 C5:1 C#5:1 Bb4:1 Ab4:4"],
  },
  {
    id: 'plaisir', key: 'Eb', cat: 'Classical', title: "Plaisir d'amour", credit: "Jean-Paul-Égide Martini, 1784", bpm: 62, meter: [6, 8], pickup: 2, accomp: 'broken',
    voices: ["Bb4:2 Eb5:6 F5:6 G5:10 G5:2 Ab5:4 Ab5:2 G5:2 Eb5:2 G5:2 F5:10 Bb4:2 C5:6 D5:6 Eb5:2 F5:2 G5:2 C5:2 F5:2 Ab5:2 G5:6 F5:4 G5:0.667 F5:0.333 Eb5:0.333 F5:0.667 Eb5:34 Eb5:2 Bb5:6 C6:6 Bb5:2 C6:2 D6:1.667 F6:0.333 Eb6:2 Bb5:2 C6:2 Bb5:6 Ab5:5.667 Ab5:0.333 G5:12 A5:6 Bb5:4 B5:2 C6:4 D6:2 Eb6:2 D6:2 C6:2 Bb5:6 A5:4 C6:1.333 Bb5:0.667 Bb5:34 Bb4:2 Eb5:6 F5:6 G5:10 G5:2 Ab5:4 Ab5:2 G5:2 Eb5:2 G5:2 F5:10 Bb4:2 C5:6 D5:6 Eb5:2 F5:2 G5:2 C5:2 F5:2 Ab5:1 C6:1 G5:6 F5:4 E5:0.667 F5:0.333 Ab5:0.333 G5:0.667 Eb5:36 F#5:6 F#5:4 F#5:2 F5:6 F5:4 F5:2 F#5:6 F#5:2 Bb5:2 F#5:2 F5:10 F5:2 F#5:4 F#5:2 Ab5:4 Ab5:2 Bb5:2 Ab5:2 Bb5:2 B5:2 C#6:2 Eb6:2 Bb5:5.667 Bb5:0.333 Ab5:6 Ab5:6 Ab5:2 Bb5:2 B5:2 C#6:12"],
  },
  {
    id: 'pavane', key: 'F#m', cat: 'Classical', title: "Pavane", credit: "Gabriel Fauré, 1887", bpm: 76, meter: [4, 4], accomp: 'broken',
    voices: ["F#4:7 G#4:1 A4:7 B4:1 A4:2 G#4:2 A4:2 F#4:2 G#4:7 A4:1 G#4:2 F#4:2 G#4:2 E4:2 F#4:7 F4:1 C#4:16 C#5:7 D5:1 E5:7 F#5:1 E5:2 D5:2 E5:2 C#5:2 D5:7 E5:1 D5:2 C#5:2 D5:2 B4:2 C#5:6 C5:2 C#5:16 F#4:7 G#4:1 A4:7 B4:1 A4:2 G#4:2 A4:2 F#4:2 G#4:7 A4:1 G#4:2 F#4:2 G#4:2 E4:2 F#4:7 F4:1 C#4:16 A4:7 B4:1 C#5:7 D5:1 C#5:2 B4:2 C#5:2 A4:2 B4:7 C#5:1 A4:2 G#4:2 A4:2 F#4:2 F#4:4 F4:4 F#4:16 C#4:7 D#4:1 F4:4 D#4:1.333 F4:1.333 F#4:1.333 G#4:2 F#4:2 A4:2 G#4:2 F4:6 D#4:2 C#4:6 D#4:2 E4:4 D#4:1.333 E4:1.333 F#4:1.333 G#4:2 F#4:2 A4:2 G#4:2 E4:6 D#4:2 C#4:4 C4:1.333 C#4:1.333 D#4:1.333 E4:6 D#4:2 C#4:4 C4:1.333 C#4:1.333 D#4:1.333 E4:6 D#4:2 G#4:12 F#4:1.333 G#4:1.333 F#4:1.333 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 F#4:0.667 F4:0.333 F#4:0.333 F4:0.667 D#4:1 F4:1 F#4:64 C#6:7 D6:1 E6:7 F#6:1 E6:2 D6:2 E6:2 C#6:2 D6:7 E6:1 D6:2 C#6:2 D6:2 B5:2 C#6:6 C6:2 C#6:16 F#5:7 G#5:1 A5:7 B5:1 A5:2 G#5:2 A5:2 F#5:2 G#5:7 A5:1 G#5:2 F#5:2 G#5:2 E5:2 F#5:7 F5:1 C#5:16"],
  },
  {
    id: 'donna', key: 'B', cat: 'Classical', title: "La donna è mobile", credit: "Giuseppe Verdi, Rigoletto, 1851", bpm: 62, meter: [3, 8], accomp: 'broken',
    voices: ["D#5:2 D#5:2 D#5:2 F#5:1.333 E5:0.667 C#5:4 C#5:2 C#5:2 C#5:2 E5:1.333 D#5:0.667 B4:4 D#5:2 C#5:2 B4:1.667 C#5:0.333 B4:1.333 A#4:0.667 A#4:4 C#5:2 B4:2 G#4:1.667 A#4:0.333 G#4:1.333 F#4:0.667 F#4:4 D#5:2 D#5:2 D#5:2 F#5:1.333 E5:0.667 C#5:4 C#5:2 C#5:2 C#5:2 E5:1.333 D#5:0.667 B4:4 D#5:2 C#5:2 B4:2 B4:1.333 A#4:0.667 A#4:4 C#5:2 B4:2 G#4:2 G#4:1.333 F#4:0.667 F#4:4 C#5:1.333 D#5:0.667 C#5:2 C#5:2 F#5:2 C#5:4 D#5:1.333 E5:0.667 D#5:2 D#5:2 G#5:2 D#5:4 F#5:1.333 G#5:0.667 F#5:2 F#5:2 G#5:4 F#5:2 E5:0.667 F#5:0.667 E5:0.667 D#5:2 C#5:2 B4:18 E5:0.667 F#5:0.667 E5:0.667 D#5:2 C#5:2 B4:6 F#5:22 G5:2 A#5:1.333 G#5:0.667 F#5:1.333 E5:0.667 D#5:1.333 C#5:0.667 B4:60 D#5:2 D#5:2 D#5:2 F#5:1.333 E5:0.667 C#5:4 C#5:2 C#5:2 C#5:2 E5:1.333 D#5:0.667 B4:4 D#5:2 C#5:2 B4:1.667 C#5:0.333 B4:1.333 A#4:0.667 A#4:4 C#5:2 B4:2 G#4:1.667 A#4:0.333 G#4:1.333 F#4:0.667 F#4:4 D#5:2 D#5:2 D#5:2 F#5:1.333 E5:0.667 C#5:4 C#5:2 C#5:2 C#5:2 E5:1.333 D#5:0.667 B4:4 D#5:2 C#5:2 B4:1.667 C#5:0.333 B4:1.333 A#4:0.667 A#4:4 C#5:2 B4:2 G#4:1.667 A#4:0.333 G#4:1.333 F#4:0.667 F#4:4 C#5:1.333 D#5:0.667 C#5:2 C#5:2 F#5:2 C#5:4 D#5:1.333 E5:0.667 D#5:2 D#5:2 G#5:2 D#5:4 F#5:1.333 G#5:0.667 F#5:2 F#5:2 G#5:4 F#5:2 E5:0.667 F#5:0.667 E5:0.667 D#5:2 C#5:2 B4:18 E5:0.667 F#5:0.667 E5:0.667 D#5:2 C#5:2 B4:6 F#5:22 G5:2 A#5:1.333 G#5:0.667 F#5:1.333 E5:0.667 D#5:1.333 C#5:0.667 B4:4"],
  },
  {
    id: 'toreador', key: 'F', cat: 'Classical', title: "Toreador Song", credit: "Georges Bizet, Carmen, 1875", bpm: 97, meter: [4, 4], accomp: 'broken',
    voices: ["C6:2 B5:2 C6:6 B5:2 C6:2 Bb5:1.667 Bb5:0.333 Ab5:2 G5:2 Ab5:6 G5:2 Ab5:2 G5:1.667 G5:0.333 F5:2 E5:2 F5:6 Eb5:2 C#5:2 C5:2 C#5:2 C5:2 Bb4:12 C#6:2 C#6:4 C#6:2 C6:1 Bb5:1 Ab5:2 Eb5:2 Ab5:2 Bb5:2 Bb5:4 Bb5:2 Ab5:1 G5:1 F5:6 Ab5:2 Eb5:2 C5:2 Eb5:2 Ab5:2 Bb5:2 C6:3 C#6:1 Eb6:4 C#6:1.333 C6:1.333 Bb5:1.333 C6:8 C6:2 B5:2 C6:6 B5:2 C6:2 Bb5:1.667 Bb5:0.333 Ab5:2 G5:2 Ab5:6 G5:2 Ab5:2 G5:1.667 G5:0.333 F5:2 E5:2 F5:6 Eb5:2 D5:2 C5:2 D5:2 C5:2 Bb4:12 C#6:2 C#6:4 C#6:2 C6:1 Bb5:1 Ab5:6 Bb5:2 Bb5:4 Bb5:2 Ab5:1 G5:1 F5:6 F#5:2 C#5:2 Bb4:2 C#5:2 F#5:2 Ab5:2 Bb5:2 C6:2 C#6:2.667 C#6:1.333 C6:1.333 B5:1.333 C6:1.333 F6:8 C6:2 B5:2 C6:6 G5:2 Eb5:2 F5:1.667 Ab5:0.333 G5:2 F#5:2 G5:6 Eb5:2 C5:2 D5:2 Eb5:2 F5:2 F#5:6 G5:2 Ab5:2 G5:2 Eb6:3 D6:1 C6:12 C#6:2 C6:2 C#6:6 C6:2 Eb6:2 C#6:1.667 C#6:0.333 C6:3 B5:1 C6:8 C5:4 C#6:2 C6:2 C#6:4 C#6:2 C6:2 Eb6:3 C#6:1 C6:7 C5:1 F5:7 Ab5:1 G5:2 G5:5 C6:1 F5:7 C6:1 E6:8 C6:24 C6:4 D6:3 C6:1 A5:4 A5:3.667 Bb5:0.333 A5:3 G5:1 A5:3 Bb5:1 A5:8 Bb5:4 G5:3 C6:1 A5:8 F5:4 D5:3 G5:1 C5:8 G5:8 G5:2 D6:2 C6:2 Bb5:1.667 Bb5:0.333 A5:2 G5:2 A5:2 Bb5:2 A5:8 E5:4 A5:4 A5:4 Ab5:2 B5:2 E6:18 D6:0.667 E6:0.667 D6:0.667 C#6:2 D6:2 G5:2 A5:2 Bb5:6 A5:0.667 Bb5:0.667 A5:0.667 F5:2 D6:2 C6:10 F5:0.667 G5:0.667 F5:0.667 C5:2 Bb5:2 A5:3.667 A5:0.333 G5:4"],
  },
  {
    id: 'eveningprayer', key: 'D', cat: 'Classical', title: "Evening Prayer", credit: "Engelbert Humperdinck, Hänsel und Gretel, 1893", bpm: 57, meter: [4, 4], accomp: 'broken',
    voices: ["D5:4 F#5:4 F#5:4 A5:4 B5:4 A5:4 A5:8 D6:4 A5:4 A5:4 F#5:4 F#5:4 E5:2 D5:2 E5:8 G5:4 G5:4 F#5:4 F#5:4 E5:8 D5:8 A5:4 A5:4 A5:4 G5:4 G5:6 F#5:2 E5:8 A#5:4 A#5:4 A5:6 A#5:2 C6:8 B5:8 D6:4 D6:4 C#6:6 D6:2 E6:8 D6:8 G5:4 B5:4 B5:4 D6:4 D6:8 A5:8 A5:4 C6:4 C6:4 E6:4 E6:8 B5:8 B5:4 D6:4 D6:4 F#6:4 F#6:4 E6:4 D6:4 G#5:4 A5:4 B5:4 C#6:4 D6:4 G6:8 F#6:6 E6:2 D6:8"],
  },
  {
    id: 'turca', key: 'Am', cat: 'Classical', title: "Rondo alla Turca", credit: "Wolfgang Amadeus Mozart, 1783", bpm: 113, meter: [2, 4], pickup: 4, accomp: 'broken',
    voices: ["B4:1 A4:1 G#4:1 A4:1 C5:4 D5:1 C5:1 B4:1 C5:1 E5:4 F5:1 E5:1 D#5:1 E5:1 B5:1 A5:1 G#5:1 A5:1 B5:1 A5:1 G#5:1 A5:1 C6:4 A5:2 C6:1.667 G5:0.333 B5:2 A5:2 G5:2 A5:1.667 G5:0.333 B5:2 A5:2 G5:2 A5:1.667 G5:0.333 B5:2 A5:2 G5:2 F#5:2 E5:4 B4:1 A4:1 G#4:1 A4:1 C5:4 D5:1 C5:1 B4:1 C5:1 E5:4 F5:1 E5:1 D#5:1 E5:1 B5:1 A5:1 G#5:1 A5:1 B5:1 A5:1 G#5:1 A5:1 C6:4 A5:2 C6:1.667 G5:0.333 B5:2 A5:2 G5:2 A5:1.667 G5:0.333 B5:2 A5:2 G5:2 A5:1.667 G5:0.333 B5:2 A5:2 G5:2 F#5:2 E5:4 E5:2 F5:2 G5:2 G5:2 A5:1 G5:1 F5:1 E5:1 D5:4 E5:2 F5:2 G5:2 G5:2 A5:1 G5:1 F5:1 E5:1 D5:4 C5:2 D5:2 E5:2 E5:2 F5:1 E5:1 D5:1 C5:1 B4:4 C5:2 D5:2 E5:2 E5:2 F5:1 E5:1 D5:1 C5:1 B4:4 B4:1 A4:1 G#4:1 A4:1 C5:4 D5:1 C5:1 B4:1 C5:1 E5:4 F5:1 E5:1 D#5:1 E5:1 B5:1 A5:1 G#5:1 A5:1 B5:1 A5:1 G#5:1 A5:1 C6:4 A5:2 B5:2 C6:2 B5:2 A5:2 G#5:2 A5:2 E5:2 F5:2 D5:2 C5:4 C5:0.667 B4:0.333 C5:0.333 B4:0.667 C5:0.667 B4:0.333 A4:0.333 B4:0.667 A4:4 E5:2 F5:2 G5:2 G5:2 A5:1 G5:1 F5:1 E5:1 D5:4 E5:2 F5:2 G5:2 G5:2 A5:1 G5:1 F5:1 E5:1 D5:4 C5:2 D5:2 E5:2 E5:2 F5:1 E5:1 D5:1 C5:1 B4:4 C5:2 D5:2 E5:2 E5:2 F5:1 E5:1 D5:1 C5:1 B4:4 B4:1 A4:1 G#4:1 A4:1 C5:4 D5:1 C5:1 B4:1 C5:1 E5:4 F5:1 E5:1 D#5:1 E5:1 B5:1 A5:1 G#5:1 A5:1 B5:1 A5:1 G#5:1 A5:1 C6:4 A5:2 B5:2"],
  },
  {
    id: 'springsong', key: 'A', cat: 'Classical', title: "Spring Song", credit: "Felix Mendelssohn, 1842", bpm: 76, meter: [2, 4], accomp: 'broken',
    voices: ["C#5:5 D5:1 D#5:1 E5:1 A5:2 E5:2 D5:2 C#5:2 B4:6 D5:2 F#5:6 D5:2 B4:5 A#4:1 B4:1 C5:1 C#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 G#4:2 A4:2 C#5:4 B4:2 E4:2 C#5:5 D5:1 D#5:1 E5:1 A5:2 E5:2 D5:2 C#5:2 B4:6 D5:2 F#5:6 E5:2 D#5:2 D5:2 C#5:2 B4:2 A4:2 G#4:2 C#5:2 B4:2 B4:4 A4:2 E4:2 E5:5 D#5:1 D5:1 C#5:1 B4:2 G#4:1.667 G#4:0.333 F#4:2 E4:2 E5:5 D#5:1 D5:1 C#5:1 B4:2 G#4:1.667 G#4:0.333 F#4:2 E4:2 G#4:2 A4:2 E5:2 A4:2 G#4:6 G#4:2 F#4:2 G4:2 E5:2 G4:2 F#4:6 F#4:1.667 A4:0.333 G#4:2 F#4:2 G#4:2 A4:2 B4:6 B4:2 E5:2 D5:2 C#5:2 B4:2 B4:4 A#4:2 C#5:2 F#5:2 D#5:2 C#5:2 B4:2 G#5:2 E5:2 D#5:2 C#5:2 B4:2 F#4:2 G#4:1.667 B4:0.333 A4:2 G#4:6 B4:2 F#5:2 D#5:2 C#5:2 B4:2 G#5:2 E5:2 D#5:2 C#5:2 B4:2 F#4:2 A4:2 D#4:2 E4:6 F4:2 F#4:6 G#4:2 A4:6 A#4:2 C#5:2 B4:2 A4:2 F#4:2 E4:6 F4:2 F#4:6 G#4:2 A4:6 A#4:2 B4:6 C#5:2 D5:5 C#5:1 D5:1 E5:1 F#5:5 C#5:1 D5:1 E5:1 F#5:5 A#4:1 B4:1 C#5:1 D5:5 A#4:1 B4:1 C#5:1 D5:1 A#4:1 B4:1 C#5:1 D5:1 A#4:1 B4:1 C#5:1 D5:1 D#5:1 E5:1 F5:1 G#5:1 F#5:1 B4:1 C#5:1 E5:1 D5:1 G#4:1 A4:1 C#5:1 B4:1 G#4:1 E4:1 C#5:5 D5:1 D#5:1 E5:1 A5:2 E5:2 D5:2 C#5:2 B4:6 D5:2 F#5:6 D5:2 B4:5 A#4:1 B4:1 C5:1 C#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 G#4:2 A4:2"],
  },
  {
    id: 'vivaldispring', key: 'E', cat: 'Classical', title: "Spring (opening)", credit: "Antonio Vivaldi, The Four Seasons, 1725", bpm: 97, meter: [3, 4], pickup: 6, accomp: 'broken',
    voices: ["E5:2 G#5:2 G#5:2 G#5:2 F#5:1 E5:1 B5:6 B5:1 A5:1 G#5:2 G#5:2 G#5:2 F#5:1 E5:1 B5:6 B5:1 A5:1 G#5:2 A5:1 B5:1 A5:2 G#5:2 F#5:2 D#5:2 B4:2 E5:2 G#5:2 G#5:2 G#5:2 F#5:1 E5:1 B5:6 B5:1 A5:1 G#5:2 G#5:2 G#5:2 F#5:1 E5:1 B5:6 B5:1 A5:1 G#5:2 A5:1 B5:1 A5:2 G#5:2 F#5:6 E5:2 B5:2 A5:1 G#5:1 A5:2 B5:2 C#6:2 B5:4 E5:2 B5:2 A5:1 G#5:1 A5:2 B5:2 C#6:2 B5:4 E5:2 C#6:2 B5:4 A5:2 G#5:2 F#5:1 E5:1 G#5:0.667 F#5:0.333 G#5:0.333 F#5:0.667 G#5:0.667 F#5:0.333 G#5:0.333 F#5:0.667 E5:6 E5:2 B5:2 A5:1 G#5:1 A5:2 B5:2 C#6:2 B5:4 E5:2 B5:2 A5:1 G#5:1 A5:2 B5:2 C#6:2 B5:4 E5:2 C#6:2 B5:4 A5:2 G#5:2 F#5:1 E5:1 G#5:0.667 F#5:0.333 G#5:0.333 F#5:0.667 G#5:0.667 F#5:0.333 G#5:0.333 F#5:0.333 C#6:0.333 B5:3.667 C#6:0.333 B5:5 A5:1 G#5:1 A5:1 A5:0.667 G#5:0.333 A5:0.333 G#5:0.667 A5:0.667 G#5:0.333 A5:0.333 G#5:1.667 A5:1 G#5:1 A5:1 A5:0.667 G#5:0.333 A5:0.333 G#5:0.667 A5:0.667 G#5:0.333 A5:0.333 G#5:2.667 B5:0.667 A5:0.333 G#5:0.333 F#5:0.667 E5:6 B5:0.667 A5:0.333 G#5:0.333 F#5:0.667 E5:5 A5:1 G#5:1 A5:1 A5:0.667 G#5:0.333 A5:0.333 G#5:0.667 A5:0.667 G#5:0.333 A5:0.333 G#5:0.667 B5:2 B5:2 B5:2 C#6:1 D#6:1 E6:1 D#6:1 C#6:1 B5:1 A5:1 G#5:1 F#5:1 E5:3 B5:0.667 A5:0.333 G#5:0.333 F#5:0.667 E5:6 B5:0.667 A5:0.333 G#5:0.333 F#5:0.667 E5:4 B5:2 B5:2 B5:2 C#6:1 D#6:1 E6:1 D#6:1 C#6:1 B5:1 A5:1 G#5:1 F#5:1 E5:7 E6:2 E6:2 E6:2 E6:2 E6:2 F#5:0.667 E5:0.333 F#5:0.333 E5:0.667 F#5:0.667 E5:0.333 F#5:0.333 E5:0.667 F#5:0.667 E5:0.333 F#5:0.333 E5:0.667 E6:2 E6:2 E6:2 E6:2 E6:2 F#5:0.667 E5:0.333 F#5:0.333 E5:0.667 F#5:0.667 E5:0.333 F#5:0.333 E5:0.667 A5:0.667 G#5:0.333 A5:0.333 G#5:0.667 A5:0.667 G#5:0.333 A5:0.333 G#5:4.667"],
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

export const CATEGORIES = ['Classics', 'Classical', 'Christmas', 'World Carols', 'Hanukkah', 'Swiss', 'Ambient', 'My tunes'];
