type Release = {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: { name: string; browser_download_url: string }[]
}

/** The newest .ablx for an extension, from GitHub's release list (newest first), checking the shape as it goes. */
export function newestAblx(releases: unknown, name: string): string | undefined {
  if (!Array.isArray(releases)) return undefined
  const prefix = `ableton/${name}-`
  const release = releases.find(
    (r): r is Release =>
      typeof r?.tag_name === 'string' &&
      // A version must follow, so "chords" doesn't match a "chords-extra" extension.
      r.tag_name.startsWith(prefix) &&
      /^\d/.test(r.tag_name.slice(prefix.length)) &&
      !r.draft && !r.prerelease && Array.isArray(r.assets),
  )
  const asset = release?.assets.find((a) => typeof a?.name === 'string' && a.name.endsWith('.ablx'))
  return typeof asset?.browser_download_url === 'string' ? asset.browser_download_url : undefined
}
