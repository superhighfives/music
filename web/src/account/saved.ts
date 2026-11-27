import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

/** What an account saves. Each is one JSON value, owned by the section that writes it. */
export const SYNC_KEYS = ['chords.songs', 'production.course', 'theory.book'] as const
export type SyncKey = (typeof SYNC_KEYS)[number]

/** An account's copy of one value, and its version. */
export type AccountCopy = { value: string; version: number }

/** A save names the version it started from. It fails if another device has saved since. */
export type SaveResult = { ok: true; version: number } | { ok: false }

/** Pasted chord sheets are the biggest thing saved. 256 KB is hundreds of songs. */
const MAX_VALUE = 256 * 1024

const isSyncKey = (key: unknown): key is SyncKey => SYNC_KEYS.includes(key as SyncKey)

/** The signed-in person's copy of a key, or null if there's none or nobody is signed in. */
export const loadSaved = createServerFn({ method: 'GET' })
  .validator((key: unknown) => {
    if (!isSyncKey(key)) throw new Error('Unknown key')
    return key
  })
  .handler(async ({ data: key }): Promise<AccountCopy | null> => {
    const { userId } = await auth()
    if (!userId) return null
    return env.DB.prepare('SELECT value, version FROM saved WHERE user_id = ? AND key = ?')
      .bind(userId, key)
      .first<AccountCopy>()
  })

/** Replaces the signed-in person's copy of a key, if it's still at version `base` (null: no copy yet). */
export const storeSaved = createServerFn({ method: 'POST' })
  .validator((input: unknown) => {
    if (typeof input !== 'object' || input === null) throw new Error('Bad input')
    const { key, value, base } = input as Record<string, unknown>
    if (!isSyncKey(key)) throw new Error('Unknown key')
    if (typeof value !== 'string' || value.length > MAX_VALUE) throw new Error('Bad value')
    if (base !== null && !Number.isInteger(base)) throw new Error('Bad version')
    JSON.parse(value)
    return { key, value, base: base as number | null }
  })
  .handler(async ({ data }): Promise<SaveResult> => {
    const { userId } = await auth()
    if (!userId) throw new Error('Not signed in')
    const version = (data.base ?? 0) + 1
    // With no base, only a first save can insert. With one, only a row still at that version updates.
    const { meta } =
      data.base === null
        ? await env.DB.prepare(
            'INSERT INTO saved (user_id, key, value, version, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING',
          )
            .bind(userId, data.key, data.value, version, Date.now())
            .run()
        : await env.DB.prepare(
            'UPDATE saved SET value = ?, version = ?, updated_at = ? WHERE user_id = ? AND key = ? AND version = ?',
          )
            .bind(data.value, version, Date.now(), userId, data.key, data.base)
            .run()
    return meta.changes === 1 ? { ok: true, version } : { ok: false }
  })
