import { Command, Component } from '@effect/ui'
import { Effect, Schema } from 'effect'

/**
 * Switches a section between light and dark, and remembers the choice under `storageKey`. Without a
 * choice the page follows the system. The section's page applies the saved choice before first paint.
 */
export const ToggleTheme = Command.make('ToggleTheme', { args: { storageKey: Schema.String } }, ({ storageKey }) =>
  Effect.sync(() => {
    const root = document.documentElement
    const current = root.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Not remembered, but the switch still applies.
    }
  }).pipe(Effect.as(Component.noop)),
)

/** The page's light or dark theme: the saved choice, or the system's. */
export const isDarkPage = () => {
  const chosen = document.documentElement.getAttribute('data-theme')
  return chosen ? chosen === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
}

/** Applies a saved light/dark choice before first paint, so there's no flash. */
export const themeScript = (storageKey: string) =>
  `<script>try{var t=localStorage.getItem(${JSON.stringify(storageKey)});if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>`
