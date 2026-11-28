import { HtmlServer } from '@effect/ui/html'
import { Effect } from 'effect'
import { userOf } from '../../account/api'
import { page } from '../../islands/document'
import { themeScript } from '../../islands/theme'
import { Production } from './Production'
import { routeOf, titleOf } from './pages'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }


const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
    ${themeScript('production.theme')}`

/** Every page under /production, rendered on the server and hydrated by client.ts. */
export async function productionPage(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname
  const route = routeOf(path)
  // A failed session check renders signed out; the browser's Clerk corrects it once it loads.
  const userId = await userOf(request, env).catch(() => null)
  const rendered = await Effect.runPromise(HtmlServer.renderToHtml(Production, { path, userId }, { includeProps: true }))
  const response = page({
    island: 'production',
    title: titleOf(route),
    description: 'A step-by-step course in music production with Ableton Live 12: sound quality, soundscapes, melody, songwriting, drums and mixing.',
    html: rendered.html,
    head: `${FONTS}\n    ${rendered.head}`,
    state: HtmlServer.serializeState(rendered.state),
    data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY },
  })
  return route._tag === 'NotFound' ? new Response(response.body, { status: 404, headers: response.headers }) : response
}
