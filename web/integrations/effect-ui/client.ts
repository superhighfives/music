import type { Renderer } from '@effect/ui'
import { BrowserHost, HtmlHydrate } from '@effect/ui/html'
import { Effect, Fiber } from 'effect'
import { isIsland, STATE_ATTRIBUTE } from './island'

/**
 * Starts an Effect UI island. A server-rendered island hydrates from its state, with the props the
 * server decoded, so the browser starts exactly where the server left off. A `client:only` island
 * mounts fresh with the page's props. The island stops when Astro unmounts it.
 */
export default (element: HTMLElement) => async (component: unknown, props: Record<string, unknown>, _slots: unknown, { client }: { client: string }) => {
  if (!isIsland(component)) return
  const stateText = element.getAttribute(STATE_ATTRIBUTE)
  const run =
    client !== 'only' && element.hasAttribute('ssr') && stateText
      ? Effect.gen(function* () {
          const state: Renderer.State = JSON.parse(stateText)
          const decoded = yield* HtmlHydrate.decodeProps(component, state)
          yield* HtmlHydrate.hydrateEffect(component, decoded, element, state, { head: false })
          return yield* Effect.never
        })
      : Effect.gen(function* () {
          element.innerHTML = ''
          yield* BrowserHost.mountEffect(component, props, element)
          return yield* Effect.never
        })
  const fiber = Effect.runFork(
    Effect.scoped(run).pipe(Effect.catch((e) => Effect.sync(() => console.error(`effect-ui: ${component.definition.name} couldn't start`, e)))),
  )
  element.addEventListener('astro:unmount', () => Effect.runFork(Fiber.interrupt(fiber)), { once: true })
}
