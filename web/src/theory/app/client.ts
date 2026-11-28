import '../styles/theory.css'
import '../../site-footer.css'
import { dark } from '@clerk/ui/themes'
import type { Renderer } from '@effect/ui'
import { HtmlHydrate } from '@effect/ui/html'
import { Effect } from 'effect'
import { connectClerk } from '~/islands/auth'
import { createAccountSync } from '~/islands/sync'
import { isDarkPage } from '~/islands/theme'
import { piano } from '~/theory/lib/audio'
import { mergeSaved, parseSaved, type Saved } from '~/theory/lib/saved'
import { setReportSaved, Theory, TheoryMessage, TheoryProps, type TheoryModel } from './Theory'

/** Clerk's dialog and menu follow the book's light or dark theme, in its type and accent. */
const appearance = () =>
  isDarkPage()
    ? { theme: dark, variables: { fontFamily: 'var(--ui)', colorPrimary: 'oklch(0.76 0.13 45)' } }
    : { variables: { fontFamily: 'var(--ui)', colorPrimary: 'oklch(0.52 0.15 35)' } }

const container = document.getElementById('app')
const stateText = document.getElementById('state')?.textContent
if (!container || !stateText) throw new Error('Theory: missing #app or #state')
const state: Renderer.State = JSON.parse(stateText)

let props: TheoryProps | null = null
let root: Renderer.Root<TheoryModel, TheoryMessage, TheoryProps> | null = null

const sync = createAccountSync<Saved>('theory.book', { parse: parseSaved, merge: mergeSaved }, (saved) =>
  root?.send(TheoryMessage.ReceivedAccount({ saved })),
)
setReportSaved((saved) => sync.changed(saved))
piano.load()

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      props = yield* HtmlHydrate.decodeProps({ props: TheoryProps }, state)
      root = yield* HtmlHydrate.hydrateEffect(Theory, props, container, state, { head: false })
      return yield* Effect.never
    }),
  ).pipe(Effect.catch((e) => Effect.sync(() => console.error("Theory couldn't start", e)))),
)

connectClerk(appearance, (userId) => {
  sync.user(userId)
  if (!root || !props || props.userId === userId) return
  props = { ...props, userId }
  root.setProps(props)
})
