import { HtmlServer } from '@effect/ui/html'
import { Effect } from 'effect'
import { isIsland, STATE_ATTRIBUTE } from './island'

const check = (component: unknown) => isIsland(component)

/**
 * Renders the component with the props the page gave it. Effect UI islands take no children or named
 * slots, and anything a component adds to the head is left out; both are reported rather than dropped
 * without a word.
 */
async function renderToStaticMarkup(component: unknown, props: Record<string, unknown>, slots: Record<string, unknown>) {
  if (!isIsland(component)) throw new Error('effect-ui: not an Effect UI component')
  if (Object.keys(slots).length) throw new Error(`effect-ui: ${component.definition.name} takes no children or slots`)
  const rendered = await Effect.runPromise(HtmlServer.renderToHtml(component, props, { includeProps: true }))
  if (rendered.head.trim()) console.warn(`effect-ui: ${component.definition.name} adds to the head, which islands leave out`)
  return { html: rendered.html, attrs: { [STATE_ATTRIBUTE]: HtmlServer.serializeState(rendered.state) } }
}

export default { name: 'effect-ui', check, renderToStaticMarkup, supportsAstroStaticSlot: false }
