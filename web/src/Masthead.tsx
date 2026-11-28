import { Music, Sun } from 'lucide-react'
import type { ReactNode } from 'react'
import { AccountButton } from './account/AccountButton'

/** Applies a saved light/dark choice before first paint, so there's no flash. One choice covers every section. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("music.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`

/**
 * The header every section shares: a music note back to the home page, then the section's mark and name, then the
 * section's own controls (children), the theme toggle and the account button. Home passes no brand.
 */
export function Masthead({ brand, children }: { brand?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mast">
      <nav className="where" aria-label="Breadcrumb">
        <a className="home" href="/" aria-label="music">
          <Music size={22} strokeWidth={1.75} aria-hidden="true" />
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
      <Sun size={20} strokeWidth={1.6} aria-hidden="true" />
    </button>
  )
}
