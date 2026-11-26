export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const

export const COLS = 8
export const ROWS = 4

export type Scale = { id: string; name: string; intervals: number[] }

// Interval sets from standard theory. Move's manual does not list its scale menu,
// so this list may not match the device's names or order.
export const SCALES: Scale[] = [
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'minor', name: 'Minor', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'locrian', name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'harmonic-minor', name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melodic-minor', name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'major-pentatonic', name: 'Major Pentatonic', intervals: [0, 2, 4, 7, 9] },
  { id: 'minor-pentatonic', name: 'Minor Pentatonic', intervals: [0, 3, 5, 7, 10] },
  { id: 'minor-blues', name: 'Minor Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { id: 'whole-tone', name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  { id: 'half-whole-dim', name: 'Half-Whole Diminished', intervals: [0, 1, 3, 4, 6, 7, 9, 10] },
  { id: 'whole-half-dim', name: 'Whole-Half Diminished', intervals: [0, 2, 3, 5, 6, 8, 9, 11] },
]

export type Layout = 'chromatic' | 'in-key-4ths' | 'in-key-octaves'

export const LAYOUTS: { id: Layout; name: string }[] = [
  { id: 'chromatic', name: 'Chromatic' },
  { id: 'in-key-4ths', name: 'In-Key 4ths' },
  { id: 'in-key-octaves', name: 'In-Key Octaves' },
]

/** A chord tone: semitones above the root, and an optional pad position relative to the root pad. */
type Tone = { interval: number; at: [col: number, row: number]; optional?: boolean }

export type ChordType = { id: string; name: string; tones: Tone[] }

const R: Tone = { interval: 0, at: [0, 0] }
const t = (interval: number, col: number, row: number, optional = false): Tone => ({
  interval,
  at: [col, row],
  optional,
})

/**
 * Shapes from the "Chords in Isomorphic Note Layout" chart (Push, Chromatic + Fixed On).
 * Move's Chromatic mode uses the same grid: +1 semitone per column, +5 per row.
 */
export const CHORD_TYPES: ChordType[] = [
  { id: 'maj', name: 'Major', tones: [R, t(4, 4, 0), t(7, 2, 1)] },
  { id: 'min', name: 'minor', tones: [R, t(3, 3, 0), t(7, 2, 1)] },
  { id: '7', name: 'dom7', tones: [R, t(4, 4, 0), t(7, 2, 1), t(10, 0, 2)] },
  { id: 'm7', name: 'm7', tones: [R, t(3, 3, 0), t(7, 2, 1), t(10, 0, 2)] },
  { id: 'M7', name: 'M7', tones: [R, t(4, 4, 0), t(7, 2, 1), t(11, 1, 2)] },
  { id: 'mM7', name: 'mM7', tones: [R, t(3, 3, 0), t(7, 2, 1), t(11, 1, 2)] },
  { id: '6', name: '6', tones: [R, t(4, 4, 0), t(7, 2, 1), t(9, 4, 1)] },
  { id: 'm6', name: 'm6', tones: [R, t(3, 3, 0), t(7, 2, 1), t(9, 4, 1)] },
  { id: '6add9', name: '6add9', tones: [R, t(4, 4, 0), t(7, 2, 1, true), t(9, 4, 1), t(14, 4, 2)] },
  { id: '9', name: '9', tones: [R, t(4, 4, 0), t(7, 2, 1, true), t(10, 0, 2), t(14, 4, 2)] },
  { id: 'm9', name: 'm9', tones: [R, t(3, 3, 0), t(7, 2, 1), t(10, 0, 2), t(14, 4, 2)] },
  { id: 'maj9', name: 'maj9', tones: [R, t(4, 4, 0), t(7, 2, 1), t(11, 1, 2), t(14, 4, 2)] },
  { id: 'add2', name: 'add2', tones: [R, t(2, 2, 0), t(4, 4, 0), t(7, 2, 1)] },
  { id: 'add9', name: 'add9', tones: [R, t(4, 4, 0), t(7, 2, 1), t(14, 4, 2)] },
  { id: 'sus2', name: 'sus2', tones: [R, t(2, 2, 0), t(7, 2, 1)] },
  { id: 'sus4', name: 'sus4', tones: [R, t(5, 0, 1), t(7, 2, 1)] },
  { id: 'dim', name: 'dim', tones: [R, t(3, 3, 0), t(6, 1, 1)] },
  { id: 'dim7', name: 'dim7', tones: [R, t(3, 3, 0), t(6, 1, 1), t(9, 4, 1)] },
  { id: 'm7b5', name: 'm7♭5', tones: [R, t(3, 3, 0), t(6, 1, 1), t(10, 0, 2)] },
  { id: 'aug', name: 'aug', tones: [R, t(4, 4, 0), t(8, 3, 1)] },
  { id: 'aug7', name: 'aug7', tones: [R, t(4, 4, 0), t(8, 3, 1), t(10, 0, 2)] },
  { id: '7b5', name: '7♭5', tones: [R, t(4, 4, 0), t(6, 1, 1), t(10, 0, 2)] },
  // Not on the chart. Added for the harmonic and melodic minor III chord.
  { id: 'augM7', name: 'augM7', tones: [R, t(4, 4, 0), t(8, 3, 1), t(11, 1, 2)] },
  { id: '11', name: '11', tones: [R, t(4, 4, 0, true), t(7, 2, 1), t(10, 0, 2), t(14, 4, 2), t(17, 2, 3)] },
  { id: 'm11', name: 'm11', tones: [R, t(3, 3, 0, true), t(7, 2, 1), t(10, 0, 2), t(14, 4, 2, true), t(17, 2, 3)] },
]

/** Groups for the chord picker. Every chord type is in exactly one group. */
export const CHORD_FAMILIES: { name: string; ids: string[] }[] = [
  { name: 'Triads', ids: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'] },
  { name: '7ths', ids: ['7', 'm7', 'M7', 'mM7', 'm7b5', 'dim7', 'aug7', 'augM7', '7b5'] },
  { name: 'Color', ids: ['6', 'm6', 'add2', 'add9', '6add9', '9', 'm9', 'maj9', '11', 'm11'] },
]

export const chordType = (id: string) => CHORD_TYPES.find((c) => c.id === id) ?? CHORD_TYPES[0]
export const scaleById = (id: string) => SCALES.find((s) => s.id === id) ?? SCALES[0]

export type Pad = { col: number; row: number; midi: number }

// Ableton numbers octaves so that MIDI 60 is C3.
const C3 = 60

/**
 * Pitch of every pad, indexed [row][col] with row 0 at the bottom.
 * Chromatic: per the Move manual, C3 is the 4th pad of the bottom row in C, so the
 * bottom-left pad defaults to A2. `chromaticBase` lets the user match their device.
 * In-Key: the bottom-left pad is the key root. Each pad to the right is the next degree.
 * A row up is one octave (Octaves) or a perfect fourth (4ths).
 */
export function padGrid(layout: Layout, key: number, scale: Scale, chromaticBase: number): Pad[][] {
  const n = scale.intervals.length
  const rowStep = layout === 'in-key-octaves' ? n : fourthStep(scale)
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      if (layout === 'chromatic') {
        return { col, row, midi: C3 - 12 + chromaticBase + col + 5 * row }
      }
      const degree = col + rowStep * row
      const midi = C3 - 12 + key + 12 * Math.floor(degree / n) + scale.intervals[degree % n]
      return { col, row, midi }
    }),
  )
}

