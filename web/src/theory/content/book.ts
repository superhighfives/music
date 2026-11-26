import { keyboard } from './chapters/keyboard'
import { majorScale } from './chapters/major-scale'
import { rhythm } from './chapters/rhythm'
import { staff } from './chapters/staff'
import { steps } from './chapters/steps'
import type { Card, Chapter, Part } from './types'

/** The book's name, wherever it's shown and in the daily email. */
export const BOOK_TITLE = 'Theory'
export const BOOK_SUBTITLE = 'Music theory, drawn out'

/*
 * The book, in reading order. To add a chapter: write it in chapters/, add it to its part's
 * `chapters`, and remove its title from `planned`. Its cards join the daily email automatically.
 */
export const PARTS: Part[] = [
  {
    id: 'foundations',
    title: 'Sound and the page',
    level: 'Foundations',
    blurb: 'The keyboard, the staff and the beat: how notes are named, written and counted.',
    chapters: [keyboard, steps, staff, rhythm],
    planned: [
      { title: 'Meter and time signatures', summary: 'Bars, strong and weak beats, 4/4, 3/4 and 6/8.' },
    ],
  },
  {
    id: 'scales',
    title: 'Scales and keys',
    level: 'Beginner',
    blurb: 'The patterns melodies are made from, and the twelve keys they move between.',
    chapters: [majorScale],
    planned: [
      { title: 'Key signatures and the circle of fifths', summary: 'Why G has one sharp, and the map of every key.' },
      { title: 'Minor scales', summary: 'Natural, harmonic and melodic minor, and relative keys.' },
      { title: 'Intervals', summary: 'Naming the distance between any two notes, and hearing it.' },
      { title: 'Pentatonic and blues scales', summary: 'Five notes that never clash, and the blue note.' },
    ],
  },
  {
    id: 'harmony',
    title: 'Chords and harmony',
    level: 'Intermediate',
    blurb: 'Stacking notes into chords, and how chords pull towards each other.',
    chapters: [],
    planned: [
      { title: 'Triads', summary: 'Major, minor, diminished and augmented: stacking thirds.' },
      { title: 'Chords in a key', summary: 'I ii iii IV V vi vii°: Roman numerals and the family of chords.' },
      { title: 'Seventh chords', summary: 'Adding a fourth note: maj7, 7, m7 and half-diminished.' },
      { title: 'Inversions and voice leading', summary: 'Moving between chords with the smallest steps.' },
      { title: 'Cadences and function', summary: 'Tonic, predominant, dominant: tension and release.' },
    ],
  },
  {
    id: 'songwriting',
    title: 'Theory for songwriting',
    level: 'Intermediate',
    blurb: 'The progressions, melodies and forms behind songs you know.',
    chapters: [],
    planned: [
      { title: 'Progressions that work', summary: 'I–V–vi–IV, ii–V–I, the 50s and the Andalusian cadence.' },
      { title: 'Writing melody', summary: 'Contour, chord tones, motifs and where to leap.' },
      { title: 'Song form', summary: 'Verses, choruses, bridges and phrase lengths.' },
      { title: 'Borrowed chords', summary: 'Mixing major and minor: ♭VI, ♭VII and iv in a major key.' },
      { title: 'Modes for songwriting', summary: 'Dorian, Mixolydian, Lydian: the colour of each.' },
      { title: 'Syncopation and groove', summary: 'Off-beats, anticipation, swing and feel.' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced harmony',
    level: 'Advanced',
    blurb: 'Leaving the key and coming back: the tools of jazz, film and adventurous pop.',
    chapters: [],
    planned: [
      { title: 'Secondary dominants', summary: 'V of V, and borrowing the pull of a dominant for any chord.' },
      { title: 'Modulation', summary: 'Changing key: pivot chords, direct shifts and the truck-driver’s change.' },
      { title: 'Extended and altered chords', summary: '9ths, 11ths, 13ths, and altered dominants.' },
      { title: 'Reharmonisation', summary: 'Tritone substitutions, chromatic mediants and new chords under old tunes.' },
      { title: 'Counterpoint', summary: 'Independent lines that fit: species counterpoint for writers.' },
    ],
  },
]

/** Every written chapter, in reading order. */
export const CHAPTERS: Chapter[] = PARTS.flatMap((p) => p.chapters)

export const findChapter = (id: string) => CHAPTERS.find((c) => c.id === id)

export const partOf = (chapter: Chapter) => PARTS.find((p) => p.chapters.includes(chapter))

/** A card with where it's from. Its key, `<chapter>.<card>`, is how the daily email tracks it. */
export type BookCard = Card & { key: string; chapter: Chapter }

/** Every card in reading order: the daily email's queue. */
export const CARDS: BookCard[] = CHAPTERS.flatMap((chapter) => chapter.cards.map((c) => ({ ...c, key: `${chapter.id}.${c.id}`, chapter })))

/** Edition log, newest first. Add a line when a chapter lands. */
export const LOG: [string, string][] = [
  ['2026-11-26', 'Part I’s first four chapters, from the keyboard to rhythm, and Part II opens with the major scale.'],
  ['2026-11-26', 'The book opens: Part I begins with Notes and the keyboard, plus the daily email.'],
]

/** One line of the contents: a written chapter, or one still planned. Numbers run through the whole book. */
export type Entry = { n: number; part: Part } & ({ chapter: Chapter } | { planned: { title: string; summary: string } })

export const CONTENTS: Entry[] = (() => {
  let n = 0
  return PARTS.flatMap((part) => [
    ...part.chapters.map((chapter) => ({ n: ++n, part, chapter })),
    ...part.planned.map((planned) => ({ n: ++n, part, planned })),
  ])
})()

export const chapterNumber = (chapter: Chapter) => CONTENTS.find((e) => 'chapter' in e && e.chapter === chapter)?.n ?? 0

/** Today's card on the home page, the same for everyone on a given UTC day. */
export function cardOfTheDay(date = new Date()): BookCard | undefined {
  const day = Math.floor(date.getTime() / 86_400_000)
  return CARDS[day % CARDS.length]
}
