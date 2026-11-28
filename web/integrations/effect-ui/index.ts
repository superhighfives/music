import type { AstroIntegration } from 'astro'

/**
 * Renders Effect UI components as Astro islands: on the server with `HtmlServer.renderToHtml`, then
 * hydrated in the browser from the state the server wrote. Use an Effect UI component in a page like any
 * other framework's, with a `client:*` directive.
 */
export default function effectUi(): AstroIntegration {
  return {
    name: 'effect-ui',
    hooks: {
      'astro:config:setup': ({ addRenderer }) => {
        addRenderer({
          name: 'effect-ui',
          serverEntrypoint: new URL('./server.ts', import.meta.url),
          clientEntrypoint: new URL('./client.ts', import.meta.url),
        })
      },
    },
  }
}
