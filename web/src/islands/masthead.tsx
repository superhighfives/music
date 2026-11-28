/** @jsxImportSource ~/content */
import type { IconNode } from 'lucide'
import { Music } from 'lucide'
import { island, jsx, type Node } from '~/content/jsx-runtime'

/** A Lucide icon, drawn as Lucide's own SVG does. */
export function Icon({ icon, size = 24, strokeWidth = 2 }: { icon: IconNode; size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {icon.map(([tag, attrs]) => jsx(tag, attrs))}
    </svg>
  )
}

/** A 4×4 pad grid with one pad lit in the section's accent. Each section lights a different pad. */
export function PadMark({ lit, big }: { lit: number; big?: boolean }) {
  return (
    <span className={big ? 'logo big' : 'logo'} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i className={i === lit ? 'on' : undefined} />
      ))}
    </span>
  )
}

/**
 * The header every section shares: a music note back to the home page, then the section's mark and name, then the
 * section's own controls (children), the theme toggle and the account button. Home passes no brand. The toggle and
 * the account button are islands each page's component fills in, with `mastheadIslands` from views.ts.
 */
export function Masthead({ brand, children }: { brand?: Node; children?: Node }) {
  return (
    <header className="mast">
      <nav className="where" aria-label="Breadcrumb">
        <a className="home" href="/" aria-label="music">
          <Icon icon={Music} size={22} strokeWidth={1.75} />
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
      {island('ThemeToggle')}
      {island('Account')}
    </header>
  )
}
