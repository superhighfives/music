/** What an account saves. Each is one JSON value, owned by the section that writes it. */
export const SYNC_KEYS = ['chords.songs', 'production.course', 'theory.book'] as const
export type SyncKey = (typeof SYNC_KEYS)[number]

/** An account's copy of one value, and its version. */
export type AccountCopy = { value: string; version: number }

/** A save names the version it started from. It fails if another device has saved since. */
export type SaveResult = { ok: true; version: number } | { ok: false }

export type StoreInput = { key: SyncKey; value: string; base: number | null }

/** Pasted chord sheets are the biggest thing saved. 256 KB is hundreds of songs. */
const MAX_VALUE = 256 * 1024

export const isSyncKey = (key: unknown): key is SyncKey => SYNC_KEYS.includes(key as SyncKey)

/** Checks a save request: a known key, a JSON value of a sane size, and a whole-number version or null. */
export function parseStoreInput(input: unknown): StoreInput {
  if (typeof input !== 'object' || input === null) throw new Error('Bad input')
  const { key, value, base } = input as Record<string, unknown>
  if (!isSyncKey(key)) throw new Error('Unknown key')
  if (typeof value !== 'string' || value.length > MAX_VALUE) throw new Error('Bad value')
  if (base !== null && !Number.isInteger(base)) throw new Error('Bad version')
  JSON.parse(value)
  return { key, value, base: base as number | null }
}

/** This person's copy of a key, or null if there's none. */
export const loadCopy = (db: D1Database, userId: string, key: SyncKey) =>
  db.prepare('SELECT value, version FROM saved WHERE user_id = ? AND key = ?').bind(userId, key).first<AccountCopy>()

/** Replaces this person's copy of a key, if it's still at version `base` (null: no copy yet). */
export async function storeCopy(db: D1Database, userId: string, input: StoreInput): Promise<SaveResult> {
  const version = (input.base ?? 0) + 1
  // With no base, only a first save can insert. With one, only a row still at that version updates.
  const { meta } =
    input.base === null
      ? await db
          .prepare('INSERT INTO saved (user_id, key, value, version, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING')
          .bind(userId, input.key, input.value, version, Date.now())
          .run()
      : await db
          .prepare('UPDATE saved SET value = ?, version = ?, updated_at = ? WHERE user_id = ? AND key = ? AND version = ?')
          .bind(input.value, version, Date.now(), userId, input.key, input.base)
          .run()
  return meta.changes === 1 ? { ok: true, version } : { ok: false }
}
