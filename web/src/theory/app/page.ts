import { HtmlServer } from '@effect/ui/html'
import { Effect } from 'effect'
import { userOf } from '~/account/api'
import { page } from '~/islands/document'
import { themeScript } from '~/islands/theme'
import { BOOK_SUBTITLE, BOOK_TITLE } from '~/theory/content/book'
import { routeOf } from './pages'
import { Theory } from './Theory'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

const HEAD = `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Instrument+Sans:wght@400..700&family=Noto+Music&display=swap">
    ${themeScript('theory.theme')}`

/** Every page under /theory, rendered on the server and hydrated by client.ts. */
export async function theoryPage(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname
  const route = routeOf(path)
  // A failed session check renders signed out; the browser's Clerk corrects it once it loads.
  const userId = await userOf(request, env).catch(() => null)
  const day = Math.floor(Date.now() / 86_400_000)
  const rendered = await Effect.runPromise(HtmlServer.renderToHtml(Theory, { path, userId, day }, { includeProps: true }))
  const response = page({
    island: 'theory',
    title: route._tag === 'Chapter' ? `${route.chapter.title} · ${BOOK_TITLE}` : `${BOOK_TITLE} · ${BOOK_SUBTITLE}`,
    description:
      route._tag === 'Chapter'
        ? route.chapter.summary
        : 'An illustrated, interactive music theory book: reading music, scales, chords and harmony, and theory for songwriting, from the first note to advanced harmony.',
    html: rendered.html,
    head: `${HEAD}\n    ${rendered.head}`,
    state: HtmlServer.serializeState(rendered.state),
    data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY },
  })
  return route._tag === 'NotFound' ? new Response(response.body, { status: 404, headers: response.headers }) : response
}
