/*
 * The music theory the book draws with: spelled notes, intervals, scales, key signatures and staff positions.
 * Pitches use scientific pitch notation, where middle C is C4 and MIDI note 60.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

/** Semitones above C for each natural letter. */
const NATURAL = [0, 2, 4, 5, 7, 9, 11]

/** A note as it's written: a letter, an accidental (−2 double flat … +2 double sharp) and an octave. */
export type Note = { letter: number; acc: number; octave: number }

export const mod = (n: number, m: number) => ((n % m) + m) % m

export const ACCIDENTALS: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' }

/** "C♯", without the octave. */
export const pitchName = (n: Note) => `${LETTERS[n.letter]}${ACCIDENTALS[n.acc] ?? ''}`

/** "C♯4". */
export const noteName = (n: Note) => `${pitchName(n)}${n.octave}`

/** MIDI number. B♯3 and C4 are both 60. */
export const midiOf = (n: Note) => 12 * (n.octave + 1) + NATURAL[n.letter] + n.acc

/** Steps up the staff from C0: each line and space is one. Accidentals don't move a note. */
export const staffStep = (n: Note) => n.octave * 7 + n.letter

/** Reads "C4", "F#3", "Bb5", "Ebb2" or "C♯4". */
export function parseNote(s: string): Note {
  const m = /^([A-G])(bb|##|b|#|♭|♯|𝄫|𝄪)?(-?\d)$/.exec(s.trim())
  if (!m) throw new Error(`Not a note: ${s}`)
  const acc = { bb: -2, '𝄫': -2, b: -1, '♭': -1, '#': 1, '♯': 1, '##': 2, '𝄪': 2 }[m[2] ?? ''] ?? 0
  return { letter: LETTERS.indexOf(m[1] as Letter), acc, octave: Number(m[3]) }
}

/** Sharp spellings for each pitch class, as the keyboard labels black keys. */
const SHARP_SPELLING = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]
const FLAT_SPELLING = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6]

/** The plainest spelling of a MIDI note, with sharps or flats for the black keys. */
export function spell(midi: number, prefer: 'sharp' | 'flat' = 'sharp'): Note {
  const pc = mod(midi, 12)
  const letter = (prefer === 'sharp' ? SHARP_SPELLING : FLAT_SPELLING)[pc]
  const acc = pc - NATURAL[letter]
  return { letter, acc, octave: Math.floor((midi - acc) / 12) - 1 }
}

export const isBlackKey = (midi: number) => [1, 3, 6, 8, 10].includes(mod(midi, 12))

/** The note `steps` letters above `from` (negative for below) that sits `semitones` above it. */
export function spellAbove(from: Note, steps: number, semitones: number): Note {
  const letterIndex = from.letter + steps
  const letter = mod(letterIndex, 7)
  const octave = from.octave + Math.floor(letterIndex / 7)
  const natural = midiOf({ letter, acc: 0, octave })
  return { letter, acc: midiOf(from) + semitones - natural, octave }
}

// Intervals

const PERFECT = new Set([1, 4, 5])
/** Semitones in the perfect or major interval of each simple size, unison to seventh. */
const REFERENCE = [0, 2, 4, 5, 7, 9, 11]

export const INTERVAL_NUMBERS = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave']

export type Interval = {
  /** 1 for a unison, 8 for an octave, 10 for a tenth. */
  number: number
  semitones: number
  quality: 'P' | 'M' | 'm' | 'A' | 'd'
  /** "M3", "P5", "A4". */
  short: string
  /** "major 3rd". */
  name: string
}

const QUALITY_NAMES = { P: 'perfect', M: 'major', m: 'minor', A: 'augmented', d: 'diminished' }

/** The interval from `a` up to `b`, named by letters (the number) and semitones (the quality). */
export function interval(a: Note, b: Note): Interval {
  const number = staffStep(b) - staffStep(a) + 1
  const semitones = midiOf(b) - midiOf(a)
  const simple = mod(number - 1, 7)
  const octaves = Math.floor((number - 1) / 7)
  const diff = semitones - octaves * 12 - REFERENCE[simple]
  let quality: Interval['quality']
  if (PERFECT.has(simple + 1)) quality = diff === 0 ? 'P' : diff > 0 ? 'A' : 'd'
  else quality = diff === 0 ? 'M' : diff === -1 ? 'm' : diff > 0 ? 'A' : 'd'
  const size = number === 8 ? 'octave' : number < 8 ? INTERVAL_NUMBERS[number - 1] : ordinal(number)
  const name = quality === 'P' && (number === 1 || number === 8) ? (number === 1 ? 'unison' : 'octave') : `${QUALITY_NAMES[quality]} ${size}`
  return { number, semitones, quality, short: `${quality}${number}`, name }
}

const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'}`

/** The everyday name for a distance in semitones, as the keyboard explorer shows it. */
export const SEMITONE_NAMES = [
  'unison',
  'minor 2nd',
  'major 2nd',
  'minor 3rd',
  'major 3rd',
  'perfect 4th',
  'tritone',
  'perfect 5th',
  'minor 6th',
  'major 6th',
  'minor 7th',
  'major 7th',
  'octave',
]

// Scales

export type ScaleType = { id: string; name: string; steps: number[] }

