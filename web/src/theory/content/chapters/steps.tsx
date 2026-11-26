import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { IntervalExplorer } from '~/theory/components/explorers'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/audio'

/** Every key from C4 to C5, one half step at a time, lit as it plays. */
function Chromatic() {
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
  Body: () => (
    <>
      <p className="lede">
        The last chapter gave every white key a name. This one measures the space between keys, and names the black keys too. Those small
        distances, the half step and the whole step, are the bricks every scale and chord is built from.
      </p>

      <Section id="half-step" title="The half step">
        <p>
          A <Term>half step</Term> is the distance from one key to the very next key, black or white, with nothing in between. It's the smallest
          distance on a keyboard, and in most Western music. You'll also hear it called a <Term>semitone</Term>.
        </p>
        <Keyboard
          from={60}
          to={71}
          names="white"
          marks={{ 60: { tone: 'lit' }, 61: { tone: 'cool' } }}
          arcs={[{ from: 60, to: 61, label: '½', tone: 'lit' }]}
          label="C to C sharp: one half step, from a white key to the black key right next to it"
          caption="C to the black key just right of it: one half step."
        />
        <Big>A half step is one key to the very next key. Nothing in between.</Big>
        <Chromatic />
      </Section>

      <Section id="no-black-key" title="Where there's no black key">
        <p>
          Look at the gaps in the pattern of black keys. Between <b>E and F</b>, and between <b>B and C</b>, there's no black key at all. Those
          white keys sit right next to each other, so they're only a half step apart.
        </p>
        <Keyboard
          from={60}
          to={72}
          names="white"
          marks={{ 64: { tone: 'lit' }, 65: { tone: 'lit' }, 71: { tone: 'cool' }, 72: { tone: 'cool' } }}
          arcs={[
            { from: 64, to: 65, label: '½', tone: 'lit' },
            { from: 71, to: 72, label: '½' },
          ]}
          label="E to F and B to C: white keys a half step apart, with no black key between"
          caption="E–F and B–C are the two pairs of white keys a half step apart."
        />
        <p>
          Every other pair of neighbouring white keys has a black key between them, so they're two half steps apart. That unevenness is not a
          flaw: it's what gives the major scale its shape, as you'll see in a later chapter.
        </p>
      </Section>

      <Section id="whole-step" title="The whole step">
        <p>
          Two half steps make a <Term>whole step</Term>, also called a <Term>tone</Term>. From C, a whole step up skips the black key and lands on
          D. From E, a whole step up skips F and lands on the black key above it.
        </p>
        <Keyboard
          from={60}
          to={71}
          names="white"
          marks={{ 60: { tone: 'lit' }, 62: { tone: 'lit' }, 64: { tone: 'cool' }, 66: { tone: 'cool' } }}
          arcs={[
            { from: 60, to: 62, label: 'W', tone: 'lit' },
            { from: 64, to: 66, label: 'W' },
          ]}
          label="Two whole steps: C to D, and E to the black key above F"
          caption="A whole step is always two keys away, counting the one you skip."
        />
        <Try>
          <p className="prompt">Press any two keys to count the half steps between them.</p>
          <IntervalExplorer mode="steps" from={60} to={76} />
        </Try>
        <Aside label="Count keys, not colours">
          The easy mistake is to count white keys only. E to F looks like a whole step because they're two different white keys, but it's a half
          step. Always count every key you pass.
        </Aside>
      </Section>

      <Section id="accidentals" title="Sharps, flats and naturals">
        <p>
          The black keys borrow their names from the white keys beside them, using signs called <Term>accidentals</Term>:
        </p>
        <ul>
          <li>
            A <b>sharp ♯</b> raises a note by a half step. C♯ is the key just above C.
          </li>
          <li>
            A <b>flat ♭</b> lowers a note by a half step. D♭ is the key just below D.
          </li>
          <li>
            A <b>natural ♮</b> cancels a sharp or flat, back to the plain letter.
          </li>
        </ul>
        <Keyboard
          from={60}
          to={71}
          names="all"
          label="One octave with the black keys named with sharps"
          caption="Named with sharps: each black key is the white key on its left, raised."
        />
        <Keyboard
          from={60}
          to={71}
          names="all"
          prefer="flat"
          label="The same octave with the black keys named with flats"
          caption="Named with flats: each black key is the white key on its right, lowered."
        />
      </Section>

      <Section id="enharmonics" title="One key, two names">
        <p>
          So the black key between C and D is both C♯ and D♭. Two names for the same sound are called <Term>enharmonic</Term> spellings. Play
          C♯ and D♭ on a piano and it's the very same key.
        </p>
        <Keyboard
          from={60}
          to={71}
          names="white"
          marks={{ 61: { tone: 'lit', label: 'C♯' }, 63: { tone: 'cool', label: 'E♭' }, 66: { tone: 'lit', label: 'F♯' }, 70: { tone: 'cool', label: 'B♭' } }}
          label="Black keys labelled C sharp, E flat, F sharp and B flat"
          caption="C♯ is also D♭, E♭ is also D♯, F♯ is also G♭, B♭ is also A♯."
        />
        <p>
          White keys can have second names too. Since E to F is a half step, raising E gives you F: <b>E♯ is F</b>. Lowering C gives you B:{' '}
          <b>C♭ is B</b>. These look strange at first, and they're rare, but they turn up in keys with lots of sharps or flats.
        </p>
      </Section>

      <Section id="spelling" title="Why the name matters">
        <p>
          If C♯ and D♭ sound the same, why keep both names? Because the name tells you what the note is <i>doing</i>. In a scale, each letter
          is used once, so the same key gets a different name depending on the notes around it: in the key of D major it's C♯, and in A♭
          major it's D♭.
        </p>
        <p>
          Think of it like spelling: <i>their</i> and <i>there</i> sound the same but mean different things. Choosing the right spelling makes
          music far easier to read, and you'll lean on it in the chapters on scales and intervals.
        </p>
        <Aside label="Coming up">
          The next chapter puts all of this on paper: the staff, where every letter has its own line or space, and accidentals sit just in front
          of the note.
        </Aside>
      </Section>
    </>
  ),
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
