import { Rhythm } from '~/theory/components/Rhythm'
import { Aside, Big, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'

const TREE = [
  { name: 'Whole', beats: '4 beats', count: 1 },
  { name: 'Half', beats: '2 beats', count: 2 },
  { name: 'Quarter', beats: '1 beat', count: 4 },
  { name: 'Eighth', beats: '½ beat', count: 8 },
  { name: 'Sixteenth', beats: '¼ beat', count: 16 },
]

/** The note value tree: each row splits the one above in two. */
export function ValueTree() {
  const x0 = 120
  const w = 520
  const row = 40
  return (
    <figure className="fig">
      <svg viewBox={`0 0 ${x0 + w + 8} ${TREE.length * row + 4}`} role="img" aria-labelledby="treeT">
        <title id="treeT">
          The note value tree: one whole note equals two halves, four quarters, eight eighths or sixteen sixteenths
        </title>
        {TREE.map((r, i) => {
          const bw = w / r.count
          return (
            <g key={r.name}>
              <text x={0} y={i * row + 20} style={{ font: '600 14px var(--sans)', fill: 'var(--ink)' }}>
                {r.name}
              </text>
              <text x={0} y={i * row + 35} style={{ font: '400 12px var(--sans)', fill: 'var(--muted)' }}>
                {r.beats}
              </text>
              {Array.from({ length: r.count }, (_, j) => (
                <rect
                  key={j}
                  x={x0 + j * bw + 1.5}
                  y={i * row + 6}
                  width={bw - 3}
                  height={28}
                  rx={Math.min(6, bw / 4)}
                  style={{
                    fill: i % 2 ? 'var(--lit-soft)' : 'var(--cool-soft)',
                    stroke: i % 2 ? 'var(--lit)' : 'var(--cool)',
                    strokeWidth: 1,
                  }}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <figcaption>Each row fills the same bar of 4/4. Every note value is half the one above it.</figcaption>
    </figure>
  )
}

export const rhythm: Chapter = {
  id: 'rhythm',
  title: 'Rhythm: beats and note values',
  summary: 'The pulse under every song, and how long each note lasts.',
  minutes: 15,
  cards: [
    {
      id: 'beat',
      kind: 'concept',
      title: 'The beat',
      body: [
        'Under almost all music runs a steady pulse: the *beat*. It’s what your foot taps along to.',
        'How fast the beats come is the *tempo*, in beats per minute. Beats are grouped into *bars*, most often of four.',
      ],
    },
    {
      id: 'values',
      kind: 'pattern',
      title: 'Note values halve',
      body: [
        'Whole, half, quarter, eighth, sixteenth: each note value lasts *half as long* as the one before.',
        'In 4/4, a quarter note is one beat, so a half note is two and a whole note is four.',
      ],
    },
    {
      id: 'counting',
      kind: 'tip',
      title: 'Counting “1 & 2 &”',
      body: [
        'Count eighth notes as *1 & 2 & 3 & 4 &*, with the “and” halfway between beats. Count sixteenths as *1 e & a*.',
        'Say it out loud, and keep the numbers steady: the beat never speeds up for small notes.',
      ],
    },
    {
      id: 'rests',
      kind: 'concept',
      title: 'Rests are counted silence',
      body: ['Each note value has a *rest* of the same length. The beat carries on through a rest; you just don’t play.'],
    },
    {
      id: 'dots',
      kind: 'pattern',
      title: 'A dot adds half',
      body: [
        'A *dot* after a note adds half its value again: a dotted half note lasts 3 beats, a dotted quarter 1½.',
        'A dotted quarter followed by an eighth, long then short, is one of the most common rhythms there is.',
      ],
    },
  ],
  check: [
    {
      prompt: 'In 4/4, how many beats does a half note last?',
      options: ['1', '2', '3', '4'],
      answer: 1,
      why: 'A whole note is four beats, and a half note is half of that.',
    },
    {
      prompt: 'How many eighth notes fit in one beat (one quarter note)?',
      options: ['1', '2', '4', '8'],
      answer: 1,
      why: 'Each value halves the one before, so two eighths make a quarter. We count them “1 &”.',
    },
    {
      prompt: 'How long is a dotted half note?',
      options: ['2 beats', '2½ beats', '3 beats', '4 beats'],
      answer: 2,
      why: 'A dot adds half the value again: 2 + 1 = 3.',
    },
    {
      prompt: 'What does the beat do during a rest?',
      options: ['It stops', 'It keeps going', 'It speeds up', 'It starts again from 1'],
      answer: 1,
      why: 'A rest is silence you count. The pulse carries on underneath.',
    },
    {
      prompt: 'How do you count four sixteenth notes in one beat?',
      options: ['1 2 3 4', '1 & 2 &', '1 e & a', '1 & a'],
      answer: 2,
      why: 'Sixteenths split each beat in four: “1 e & a”.',
    },
  ],
}
