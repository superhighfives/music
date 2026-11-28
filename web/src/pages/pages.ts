import { userOf } from '../account/api'
import { renderPage } from '../islands/render'
import { Site, type Page } from './Site'

type Env = { DB: D1Database; CLERK_SECRET_KEY: string; CLERK_PUBLISHABLE_KEY: string }

const PATHS: Record<string, { page: Exclude<Page, 'not-found'>; title: string; description: string }> = {
  '/': {
    page: 'home',
    title: 'music · Charlie Gleason',
    description:
      'Music tools: chord shapes for Ableton Move, a production course for Live 12, an illustrated theory book, Live Extensions, and the studio setup.',
  },
  '/ableton': { page: 'ableton', title: 'Ableton Extensions · music', description: 'Ableton Live 12 Extensions for chords, progressions and ambient soundscapes.' },
  '/tools': {
    page: 'tools',
    title: 'Tools · music',
    description: 'The whole studio setup: Live, recording, editing, effects and mastering, with exercises to learn each tool and links to Production lessons.',
  },
  '/privacy': { page: 'privacy', title: 'Privacy · music', description: 'What music.charliegleason.com stores, and why.' },
}

/** Home and the plain pages that share its look, rendered on the Worker. Null for any other path. */
export async function sitePage(request: Request, env: Env, path: string): Promise<Response | null> {
  const known = PATHS[path]
  if (!known) return null
  // A failed session check renders signed out; the browser's Clerk corrects it once it loads.
  const userId = await userOf(request, env).catch(() => null)
  return renderPage(Site, { page: known.page, userId }, { island: 'site', title: known.title, description: known.description, data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY } })
}

/** Any path nothing else serves. */
export async function notFoundPage(request: Request, env: Env): Promise<Response> {
  const userId = await userOf(request, env).catch(() => null)
  const response = await renderPage(Site, { page: 'not-found', userId }, {
    island: 'site',
    title: 'Not found · music',
    description: 'Nothing lives at this address.',
    data: { 'clerk-key': env.CLERK_PUBLISHABLE_KEY },
  })
  return new Response(response.body, { status: 404, headers: response.headers })
}
