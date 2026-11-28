import { $authStore } from '@clerk/astro/client'
import { effect, signal } from '@preact/signals'
import { useEffect, useState } from 'preact/hooks'
import { createAccountSync } from '~/islands/sync'
import { DEFAULT_SETTINGS, type Settings } from '~/production/lib/music'
import { mergeSaved, parseSaved, type Saved } from '~/production/lib/saved'

/*
 * The course's settings and progress, shared by every island on the page. They live in this browser's
 * storage and, signed in, in the account (`production.course`). The server renders the defaults.
 */

const KEY = 'production.v1'
const INITIAL: Saved = { settings: DEFAULT_SETTINGS, done: {}, last: null }

export const saved = signal<Saved>(INITIAL)

if (typeof window !== 'undefined') {
  try {
    saved.value = parseSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null')) ?? INITIAL
  } catch {
    // Bad JSON in storage: start with the defaults.
  }
  const sync = createAccountSync<Saved>('production.course', { parse: parseSaved, merge: mergeSaved }, (merged) => {
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

/**
 * What an island draws: the server's defaults until it has hydrated, then this browser's settings and
 * progress. Hydration needs the first render to match the server's.
 */
export function useSaved(): Saved {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated ? saved.value : INITIAL
}

export const setSettings = (patch: Partial<Settings>) => {
  saved.value = { ...saved.value, settings: { ...saved.value.settings, ...patch } }
}

export const toggleDone = (key: string) => {
  const done = { ...saved.value.done }
  if (done[key]) delete done[key]
  else done[key] = true
  saved.value = { ...saved.value, done }
}

export const visit = (key: string) => {
  if (saved.value.last !== key) saved.value = { ...saved.value, last: key }
}
