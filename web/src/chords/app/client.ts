import '../styles.css'
import '../../site-footer.css'
import { dark } from '@clerk/ui/themes'
import type { Renderer } from '@effect/ui'
import { HtmlHydrate } from '@effect/ui/html'
import { Effect } from 'effect'
import type { SyncIO } from '../../account/account-sync'
import type { AccountCopy, SaveResult } from '../../account/store'
import { connectClerk } from '../../islands/auth'
import { Chords, ChordsProps } from './Chords'
import { piano, setAccountIO } from './effects'
import type { ChordsMessage } from './messages'
import type { ChordsModel } from './state'

/** chords is always dark, with its cyan for buttons and links. */
const appearance = {
  theme: dark,
  variables: { colorPrimary: 'oklch(0.78 0.16 195)', colorPrimaryForeground: '#0a0a0a', colorBackground: '#171717' },
}

async function call<T>(response: Promise<Response>): Promise<T> {
  const r = await response
  if (!r.ok) throw new Error(`Account request failed: ${r.status}`)
  return r.json() as Promise<T>
}

/** The account's copy of the pasted songs, through the Worker's /api/saved. */
const io: SyncIO = {
  load: () => call<AccountCopy | null>(fetch('/api/saved?key=chords.songs')),
  store: (value, base) =>
    call<SaveResult>(
      fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'chords.songs', value, base }) }),
    ),
}

setAccountIO(io)
piano.load()

const container = document.getElementById('app')
const stateText = document.getElementById('state')?.textContent
if (!container || !stateText) throw new Error('Chords: missing #app or #state')
const state: Renderer.State = JSON.parse(stateText)

let props: ChordsProps | null = null
let root: Renderer.Root<ChordsModel, ChordsMessage, ChordsProps> | null = null
const setUser = (userId: string | null) => {
  if (!root || !props || props.userId === userId) return
  props = { ...props, userId }
  root.setProps(props)
}

Effect.runFork(
  Effect.scoped(
    Effect.gen(function* () {
      props = yield* HtmlHydrate.decodeProps({ props: ChordsProps }, state)
      root = yield* HtmlHydrate.hydrateEffect(Chords, props, container, state, { head: false })
      return yield* Effect.never
    }),
  ).pipe(Effect.catch((e) => Effect.sync(() => console.error("Chords couldn't start", e)))),
)

connectClerk(() => appearance, setUser)
