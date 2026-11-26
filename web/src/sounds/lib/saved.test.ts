import { describe, expect, it } from 'vitest'
import { mergeSaved, parseSaved } from './saved'

describe('mergeSaved', () => {
  it("keeps every lesson done on either side, the account's settings and this browser's last lesson", () => {
    const local = { settings: { root: 0, mode: 'major', bpm: 90 }, done: { a: true }, last: 'b' } as const
    const account = { settings: { root: 2, mode: 'minor', bpm: 70 }, done: { c: true }, last: 'c' } as const
    expect(mergeSaved(local as never, account as never)).toEqual({
      settings: account.settings,
      done: { a: true, c: true },
      last: 'b',
    })
  })
})

describe('parseSaved', () => {
  it('replaces invalid settings with the defaults', () => {
    const saved = parseSaved({ settings: { root: 99, mode: 'nope', bpm: 1000 }, done: 'x', last: 4 })
    expect(saved?.done).toEqual({})
    expect(saved?.last).toBeNull()
    expect(saved?.settings.root).not.toBe(99)
  })

  it('reads nothing from a non-object', () => {
    expect(parseSaved(null)).toBeNull()
    expect(parseSaved('text')).toBeNull()
  })
})

describe('parseSaved done', () => {
  it('only counts lessons marked true', () => {
    expect(parseSaved({ done: { a: true, b: 'yes', c: false } })?.done).toEqual({ a: true })
  })
})
