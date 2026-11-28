import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { ScaleExplorer } from '~/theory/components/explorers'
import { Staff } from '~/theory/components/Staff'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/hooks'

const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72]
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
const STEPS = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

/** C major on the white keys, with each step's size drawn above. */
export function CMajor() {
  const player = usePlayer()
  const marks: Record<number, Mark> = {}
  C_MAJOR.forEach((m, i) => (marks[m] = { tone: player.current === i ? 'lit' : i === 0 || i === 7 ? 'cool' : 'soft', label: NAMES[i] }))
  const arcs = STEPS.map((s, i) => ({ from: C_MAJOR[i], to: C_MAJOR[i + 1], label: s, tone: s === 'H' ? ('lit' as const) : undefined }))
  return (
    <Try title="Hear it">
      <div className="figbar">
        <PlayButton
          playing={player.playing}
          label="Play C major"
          onClick={() => (player.playing ? player.stop() : player.start(C_MAJOR.map((m) => ({ notes: [m], beats: 1 })), { bpm: 120 }))}
        />
      </div>
      <Keyboard
        from={60}
        to={72}
        names="none"
        marks={marks}
        arcs={arcs}
        label="C major scale on the white keys, with whole steps between every pair except E to F and B to C, which are half steps"
        caption="No black key between E and F, or between B and C: those are the half steps."
      />
    </Try>
  )
}

/** The scale climbing, then the last note left hanging, then resolved home. */
export function Home() {
  const player = usePlayer()
  const hang = [60, 62, 64, 65, 67, 69, 71]
  return (
    <div className="figbar">
      <PlayButton
        playing={player.playing}
        label="Stop on 7"
        onClick={() => (player.playing ? player.stop() : player.start(hang.map((m, i) => ({ notes: [m], beats: i === 6 ? 3 : 1 })), { bpm: 120 }))}
      />
      <PlayButton
        playing={false}
        label="Then go home"
        onClick={() => player.start([{ notes: [71], beats: 1 }, { notes: [72], beats: 3 }], { bpm: 100 })}
      />
    </div>
  )
}

export const majorScale: Chapter = {
  id: 'major-scale',
  title: 'The major scale',
  summary: 'W W H W W W H: one pattern, twelve keys.',
  minutes: 15,
  cards: [
    {
      id: 'pattern',
      kind: 'pattern',
      title: 'W W H W W W H',
      body: [
        'Every major scale follows the same steps: *whole, whole, half, whole, whole, whole, half*.',
        'The half steps fall between degrees 3 and 4, and between 7 and 8.',
      ],
    },
    {
      id: 'c-major',
      kind: 'concept',
      title: 'C major is the white keys',
      body: [
        'Play the white keys from C to C and you’ve played the C major scale. E to F and B to C have no black key between them: they’re the half steps.',
      ],
    },
    {
      id: 'one-letter',
      kind: 'tip',
      title: 'One of each letter',
      body: [
        'A major scale uses every letter once, in order. That’s why G major has *F♯*, not G♭, and F major has *B♭*, not A♯.',
      ],
    },
    {
      id: 'degrees',
      kind: 'concept',
      title: 'Scale degrees',
      body: [
        'The notes of a scale are numbered 1 to 7. *1 is the tonic*, home; 5 is the dominant; 7 is the leading tone, a half step below home.',
        'Numbers work the same in every key, which is why songwriters think in them.',
      ],
    },
    {
      id: 'leading-tone',
      kind: 'listen',
      title: 'The pull of 7 to 1',
      body: [
        'Sing up a major scale and stop on the seventh note, “ti”. It hangs in the air, waiting. That half step up to the tonic is the strongest pull in the scale.',
      ],
    },
  ],
  check: [
    {
      prompt: 'Which is the pattern of steps in a major scale?',
      options: ['W H W W H W W', 'W W H W W W H', 'W W W H W W H', 'H W W W H W W'],
      answer: 1,
      why: 'Whole, whole, half, whole, whole, whole, half, with half steps between 3–4 and 7–8.',
    },
    {
      prompt: 'Which sharp does G major need?',
      options: ['C♯', 'G♯', 'F♯', 'D♯'],
      answer: 2,
      why: 'From E the pattern needs a whole step, so F is raised to F♯, leaving a half step up to G.',
    },
    {
      prompt: 'Why is F major spelled with B♭ rather than A♯?',
      options: ['Flats sound lower', 'Each letter is used once', 'A♯ isn’t a real note', 'Major keys only use flats'],
      answer: 1,
      why: 'F major already has an A, so the fourth note must be some kind of B: B♭.',
    },
    {
      prompt: 'In any major key, what is scale degree 1 called?',
      options: ['Dominant', 'Leading tone', 'Tonic', 'Subdominant'],
      answer: 2,
      why: 'The tonic is home, the note the scale is named after.',
    },
    {
      prompt: 'Between which degrees of a major scale are the half steps?',
      options: ['2–3 and 6–7', '3–4 and 7–8', '1–2 and 5–6', '4–5 and 7–8'],
      answer: 1,
      why: 'In C, that’s E–F and B–C, the white keys with no black key between them.',
    },
  ],
}
