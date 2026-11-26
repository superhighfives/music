import { CARDS } from '~/theory/content/book'
import { pickCard, utcDay } from './pick'
import { renderEmail, SITE } from './render'

/** Who the daily email comes from. Its domain must be onboarded to Cloudflare Email Service. */
export const FROM = { email: 'theory@charliegleason.com', name: 'Theory' }

/** The Worker bindings the daily email uses. */
export type DailyEnv = { DB: D1Database; EMAIL: SendEmail }

export const unsubscribeUrl = (token: string) => `${SITE}/theory/unsubscribe?t=${encodeURIComponent(token)}`

type Subscriber = { user_id: string; email: string; token: string }

/** Sends one person their next card, and records it. `record: false` sends a preview without counting it. */
export async function sendCard(env: DailyEnv, sub: Subscriber, now: Date, record = true) {
  const { results } = await env.DB.prepare('SELECT card, sent_at FROM theory_email_sent WHERE user_id = ?').bind(sub.user_id).all<{ card: string; sent_at: number }>()
  const picked = pickCard(CARDS, new Map(results.map((r) => [r.card, r.sent_at])))
  if (!picked) return null
  const url = unsubscribeUrl(sub.token)
  const email = renderEmail(picked.card, { unsubscribeUrl: url, review: picked.review })
  // Sent before it's recorded, on purpose: if a write fails afterwards, the worst case is the same card
  // again tomorrow. Recording first would risk the opposite, a card counted as sent that never arrived.
  await env.EMAIL.send({
    to: sub.email,
    from: FROM,
    subject: email.subject,
    html: email.html,
    text: email.text,
    headers: { 'List-Unsubscribe': `<${url}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  })
  if (record) {
    await env.DB.prepare(
      'INSERT INTO theory_email_sent (user_id, card, sent_at) VALUES (?, ?, ?) ON CONFLICT (user_id, card) DO UPDATE SET sent_at = excluded.sent_at',
    )
      .bind(sub.user_id, picked.card.key, now.getTime())
      .run()
    await env.DB.prepare('UPDATE theory_email SET last_sent_on = ? WHERE user_id = ?').bind(utcDay(now), sub.user_id).run()
  }
  return picked.card
}

/**
 * The cron's job: everyone subscribed who hasn't had today's email gets one. The cron runs hourly
 * through the day (cloudflare.config.ts); the first run sends, and later ones only pick up anyone a
 * failure skipped, since a failed send isn't marked sent.
 *
 * It sends one person at a time, about four subrequests each, which suits a small list. Workers cap
 * subrequests per run, so a much larger list would need batching or a queue.
 */
export async function sendDaily(env: DailyEnv, now = new Date()) {
  const today = utcDay(now)
  const { results } = await env.DB.prepare(
    'SELECT user_id, email, token FROM theory_email WHERE active = 1 AND (last_sent_on IS NULL OR last_sent_on <> ?)',
  )
    .bind(today)
    .all<Subscriber>()
  let sent = 0
  for (const sub of results) {
    try {
      if (await sendCard(env, sub, now)) sent++
    } catch (e) {
      console.error(`theory daily: couldn't send to ${sub.user_id}`, e)
    }
  }
  console.log(`theory daily: sent ${sent} of ${results.length} on ${today}`)
}

/** Turns off the email for whoever holds this unsubscribe token. True if it matched someone. */
export async function unsubscribe(env: { DB: D1Database }, token: string) {
  const { meta } = await env.DB.prepare('UPDATE theory_email SET active = 0 WHERE token = ?').bind(token).run()
  return meta.changes > 0
}
