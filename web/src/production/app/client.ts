import '../styles/app.css'
import '../../site-footer.css'
import type { Renderer } from '@effect/ui'
import { HtmlHydrate } from '@effect/ui/html'
import { Effect } from 'effect'
import { connectClerk } from '../../islands/auth'
import { createAccountSync } from '../../islands/sync'
import { mergeSaved, parseSaved, type Saved } from '../lib/saved'
import { Production, ProductionMessage, ProductionProps, setReportSaved, type ProductionModel } from './Production'

const container = document.getElementById('app')
const stateText = document.getElementById('state')?.textContent
if (!container || !stateText) throw new Error('Production: missing #app or #state')
const state: Renderer.State = JSON.parse(stateText)

let props: ProductionProps | null = null
let root: Renderer.Root<ProductionModel, ProductionMessage, ProductionProps> | null = null

const sync = createAccountSync<Saved>(
  'production.course',
  { parse: parseSaved, merge: mergeSaved },
  (saved) => root?.send(ProductionMessage.ReceivedAccount({ saved })),
)
setReportSaved((saved) => sync.changed(saved))

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      props = yield* HtmlHydrate.decodeProps({ props: ProductionProps }, state)
      root = yield* HtmlHydrate.hydrateEffect(Production, props, container, state, { head: false })
      return yield* Effect.never
    }),
  ).pipe(Effect.catch((e) => Effect.sync(() => console.error("Production couldn't start", e)))),
)

connectClerk((userId) => {
  sync.user(userId)
  if (!root || !props || props.userId === userId) return
  props = { ...props, userId }
  root.setProps(props)
})
