import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAccountSync } from '~/account/sync'
import { EMPTY, mergeSaved, parseSaved, type Saved } from './saved'

/**
 * Progress lives in this browser's localStorage, and in the account when signed in.
 * The server renders nothing read; saved progress loads after hydration.
 */
const KEY = 'theory.v1'

interface Store extends Saved {
  ready: boolean
  toggleRead: (chapterId: string) => void
  passCheck: (chapterId: string) => void
  visit: (chapterId: string) => void
}

const StoreContext = createContext<Store | null>(null)

function load(): Saved | null {
  try {
    return parseSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(EMPTY)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const s = load()
    if (s) setSaved(s)
    setReady(true)
  }, [])

  useAccountSync({ key: 'theory.book', value: saved, ready, parse: parseSaved, merge: mergeSaved, apply: setSaved })

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // Private windows and blocked storage: progress just won't persist.
    }
  }, [saved, ready])

  const toggleRead = useCallback(
    (id: string) =>
      setSaved((p) => {
        const read = { ...p.read }
        if (read[id]) delete read[id]
        else read[id] = true
        return { ...p, read }
      }),
    [],
  )
  // Reading a check right through also counts the chapter as read.
  const passCheck = useCallback(
    (id: string) => setSaved((p) => (p.checks[id] ? p : { ...p, checks: { ...p.checks, [id]: true }, read: { ...p.read, [id]: true } })),
    [],
  )
  const visit = useCallback((id: string) => setSaved((p) => (p.last === id ? p : { ...p, last: id })), [])

  const value = useMemo<Store>(
    () => ({ ...saved, ready, toggleRead, passCheck, visit }),
    [saved, ready, toggleRead, passCheck, visit],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside StoreProvider')
  return store
}
