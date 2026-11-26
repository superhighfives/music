import { createServerEntry, createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { moved } from './moved'

const handler = createStartHandler(defaultStreamHandler)

/** The old addresses, and the section of music.charliegleason.com each one moved to. */
const OLD_HOSTS: Record<string, string> = {
  'chords.charliegleason.com': 'chords',
  'sounds.charliegleason.com': 'sounds',
}

const RELEASES = 'https://github.com/superhighfives/music/releases'
const EXTENSIONS = new Set(['chords', 'progressive', 'ambient', 'reverse-midi'])

export default createServerEntry({
  fetch(request) {
    const url = new URL(request.url)
    const section = OLD_HOSTS[url.hostname]
    if (section) return moved(url, section)
    const ablx = /^\/ableton\/([a-z-]+)\.ablx$/.exec(url.pathname)
    if (ablx && EXTENSIONS.has(ablx[1])) return latestRelease(ablx[1])
    return handler(request)
  },
})

type Release = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: { name: string; browser_download_url: string }[]
}

/**
 * Redirects to the newest .ablx for an extension, so /ableton links never need a version bump.
 * Releases are tagged ableton/<name>-<version>. If GitHub can't be reached, it falls back to the
 * release list filtered to that extension.
 */
async function latestRelease(name: string): Promise<Response> {
  const prefix = `ableton/${name}-`
  const fallback = `${RELEASES}?q=${encodeURIComponent(prefix)}`
  try {
    const res = await fetch('https://api.github.com/repos/superhighfives/music/releases?per_page=100', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'music.charliegleason.com' },
      // GitHub allows 60 unauthenticated requests an hour, so keep its answer for 10 minutes.
      cf: { cacheTtl: 600, cacheEverything: true },
    } as RequestInit)
    if (!res.ok) return Response.redirect(fallback, 302)
    // GitHub lists the newest release first.
    const releases: Release[] = await res.json()
    const release = releases.find((r) => !r.draft && !r.prerelease && r.tag_name.startsWith(prefix))
    const asset = release?.assets.find((a) => a.name.endsWith('.ablx'))
    return Response.redirect(asset?.browser_download_url ?? fallback, 302)
  } catch {
    return Response.redirect(fallback, 302)
  }
}
