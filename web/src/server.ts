import { createServerEntry, createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { EXTENSIONS } from './extensions'
import { newestAblx } from './releases'

const handler = createStartHandler(defaultStreamHandler)

const RELEASES = 'https://github.com/superhighfives/music/releases'
const EXTENSION_IDS = new Set(EXTENSIONS.map((x) => x.id))

export default createServerEntry({
  fetch(request) {
    const url = new URL(request.url)
    const ablx = /^\/ableton\/([a-z-]+)\.ablx$/.exec(url.pathname)
    if (ablx && EXTENSION_IDS.has(ablx[1])) return latestRelease(ablx[1])
    return handler(request)
  },
})

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
