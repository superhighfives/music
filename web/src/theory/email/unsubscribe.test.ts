import { describe, expect, it } from 'vitest'
import { fakeDb } from '../../fake-db'
import { unsubscribePage } from './unsubscribe'

const url = (token?: string) => new URL(`https://music.test/theory/unsubscribe${token ? `?t=${token}` : ''}`)

describe('unsubscribePage', () => {
  it('only asks when the link is opened, so a mail scanner can’t unsubscribe anyone', async () => {
    const { db, calls } = fakeDb(1)
    const res = await unsubscribePage(new Request(url('abc')), url('abc'), { DB: db })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<form method="post">')
    expect(calls).toEqual([])
  })

  it('unsubscribes the link’s token on POST', async () => {
    const { db, calls } = fakeDb(1)
    const res = await unsubscribePage(new Request(url('abc'), { method: 'POST' }), url('abc'), { DB: db })
    expect(await res.text()).toContain('Unsubscribed')
    expect(calls.map((c) => c.values)).toEqual([['abc']])
  })

  it('says so when the token matches nothing, or is missing', async () => {
    const { db } = fakeDb(0)
    expect((await unsubscribePage(new Request(url('abc'), { method: 'POST' }), url('abc'), { DB: db })).status).toBe(404)
    expect((await unsubscribePage(new Request(url()), url(), { DB: db })).status).toBe(400)
  })
})
