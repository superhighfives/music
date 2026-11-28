import type { ReactNode } from 'react'
import { AccountButton } from './account/AccountButton'

/** Applies a saved light/dark choice before first paint, so there's no flash. One choice covers every section. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("music.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`

/**
 * The header every section shares: 🎵 back to the home page, then the section's mark and name, then the
 * section's own controls (children), the theme toggle and the account button. Home passes no brand.
 */
export function Masthead({ brand, children }: { brand?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mast">
      <nav className="where" aria-label="Breadcrumb">
        <a className="home" href="/" aria-label="music">
          🎵
        </a>
        {brand ? (
          <>
            <span className="slash" aria-hidden="true">
              /
            </span>
            {brand}
          </>
        ) : null}
      </nav>
      {children}
      <ThemeToggle />
      <AccountButton className="btn" />
    </header>
  )
}

/** A 4×4 pad grid with one pad lit in the section's accent. Each section lights a different pad. */
export function PadMark({ lit, big }: { lit: number; big?: boolean }) {
  return (
    <span className={big ? 'logo big' : 'logo'} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i key={i} className={i === lit ? 'on' : undefined} />
      ))}
    </span>
  )
}

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const current = root.getAttribute('data-theme') ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem('music.theme', next)
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
