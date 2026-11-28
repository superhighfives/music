import { createClerkClient } from '@clerk/backend'
import { userOf } from '~/account/api'
import { type DailyEnv, sendCard } from './daily'

type Env = DailyEnv & { CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

/** How long someone waits between previews, so "Send one now" can't send in a loop. */
const PREVIEW_COOLDOWN = 10 * 60_000

export type EmailStatus = { signedIn: false } | { signedIn: true; subscribed: boolean; email: string | null }
export type PreviewResult = { title: string | null } | { waitMinutes: number }

/** The signed-in person's verified primary email, from Clerk rather than the browser. */
async function primaryEmail(env: Env, userId: string) {
  const user = await createClerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUser(userId)
  return user.primaryEmailAddress?.emailAddress ?? null
}

async function status(env: Env, userId: string): Promise<EmailStatus> {
  const row = await env.DB.prepare('SELECT email, active FROM theory_email WHERE user_id = ?').bind(userId).first<{ email: string; active: number }>()
  if (row?.active) return { signedIn: true, subscribed: true, email: row.email }
  return { signedIn: true, subscribed: false, email: await primaryEmail(env, userId) }
}

/** Turns the daily email on or off. Turning it on keeps what they've already been sent. */
async function setDaily(env: Env, userId: string, on: boolean): Promise<EmailStatus> {
  if (!on) {
    await env.DB.prepare('UPDATE theory_email SET active = 0 WHERE user_id = ?').bind(userId).run()
    return { signedIn: true, subscribed: false, email: await primaryEmail(env, userId) }
  }
  const email = await primaryEmail(env, userId)
  if (!email) throw new Error('No email address on this account')
  await env.DB.prepare(
    `INSERT INTO theory_email (user_id, email, token, active, created_at) VALUES (?, ?, ?, 1, ?)
     ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, active = 1`,
  )
    .bind(userId, email, crypto.randomUUID(), Date.now())
    .run()
  return { signedIn: true, subscribed: true, email }
}

/**
 * Sends the subscriber their next card now, as a preview: it doesn't count as sent. One every ten minutes
 * at most; sooner, it says how long to wait instead of sending.
 */
async function sendPreview(env: Env, userId: string): Promise<PreviewResult> {
  const now = Date.now()
  // Claims the preview before sending: only a row whose last preview is old enough updates.
  const { meta } = await env.DB.prepare(
    'UPDATE theory_email SET last_preview_at = ? WHERE user_id = ? AND active = 1 AND (last_preview_at IS NULL OR last_preview_at <= ?)',
  )
    .bind(now, userId, now - PREVIEW_COOLDOWN)
    .run()
  const sub = await env.DB.prepare('SELECT user_id, email, token, last_preview_at FROM theory_email WHERE user_id = ? AND active = 1')
    .bind(userId)
    .first<{ user_id: string; email: string; token: string; last_preview_at: number | null }>()
  if (!sub) throw new Error('Turn on the daily email first')
  if (meta.changes === 0) return { waitMinutes: Math.max(1, Math.ceil(((sub.last_preview_at ?? 0) + PREVIEW_COOLDOWN - now) / 60_000)) }
  const card = await sendCard(env, sub, new Date(now), false)
  return { title: card?.title ?? null }
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

/**
 * The daily email switch, for the signed-in person only. GET /api/theory/email reads it, POST with
 * `{ on }` sets it, and POST /api/theory/email/preview sends one now.
 */
export async function emailApi(request: Request, env: Env, path: string): Promise<Response> {
  const userId = await userOf(request, env)
  try {
    if (path === '/api/theory/email' && request.method === 'GET') return json(userId ? await status(env, userId) : { signedIn: false })
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    if (!userId) return json({ error: 'Not signed in' }, 401)
    if (path === '/api/theory/email/preview') return json(await sendPreview(env, userId))
    const body: unknown = await request.json().catch(() => null)
    const on = body && typeof body === 'object' && 'on' in body ? body.on : undefined
    if (typeof on !== 'boolean') return json({ error: 'Bad input' }, 400)
    return json(await setDaily(env, userId, on))
  } catch (e) {
    console.error('Theory email request failed', e)
    return json({ error: e instanceof Error ? e.message : 'Failed' }, 500)
  }
}
