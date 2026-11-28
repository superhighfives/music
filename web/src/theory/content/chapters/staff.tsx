import { NoteNamer } from '~/theory/components/explorers'
import { Staff } from '~/theory/components/Staff'
import { Aside, Big, Section, Term, Try } from '~/theory/components/ui'
import type { Chapter } from '~/theory/content/types'

export const staff: Chapter = {
  id: 'staff',
  title: 'Reading pitch: the staff and clefs',
  summary: 'Five lines, two clefs, and landmarks for reading notes fast.',
  minutes: 16,
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
