/** The site's sections, in footer order. Plain data, so the React sections and Effect UI's Chords share it. */
export type Section = 'home' | 'chords' | 'production' | 'theory' | 'ableton' | 'privacy'

export const SITE_LINKS: ReadonlyArray<{ id: Section; href: string; label: string }> = [
  { id: 'home', href: '/', label: 'music' },
  { id: 'chords', href: '/chords', label: 'Chords' },
  { id: 'production', href: '/production', label: 'Production' },
  { id: 'theory', href: '/theory', label: 'Theory' },
  { id: 'ableton', href: '/ableton', label: 'Extensions' },
  { id: 'privacy', href: '/privacy', label: 'Privacy' },
]
