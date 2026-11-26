import { describe, expect, it } from 'vitest'
import {
  diatonicTriads,
  interval,
  keySignatureSteps,
  midiOf,
  noteName,
  parseNote,
  parseRhythm,
  beatsOf,
  scale,
  scaleType,
  signatureAccidentals,
  spell,
  stepPattern,
} from './theory'

const names = (s: string) => noteName(parseNote(s))

describe('notes', () => {
  it('puts middle C at MIDI 60, and B♯3 there too', () => {
    expect(midiOf(parseNote('C4'))).toBe(60)
    expect(midiOf(parseNote('B#3'))).toBe(60)
    expect(midiOf(parseNote('Cb4'))).toBe(59)
    expect(names('Eb5')).toBe('E♭5')
  })

  it('spells black keys with sharps or flats, keeping the octave right', () => {
    expect(noteName(spell(61))).toBe('C♯4')
    expect(noteName(spell(61, 'flat'))).toBe('D♭4')
    expect(noteName(spell(59))).toBe('B3')
    expect(noteName(spell(70, 'flat'))).toBe('B♭4')
  })
})

describe('interval', () => {
  const iv = (a: string, b: string) => interval(parseNote(a), parseNote(b)).short
  it('names by letters, then semitones', () => {
    expect(iv('C4', 'E4')).toBe('M3')
    expect(iv('C4', 'Eb4')).toBe('m3')
    expect(iv('C4', 'G4')).toBe('P5')
    expect(iv('F4', 'B4')).toBe('A4')
    expect(iv('B4', 'F5')).toBe('d5')
    expect(iv('C4', 'C5')).toBe('P8')
    expect(iv('C4', 'D5')).toBe('M9')
  })

  it('tells enharmonic intervals apart', () => {
    expect(iv('C4', 'D#4')).toBe('A2')
    expect(iv('C4', 'Eb4')).toBe('m3')
  })
})

describe('scale', () => {
  it('spells every major scale with one of each letter', () => {
    const s = (root: string, type = 'major') => scale(parseNote(root), scaleType(type)).map((n) => noteName(n)).join(' ')
    expect(s('C4')).toBe('C4 D4 E4 F4 G4 A4 B4 C5')
    expect(s('F#4')).toBe('F♯4 G♯4 A♯4 B4 C♯5 D♯5 E♯5 F♯5')
    expect(s('Bb3')).toBe('B♭3 C4 D4 E♭4 F4 G4 A4 B♭4')
    expect(s('A3', 'harmonic')).toBe('A3 B3 C4 D4 E4 F4 G♯4 A4')
  })

  it('shows the major pattern as whole and half steps', () => {
    expect(stepPattern(scale(parseNote('D4'), scaleType('major')))).toEqual(['W', 'W', 'H', 'W', 'W', 'W', 'H'])
    expect(stepPattern(scale(parseNote('A4'), scaleType('harmonic')))[5]).toBe('W+H')
  })
})

describe('keys', () => {
  it('adds sharps F C G and flats B E A in order', () => {
    expect(signatureAccidentals(3)).toEqual([1, 0, 0, 1, 1, 0, 0])
    expect(signatureAccidentals(-2)).toEqual([0, 0, -1, 0, 0, 0, -1])
  })

  it('puts the bass clef signature a line lower', () => {
    expect(keySignatureSteps(1, 'treble')).toEqual([38])
    expect(keySignatureSteps(1, 'bass')).toEqual([24])
  })
})

describe('diatonic triads', () => {
  it('gives major keys I ii iii IV V vi vii°', () => {
    expect(diatonicTriads(parseNote('C4'), scaleType('major')).map((t) => t.numeral)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ])
  })
})

describe('rhythm', () => {
  it('reads shorthand and counts beats', () => {
    const r = parseRhythm('h. q e e rq')
    expect(r.map(beatsOf)).toEqual([3, 1, 0.5, 0.5, 1])
    expect(r[4].rest).toBe(true)
  })
})
