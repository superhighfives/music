import { describe, expect, it } from 'vitest'
import {
  CHORD_FAMILIES,
  CHORD_TYPES,
  SCALES,
  chordMatch,
  chordType,
  diatonicChords,
  padGrid,
  scaleById,
  voicings,
} from './music'
import { SONGS, parseChordName, parseSheet, songEvents, songKey, unknownChords, type SongChord } from './songs'
import { TUTORIALS } from './tutorials'

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

  it('plays every chord from every root in chromatic, preferring the chart shape', () => {
    const grid = padGrid('chromatic', 0, major, 9)
    for (const type of CHORD_TYPES) {
      for (let root = 0; root < 12; root++) {
        const [best] = voicings(grid, root, type, 'chromatic')
        expect(best?.missing, `${root} ${type.name}`).toEqual([])
      }
    }
    // G♯ dom7 has no room for the chart shape when the bottom-left pad is A.
    expect(voicings(grid, 8, CHORD_TYPES[2], 'chromatic')[0].fromChart).toBe(false)
    expect(voicings(grid, 0, CHORD_TYPES[2], 'chromatic')[0].fromChart).toBe(true)
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

describe('chordMatch', () => {
  const cMaj = chordType('maj')
  it('accepts any voicing and octave of the chord', () => {
    expect(chordMatch([], 0, cMaj)).toBe('empty')
    expect(chordMatch([60, 64], 0, cMaj)).toBe('partial')
    expect(chordMatch([64, 67, 72], 0, cMaj)).toBe('complete')
    expect(chordMatch([48, 64, 67, 72], 0, cMaj)).toBe('complete')
    expect(chordMatch([60, 63, 67], 0, cMaj)).toBe('wrong')
  })

  it('does not require optional tones', () => {
    // The 9 chord marks its fifth as optional.
    expect(chordMatch([60, 64, 70, 74], 0, chordType('9'))).toBe('complete')
  })
})

describe('TUTORIALS', () => {
  it('only asks for chords that have a full shape in the tutorial layout', () => {
    for (const t of TUTORIALS) {
      const grid = padGrid(t.layout, t.key, scaleById(t.scale), 9)
      for (const step of t.steps) {
        if (step.kind !== 'chord') continue
        expect(CHORD_TYPES.some((c) => c.id === step.chord), `${t.id} ${step.chord}`).toBe(true)
        const [best] = voicings(grid, step.root, chordType(step.chord), t.layout)
        expect(best?.missing, `${t.id} ${step.root} ${step.chord}`).toEqual([])
      }
    }
  })
})

describe('chord sheets', () => {
  it('read chord names, including accidentals, slash chords and unknown names', () => {
    expect(parseChordName('F#m7')).toEqual({ name: 'F#m7', root: 6, chord: 'm7', bass: undefined })
    expect(parseChordName('Bb/D')).toMatchObject({ root: 10, chord: 'maj', bass: 2 })
    expect(parseChordName('C6/9')).toMatchObject({ root: 0, chord: '6add9', bass: undefined })
    expect(parseChordName('E♭maj7')).toMatchObject({ root: 3, chord: 'M7' })
    expect(parseChordName('C7sus4')).toBeNull()
    expect(parseChordName('Verse')).toBeNull()
  })

  it('read ChordPro and chords-above-lyrics sheets the same way', () => {
    const pro = parseSheet('{title: Test}\n[Chorus]\n[G]Hello [C]there')
    const above = parseSheet('[Chorus]\nG     C\nHello there', 'Test')
    expect(pro).toEqual(above)
    const unknown = parseSheet('Am   G7sus4\nA day in the sun')
    expect(unknown.lines[0].lyric).toBe('A day in the sun')
    expect(unknown.lines[0].chords.map((c) => [c.name, !!c.parsed])).toEqual([
      ['Am', true],
      ['G7sus4', false],
    ])
    expect(pro.lines).toEqual([
      {
        lyric: 'Hello there',
        chords: [
          { at: 0, name: 'G', parsed: { name: 'G', root: 7, chord: 'maj', bass: undefined } },
          { at: 6, name: 'C', parsed: { name: 'C', root: 0, chord: 'maj', bass: undefined } },
        ],
      },
    ])
  })

  it('pick the key of the song', () => {
    const tones = (c: SongChord) => chordType(c.chord).tones.map((t) => (c.root + t.interval) % 12)
    const amazing = songEvents(SONGS.find((s) => s.id === 'amazing-grace')!)
    expect(songKey(amazing, tones)).toEqual({ key: 7, scale: 'major' })
    const scarborough = songEvents(SONGS.find((s) => s.id === 'scarborough-fair')!)
    // Am G C D is A Dorian, so G major holds every tone. A minor does not, because of D major's F♯.
    expect(songKey(scarborough, tones)).toEqual({ key: 7, scale: 'major' })
  })

  it('built-in songs have only chords we can read, and each fits on the grid', () => {
    for (const song of SONGS) {
      expect(unknownChords(song), song.id).toEqual([])
      const events = songEvents(song)
      const tones = (c: SongChord) => chordType(c.chord).tones.map((t) => (c.root + t.interval) % 12)
      const { key, scale } = songKey(events, tones)
      const grid = padGrid('chromatic', key, scaleById(scale), 9)
      for (const e of events) {
        const full = voicings(grid, e.chord.root, chordType(e.chord.chord), 'chromatic').some((v) => v.missing.length === 0)
        expect(full, `${song.id} ${e.chord.name}`).toBe(true)
      }
    }
  })
})

describe('Ultimate Guitar sheets', () => {
  it('read chords, skip section labels and guitar tab lines', () => {
    // The shape of a sheet from an Ultimate Guitar page, with our own words.
    const sheet = parseSheet(
      '[tab][Intro] x2\r\n   [ch]C[/ch]      [ch]Em[/ch]\r\ne|------0-----|\r\nB|-0h1------1--|[/tab]\r\n\r\n[Verse 1]\r\n[tab][ch]C[/ch]            [ch]Em[/ch]\r\nWords for a test line[/tab]',
    )
    expect(sheet.lines.map((l) => [l.lyric, l.chords.map((c) => `${c.name}@${c.at}`)])).toEqual([
      ['', ['C@3', 'Em@10']],
      ['Words for a test line', ['C@0', 'Em@13']],
    ])
    const notes = parseSheet('C (hold)  Em  x2\nSome words here')
    expect(notes.lines[0].chords.map((c) => c.name)).toEqual(['C', 'Em'])
  })
})
