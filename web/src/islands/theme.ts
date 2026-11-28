import { dark } from '@clerk/ui/themes'
import { Command, Component } from '@effect/ui'
import { Effect } from 'effect'

/** Where the light or dark choice is kept. One choice covers every section. */
const KEY = 'music.theme'

/** Applies a saved light/dark choice before first paint, so there's no flash. Every page runs it in its head. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("music.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`

/** Switches between light and dark, and remembers the choice. Without a choice the page follows the system. */
export const ToggleTheme = Command.make('ToggleTheme', {}, () =>
  Effect.sync(() => {
    const root = document.documentElement
    const current = root.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not remembered, but the switch still applies.
    }
  }).pipe(Effect.as(Component.noop)),
)

/** The page's light or dark theme: the saved choice, or the system's. */
const isDarkPage = () => {
  const chosen = document.documentElement.getAttribute('data-theme')
  return chosen ? chosen === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
}

/** Clerk's dialog and menu follow the page's light or dark theme, in its type. */
export const clerkAppearance = () =>
  isDarkPage() ? { theme: dark, variables: { fontFamily: 'var(--sans)' } } : { variables: { fontFamily: 'var(--sans)' } }
