/** @jsxImportSource ~/content */
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
function ValueTree() {
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
            <g>
              <text x={0} y={i * row + 20} style={{ font: '600 14px var(--sans)', fill: 'var(--ink)' }}>
                {r.name}
              </text>
              <text x={0} y={i * row + 35} style={{ font: '400 12px var(--sans)', fill: 'var(--muted)' }}>
                {r.beats}
              </text>
              {Array.from({ length: r.count }, (_, j) => (
                <rect
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
  Body: () => (
    <>
      <p className="lede">
        Pitch is where a note sits; rhythm is <i>when</i> it happens and how long it lasts. You already feel rhythm: it's why your foot taps along
        to a song. This chapter gives names to what your foot already knows.
      </p>

      <Section id="beat" title="The beat">
        <p>
          Under almost all music runs a steady pulse, like a heartbeat or a clock ticking. That's the <Term>beat</Term>. When you nod your head
          to a song, you're nodding on the beat. How fast the beats come is the <Term>tempo</Term>, measured in beats per minute (bpm).
        </p>
        <Try title="Tap along">
          <p className="prompt">Press play and tap your foot or a finger with each click. Each note lands on a beat.</p>
          <Rhythm rhythm="q q q q q q q q" bpm={80} label="Eight quarter notes, one on each beat" />
        </Try>
        <p>
          Beats are grouped into <Term>bars</Term> (also called measures), most often of four. The first beat of each bar feels a little stronger,
          which is why the metronome clicks higher there. Counting four beats to a bar is called <b>4/4</b>, or common time; the next chapter is
          all about these groupings.
        </p>
      </Section>

      <Section id="values" title="Note values">
        <p>
          Written music shows how long each note lasts by its shape. Hollow or filled head, a stem or not, flags or beams: each detail halves the
          length. Everything is measured against the <Term>whole note</Term>, which fills a whole bar of 4/4.
        </p>
        <ValueTree />
        <Big>Each note value is half the one before: whole, half, quarter, eighth, sixteenth.</Big>
        <p>
          In 4/4, a quarter note gets one beat. That makes a half note two beats and a whole note four. Hear how the same bar can hold one long
          note or several shorter ones:
        </p>
        <Rhythm rhythm="w" counts label="One whole note, four beats long" caption="A whole note: held for all four beats." />
        <Rhythm rhythm="h h" label="Two half notes" caption="Two half notes: two beats each. Hollow heads with stems." />
        <Rhythm rhythm="q q q q" label="Four quarter notes" caption="Four quarter notes: one beat each. Filled heads with stems." />
      </Section>

      <Section id="counting" title="Counting smaller notes">
        <p>
          Shorter than a beat, notes are counted by splitting the beat. Two eighth notes share one beat; we count them <b>“1 &amp; 2 &amp;”</b>,
          saying “and” halfway between beats. Eighth notes have one flag, and when they come in groups their flags join into a <Term>beam</Term>.
        </p>
        <Rhythm rhythm="e e e e e e e e" bpm={76} label="Eight eighth notes, counted 1 and 2 and 3 and 4 and" />
        <p>
          Split each eighth again and you get sixteenth notes: four to a beat, with two beams. We count them <b>“1 e &amp; a”</b> (say “one ee
          and uh”).
        </p>
        <Rhythm rhythm="s s s s s s s s e e q" bpm={66} label="Sixteenth notes, then eighths, then a quarter" />
        <Aside label="Say it out loud">
          Counting aloud is the fastest way to learn rhythm. Keep the numbers on the beat steady and fit the “&amp;”s and “e”s in between. The
          beat never speeds up for the small notes.
        </Aside>
      </Section>

      <Section id="rests" title="Rests: measured silence">
        <p>
          Silence in music is counted too. Each note value has a matching <Term>rest</Term> that lasts just as long. The beat carries on
          through a rest; you just don't play.
        </p>
        <Rhythm rhythm="q rq q rq" label="Quarter note, quarter rest, quarter note, quarter rest" caption="Notes on 1 and 3, rests on 2 and 4. The counts in brackets are silent." />
        <Rhythm rhythm="h rh" label="Half note then half rest" caption="A half note, then a half rest: two beats of silence." />
        <Rhythm rhythm="re e re e re e re e" bpm={84} label="Eighth rests on the beats, eighth notes on the ands" caption="Rests on the beat, notes on the “&”: the start of a groove." />
      </Section>

      <Section id="dots-ties" title="Dots and ties">
        <p>
          A <Term>dot</Term> after a note adds half its value again. A half note is two beats, so a dotted half note is three. A dotted quarter
          is one and a half beats, which leaves room for an eighth to finish the beat. That long-short pair is everywhere in music.
        </p>
        <Rhythm rhythm="h. q" label="A dotted half note then a quarter note" caption="Dotted half: 2 + 1 = 3 beats." />
        <Rhythm rhythm="q. e q q" label="Dotted quarter, eighth, quarter, quarter" caption="Dotted quarter and eighth: long, short, then two steady beats." />
        <p>
          A <Term>tie</Term> is a curved line joining two notes of the same pitch: you play the first and hold it through the second. Ties let a
          note last across a barline, or for a length no single symbol can show.
        </p>
      </Section>
    </>
  ),
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
