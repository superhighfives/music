import type { Component } from '@effect/ui'
import { HtmlServer, type BrowserHost } from '@effect/ui/html'
import type { View } from '@effect/ui'
import { Effect } from 'effect'
import { page } from './document'

type PageOptions = Omit<Parameters<typeof page>[0], 'html' | 'head' | 'state'>

/**
 * Renders an Effect UI component on the Worker into a whole page, which its client entry hydrates from the
 * state.
 */
export async function renderPage<Name extends string, Props, Model, Msg, Events, V extends View.Elements>(
  component: Component.Members<Name, Props, Model, Msg, Events, never, V, any> & BrowserHost.HtmlRoot<V>,
  props: Props,
  options: PageOptions,
): Promise<Response> {
  const rendered = await Effect.runPromise(HtmlServer.renderToHtml(component, props, { includeProps: true }))
  return page({ ...options, html: rendered.html, head: rendered.head, state: HtmlServer.serializeState(rendered.state) })
}
