import css from './site-footer.css?url'

export type Section = 'home' | 'chords' | 'sounds' | 'theory' | 'ableton' | 'privacy'

const LINKS: { id: Section; href: string; label: string }[] = [
  { id: 'home', href: '/', label: 'music' },
  { id: 'chords', href: '/chords', label: 'chords' },
  { id: 'sounds', href: '/sounds', label: 'sounds' },
  { id: 'theory', href: '/theory', label: 'Theory' },
  { id: 'ableton', href: '/ableton', label: 'Ableton Extensions' },
  { id: 'privacy', href: '/privacy', label: 'Privacy' },
]

/**
 * The same footer in every section: home and each part of music. It brings its own small stylesheet
 * (React puts it in the head once), and takes its colours from the text around it, so it fits each
 * section's look, light or dark. Plain links, like everywhere else between sections.
 */
export function SiteFooter({ current, className }: { current: Section; className?: string }) {
  return (
    <footer className={className ? `sitefoot ${className}` : 'sitefoot'}>
      <link rel="stylesheet" href={css} precedence="default" />
      <nav aria-label="music">
        {LINKS.map((l) => (
          <a key={l.id} href={l.href} aria-current={l.id === current ? 'page' : undefined}>
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
