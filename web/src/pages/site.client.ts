import '../site.css'
import '../site-footer.css'
import type { Renderer } from '@effect/ui'
import { HtmlHydrate } from '@effect/ui/html'
import { Effect } from 'effect'
import { connectClerk } from '../islands/auth'
import { Site, SiteProps, type SiteMessage } from './Site'

const container = document.getElementById('app')
const stateText = document.getElementById('state')?.textContent
if (!container || !stateText) throw new Error('Site: missing #app or #state')
const state: Renderer.State = JSON.parse(stateText)

let props: SiteProps | null = null
let root: Renderer.Root<{}, SiteMessage, SiteProps> | null = null

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      props = yield* HtmlHydrate.decodeProps({ props: SiteProps }, state)
      root = yield* HtmlHydrate.hydrateEffect(Site, props, container, state, { head: false })
      return yield* Effect.never
    }),
  ).pipe(Effect.catch((e) => Effect.sync(() => console.error("The page couldn't start", e)))),
)

connectClerk((userId) => {
  if (!root || !props || props.userId === userId) return
  props = { ...props, userId }
  root.setProps(props)
})
