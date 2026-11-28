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
          // Package specifiers, as Astro's own renderers use: Astro bundles the client half by its name.
          serverEntrypoint: 'astro-effect-ui/server',
          clientEntrypoint: 'astro-effect-ui/client',
        })
      },
    },
  }
}
