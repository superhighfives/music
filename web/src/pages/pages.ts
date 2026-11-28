import { userOf } from '../account/api'
import { renderPage } from '../islands/render'
import { Home } from './Home'
import { Ableton, NotFound, Privacy, Tools } from './Static'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

/** The home page and the plain pages that share its look, rendered on the Worker. Null for any other path. */
export async function sitePage(request: Request, env: Env, path: string): Promise<Response | null> {
  if (path === '/') {
    const userId = await userOf(request, env).catch(() => null)
    return renderPage(Home, { userId }, {
      island: 'home',
      title: 'music · Charlie Gleason',
      description:
        'Music tools: chord shapes for Ableton Move, a production course for Live 12, an illustrated theory book, Live Extensions, and the studio setup.',
      data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY },
    })
  }
  if (path === '/ableton')
    return renderPage(Ableton, {}, { island: 'static', script: false, title: 'Ableton Extensions · music', description: 'Ableton Live 12 Extensions for chords, progressions and ambient soundscapes.' })
  if (path === '/tools')
    return renderPage(Tools, {}, {
      island: 'static',
      script: false,
      title: 'Tools · music',
      description: 'The whole studio setup: Live, recording, editing, effects and mastering, with exercises to learn each tool and links to Production lessons.',
    })
  if (path === '/privacy')
    return renderPage(Privacy, {}, { island: 'static', script: false, title: 'Privacy · music', description: 'What music.charliegleason.com stores, and why.' })
  return null
}

/** Any path nothing else serves. */
export async function notFoundPage(): Promise<Response> {
  const response = await renderPage(NotFound, {}, { island: 'static', script: false, title: 'Not found · music', description: 'There’s no page here.' })
  return new Response(response.body, { status: 404, headers: response.headers })
}
