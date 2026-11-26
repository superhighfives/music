import { Keyboard, type Mark } from '~/theory/components/Keyboard'
import { NoteFinder } from '~/theory/components/explorers'
import { Aside, Big, PlayButton, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'
import { usePlayer } from '~/theory/lib/audio'

/** The groups of two and three black keys, shaded. */
function Groups() {
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

function Octaves() {
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
  Body: () => (
    <>
      <p className="lede">
        Every piece of music you've ever heard is built from a small set of notes, used over and over at different heights. The piano keyboard lays
        them all out in a row, so it's the clearest picture of them there is. Learn its pattern once and you can find any note, on any instrument.
      </p>

      <Section id="pitch" title="Pitch: high and low">
        <p>
          <Term>Pitch</Term> is how high or low a sound is. A bird's chirp is high; a bass guitar is low. On a keyboard, pitch goes up as you move
          right and down as you move left. Press a few keys below, from one end to the other, and listen to the pitch climb.
        </p>
        <Keyboard from={48} to={83} names="none" label="A three-octave keyboard to play" caption="Low on the left, high on the right." />
      </Section>

      <Section id="alphabet" title="The musical alphabet">
        <p>
          Notes are named with just seven letters: <b>A B C D E F G</b>. After G, the letters start again at A. That's the whole alphabet, and it
          repeats all the way up and down the keyboard.
        </p>
        <Big>A B C D E F G, then A again. Seven names, repeating forever.</Big>
        <p>
          The white keys are those seven letters in order. Most music starts its counting from C rather than A (you'll see why in the major scale
          chapter), so we'll read them as C D E F G A B.
        </p>
        <Keyboard from={60} to={83} names="white" label="Two octaves with every white key named C D E F G A B" />
      </Section>

      <Section id="pattern" title="The pattern of black keys">
        <p>
          The white keys all look the same, so how do you know which is C? The black keys tell you. They come in <b>groups of two</b> and{' '}
          <b>groups of three</b>, alternating all the way along.
        </p>
        <Groups />
        <p>
          Every note has a fixed place in that pattern. <b>C is the white key just left of each group of two.</b> Once you can see C, the rest
          follow: D sits <i>between</i> the two black keys, E just right of them. F is just left of the group of three, and G, A and B run through
          it.
        </p>
        <Try>
          <NoteFinder letter="C" />
        </Try>
        <Try title="Try another">
          <NoteFinder letter="F" />
        </Try>
        <Aside label="Landmarks">
          Two landmarks are worth learning cold: <b>C</b>, left of the two, and <b>F</b>, left of the three. Every other white key is one step from
          one of them.
        </Aside>
      </Section>

      <Section id="octaves" title="Octaves: the same note, higher">
        <p>
          Play a C, then the next C up. They sound different, one higher, and yet somehow the <i>same</i>. That's an <Term>octave</Term>: twelve
          keys up from any note, counting black and white, you reach the same letter again.
        </p>
        <Octaves />
        <p>
          Underneath, an octave is a doubling. A4, the A above middle C, vibrates 440 times a second; A5 vibrates 880 times. Your ear hears
          notes whose frequencies double as the same note, which is why the alphabet can repeat.
        </p>
        <p>
          To say <i>which</i> C, we add a number. The C near the middle of a piano is <Term>middle C</Term>, written <b>C4</b>. The next C up is
          C5, the one below is C3. The number changes at every C, so the B just below middle C is B3.
        </p>
        <Keyboard
          from={57}
          to={74}
          names="none"
          marks={{ 59: { tone: 'soft', label: 'B3' }, 60: { tone: 'lit', label: 'C4' }, 62: { tone: 'soft', label: 'D4' }, 72: { tone: 'cool', label: 'C5' } }}
          label="Middle C, C4, with B3 just below and C5 an octave above"
          caption="Octave numbers go up at C: B3, then C4."
        />
      </Section>

      <Section id="twelve" title="Twelve keys, then it repeats">
        <p>
          Count every key from one C up to (but not including) the next: seven white and five black, <b>twelve</b> in all. Those twelve are every
          pitch Western music uses. Everything else in this book, from scales and chords to whole songs, is a way of choosing from those twelve.
        </p>
        <Aside label="Black keys' names">
          The black keys have names too, borrowed from the white keys beside them: the one between C and D is C sharp or D flat. That's the next
          chapter.
        </Aside>
      </Section>
    </>
  ),
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
