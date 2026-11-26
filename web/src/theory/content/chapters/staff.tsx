import { NoteNamer } from '~/theory/components/explorers'
import { Staff } from '~/theory/components/Staff'
import { Aside, Big, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'

export const staff: Chapter = {
  id: 'staff',
  title: 'Reading pitch: the staff and clefs',
  summary: 'Five lines, two clefs, and landmarks for reading notes fast.',
  minutes: 16,
  Body: () => (
    <>
      <p className="lede">
        The keyboard shows notes side by side. Written music stacks them up instead: higher notes sit higher on the page. Once you can read
        that page, you can read a melody, a chord or a whole piano part, and every figure in this book becomes something you could play.
      </p>

      <Section id="lines-and-spaces" title="Five lines, four spaces">
        <p>
          Music is written on a <Term>staff</Term>: five horizontal lines with four spaces between them. A note can sit <i>on</i> a line, with the
          line running through its middle, or <i>in</i> a space, between two lines.
        </p>
        <Staff
          items={[
            { notes: ['E4'], label: 'line' },
            { notes: ['F4'], label: 'space' },
            { notes: ['G4'], label: 'line' },
            { notes: ['A4'], label: 'space' },
            { notes: ['B4'], label: 'line' },
          ]}
          label="Notes going up the staff, alternating line, space, line, space, line"
          caption="Each step up goes from a line to the next space, or a space to the next line."
        />
        <p>
          Moving up one line or space is moving up one letter: C to D, D to E. So the staff is a ladder of the white keys, and reading it is
          mostly counting rungs.
        </p>
        <Big>Line, space, line, space: each step up the staff is the next letter.</Big>
      </Section>

      <Section id="treble" title="The treble clef">
        <p>
          On its own, a staff doesn't say which note is which. A <Term>clef</Term> at the start fixes that. The <Term>treble clef</Term>, also
          called the G clef, curls around the second line from the bottom and marks it as <b>G4</b>, the G above middle C.
        </p>
        <Staff
          items={[{ notes: ['G4'], tone: 'lit', label: 'G4' }]}
          label="Treble clef with G4 on the second line, where the clef curls"
          caption="The treble clef's curl wraps round the G line."
        />
        <p>
          From G you can count to anything: one step up is A in the space above, one step down is F in the space below. Here are the lines and
          spaces of the treble staff, bottom to top.
        </p>
        <Staff items="E4 F4 G4 A4 B4 C5 D5 E5 F5" names label="Every line and space of the treble staff, E4 up to F5, named" />
        <Aside label="Mnemonics">
          The lines, bottom to top, are E G B D F: <b>Every Good Boy Does Fine</b>. The spaces spell <b>FACE</b>. They're handy at first, but
          don't stop there; see the section on landmarks below.
        </Aside>
        <p>The treble clef is used for higher sounds: the right hand on a piano, voices, guitar, violin, flute.</p>
      </Section>

      <Section id="bass" title="The bass clef">
        <p>
          The <Term>bass clef</Term>, or F clef, is for lower sounds: the piano's left hand, bass guitar, cello. Its two dots sit either side of the
          fourth line, and mark it as <b>F3</b>, the F below middle C.
        </p>
        <Staff
          clef="bass"
          items={[{ notes: ['F3'], tone: 'lit', label: 'F3' }]}
          label="Bass clef with F3 on the fourth line, between the clef's two dots"
          caption="The bass clef's dots sit either side of the F line."
        />
        <Staff clef="bass" items="G2 A2 B2 C3 D3 E3 F3 G3 A3" names label="Every line and space of the bass staff, G2 up to A3, named" />
        <Aside label="Mnemonics">
          Bass lines, bottom to top: G B D F A, <b>Good Boys Do Fine Always</b>. Bass spaces: A C E G, <b>All Cows Eat Grass</b>.
        </Aside>
      </Section>

      <Section id="ledger" title="Ledger lines and middle C">
        <p>
          Notes can go above or below the staff. Short extra lines, called <Term>ledger lines</Term>, extend the staff just for that note. The
          most important one is <b>middle C</b>: one ledger line below the treble staff.
        </p>
        <Staff
          items={[
            { notes: ['A3'] },
            { notes: ['B3'] },
            { notes: ['C4'], tone: 'lit', label: 'C4' },
            { notes: ['D4'] },
            { bar: true },
            { notes: ['G5'] },
            { notes: ['A5'], label: 'A5' },
            { notes: ['C6'], label: 'C6' },
          ]}
          label="Notes below and above the treble staff on ledger lines, with middle C lit"
          caption="Middle C sits on one ledger line below the treble staff. Above, A5 takes one ledger line and C6 two."
        />
        <p>
          Ledger lines follow the same rule as the staff: line, space, line. Count them the way you'd count the lines of the staff, and the
          note's letter follows.
        </p>
      </Section>

      <Section id="grand" title="The grand staff">
        <p>
          Piano music joins a treble staff and a bass staff with a brace into a <Term>grand staff</Term>. Middle C sits between them: one ledger
          line below the treble staff, or one ledger line above the bass staff. Same key, same sound, written in whichever staff is nearer.
        </p>
        <Staff
          clef="grand"
          items={[
            { notes: ['C4'], tone: 'lit', label: 'C4', staff: 'treble' },
            { notes: ['C4'], tone: 'lit', label: 'C4', staff: 'bass' },
            { bar: true },
            { notes: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4'], label: 'C chord' },
          ]}
          label="A grand staff: middle C written in the treble staff and again in the bass staff, then a C chord spread across both"
          caption="Middle C can be written in either staff. A chord can spread across both."
        />
      </Section>

      <Section id="landmarks" title="Read by landmarks">
        <p>
          Mnemonics work, but spelling out every note from the bottom line is slow. Fluent readers learn a handful of <b>landmark notes</b> by
          sight, then count steps from the nearest one.
        </p>
        <Staff
          clef="grand"
          items={[
            { notes: ['C3'], tone: 'cool', label: 'C3' },
            { notes: ['F3'], tone: 'cool', label: 'F3' },
            { notes: ['C4'], tone: 'lit', label: 'C4', staff: 'treble' },
            { notes: ['G4'], tone: 'cool', label: 'G4' },
            { notes: ['C5'], tone: 'cool', label: 'C5' },
          ]}
          label="Landmark notes on the grand staff: bass C3 and F3, middle C, treble G4 and C5"
          caption="Five landmarks: bass C3 (second space) and F3 (the F line), middle C, treble G4 (the G line) and C5 (third space)."
        />
        <p>
          To read any note, find the nearest landmark and count: a line to the next space is one letter. D5 is one step above the C5 landmark; E3
          is one step below F3. Before long you won't count at all; you'll just see them.
        </p>
        <Try title="Name the note, treble clef">
          <NoteNamer clef="treble" />
        </Try>
        <Try title="Name the note, bass clef">
          <NoteNamer clef="bass" />
        </Try>
      </Section>

      <Section id="accidentals" title="Sharps and flats on the staff">
        <p>
          An accidental is written just <i>before</i> the note it changes, on the same line or space. The note stays in the same place; the sign
          moves it up or down a half step.
        </p>
        <Staff items="F#4 Bb4 C#5 Eb5" names label="F sharp, B flat, C sharp and E flat on the treble staff, each with its sign in front" />
        <p>
          Within a bar, an accidental lasts until the bar line, so a second F in the same bar is still F♯ unless a natural ♮ cancels it. The
          next bar starts fresh.
        </p>
        <Staff
          items={[{ notes: ['F#4'], label: 'F♯' }, { notes: ['F#4'], label: 'still F♯' }, { notes: ['F4'], tone: 'lit', label: 'F♮' }]}
          label="F sharp, then F sharp again without a sign shown, then F natural with a natural sign"
          caption="The figure draws every sign; on real sheet music the second F♯ would have none, because the first carries through the bar."
        />
      </Section>
    </>
  ),
  cards: [
    {
      id: 'staff',
      kind: 'concept',
      title: 'The staff',
      body: [
        'Music is written on a *staff*: five lines and four spaces. Higher on the staff means higher in pitch.',
        'Each step from a line to the next space (or space to line) is the next letter of the musical alphabet.',
      ],
    },
    {
      id: 'treble-clef',
      kind: 'concept',
      title: 'The treble clef',
      body: [
        'The *treble clef* (G clef) curls round the second line from the bottom and makes it *G4*, the G above middle C.',
        'Lines bottom to top: E G B D F, Every Good Boy Does Fine. Spaces: F A C E.',
      ],
    },
    {
      id: 'bass-clef',
      kind: 'concept',
      title: 'The bass clef',
      body: [
        'The *bass clef* (F clef) puts its two dots either side of the fourth line and makes it *F3*, the F below middle C.',
        'Lines: G B D F A, Good Boys Do Fine Always. Spaces: A C E G, All Cows Eat Grass.',
      ],
    },
    {
      id: 'middle-c',
      kind: 'pattern',
      title: 'Middle C on the grand staff',
      body: [
        'Middle C sits on one *ledger line* between the two staves: just below the treble staff, or just above the bass staff. Same key either way.',
      ],
    },
    {
      id: 'landmarks',
      kind: 'tip',
      title: 'Read by landmarks',
      body: [
        'Learn five notes by sight: bass *C3* and *F3*, *middle C*, treble *G4* and *C5*. To read anything else, count steps from the nearest one.',
        'It is faster than spelling every note out with a mnemonic, and soon you stop counting at all.',
      ],
    },
  ],
  check: [
    {
      prompt: 'Which note is on the second line of the treble staff, where the clef curls?',
      figure: <Staff items="G4" label="A note on the second line of the treble staff" />,
      options: ['E', 'G', 'B', 'F'],
      answer: 1,
      why: 'The treble clef is a G clef: its curl marks the G line, G4.',
    },
    {
      prompt: 'What is this note?',
      figure: <Staff items="C4" label="A note on one ledger line below the treble staff" />,
      options: ['A', 'B', 'C', 'D'],
      answer: 2,
      why: 'One ledger line below the treble staff is middle C, C4.',
    },
    {
      prompt: 'Which line do the bass clef’s two dots surround?',
      options: ['G', 'C', 'F', 'A'],
      answer: 2,
      why: 'The bass clef is an F clef: its dots sit either side of the F line, F3.',
    },
    {
      prompt: 'What is this note in the bass clef?',
      figure: <Staff clef="bass" items="A2" label="A note in the bottom space of the bass staff" />,
      options: ['F', 'A', 'C', 'E'],
      answer: 1,
      why: 'The bass spaces from the bottom are A C E G (All Cows Eat Grass), so the bottom space is A.',
    },
    {
      prompt: 'An F♯ appears at the start of a bar. A later F in the same bar has no sign. What is it?',
      options: ['F', 'F♯', 'F♭', 'It depends on the clef'],
      answer: 1,
      why: 'An accidental lasts until the end of the bar, unless a natural cancels it.',
    },
  ],
}
