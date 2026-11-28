import islands from 'virtual:islands'
import { THEME_SCRIPT } from './theme'

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * A whole page for an Effect UI section: the server-rendered HTML in #app, its state for hydration, and the
 * section's client entry and stylesheets. `data` carries values the client needs before it hydrates, such
 * as Clerk's publishable key. Every page shares the fonts and the light or dark choice.
 */
export function page(o: {
  island: string
  title: string
  description: string
  icon?: string
  html: string
  head: string
  state: string
  data?: Record<string, string>
}): Response {
  const entry = islands[o.island]
  if (!entry) throw new Error(`No client entry for ${o.island}`)
  const data = Object.entries(o.data ?? {})
    .map(([k, v]) => ` data-${k}="${escape(v)}"`)
    .join('')
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(o.title)}</title>
    <meta name="description" content="${escape(o.description)}">
    <link rel="icon" href="${escape(o.icon ?? '/favicon.svg')}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
    <script>${THEME_SCRIPT}</script>
    ${entry.css.map((href) => `<link rel="stylesheet" href="${escape(href)}">`).join('\n    ')}
    ${o.head}
  </head>
  <body${data}>
    <div id="app">${o.html}</div>
    <script type="application/json" id="state">${o.state}</script>
    <script type="module" src="${escape(entry.js)}"></script>
  </body>
</html>`
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
