import { dark } from '@clerk/ui/themes'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { SiteFooter } from '~/SiteFooter'
import { AccountButton, type ClerkAppearance, useDarkPage } from '~/account/AccountButton'
import { BOOK_SUBTITLE, BOOK_TITLE, CHAPTERS } from '~/theory/content/book'
import { Mark } from '~/theory/components/ui'
import { AudioProvider } from '~/theory/lib/audio'
import { StoreProvider, useStore } from '~/theory/lib/store'
import css from '~/theory/styles/theory.css?url'

// Applies a saved light/dark choice before first paint, so there's no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theory.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`

// The theory book. Its styles, fonts and theme load only under /theory.
export const Route = createFileRoute('/theory')({
  head: () => ({
    meta: [
      { title: `${BOOK_TITLE} · ${BOOK_SUBTITLE}` },
      {
        name: 'description',
        content: 'An illustrated, interactive music theory book: reading music, scales, chords and harmony, and theory for songwriting, from the first note to advanced harmony.',
      },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Instrument+Sans:wght@400..700&family=Noto+Music&display=swap',
      },
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
    scripts: [{ children: THEME_SCRIPT }],
  }),
  component: Root,
})

function Root() {
  return (
    <StoreProvider>
      <AudioProvider>
        <div className="book">
          <Masthead />
          <Outlet />
          <SiteFooter current="theory" />
        </div>
      </AudioProvider>
    </StoreProvider>
  )
}

const CLERK_LIGHT: ClerkAppearance = { variables: { fontFamily: 'var(--ui)', colorPrimary: 'oklch(0.52 0.15 35)' } }
const CLERK_DARK: ClerkAppearance = { theme: dark, variables: { fontFamily: 'var(--ui)', colorPrimary: 'oklch(0.76 0.13 45)' } }

function Masthead() {
  const { read, ready } = useStore()
  const done = CHAPTERS.filter((c) => read[c.id]).length
  const clerkAppearance = useDarkPage() ? CLERK_DARK : CLERK_LIGHT
  return (
    <header className="mast">
      <Link className="brand" to="/theory">
        <Mark />
        {BOOK_TITLE}
      </Link>
      {ready && done > 0 ? (
        <span className="mastprog" title={`${done} of ${CHAPTERS.length} chapters read`}>
          <span className="bar">
            <i style={{ width: `${(done / CHAPTERS.length) * 100}%` }} />
          </span>
          {done}/{CHAPTERS.length}
        </span>
      ) : null}
      <ThemeToggle />
      <AccountButton className="btn" appearance={clerkAppearance} />
    </header>
  )
}

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const current = root.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theory.theme', next)
    } catch {
      // Not remembered, but the switch still applies.
    }
  }
  return (
    <button type="button" className="iconbtn" aria-label="Switch light or dark theme" onClick={toggle}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  )
}