/** Each scale as semitones above its root, one per letter. */
export const SCALE_TYPES: ScaleType[] = [
  { id: 'major', name: 'Major', steps: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: 'Natural minor', steps: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'harmonic', name: 'Harmonic minor', steps: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic', name: 'Melodic minor', steps: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'dorian', name: 'Dorian', steps: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', steps: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', steps: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', steps: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', steps: [0, 1, 3, 5, 6, 8, 10] },
]

export const scaleType = (id: string) => SCALE_TYPES.find((s) => s.id === id) ?? SCALE_TYPES[0]

/** A scale spelled with one of each letter, from `root` up to its octave (eight notes). */
export function scale(root: Note, type: ScaleType): Note[] {
  return [...type.steps, 12].map((semis, i) => spellAbove(root, i, semis))
}

/** "W" and "H" (and "W+H" for a step and a half) between each pair of neighbouring notes. */
export function stepPattern(notes: Note[]): string[] {
  return notes.slice(1).map((n, i) => {
    const semis = midiOf(n) - midiOf(notes[i])
    return semis === 1 ? 'H' : semis === 2 ? 'W' : semis === 3 ? 'W+H' : `${semis}`
  })
}

// Keys

/** Major keys round the circle of fifths, by how many sharps (positive) or flats (negative) they have. */
export const MAJOR_KEYS = [
  { sig: 0, tonic: 'C' },
  { sig: 1, tonic: 'G' },
  { sig: 2, tonic: 'D' },
  { sig: 3, tonic: 'A' },
  { sig: 4, tonic: 'E' },
  { sig: 5, tonic: 'B' },
  { sig: 6, tonic: 'F#' },
  { sig: 7, tonic: 'C#' },
  { sig: -1, tonic: 'F' },
  { sig: -2, tonic: 'Bb' },
  { sig: -3, tonic: 'Eb' },
  { sig: -4, tonic: 'Ab' },
  { sig: -5, tonic: 'Db' },
  { sig: -6, tonic: 'Gb' },
  { sig: -7, tonic: 'Cb' },
]

/** Sharps are added in this order, a fifth apart; flats in the reverse. */
export const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
export const FLAT_ORDER = [...SHARP_ORDER].reverse()

/** Where each sharp or flat of a key signature sits on the treble staff, as a staff step. */
const TREBLE_SHARPS = [38, 35, 39, 36, 33, 37, 34]
const TREBLE_FLATS = [34, 37, 33, 36, 32, 35, 31]

export type Clef = 'treble' | 'bass'

/** The staff step of each clef's bottom line: E4 on treble, G2 on bass. */
export const BOTTOM_LINE: Record<Clef, number> = { treble: 30, bass: 18 }

/** The staff steps of a key signature's sharps or flats on a clef. Bass sits a line lower than treble. */
export function keySignatureSteps(sig: number, clef: Clef): number[] {
  const steps = (sig >= 0 ? TREBLE_SHARPS : TREBLE_FLATS).slice(0, Math.abs(sig))
  return clef === 'treble' ? steps : steps.map((s) => s - 14)
}

/** The key signature's accidental for each letter, C to B. */
export function signatureAccidentals(sig: number): number[] {
  const accs = [0, 0, 0, 0, 0, 0, 0]
  const order = sig >= 0 ? SHARP_ORDER : FLAT_ORDER
  for (const l of order.slice(0, Math.abs(sig))) accs[LETTERS.indexOf(l as Letter)] = Math.sign(sig)
  return accs
}

// Chords

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented'

/** A triad's quality from its two stacked thirds, in semitones above the root. */
export function triadQuality(third: number, fifth: number): TriadQuality | null {
  if (third === 4 && fifth === 7) return 'major'
  if (third === 3 && fifth === 7) return 'minor'
  if (third === 3 && fifth === 6) return 'diminished'
  if (third === 4 && fifth === 8) return 'augmented'
  return null
}

/** Triads built on each degree of a scale, stacking every other note. */
export function diatonicTriads(root: Note, type: ScaleType) {
  const notes = scale(root, type).slice(0, 7)
  const ext = [...notes, ...notes.map((n) => ({ ...n, octave: n.octave + 1 }))]
  return notes.map((n, i) => {
    const third = midiOf(ext[i + 2]) - midiOf(n)
    const fifth = midiOf(ext[i + 4]) - midiOf(n)
    const quality = triadQuality(third, fifth)
    return { degree: i + 1, root: n, notes: [n, ext[i + 2], ext[i + 4]], quality, numeral: numeral(i + 1, quality) }
  })
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function numeral(degree: number, quality: TriadQuality | null) {
  const r = ROMAN[degree - 1]
  if (quality === 'major') return r
  if (quality === 'minor') return r.toLowerCase()
  if (quality === 'diminished') return `${r.toLowerCase()}°`
  if (quality === 'augmented') return `${r}+`
  return r
}

// Rhythm

/** Note values in beats of a quarter note. */
export const DURATIONS = {
  whole: 4,
  half: 2,
  quarter: 1,
  eighth: 0.5,
  sixteenth: 0.25,
} as const
export type Duration = keyof typeof DURATIONS

/** One note or rest in a rhythm. A dot adds half the value again. */
export type RhythmEvent = { value: Duration; rest?: boolean | undefined; dot?: boolean | undefined }

export const beatsOf = (e: RhythmEvent) => DURATIONS[e.value] * (e.dot ? 1.5 : 1)

/** Reads "q q e e h" style shorthand: w h q e s, "." for a dot, "r" before a letter for a rest. */
export function parseRhythm(s: string): RhythmEvent[] {
  const map: Record<string, Duration> = { w: 'whole', h: 'half', q: 'quarter', e: 'eighth', s: 'sixteenth' }
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const m = /^(r?)([whqes])(\.?)$/.exec(tok)
      if (!m) throw new Error(`Not a rhythm: ${tok}`)
      return { value: map[m[2]], rest: m[1] === 'r' || undefined, dot: m[3] === '.' || undefined }
    })
}
