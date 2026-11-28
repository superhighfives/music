import { $authStore } from '@clerk/astro/client'
import { effect, signal } from '@preact/signals'
import { useEffect, useState } from 'preact/hooks'
import { createAccountSync } from '~/islands/sync'
import { EMPTY, mergeSaved, parseSaved, type Saved } from '~/theory/lib/saved'

/*
 * What the book remembers, shared by every island on the page: chapters read, checks passed, and where
 * you were. It lives in this browser's storage and, signed in, in the account (`theory.book`).
 */

const KEY = 'theory.v1'

export const saved = signal<Saved>(EMPTY)

if (typeof window !== 'undefined') {
  try {
    saved.value = parseSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null')) ?? EMPTY
  } catch {
    // Bad JSON in storage: start unread.
  }
  const sync = createAccountSync<Saved>('theory.book', { parse: parseSaved, merge: mergeSaved }, (merged) => {
    saved.value = merged
  })
  effect(() => {
    const value = saved.value
    try {
      localStorage.setItem(KEY, JSON.stringify(value))
    } catch {
      // Private windows and blocked storage: progress just won't persist.
    }
    sync.changed(value)
  })
  $authStore.subscribe(({ userId }) => {
    if (userId !== undefined) sync.user(userId)
  })
}

/** The server renders an unread book; an island shows this browser's progress once it has hydrated. */
export function useSaved(): Saved & { ready: boolean } {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  return ready ? { ...saved.value, ready } : { ...EMPTY, ready }
}

export const toggleRead = (id: string) => {
  const read = { ...saved.value.read }
  if (read[id]) delete read[id]
  else read[id] = true
  saved.value = { ...saved.value, read }
}

/** Getting a check right through also counts the chapter as read. */
export const passCheck = (id: string) => {
  const s = saved.value
  if (!s.checks[id]) saved.value = { ...s, checks: { ...s.checks, [id]: true }, read: { ...s.read, [id]: true } }
}

export const visit = (id: string) => {
  if (saved.value.last !== id) saved.value = { ...saved.value, last: id }
}
