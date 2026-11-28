import { Component } from '@effect/ui'
import type { BrowserHost, Html } from '@effect/ui/html'

/**
 * What an Effect UI island is: an HTML component that needs nothing but the page it renders into, as
 * `renderToHtml` and `hydrateEffect` take. Its props, Model and messages are its own business.
 */
export type Island = Component.Members<string, any, any, any, any, Html.Host, Html.Elements, any> & BrowserHost.HtmlRoot<Html.Elements>

/**
 * Astro hands a renderer every component on the page, as `unknown`. This recognizes Effect UI's. Whether
 * a component still needs services can't be seen at runtime, so one that does fails when it renders.
 */
export const isIsland = (u: unknown): u is Island => Component.isComponent(u)

/** The attribute that carries an island's hydration state from the server to the browser. */
export const STATE_ATTRIBUTE = 'data-effect-ui-state'
