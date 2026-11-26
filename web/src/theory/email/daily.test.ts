import { describe, expect, it } from 'vitest'
import { CARDS } from '~/theory/content/book'
import { type DailyEnv, sendDaily, unsubscribe } from './daily'

type Sub = { user_id: string; email: string; token: string; active: number; last_sent_on: string | null }

/** Just enough of D1 and Email Service for the daily email's queries, kept in memory. */
function fakeEnv(subs: Sub[], { failSendTo = new Set<string>() } = {}) {
  const sent = new Map<string, Map<string, number>>()
  const mail: { to: string; subject: string }[] = []
  const DB = {
    prepare(sql: string) {
      let args: unknown[] = []
      const stmt = {
        bind: (...a: unknown[]) => ((args = a), stmt),
        async all<T>() {
          if (sql.startsWith('SELECT user_id, email, token FROM theory_email'))
            return { results: subs.filter((s) => s.active === 1 && s.last_sent_on !== args[0]) as T[] }
          if (sql.startsWith('SELECT card, sent_at FROM theory_email_sent'))
            return { results: [...(sent.get(args[0] as string) ?? new Map())].map(([card, sent_at]) => ({ card, sent_at })) as T[] }
          throw new Error(`Unexpected query: ${sql}`)
        },
        async first<T>(): Promise<T | null> {
          throw new Error(`Unexpected query: ${sql}`)
        },
        async run() {
          if (sql.startsWith('INSERT INTO theory_email_sent')) {
            const [user, card, at] = args as [string, string, number]
            sent.set(user, (sent.get(user) ?? new Map()).set(card, at))
            return { meta: { changes: 1 } }
          }
          if (sql.startsWith('UPDATE theory_email SET last_sent_on')) {
            subs.filter((s) => s.user_id === args[1]).forEach((s) => (s.last_sent_on = args[0] as string))
            return { meta: { changes: 1 } }
          }
          if (sql.startsWith('UPDATE theory_email SET active = 0 WHERE token')) {
            const hit = subs.filter((s) => s.token === args[0])
            hit.forEach((s) => (s.active = 0))
            return { meta: { changes: hit.length } }
          }
          throw new Error(`Unexpected query: ${sql}`)
        },
      }
      return stmt
    },
  }
  const EMAIL = {
    async send(m: { to: string | string[]; subject: string }) {
      const to = String(m.to)
      if (failSendTo.has(to)) throw new Error('send failed')
      mail.push({ to, subject: m.subject })
      return { messageId: String(mail.length) }
    },
  }
  return { env: { DB, EMAIL } as unknown as DailyEnv, sent, mail }
}

const sub = (id: string, over: Partial<Sub> = {}): Sub => ({ user_id: id, email: `${id}@example.com`, token: `t-${id}`, active: 1, last_sent_on: null, ...over })
const day1 = new Date('2026-11-27T07:00:00Z')

describe('sendDaily', () => {
  it('sends each subscriber the first card, once a day', async () => {
    const { env, mail } = fakeEnv([sub('a'), sub('b')])
    await sendDaily(env, day1)
    expect(mail.map((m) => m.to)).toEqual(['a@example.com', 'b@example.com'])
    expect(mail[0].subject).toContain(CARDS[0].title)
    // Later runs the same day send nothing more.
    await sendDaily(env, new Date('2026-11-27T08:00:00Z'))
    expect(mail).toHaveLength(2)
  })

  it('sends the next card the next day', async () => {
    const { env, mail } = fakeEnv([sub('a')])
    await sendDaily(env, day1)
    await sendDaily(env, new Date('2026-11-28T07:00:00Z'))
    expect(mail[1].subject).toContain(CARDS[1].title)
  })

  it('skips a failed send without stopping the rest, and retries it on a later run', async () => {
    const failSendTo = new Set(['a@example.com'])
    const { env, mail } = fakeEnv([sub('a'), sub('b')], { failSendTo })
    await sendDaily(env, day1)
    expect(mail.map((m) => m.to)).toEqual(['b@example.com'])
    failSendTo.clear()
    await sendDaily(env, new Date('2026-11-27T08:00:00Z'))
    expect(mail.map((m) => m.to)).toEqual(['b@example.com', 'a@example.com'])
  })

  it('leaves out anyone unsubscribed', async () => {
    const { env, mail } = fakeEnv([sub('a'), sub('b')])
    expect(await unsubscribe(env, 't-a')).toBe(true)
    expect(await unsubscribe(env, 'nobody')).toBe(false)
    await sendDaily(env, day1)
    expect(mail.map((m) => m.to)).toEqual(['b@example.com'])
  })
})
