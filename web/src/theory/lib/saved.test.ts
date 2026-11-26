import { describe, expect, it } from 'vitest'
import { mergeSaved, parseSaved } from './saved'

describe('theory progress', () => {
  it('keeps everything read or passed on either side, and this browser’s place', () => {
    const local = { read: { a: true }, checks: {}, last: 'a' } as const
    const account = { read: { b: true }, checks: { b: true }, last: 'b' } as const
    expect(mergeSaved(local, account)).toEqual({ read: { a: true, b: true }, checks: { b: true }, last: 'a' })
  })

  it('takes the account’s place when this browser has none', () => {
    expect(mergeSaved({ read: {}, checks: {}, last: null }, { read: {}, checks: {}, last: 'b' }).last).toBe('b')
  })

  it('drops anything that isn’t marked true', () => {
    expect(parseSaved({ read: { a: true, b: 'yes' }, checks: 3, last: 4 })).toEqual({ read: { a: true }, checks: {}, last: null })
    expect(parseSaved('nope')).toBeNull()
  })
})
