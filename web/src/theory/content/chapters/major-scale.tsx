import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { ScaleExplorer } from '~/theory/components/explorers'
import { Staff } from '~/theory/components/Staff'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/audio'

const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72]
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']
const STEPS = ['W', 'W', 'H', 'W', 'W', 'W', 'H']

/** C major on the white keys, with each step's size drawn above. */
function CMajor() {
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
function Home() {
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
  Body: () => (
    <>
      <p className="lede">
        Sing “do re mi fa so la ti do” and you've sung a major scale. It's the backbone of most of the music you know, from nursery rhymes to pop
        choruses. Better still, it's one simple pattern of steps, and once you know it you can build it from any note.
      </p>

      <Section id="ladder" title="A scale is a ladder">
        <p>
          A <Term>scale</Term> is a set of notes climbing in order from one note up to the same note an octave higher, like rungs on a ladder.
          The note it starts and ends on gives the scale its name. Play the white keys from C to the next C and you've played the{' '}
          <b>C major scale</b>.
        </p>
        <CMajor />
        <p>
          The rungs aren't evenly spaced. Most of the steps are <b>whole steps</b> (two keys apart, with a black key between). But between E and F,
          and between B and C, there's no black key, so those steps are <b>half steps</b>.
        </p>
      </Section>

      <Section id="pattern" title="The pattern: W W H W W W H">
        <p>Write the steps out in order and you get the recipe for every major scale:</p>
        <Big>Whole, whole, half, whole, whole, whole, half.</Big>
        <p>
          The half steps always fall between notes <b>3 and 4</b> and between <b>7 and 8</b>. That's what makes a major scale sound major. Some
          people remember it as two groups: W W H, then a whole step, then W W H again.
        </p>
        <Staff items="C4 D4 E4 F4 G4 A4 B4 C5" names label="The C major scale on the treble staff, from C4 to C5" caption="C major on the staff: no sharps or flats needed." />
      </Section>

      <Section id="other-keys" title="Starting somewhere else">
        <p>
          C major is the only major scale that fits on the white keys alone. Start on G, follow the pattern, and something has to give. G to A is
          whole, A to B whole, B to C half. So far so good. Then C, D, E, each a whole step. But the next step must be <i>whole</i>, and E to F
          is only a half step. So we raise F to <b>F♯</b>, and F♯ to G is the final half step.
        </p>
        <Try>
          <ScaleExplorer initial="G" />
        </Try>
        <p>
          Start on F and the opposite happens: A to B is a whole step, but the pattern needs a half step there, so B comes down to <b>B♭</b>.
          Pick other roots above and watch which keys turn black.
        </p>
        <Aside label="One of each letter">
          A major scale uses every letter once, in order. That's why G major has F♯ rather than G♭: G is already taken, and F still needs a
          place. The same rule decides whether a scale is spelled with sharps or flats.
        </Aside>
        <p>
          Because each major key always needs the same sharps or flats, music writes them once at the start of each line, in a{' '}
          <Term>key signature</Term>. Here's G major with its one sharp:
        </p>
        <Staff keySig={1} items="G4 A4 B4 C5 D5 E5 F#5 G5" names label="G major scale with a key signature of one sharp, F sharp" caption="The ♯ on the top line means every F is F♯." />
      </Section>

      <Section id="degrees" title="Scale degrees">
        <p>
          Musicians number the notes of a scale from <b>1 to 7</b> (8 is 1 again). These numbers are <Term>scale degrees</Term>, and they work
          the same in every key: in C, degree 5 is G; in G, it's D. Thinking in numbers is how songwriters talk about melodies and chords without
          caring which key they're in.
        </p>
        <p>
          A few degrees have names you'll meet again. <b>1</b> is the <b>tonic</b>, home. <b>5</b> is the <b>dominant</b>, the strongest pull back
          home. <b>4</b> is the <b>subdominant</b>. And <b>7</b>, a half step below the tonic, is the <b>leading tone</b>, because it leads so
          strongly up to 1. Singers know them as do re mi fa so la ti.
        </p>
      </Section>

      <Section id="home" title="Why it sounds like home">
        <p>
          Play the scale but stop on 7. It sounds unfinished, like a question. That half step up to 1 is the tug you feel. The tonic is where
          melodies want to rest, and much of music is the art of leaving home and coming back.
        </p>
        <Try title="Hear the pull">
          <Home />
        </Try>
      </Section>
    </>
  ),
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
