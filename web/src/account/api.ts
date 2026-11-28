import { createClerkClient } from '@clerk/backend'
import { isSyncKey, loadCopy, parseStoreInput, storeCopy } from './store'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

/** The signed-in user for a request, from its Clerk session cookie or header, or null. */
export async function userOf(request: Request, env: Env): Promise<string | null> {
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY })
  const state = await clerk.authenticateRequest(request)
  return state.toAuth()?.userId ?? null
}

const json = (body: unknown, status = 200) => Response.json(body, { status })

/**
 * The account's saved values, for the Effect UI sections: GET /api/saved?key=… reads one, POST stores one.
 * The same rules as the React sections' server functions, which share `store.ts`.
 */
export async function savedApi(request: Request, env: Env): Promise<Response> {
  const userId = await userOf(request, env)
  if (request.method === 'GET') {
    const key = new URL(request.url).searchParams.get('key')
    if (!isSyncKey(key)) return json({ error: 'Unknown key' }, 400)
    return json(userId ? await loadCopy(env.DB, userId, key) : null)
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!userId) return json({ error: 'Not signed in' }, 401)
  let input
  try {
    input = parseStoreInput(await request.json())
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Bad input' }, 400)
  }
  return json(await storeCopy(env.DB, userId, input))
}
