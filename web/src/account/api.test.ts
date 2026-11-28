import { describe, expect, it } from 'vitest'
import { fakeDb } from '../fake-db'
import { savedApi } from './api'

const get = (key: string) => new Request(`https://music.test/api/saved?key=${key}`)
const post = (body: unknown) => new Request('https://music.test/api/saved', { method: 'POST', body: JSON.stringify(body) })
const save = { key: 'theory.book', value: '{"read":{}}', base: null }

describe('savedApi', () => {
  it('turns away an unknown key', async () => {
    const { db } = fakeDb()
    expect((await savedApi(get('nope'), db, 'u1')).status).toBe(400)
  })

  it('reads nothing for someone signed out', async () => {
    const { db, calls } = fakeDb()
    const res = await savedApi(get('theory.book'), db, null)
    expect(await res.json()).toBeNull()
    expect(calls).toEqual([])
  })

  it('reads only the signed-in person’s copy', async () => {
    const { db, calls } = fakeDb()
    await savedApi(get('theory.book'), db, 'u1')
    expect(calls.map((c) => c.values)).toEqual([['u1', 'theory.book']])
  })

  it('refuses a save from someone signed out', async () => {
    const { db, calls } = fakeDb(1)
    expect((await savedApi(post(save), db, null)).status).toBe(401)
    expect(calls).toEqual([])
  })

  it('refuses a save that isn’t JSON or names no known key', async () => {
    const { db } = fakeDb(1)
    expect((await savedApi(post({ ...save, value: 'not json' }), db, 'u1')).status).toBe(400)
    expect((await savedApi(post({ ...save, key: 'nope' }), db, 'u1')).status).toBe(400)
  })

  it('saves under the signed-in person, and reports when another device saved first', async () => {
    const first = fakeDb(1)
    expect(await (await savedApi(post(save), first.db, 'u1')).json()).toEqual({ ok: true, version: 1 })
    expect(first.calls[0]?.values.slice(0, 2)).toEqual(['u1', 'theory.book'])
    const stale = fakeDb(0)
    expect(await (await savedApi(post({ ...save, base: 3 }), stale.db, 'u1')).json()).toEqual({ ok: false })
  })

  it('only answers GET and POST', async () => {
    const { db } = fakeDb()
    expect((await savedApi(new Request('https://music.test/api/saved', { method: 'DELETE' }), db, 'u1')).status).toBe(405)
  })
})
