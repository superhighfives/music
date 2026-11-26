import type { Layout } from './music'

/** A step either waits for a chord on Move or for the Next button. */
export type TutorialStep = { text: string } & ({ kind: 'info' } | { kind: 'chord'; root: number; chord: string })

export type Tutorial = {
  id: string
  name: string
  summary: string
  key: number
  scale: string
  layout: Layout
  steps: TutorialStep[]
}

const C = 0
const D = 2
const F = 5
const G = 7
const A = 9

export const TUTORIALS: Tutorial[] = [
  {
    id: 'first-chords',
    name: 'First chords',
    summary: 'I–IV–V–I in C on the chromatic grid',
    key: C,
    scale: 'major',
    layout: 'chromatic',
    steps: [
      {
        kind: 'info',
        text: 'In Chromatic, each pad to the right is one semitone higher. Each row up is five semitones higher. So one chord shape works from any root.',
      },
      { kind: 'chord', root: C, chord: 'maj', text: 'Play C major. The cyan pad is the root. The white pads are the other chord tones.' },
      { kind: 'chord', root: F, chord: 'maj', text: 'Play F major. It is the same shape from a different root.' },
      { kind: 'chord', root: G, chord: 'maj', text: 'Play G major. Move the same shape again.' },
      { kind: 'chord', root: C, chord: 'maj', text: 'Go back to C major. You played I–IV–V–I.' },
    ],
  },
  {
    id: 'pop-progression',
    name: 'Pop progression',
    summary: 'I–V–vi–IV in C, with In-Key 4ths',
    key: C,
    scale: 'major',
    layout: 'in-key-4ths',
    steps: [
      {
        kind: 'info',
        text: 'In-Key 4ths shows only notes in the scale. Each pad to the right is the next scale note. Every pad is in key, so wrong notes are hard to play.',
      },
      { kind: 'chord', root: C, chord: 'maj', text: 'Play C major, the I chord.' },
      { kind: 'chord', root: G, chord: 'maj', text: 'Play G major, the V chord.' },
      { kind: 'chord', root: A, chord: 'min', text: 'Play A minor, the vi chord.' },
      { kind: 'chord', root: F, chord: 'maj', text: 'Play F major, the IV chord. Many pop songs loop these four chords.' },
    ],
  },
  {
    id: 'minor-loop',
    name: 'Minor loop',
    summary: 'i–VI–III–VII in A minor',
    key: A,
    scale: 'minor',
    layout: 'chromatic',
    steps: [
      { kind: 'chord', root: A, chord: 'min', text: 'Play A minor. A minor shape has its middle note one pad to the left of the major shape.' },
      { kind: 'chord', root: F, chord: 'maj', text: 'Play F major, the VI chord.' },
      { kind: 'chord', root: C, chord: 'maj', text: 'Play C major, the III chord.' },
      { kind: 'chord', root: G, chord: 'maj', text: 'Play G major, the VII chord. Then loop back to A minor.' },
    ],
  },
  {
    id: 'ii-v-i',
    name: 'Jazz ii–V–I',
    summary: 'Seventh chords in C',
    key: C,
    scale: 'major',
    layout: 'chromatic',
    steps: [
      { kind: 'chord', root: D, chord: 'm7', text: 'Play D minor 7, the ii chord. A seventh chord adds a fourth note.' },
      { kind: 'chord', root: G, chord: '7', text: 'Play G7, the V chord. It pulls toward C.' },
      { kind: 'chord', root: C, chord: 'M7', text: 'Play C major 7, the I chord. That resolves the progression.' },
    ],
  },
]

export const tutorialById = (id: string | undefined) => TUTORIALS.find((t) => t.id === id)
