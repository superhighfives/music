import { createServerEntry, createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { savedApi } from './account/api'
import { chordsPage } from './chords/app/page'
import { sitePage } from './pages/pages'
import { productionPage } from './production/app/page'
import { EXTENSIONS } from './extensions'
import { newestAblx } from './releases'
import { type DailyEnv, sendDaily, unsubscribe } from './theory/email/daily'

const handler = createStartHandler(defaultStreamHandler)

const RELEASES = 'https://github.com/superhighfives/music/releases'
const EXTENSION_IDS = new Set(EXTENSIONS.map((x) => x.id))

const entry = createServerEntry({
  async fetch(request) {
    const url = new URL(request.url)
    const ablx = /^\/ableton\/([a-z-]+)\.ablx$/.exec(url.pathname)
    if (ablx && EXTENSION_IDS.has(ablx[1])) return latestRelease(ablx[1])
    if (url.pathname === '/theory/unsubscribe') return unsubscribePage(request, url)
    // Sections moved to Effect UI render here; the rest are TanStack Start's.
    if (url.pathname === '/chords' || url.pathname === '/chords/') return chordsPage(request, (await import('cloudflare:workers')).env)
    if (url.pathname === '/production' || url.pathname.startsWith('/production/')) return productionPage(request, (await import('cloudflare:workers')).env)
    const site = await sitePage(request, (await import('cloudflare:workers')).env, url.pathname)
    if (site) return site
    if (url.pathname === '/api/saved') return savedApi(request, (await import('cloudflare:workers')).env)
    return handler(request)
  },
})

export default {
  ...entry,
  // The cron in alchemy.run.ts: the theory book's daily email.
  scheduled(_controller: unknown, env: DailyEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(sendDaily(env))
  },
}

/**
 * The daily email's unsubscribe link. Opening it shows a button, so a mail scanner following links
 * can't unsubscribe anyone; the button, and mail apps' one-click unsubscribe, POST here.
 */
async function unsubscribePage(request: Request, url: URL): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const page = (body: string, status = 200) =>
    new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Daily email · Theory</title><style>body{margin:0;font:18px/1.6 Georgia,serif;background:#f6f1e9;color:#221c17}main{max-width:32rem;margin:15vh auto;padding:0 16px}button{font:600 15px -apple-system,sans-serif;padding:11px 18px;border:0;border-radius:8px;background:#b4532a;color:#fff;cursor:pointer}a{color:#b4532a}@media(prefers-color-scheme:dark){body{background:#1b1714;color:#efe7dc}}</style></head><body><main>${body}</main></body></html>`,
      { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  if (!token) return page('<p>This unsubscribe link is missing its code. Turn the email off from <a href="/theory">the book</a> instead.</p>', 400)
  if (request.method === 'POST') {
    const { env } = await import('cloudflare:workers')
    const ok = await unsubscribe(env, token)
    return ok
      ? page('<h1>Unsubscribed</h1><p>No more daily emails. You can turn them back on from <a href="/theory">the book</a>.</p>')
      : page('<p>That link doesn’t match a subscription. It may already be off; check from <a href="/theory">the book</a>.</p>', 404)
  }
  return page(
    `<h1>Stop the daily email?</h1><p>You’ll stop getting one idea a day from the book.</p><form method="post"><button type="submit">Unsubscribe</button></form>`,
  )
}

/**
 * Redirects to the newest .ablx for an extension, so /ableton links never need a version bump.
 * Releases are tagged ableton/<name>-<version>. If GitHub can't be reached, it falls back to the
 * release list filtered to that extension.
 */
async function latestRelease(name: string): Promise<Response> {
  const fallback = `${RELEASES}?q=${encodeURIComponent(`ableton/${name}-`)}`
  try {
    const res = await fetch('https://api.github.com/repos/superhighfives/music/releases?per_page=100', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'music.charliegleason.com' },
      // GitHub allows 60 unauthenticated requests an hour, so keep its answer for 10 minutes.
      cf: { cacheTtl: 600, cacheEverything: true },
      // `cf` is a Workers-only fetch option that the DOM RequestInit type doesn't know.
    } as RequestInit)
    if (!res.ok) {
      console.warn(`ableton/${name}.ablx: GitHub answered ${res.status}, sending the release list`)
      return Response.redirect(fallback, 302)
    }
    const url = newestAblx(await res.json(), name)
    if (!url) console.warn(`ableton/${name}.ablx: no release with an .ablx, sending the release list`)
    return Response.redirect(url ?? fallback, 302)
  } catch (e) {
    console.warn(`ableton/${name}.ablx: ${e}, sending the release list`)
    return Response.redirect(fallback, 302)
  }
}
