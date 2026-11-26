import { useAuth } from '@clerk/tanstack-react-start'
import { useEffect, useRef, useState } from 'react'
import { loadSaved, storeSaved, type SyncKey } from './saved'

/** Wait this long after a change before saving it, so dragging a tempo doesn't write every step. */
const SAVE_DELAY = 400

/**
 * Keeps one value in step with the signed-in account. Signed out, nothing happens: the section keeps
 * using this browser's storage. On sign-in it loads the account's copy once, merges this browser's
 * into it, and applies the result; after that, every change is saved to the account.
 *
 * `ready` is false until the section has read this browser's storage, so an empty first render
 * never merges over saved data. `parse` validates the account's JSON the way the section validates
 * its own storage, and returns null for anything it can't read.
 */
export function useAccountSync<T>({
  key,
  value,
  ready,
  parse,
  merge,
  apply,
}: {
  key: SyncKey
  value: T
  ready: boolean
  parse: (json: unknown) => T | null
  merge: (local: T, account: T) => T
  apply: (merged: T) => void
}) {
  const { isSignedIn, userId } = useAuth()
  // The account this value has been merged with, so the merge runs once per sign-in.
  const [syncedFor, setSyncedFor] = useState<string | null>(null)
  const latest = useRef(value)
  latest.current = value
  const lastSaved = useRef<string | null>(null)
  const json = JSON.stringify(value)

  useEffect(() => {
    if (!ready || !isSignedIn || !userId || syncedFor === userId) return
    let cancelled = false
    loadSaved({ data: key })
      .then((text) => {
        if (cancelled) return
        const account = text === null ? null : parse(JSON.parse(text))
        apply(account === null ? latest.current : merge(latest.current, account))
        setSyncedFor(userId)
      })
      .catch((e) => console.warn(`Couldn't load ${key} from your account:`, e))
    return () => {
      cancelled = true
    }
  }, [ready, isSignedIn, userId, syncedFor, key])

  useEffect(() => {
    if (!isSignedIn || !userId || syncedFor !== userId || json === lastSaved.current) return
    const id = setTimeout(() => {
      lastSaved.current = json
      storeSaved({ data: { key, value: json } }).catch((e) => {
        lastSaved.current = null
        console.warn(`Couldn't save ${key} to your account:`, e)
      })
    }, SAVE_DELAY)
    return () => clearTimeout(id)
  }, [json, isSignedIn, userId, syncedFor, key])

  // Signing out keeps what's in this browser, and the next sign-in merges again.
  useEffect(() => {
    if (isSignedIn) return
    setSyncedFor(null)
    lastSaved.current = null
  }, [isSignedIn])
}
