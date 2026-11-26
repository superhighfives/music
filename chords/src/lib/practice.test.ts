import { describe, expect, it } from 'vitest'
import { padGrid, scaleById } from './music'
import { EXERCISES, HIT_MS, judge, summarize, type PracticeEvent } from './practice'

const MS_PER_BEAT = 500
const cMajorAt = (beat: number): PracticeEvent => ({ kind: 'chord', beat, length: 1, root: 0, chord: 'maj' })
const noteAt = (beat: number, midi: number): PracticeEvent => ({ kind: 'note', beat, length: 1, midi })

describe('judge', () => {
  it('grades a chord by the mean offset of its notes', () => {
    const events = [cMajorAt(0), cMajorAt(1), cMajorAt(2)]
    const chord = (ms: number) => [60, 64, 67].map((midi) => ({ ms, midi }))
    const presses = [...chord(10), ...chord(500 - 90), ...chord(1000 + 90)]
    const { results, wrong } = judge(events, presses, MS_PER_BEAT, 5000)
    expect(results.map((r) => r.judgment)).toEqual(['perfect', 'early', 'late'])
    expect(wrong).toBe(0)
  })

  it('misses an event only after its window closes', () => {
    const events = [noteAt(1, 60)]
    expect(judge(events, [], MS_PER_BEAT, 500 + HIT_MS).results[0].judgment).toBe('pending')
    expect(judge(events, [], MS_PER_BEAT, 500 + HIT_MS + 1).results[0].judgment).toBe('missed')
  })

  it('needs every required chord tone, and lets a doubled root count as part of the chord', () => {
    const events = [cMajorAt(0)]
    const partial = judge(events, [{ ms: 0, midi: 60 }, { ms: 0, midi: 64 }], MS_PER_BEAT, 1000)
    expect(partial.results[0].judgment).toBe('missed')
    const doubled = [60, 64, 67, 72].map((midi) => ({ ms: 0, midi }))
    expect(judge(events, doubled, MS_PER_BEAT, 1000)).toEqual({ results: [{ judgment: 'perfect', offsetMs: 0 }], wrong: 0 })
  })

  it('counts a wrong note only when no pending event can still use it', () => {
    const events = [noteAt(1, 62)]
    // D, early but inside the window of the pending note: not wrong yet.
    expect(judge(events, [{ ms: 400, midi: 62 }], MS_PER_BEAT, 400).wrong).toBe(0)
    // E: no event wants it.
    expect(judge(events, [{ ms: 400, midi: 64 }], MS_PER_BEAT, 400).wrong).toBe(1)
  })
})

describe('summarize', () => {
  it('counts wrong notes against accuracy and finds the best streak', () => {
    const s = summarize(
      [{ judgment: 'perfect' }, { judgment: 'late' }, { judgment: 'missed' }, { judgment: 'perfect' }],
      1,
    )
    expect(s).toMatchObject({ perfect: 2, late: 1, missed: 1, wrong: 1, bestStreak: 2, accuracy: 50 })
  })
})

describe('exercises', () => {
  it('fit in their length, and every melody note is on the default Chromatic grid', () => {
    const pads = new Set(padGrid('chromatic', 0, scaleById('major'), 9).flat().map((p) => p.midi))
    for (const x of EXERCISES) {
      for (const e of x.events) {
        expect(e.beat + e.length, x.id).toBeLessThanOrEqual(x.beats)
        if (e.kind === 'note') expect(pads.has(e.midi), `${x.id} ${e.midi}`).toBe(true)
      }
    }
  })
})
