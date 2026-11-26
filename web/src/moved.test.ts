import { beforeEach, describe, expect, it } from 'vitest'
import { HANDOVER_SCRIPT, moved } from './moved'

describe('moved', () => {
  it('sends an old path to the same path under its section', async () => {
    const html = await moved(new URL('https://sounds.charliegleason.com/themes/drums?x=1'), 'sounds').text()
    expect(html).toContain('"https://music.charliegleason.com/sounds/themes/drums?x=1"')
  })

  it('sends the old home page to the section itself', async () => {
    const html = await moved(new URL('https://chords.charliegleason.com/?key=2'), 'chords').text()
    expect(html).toContain('"https://music.charliegleason.com/chords?key=2"')
  })
})

describe('HANDOVER_SCRIPT', () => {
  let store: Map<string, string>
  let replaced: string | undefined

  beforeEach(() => {
    store = new Map([['movechords:sidebar', '500']])
    replaced = undefined
    Object.assign(globalThis, {
      localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
      history: { replaceState: (_: unknown, __: string, url: string) => (replaced = url) },
    })
  })

  const run = (payload: unknown) => {
    Object.assign(globalThis, {
      location: { hash: `#handover=${encodeURIComponent(JSON.stringify(payload))}`, pathname: '/chords', search: '?key=2' },
    })
    new Function(HANDOVER_SCRIPT)()
  }

  it('adds missing keys, keeps saved ones, and puts back the old hash', () => {
    run({ data: { 'movechords:songs': '[]', 'movechords:sidebar': '400', 'sounds.v1': '{}' }, hash: '#import=x' })
    expect(Object.fromEntries(store)).toEqual({ 'movechords:sidebar': '500', 'movechords:songs': '[]', 'sounds.v1': '{}' })
    expect(replaced).toBe('/chords?key=2#import=x')
  })

  it("ignores keys the apps don't use, and values that aren't strings", () => {
    run({ data: { token: 'x', 'sounds.theme': 1 } })
    expect(Object.fromEntries(store)).toEqual({ 'movechords:sidebar': '500' })
    expect(replaced).toBe('/chords?key=2')
  })

  it('only puts back a hash', () => {
    run({ data: {}, hash: '/elsewhere' })
    expect(replaced).toBe('/chords?key=2')
  })
})
