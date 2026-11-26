import { useAuth } from '@clerk/tanstack-react-start'
import { useEffect, useRef, useState } from 'react'
import { AccountSync, type SyncRules } from './account-sync'
import { loadSaved, storeSaved, type SyncKey } from './saved'

/** Wait this long after a change before saving it, so dragging a tempo doesn't write every step. */
const SAVE_DELAY = 400

/** After a failed load or save, try again after 2 s, then 4 s, 8 s and so on, up to a minute. */
const retryDelay = (failures: number) => Math.min(60_000, 2000 * 2 ** (failures - 1))

/**
 * Keeps one value in step with the signed-in account. Signed out, nothing happens: the section keeps
 * using this browser's storage. On sign-in it merges this browser's copy into the account's, then
 * saves every change. A tab coming back into view picks up what other devices saved meanwhile.
 *
 * `ready` is false until the section has read this browser's storage, so an empty first render
 * never merges over saved data.
 */
export function useAccountSync<T>({
  key,
  value,
  ready,
  parse,
  merge,
  apply,
}: SyncRules<T> & { key: SyncKey; value: T; ready: boolean; apply: (value: T) => void }) {
  const { isSignedIn, userId } = useAuth()
  // The account this value has been merged with, so the merge runs once per sign-in.
  const [joinedFor, setJoinedFor] = useState<string | null>(null)
  // Failed loads or saves in a row. Each failure schedules another try by bumping this.
  const [failures, setFailures] = useState(0)
  // Bumped after a conflict, to save the merged value even if it matches what's shown.
  const [resave, setResave] = useState(0)
  const sync = useRef<AccountSync<T> | null>(null)
  // The latest value and rules, for async work that outlives a render.
  const latest = useRef({ value, parse, merge, apply })
  latest.current = { value, parse, merge, apply }
  // The JSON last saved to (or read from) the account, so unchanged values aren't saved again.
  const lastSaved = useRef<string | null>(null)
  const json = JSON.stringify(value)
  const joined = !!isSignedIn && !!userId && joinedFor === userId

  const fail = (what: string, e: unknown) => {
    console.warn(`Couldn't ${what} ${key} in your account; trying again.`, e)
    setTimeout(() => setFailures((f) => f + 1), retryDelay(failures + 1))
  }

  // Sign-in: merge this browser's copy into the account's.
  useEffect(() => {
    if (!ready || !isSignedIn || !userId || joinedFor === userId) return
    let cancelled = false
    const s = new AccountSync(
      { load: () => loadSaved({ data: key }), store: (v, base) => storeSaved({ data: { key, value: v, base } }) },
      { parse: (j) => latest.current.parse(j), merge: (l, a) => latest.current.merge(l, a) },
    )
    s.join(latest.current.value)
      .then((merged) => {
        if (cancelled) return
        sync.current = s
        lastSaved.current = null
        latest.current.apply(merged)
        setJoinedFor(userId)
        setFailures(0)
      })
      .catch((e) => !cancelled && fail('load', e))
    return () => {
      cancelled = true
    }
  }, [ready, isSignedIn, userId, joinedFor, key, failures])

  // Every change after that: save it, or on a conflict apply the merge and save that.
  useEffect(() => {
    if (!joined || !sync.current || json === lastSaved.current) return
    const s = sync.current
    const id = setTimeout(() => {
      const sent = json
      s.save(latest.current.value)
        .then((result) => {
          setFailures(0)
          if (result.saved) {
            lastSaved.current = sent
            return
          }
          lastSaved.current = null
          latest.current.apply(result.merged)
          setResave((r) => r + 1)
        })
        .catch((e) => fail('save', e))
    }, SAVE_DELAY)
    return () => clearTimeout(id)
  }, [json, joined, failures, resave])

  // Back in view with nothing waiting to save: take what other devices saved.
  useEffect(() => {
    if (!joined) return
    const onVisible = () => {
      const s = sync.current
      if (document.visibilityState !== 'visible' || !s || JSON.stringify(latest.current.value) !== lastSaved.current) return
      s.refresh()
        .then((account) => {
          if (account === null) return
          lastSaved.current = JSON.stringify(account)
          latest.current.apply(account)
        })
        .catch((e) => console.warn(`Couldn't refresh ${key} from your account.`, e))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [joined, key])

  // Signing out keeps what's in this browser, and the next sign-in merges again.
  useEffect(() => {
    if (isSignedIn) return
    setJoinedFor(null)
    sync.current = null
    lastSaved.current = null
  }, [isSignedIn])
}