/**
 * Scale degrees per row in the In-Key 4ths layout. For seven-note scales this is
 * three degrees. For other scales it is the first degree at or above a perfect
 * fourth. The manual does not describe non-heptatonic 4ths rows, so this is a guess.
 */
export function fourthStep(scale: Scale) {
  if (scale.intervals.length === 7) return 3
  const i = scale.intervals.findIndex((iv) => iv >= 5)
  return i === -1 ? scale.intervals.length : i
}

export type Voicing = {
  /** Pads to press, one per tone that the grid can play. */
  pads: { col: number; row: number; midi: number; interval: number; optional: boolean }[]
  /** Required tones that no pad in range can play. */
  missing: number[]
  /** True when the pads follow the isomorphic chord chart exactly. */
  fromChart: boolean
}

/**
 * All root-position voicings of a chord on the grid, one per root pad.
 * Chromatic uses the chart shape where it fits. Otherwise, and in In-Key layouts,
 * it searches for the most compact pads that give each tone in some octave above the root.
 */
export function voicings(grid: Pad[][], rootPc: number, type: ChordType, layout: Layout): Voicing[] {
  const pads = grid.flat()
  const roots = pads.filter((p) => mod(p.midi, 12) === rootPc)
  const result: Voicing[] = []
  for (const root of roots) {
    // Chromatic falls back to a searched shape when the chart shape runs off the grid.
    const v = (layout === 'chromatic' && chartVoicing(grid, root, type)) || searchVoicing(pads, root, type)
    if (v) result.push(v)
  }
  // Complete voicings first, then chart shapes, then the most compact.
  return result.sort(
    (a, b) =>
      a.missing.length - b.missing.length || Number(b.fromChart) - Number(a.fromChart) || spread(a) - spread(b),
  )
}

