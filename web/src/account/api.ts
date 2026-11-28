import { isSyncKey, loadCopy, parseStoreInput, storeCopy } from './store'

const json = (body: unknown, status = 200) => Response.json(body, { status })

/**
 * The account's saved values: GET /api/saved?key=… reads one, POST stores one. `userId` is the session
 * Clerk's middleware checked, or null when signed out.
 */
export async function savedApi(request: Request, db: D1Database, userId: string | null): Promise<Response> {
  if (request.method === 'GET') {
    const key = new URL(request.url).searchParams.get('key')
    if (!isSyncKey(key)) return json({ error: 'Unknown key' }, 400)
    return json(userId ? await loadCopy(db, userId, key) : null)
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!userId) return json({ error: 'Not signed in' }, 401)
  let input
  try {
    input = parseStoreInput(await request.json())
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Bad input' }, 400)
  }
  return json(await storeCopy(db, userId, input))
}
