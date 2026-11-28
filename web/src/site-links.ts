/** The site's sections, in footer order. Plain data, shared by every page's footer. */
export type Section = 'home' | 'chords' | 'production' | 'theory' | 'ableton' | 'tools' | 'privacy'

export const SITE_LINKS: ReadonlyArray<{ id: Section; href: string; label: string }> = [
  { id: 'home', href: '/', label: 'music' },
  { id: 'chords', href: '/chords', label: 'Chords' },
  { id: 'production', href: '/production', label: 'Production' },
  { id: 'theory', href: '/theory', label: 'Theory' },
  { id: 'ableton', href: '/ableton', label: 'Extensions' },
  { id: 'tools', href: '/tools', label: 'Tools' },
  { id: 'privacy', href: '/privacy', label: 'Privacy' },
]