function chartVoicing(grid: Pad[][], root: Pad, type: ChordType): Voicing | null {
  const pads: Voicing['pads'] = []
  for (const tone of type.tones) {
    const pad = grid[root.row + tone.at[1]]?.[root.col + tone.at[0]]
    if (!pad) return null
    pads.push({ ...pad, interval: tone.interval, optional: !!tone.optional })
  }
  return { pads, missing: [], fromChart: true }
}

function searchVoicing(pads: Pad[], root: Pad, type: ChordType): Voicing | null {
  const chosen: Voicing['pads'] = [{ ...root, interval: 0, optional: false }]
  const missing: number[] = []
  for (const tone of type.tones.slice(1)) {
    const candidates = pads.filter(
      (p) => p.midi > root.midi && mod(p.midi - root.midi, 12) === mod(tone.interval, 12),
    )
    if (candidates.length === 0) {
      if (!tone.optional) missing.push(tone.interval)
      continue
    }
    // Prefer the closest pad to the root, then the lowest pitch.
    candidates.sort((a, b) => dist(a, root) - dist(b, root) || a.midi - b.midi)
    const best = candidates[0]
    chosen.push({ ...best, interval: tone.interval, optional: !!tone.optional })
  }
  if (chosen.length === 1) return null
  return { pads: chosen, missing, fromChart: false }
}

const dist = (a: { col: number; row: number }, b: { col: number; row: number }) =>
  Math.hypot(a.col - b.col, a.row - b.row)

function spread(v: Voicing) {
  const cols = v.pads.map((p) => p.col)
  const rows = v.pads.map((p) => p.row)
  return Math.max(...cols) - Math.min(...cols) + Math.max(...rows) - Math.min(...rows)
}

export const mod = (n: number, m: number) => ((n % m) + m) % m

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export type DiatonicChord = { degree: number; numeral: string; rootPc: number; type: ChordType }

/** Chords built in stacked thirds on each degree of a seven-note scale. */
export function diatonicChords(key: number, scale: Scale, sevenths: boolean): DiatonicChord[] {
  const iv = scale.intervals
  if (iv.length !== 7) return []
  return iv.flatMap((_, d) => {
    const at = (step: number) => iv[(d + step) % 7] + 12 * Math.floor((d + step) / 7) - iv[d]
    const stack = sevenths ? [0, at(2), at(4), at(6)] : [0, at(2), at(4)]
    const type = CHORD_TYPES.find(
      (c) => c.tones.length === stack.length && c.tones.every((tone, i) => tone.interval === stack[i]),
    )
    if (!type) return []
    const minorish = stack[1] === 3
    const numeral =
      (minorish ? ROMAN[d].toLowerCase() : ROMAN[d]) +
      (type.id === 'dim' || type.id === 'dim7' ? '°' : type.id === 'm7b5' ? 'ø' : type.id === 'aug' ? '+' : '')
    return [{ degree: d, numeral, rootPc: mod(key + iv[d], 12), type }]
  })
}

/**
 * Checks held notes against a chord in any voicing or octave.
 * `wrong`: a held note is not in the chord. `complete`: every required tone is held.
 */
export function chordMatch(held: number[], rootPc: number, type: ChordType): 'empty' | 'partial' | 'wrong' | 'complete' {
  if (held.length === 0) return 'empty'
  const chordPcs = new Set(type.tones.map((t) => mod(rootPc + t.interval, 12)))
  const heldPcs = new Set(held.map((m) => mod(m, 12)))
  if ([...heldPcs].some((p) => !chordPcs.has(p))) return 'wrong'
  const required = type.tones.filter((t) => !t.optional).map((t) => mod(rootPc + t.interval, 12))
  return required.every((p) => heldPcs.has(p)) ? 'complete' : 'partial'
}

export const noteName = (midi: number) => NOTE_NAMES[mod(midi, 12)]
export const noteWithOctave = (midi: number) => `${noteName(midi)}${Math.floor(midi / 12) - 2}`
