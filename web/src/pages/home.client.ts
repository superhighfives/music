import '../site.css'
import '../site-footer.css'
import type { Renderer } from '@effect/ui'
import { HtmlHydrate } from '@effect/ui/html'
import { Effect } from 'effect'
import { connectClerk } from '../islands/auth'
import { Home, HomeProps, type HomeMessage } from './Home'

/** Clerk's dialog and menu follow the system's light or dark setting, with the site's cyan. */
const dark = matchMedia('(prefers-color-scheme: dark)').matches
const appearance = dark
  ? { variables: { colorPrimary: 'oklch(0.78 0.16 195)', colorPrimaryForeground: '#0a0a0a', colorBackground: '#171717', colorForeground: '#ffffff' } }
  : { variables: { colorPrimary: 'oklch(0.55 0.12 200)', colorPrimaryForeground: '#ffffff' } }

const container = document.getElementById('app')
const stateText = document.getElementById('state')?.textContent
if (container && stateText) {
  const state: Renderer.State = JSON.parse(stateText)
  let props: HomeProps | null = null
  let root: Renderer.Root<{}, HomeMessage, HomeProps> | null = null
  Effect.runFork(
    Effect.scoped(
      Effect.gen(function* () {
        props = yield* HtmlHydrate.decodeProps({ props: HomeProps }, state)
        root = yield* HtmlHydrate.hydrateEffect(Home, props, container, state, { head: false })
        return yield* Effect.never
      }),
    ).pipe(Effect.catch((e) => Effect.sync(() => console.error("Home couldn't start", e)))),
  )
  connectClerk(appearance, (userId) => {
    if (!root || !props || props.userId === userId) return
    props = { ...props, userId }
    root.setProps(props)
  })
}
