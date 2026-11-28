import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import { isSyncKey, loadCopy, parseStoreInput, storeCopy, type AccountCopy, type SaveResult } from './store'

export { SYNC_KEYS, type AccountCopy, type SaveResult, type SyncKey } from './store'

/** The signed-in person's copy of a key, or null if there's none or nobody is signed in. For the React sections. */
export const loadSaved = createServerFn({ method: 'GET' })
  .validator((key: unknown) => {
    if (!isSyncKey(key)) throw new Error('Unknown key')
    return key
  })
  .handler(async ({ data: key }): Promise<AccountCopy | null> => {
    const { userId } = await auth()
    return userId ? loadCopy(env.DB, userId, key) : null
  })

/** Replaces the signed-in person's copy of a key, if it's still at version `base`. For the React sections. */
export const storeSaved = createServerFn({ method: 'POST' })
  .validator(parseStoreInput)
  .handler(async ({ data }): Promise<SaveResult> => {
    const { userId } = await auth()
    if (!userId) throw new Error('Not signed in')
    return storeCopy(env.DB, userId, data)
  })
