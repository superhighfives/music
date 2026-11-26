import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

/** What an account saves. Each is one JSON value, owned by the section that writes it. */
export const SYNC_KEYS = ['chords.songs', 'sounds.course'] as const
export type SyncKey = (typeof SYNC_KEYS)[number]

/** Pasted chord sheets are the biggest thing saved. 256 KB is hundreds of songs. */
const MAX_VALUE = 256 * 1024

const isSyncKey = (key: unknown): key is SyncKey => SYNC_KEYS.includes(key as SyncKey)

/** The signed-in person's saved value for a key, as JSON text, or null if there's none or nobody is signed in. */
export const loadSaved = createServerFn({ method: 'GET' })
  .validator((key: unknown) => {
    if (!isSyncKey(key)) throw new Error('Unknown key')
    return key
  })
  .handler(async ({ data: key }) => {
    const { userId } = await auth()
    if (!userId) return null
    const row = await env.DB.prepare('SELECT value FROM saved WHERE user_id = ? AND key = ?')
      .bind(userId, key)
      .first<{ value: string }>()
    return row?.value ?? null
  })

/** Replaces the signed-in person's saved value for a key. */
export const storeSaved = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    const { key, value } = (input ?? {}) as { key?: unknown; value?: unknown }
    if (!isSyncKey(key)) throw new Error('Unknown key')
    if (typeof value !== 'string' || value.length > MAX_VALUE) throw new Error('Bad value')
    JSON.parse(value)
    return { key, value }
  })
  .handler(async ({ data }) => {
    const { userId } = await auth()
    if (!userId) throw new Error('Not signed in')
    await env.DB.prepare(
      `INSERT INTO saved (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
      .bind(userId, data.key, data.value, Date.now())
      .run()
  })
