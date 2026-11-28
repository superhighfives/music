import { AccountSync, type SyncIO, type SyncRules } from '../account/account-sync'
import type { AccountCopy, SaveResult, SyncKey } from '../account/store'

/** Wait this long after a change before saving it, so dragging a tempo doesn't write every step. */
const SAVE_DELAY = 400

/** After a failed load or save, try again after 2 s, then 4 s, 8 s and so on, up to a minute. */
const retryDelay = (failures: number) => Math.min(60_000, 2000 * 2 ** (failures - 1))

async function call<T>(response: Promise<Response>): Promise<T> {
  const r = await response
  if (!r.ok) throw new Error(`Account request failed: ${r.status}`)
  return r.json() as Promise<T>
}

/**
 * Keeps one value in step with the signed-in account, for Production and Theory. The section reports who
 * is signed in and every change, and gets merged values back through `apply`, which it turns into a message.
 *
 * Signed out, nothing happens. On sign-in it merges this browser's copy into the account's, then saves
 * every change. A tab coming back into view picks up what other devices saved meanwhile.
 */
/** The account's copy of one value, through the Worker's /api/saved. */
export const accountIO = (key: SyncKey): SyncIO => ({
  load: () => call<AccountCopy | null>(fetch(`/api/saved?key=${key}`)),
  store: (value, base) =>
    call<SaveResult>(fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value, base }) })),
})

export function createAccountSync<T>(key: SyncKey, rules: SyncRules<T>, apply: (value: T) => void) {
  const io = accountIO(key)
  let userId: string | null = null
  let latest: T | null = null
  let sync: AccountSync<T> | null = null
  let joinedFor: string | null = null
  let lastSaved: string | null = null
  let failures = 0
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined

  const fail = (what: string, e: unknown, retry: () => void) => {
    console.warn(`Couldn't ${what} ${key} in your account; trying again.`, e)
    failures++
    clearTimeout(retryTimer)
    retryTimer = setTimeout(retry, retryDelay(failures))
  }

  function join() {
    const who = userId
    if (!who || latest === null || joinedFor === who) return
    const s = new AccountSync<T>(io, rules)
    s.join(latest)
      .then((merged) => {
        if (userId !== who) return
        sync = s
        joinedFor = who
        lastSaved = null
        failures = 0
        latest = merged
        apply(merged)
        scheduleSave()
      })
      .catch((e) => fail('load', e, join))
  }

  function scheduleSave() {
    clearTimeout(saveTimer)
    if (!sync || joinedFor !== userId || latest === null || JSON.stringify(latest) === lastSaved) return
    const s = sync
    saveTimer = setTimeout(() => {
      const value = latest
      if (value === null) return
      const sent = JSON.stringify(value)
      s.save(value)
        .then((result) => {
          failures = 0
          if (result.saved) {
            lastSaved = sent
            return
          }
          // Another device saved first: apply the merge, and save that.
          lastSaved = null
          latest = result.merged
          apply(result.merged)
          scheduleSave()
        })
        .catch((e) => fail('save', e, scheduleSave))
    }, SAVE_DELAY)
  }

  // Back in view with nothing waiting to save: take what other devices saved.
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !sync || joinedFor !== userId || JSON.stringify(latest) !== lastSaved) return
      sync
        .refresh()
        .then((account) => {
          if (account === null) return
          lastSaved = JSON.stringify(account)
          latest = account
          apply(account)
        })
        .catch((e) => console.warn(`Couldn't refresh ${key} from your account.`, e))
    })

  return {
    /** The page's signed-in user. Signing out keeps what's in this browser, and the next sign-in merges again. */
    user(next: string | null) {
      if (next === userId) return
      userId = next
      if (next === null) {
        sync = null
        joinedFor = null
        lastSaved = null
        return
      }
      join()
    },
    /** This browser's value: the first call is once storage is read, so an empty start never merges over saved data. */
    changed(value: T) {
      const first = latest === null
      latest = value
      if (first) join()
      else scheduleSave()
    },
  }
}
