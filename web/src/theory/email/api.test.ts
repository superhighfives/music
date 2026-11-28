import { describe, expect, it } from 'vitest'
import { fakeDb } from '../../fake-db'
import { emailApi } from './api'

// Only the paths that never reach Clerk: who may do what, and what counts as a request.
const env = () => {
  const { db, calls } = fakeDb()
  const sent: unknown[] = []
  const EMAIL: SendEmail = { send: async (m) => (sent.push(m), { messageId: 'm' }) }
  return { env: { DB: db, EMAIL, CLERK_SECRET_KEY: 'unused' }, calls, sent }
}
const request = (method: string, body?: unknown) =>
  new Request('https://music.test/api/theory/email', body === undefined ? { method } : { method, body: JSON.stringify(body) })

describe('emailApi', () => {
  it('tells someone signed out that it needs an account', async () => {
    const { env: e, calls } = env()
    expect(await (await emailApi(request('GET'), e, '/api/theory/email', null)).json()).toEqual({ signedIn: false })
    expect(calls).toEqual([])
  })

  it('refuses to switch it or send a preview for someone signed out', async () => {
    const { env: e, calls, sent } = env()
    expect((await emailApi(request('POST', { on: true }), e, '/api/theory/email', null)).status).toBe(401)
    expect((await emailApi(request('POST', {}), e, '/api/theory/email/preview', null)).status).toBe(401)
    expect(calls).toEqual([])
    expect(sent).toEqual([])
  })

  it('refuses a switch that isn’t on or off', async () => {
    const { env: e, calls } = env()
    expect((await emailApi(request('POST', { on: 'yes' }), e, '/api/theory/email', 'u1')).status).toBe(400)
    expect(calls).toEqual([])
  })

  it('only answers GET and POST', async () => {
    const { env: e } = env()
    expect((await emailApi(request('DELETE'), e, '/api/theory/email', 'u1')).status).toBe(405)
  })
})
