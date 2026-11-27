import type { Renderer } from '@effect/ui'
import { BrowserHost } from '@effect/ui/html'
import { Effect, Fiber } from 'effect'
import type { SyncIO } from '../../account/account-sync'
import { parseSheet } from '../lib/songs'
import { Chords, type ChordsProps } from './Chords'
import { piano, readSheets, readSidebar, setAccountIO, setAuthUI, type AuthUI } from './effects'
import { ChordsMessage } from './messages'
import { SIDEBAR_DEFAULT, SIDEBAR_MAX, SIDEBAR_MIN, parseSearch, type ChordsModel } from './state'

export type ChordsHandle = {
  /** The page's signed-in user changed. */
  setUser: (userId: string | null) => void
  dispose: () => void
}

type Root = Renderer.Root<ChordsModel, ChordsMessage, ChordsProps>

/**
 * Mounts Chords, an Effect UI app, into a node the TanStack route owns. The route keeps the document head
 * and the Clerk session, and passes in what the island can't import: the account's server functions and
 * Clerk's sign-in UI.
 */
export function mountChords(container: Element, options: { io: SyncIO; auth: AuthUI; userId: string | null }): ChordsHandle {
  setAccountIO(options.io)
  setAuthUI(options.auth)
  piano.load()
  // The Ultimate Guitar bookmarklet opens "/chords#import=<sheet>". Take the sheet, then remove it from the URL.
  const imported = /^#import=(.*)$/s.exec(location.hash)?.[1]
  if (imported !== undefined) history.replaceState(history.state, '', location.pathname + location.search)

  let props: ChordsProps = {
    initialSearch: parseSearch(new URLSearchParams(location.search)),
    initialSheets: readSheets(),
    initialSidebar: readSidebar(SIDEBAR_DEFAULT, SIDEBAR_MIN, SIDEBAR_MAX),
    userId: options.userId,
  }
  let resolveRoot: (root: Root) => void = () => {}
  const mounted = new Promise<Root>((resolve) => (resolveRoot = resolve))

  const fiber = Effect.runFork(
    Effect.scoped(
      Effect.gen(function* () {
        // TanStack Start owns the document head.
        const root = yield* BrowserHost.mountEffect(Chords, props, container, { head: false })
        resolveRoot(root)
        // Spike only: `?move=fake` acts as if Move is connected, so Learn, Songs and Practice can be tried
        // and measured without the device. Nothing answers on MIDI, so no pad is ever pressed.
        if (new URLSearchParams(location.search).get('move') === 'fake') root.send(ChordsMessage.ChangedMoveStatus({ status: 'connected' }))
        if (imported !== undefined) {
          const text = decodeURIComponent(imported)
          root.send(ChordsMessage.ImportedSheet({ id: `my-${Date.now().toString(36)}`, title: parseSheet(text).title, text }))
        }
        return yield* Effect.never
      }),
    ),
  )

  return {
    setUser: (userId) => {
      if (userId === props.userId) return
      props = { ...props, userId }
      void mounted.then((root) => root.setProps(props))
    },
    dispose: () => void Effect.runFork(Fiber.interrupt(fiber)),
  }
}
