import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { IntervalExplorer } from '~/theory/components/explorers'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/hooks'

/** Every key from C4 to C5, one half step at a time, lit as it plays. */
export function Chromatic() {
  const player = usePlayer()
  const notes = Array.from({ length: 13 }, (_, i) => 60 + i)
  const marks: Record<number, Mark> = {}
  if (player.current !== null) marks[notes[player.current]] = { tone: 'lit' }
  return (
    <Try title="Hear it">
      <div className="figbar">
        <PlayButton
          playing={player.playing}
          label="Play every key, C to C"
          onClick={() => (player.playing ? player.stop() : player.start(notes.map((m) => ({ notes: [m], beats: 0.5 })), { bpm: 90 }))}
        />
      </div>
      <Keyboard from={60} to={72} names="all" marks={marks} label="One octave, C4 to C5, played key by key" caption="Twelve half steps take you from C up to the next C." />
    </Try>
  )
}

export const steps: Chapter = {
  id: 'steps',
  title: 'Half steps, whole steps and accidentals',
  summary: 'The smallest distances in music, and the sharps and flats that name the black keys.',
  minutes: 14,
  cards: [
    {
      id: 'half-step',
      kind: 'concept',
      title: 'The half step',
      body: [
        'A *half step* (or semitone) is the distance from one key to the very next key, black or white. It is the smallest distance in most Western music.',
        'Twelve half steps take you from any note up to the same note an octave higher.',
      ],
    },
    {
      id: 'e-f-b-c',
      kind: 'pattern',
      title: 'E–F and B–C',
      body: [
        'There is no black key between *E and F*, or between *B and C*. Those white keys are only a half step apart.',
        'Every other pair of neighbouring white keys is a whole step apart.',
      ],
    },
    {
      id: 'whole-step',
      kind: 'concept',
      title: 'The whole step',
      body: ['A *whole step* (or tone) is two half steps. C to D is a whole step; E to F♯ is a whole step too.', 'Count every key you pass, black and white, not just the white ones.'],
    },
    {
      id: 'accidentals',
      kind: 'concept',
      title: 'Sharps, flats and naturals',
      body: ['A *sharp ♯* raises a note by a half step. A *flat ♭* lowers it by a half step. A *natural ♮* cancels either, back to the plain letter.'],
    },
    {
      id: 'enharmonic',
      kind: 'tip',
      title: 'One key, two names',
      body: [
        'C♯ and D♭ are the same key: two *enharmonic* spellings of one sound. Even white keys have them: E♯ is F, and C♭ is B.',
        'Which name you use depends on the key you are in, because each scale uses every letter once.',
      ],
    },
  ],
  check: [
    {
      prompt: 'How many half steps make a whole step?',
      options: ['1', '2', '3', '4'],
      answer: 1,
      why: 'A whole step is two half steps: skip one key and land on the next.',
    },
    {
      prompt: 'Which pair of white keys is only a half step apart?',
      options: ['C and D', 'F and G', 'E and F', 'A and B'],
      answer: 2,
      why: 'There is no black key between E and F (or between B and C), so they are neighbours.',
    },
    {
      prompt: 'What does a flat ♭ do to a note?',
      options: ['Raises it a half step', 'Lowers it a half step', 'Lowers it a whole step', 'Cancels a sharp'],
      answer: 1,
      why: 'A flat lowers a note by one half step. A natural is what cancels a sharp or flat.',
    },
    {
      prompt: 'Which note is the same key as G♭?',
      options: ['F', 'G', 'F♯', 'A♭'],
      answer: 2,
      why: 'The black key between F and G is both F♯ and G♭: enharmonic spellings.',
    },
    {
      prompt: 'E♯ is the same key as…',
      options: ['F', 'E', 'F♯', 'D'],
      answer: 0,
      why: 'E to F is a half step, so raising E by a half step lands on F.',
    },
  ],
}
