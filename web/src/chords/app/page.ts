import { HtmlServer } from '@effect/ui/html'
import { Effect } from 'effect'
import { userOf } from '../../account/api'
import { page } from '../../islands/document'
import { Chords } from './Chords'
import { parseSearch } from './state'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

/** /chords, rendered on the server for the view the URL asks for, and hydrated by client.ts. */
export async function chordsPage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  // A failed session check renders signed out; the browser's Clerk corrects it once it loads.
  const userId = await userOf(request, env).catch(() => null)
  const rendered = await Effect.runPromise(
    HtmlServer.renderToHtml(Chords, { initialSearch: parseSearch(url.searchParams), userId }, { includeProps: true }),
  )
  return page({
    island: 'chords',
    title: 'chords · chord shapes for Ableton Move',
    description: 'See chord shapes on the Ableton Move pad grid in any key, scale and layout.',
    icon: '/chords/favicon.svg',
    html: rendered.html,
    head: rendered.head,
    state: HtmlServer.serializeState(rendered.state),
    data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY },
  })
}
