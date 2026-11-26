import { describe, expect, it } from 'vitest'
import { newestAblx } from './releases'

const release = (tag: string, extra: object = {}) => ({
  tag_name: tag,
  draft: false,
  prerelease: false,
  assets: [{ name: `${tag.split('/')[1]}.ablx`, browser_download_url: `https://example.com/${tag}.ablx` }],
  ...extra,
})

describe('newestAblx', () => {
  it('picks the first matching release, which GitHub lists as the newest', () => {
    const releases = [release('ableton/chords-1.1.0'), release('ableton/ambient-1.0.0'), release('ableton/chords-1.0.0')]
    expect(newestAblx(releases, 'chords')).toBe('https://example.com/ableton/chords-1.1.0.ablx')
  })

  it('skips drafts and prereleases', () => {
    const releases = [
      release('ableton/chords-2.0.0', { draft: true }),
      release('ableton/chords-1.2.0', { prerelease: true }),
      release('ableton/chords-1.1.0'),
    ]
    expect(newestAblx(releases, 'chords')).toBe('https://example.com/ableton/chords-1.1.0.ablx')
  })

  it("doesn't match an extension whose name starts the same way", () => {
    expect(newestAblx([release('ableton/chords-extra-1.0.0')], 'chords')).toBeUndefined()
    expect(newestAblx([release('ableton/reverse-midi-1.0.0')], 'reverse')).toBeUndefined()
  })

  it('needs an .ablx asset', () => {
    expect(newestAblx([release('ableton/chords-1.0.0', { assets: [] })], 'chords')).toBeUndefined()
  })

  it('returns nothing for an unexpected shape', () => {
    expect(newestAblx({ message: 'rate limited' }, 'chords')).toBeUndefined()
    expect(newestAblx([null, { tag_name: 3 }], 'chords')).toBeUndefined()
  })
})
