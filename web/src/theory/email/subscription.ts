import { auth, clerkClient } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { sendCard } from './daily'

export type EmailStatus = { signedIn: false } | { signedIn: true; subscribed: boolean; email: string | null }

/** The signed-in person's verified primary email, from Clerk rather than the browser. */
async function primaryEmail(userId: string) {
  const user = await clerkClient({ secretKey: env.CLERK_SECRET_KEY }).users.getUser(userId)
  return user.primaryEmailAddress?.emailAddress ?? null
}

/** Whether the signed-in person gets the daily email, and where it goes. */
export const emailStatus = createServerFn({ method: 'GET' }).handler(async (): Promise<EmailStatus> => {
  const { userId } = await auth()
  if (!userId) return { signedIn: false }
  const row = await env.DB.prepare('SELECT email, active FROM theory_email WHERE user_id = ?')
    .bind(userId)
    .first<{ email: string; active: number }>()
  if (row?.active) return { signedIn: true, subscribed: true, email: row.email }
  return { signedIn: true, subscribed: false, email: await primaryEmail(userId) }
})

/** Turns the daily email on or off for the signed-in person. Turning it on keeps what they've already been sent. */
export const setDailyEmail = createServerFn({ method: 'POST' })
  .validator((on: unknown) => {
    if (typeof on !== 'boolean') throw new Error('Bad input')
    return on
  })
  .handler(async ({ data: on }): Promise<EmailStatus> => {
    const { userId } = await auth()
    if (!userId) throw new Error('Not signed in')
    if (!on) {
      await env.DB.prepare('UPDATE theory_email SET active = 0 WHERE user_id = ?').bind(userId).run()
      return { signedIn: true, subscribed: false, email: await primaryEmail(userId) }
    }
    const email = await primaryEmail(userId)
    if (!email) throw new Error('No email address on this account')
    await env.DB.prepare(
      `INSERT INTO theory_email (user_id, email, token, active, created_at) VALUES (?, ?, ?, 1, ?)
       ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, active = 1`,
    )
      .bind(userId, email, crypto.randomUUID(), Date.now())
      .run()
    return { signedIn: true, subscribed: true, email }
  })

/** Sends the signed-in subscriber their next card now, as a preview: it doesn't count as sent. */
export const sendPreview = createServerFn({ method: 'POST' }).handler(async () => {
  const { userId } = await auth()
  if (!userId) throw new Error('Not signed in')
  const sub = await env.DB.prepare('SELECT user_id, email, token FROM theory_email WHERE user_id = ? AND active = 1')
    .bind(userId)
    .first<{ user_id: string; email: string; token: string }>()
  if (!sub) throw new Error('Turn on the daily email first')
  const card = await sendCard(env, sub, new Date(), false)
  return { title: card?.title ?? null }
})
