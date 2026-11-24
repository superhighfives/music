import { describe, expect, it } from 'vitest'
import { CHORD_FAMILIES, CHORD_TYPES, SCALES, diatonicChords, padGrid, scaleById, voicings } from './music'

const major = scaleById('major')

describe('chart shapes', () => {
  it('match their intervals on a +1 column / +5 row grid', () => {
    for (const type of CHORD_TYPES) {
      for (const tone of type.tones) {
        expect(tone.at[0] + 5 * tone.at[1], `${type.name} ${tone.interval}`).toBe(tone.interval)
      }
    }
  })
})

describe('CHORD_FAMILIES', () => {
  it('lists every chord type exactly once', () => {
    expect(CHORD_FAMILIES.flatMap((f) => f.ids).sort()).toEqual(CHORD_TYPES.map((c) => c.id).sort())
  })
})

describe('padGrid', () => {
  it('puts C3 on the 4th bottom pad in chromatic C (per the Move manual)', () => {
    const grid = padGrid('chromatic', 0, major, 9)
    expect(grid[0][3].midi).toBe(60)
    expect(grid[1][0].midi - grid[0][0].midi).toBe(5)
  })

  it('stacks octaves and fourths in key', () => {
    const oct = padGrid('in-key-octaves', 0, major, 9)
    expect(oct[0].map((p) => p.midi)).toEqual([48, 50, 52, 53, 55, 57, 59, 60])
    expect(oct[1][0].midi).toBe(60)
    const fourths = padGrid('in-key-4ths', 2, scaleById('dorian'), 9)
    expect(fourths[1][0].midi - fourths[0][0].midi).toBe(5)
  })
})

describe('voicings', () => {
  it('uses the chart shape in chromatic mode', () => {
    const grid = padGrid('chromatic', 0, major, 9)
    const [v] = voicings(grid, 0, CHORD_TYPES[0], 'chromatic')
    expect(v.pads.map((p) => p.midi % 12).sort()).toEqual([0, 4, 7])
  })

  it('finds every required tone in key when the chord is diatonic', () => {
    for (const layout of ['in-key-4ths', 'in-key-octaves'] as const) {
      for (const scale of SCALES.filter((s) => s.intervals.length === 7)) {
        const grid = padGrid(layout, 5, scale, 9)
        for (const chord of diatonicChords(5, scale, true)) {
          const [best] = voicings(grid, chord.rootPc, chord.type, layout)
          expect(best?.missing, `${layout} ${scale.name} ${chord.numeral}`).toEqual([])
        }
      }
    }
  })
})

describe('diatonicChords', () => {
  it('names C major triads and sevenths', () => {
    expect(diatonicChords(0, major, false).map((c) => c.numeral)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
    expect(diatonicChords(0, major, true).map((c) => c.type.id)).toEqual(['M7', 'm7', 'm7', 'M7', '7', 'm7', 'm7b5'])
    expect(diatonicChords(0, scaleById('harmonic-minor'), true)).toHaveLength(7)
  })
})
