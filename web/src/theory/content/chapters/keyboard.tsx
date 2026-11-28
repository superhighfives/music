import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { NoteFinder } from '~/theory/components/explorers'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/hooks'

/** The groups of two and three black keys, shaded. */
export function Groups() {
  const marks: Record<number, Mark> = {}
  for (const m of [61, 63, 73, 75]) marks[m] = { tone: 'cool' }
  for (const m of [66, 68, 70, 78, 80, 82]) marks[m] = { tone: 'lit' }
  for (const m of [60, 72]) marks[m] = { tone: 'soft', label: 'C' }
  return (
    <Keyboard
      from={60}
      to={83}
      names="none"
      marks={marks}
      label="Two octaves of keyboard: black keys in groups of two (blue) and three (orange), with each C just left of a group of two"
      caption="Blue: the groups of two. Orange: the groups of three. C sits just left of every group of two."
    />
  )
}

const CS = [48, 60, 72, 84]

export function Octaves() {
  const player = usePlayer()
  const marks: Record<number, Mark> = {}
  CS.forEach((m, i) => (marks[m] = { tone: player.current === i ? 'lit' : 'soft', label: `C${m / 12 - 1}` }))
  return (
    <Try title="Hear it">
      <div className="figbar">
        <PlayButton
          playing={player.playing}
          label="Play the Cs, low to high"
          onClick={() => (player.playing ? player.stop() : player.start(CS.map((m) => ({ notes: [m], beats: 1 })), { bpm: 70 }))}
        />
      </div>
      <Keyboard from={48} to={84} names="none" marks={marks} label="Three octaves with C3, C4, C5 and C6 marked" />
    </Try>
  )
}

export const keyboard: Chapter = {
  id: 'keyboard',
  title: 'Notes and the keyboard',
  summary: 'Seven letters, twelve keys, and the pattern that lets you find any note.',
  minutes: 12,
  cards: [
    {
      id: 'alphabet',
      kind: 'concept',
      title: 'The musical alphabet',
      body: [
        'Music names its notes with seven letters: *A B C D E F G*. After G comes A again.',
        'The white keys of a piano are those seven letters in order, repeating all the way up.',
      ],
    },
    {
      id: 'find-c',
      kind: 'pattern',
      title: 'Finding C',
      body: [
        'Black keys come in groups of two and three. *C is the white key just left of each group of two*; F is just left of each group of three.',
        'Learn those two landmarks and every other white key is one step away.',
      ],
    },
    {
      id: 'octave',
      kind: 'concept',
      title: 'Octaves',
      body: [
        'Twelve keys up from any note, you reach the same letter again: an *octave*. It sounds like the same note, higher.',
        'An octave doubles the frequency: A4 is 440 vibrations a second, A5 is 880.',
      ],
    },
    {
      id: 'middle-c',
      kind: 'tip',
      title: 'Middle C is C4',
      body: ['The C nearest the middle of a piano is *C4*. Octave numbers go up at each C, so the B just below middle C is B3, not B4.'],
    },
  ],
  check: [
    {
      prompt: 'Which note is the white key just left of a group of two black keys?',
      options: ['A', 'C', 'F', 'G'],
      answer: 1,
      why: 'C is left of the two; F is left of the three.',
    },
    {
      prompt: 'What comes after G in the musical alphabet?',
      options: ['H', 'A', 'C', 'G again'],
      answer: 1,
      why: 'The alphabet has only seven letters, so after G it starts again at A.',
    },
    {
      prompt: 'How many keys, black and white, are there in one octave?',
      options: ['7', '8', '12', '13'],
      answer: 2,
      why: 'Seven white and five black: twelve different pitches before the pattern repeats.',
    },
    {
      prompt: 'Which is higher, B3 or C4?',
      options: ['B3', 'C4', 'They’re the same'],
      answer: 1,
      why: 'Octave numbers change at C, so B3 is the key just below C4.',
    },
  ],
}
