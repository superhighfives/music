/** @jsxImportSource ~/content */
import type { Node } from '~/content/jsx-runtime'
import type { Card } from '~/theory/content/types'

/** A chapter section. Its heading links to itself, and the chapter's contents list it. */
export function Section({ id, title, children }: { id: string; title: string; children?: Node }) {
  return (
    <section className="sec" id={id} aria-labelledby={`${id}-h`} data-title={title}>
      <h2 id={`${id}-h`}>
        <a href={`#${id}`} className="anchor" aria-hidden="true" tabIndex={-1}>
          §
        </a>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** A highlighted idea to remember. */
export function Big({ children }: { children?: Node }) {
  return <p className="big">{children}</p>
}

/** A side note: a tip, a why, or a "you might hear". */
export function Aside({ label = 'Note', children }: { label?: string; children?: Node }) {
  return (
    <aside className="aside">
      <span className="lab">{label}</span>
      <div>{children}</div>
    </aside>
  )
}

/** A panel to play with. Whatever's inside is the interaction. */
export function Try({ title = 'Try it', children }: { title?: string; children?: Node }) {
  return (
    <div className="try">
      <div className="lab">{title}</div>
      {children}
    </div>
  )
}

/** A word being defined, the first time it appears. */
export function Term({ children }: { children?: Node }) {
  return <dfn className="term">{children}</dfn>
}

/** `onClick` returns the message to send: start or stop a sequence. */
export function PlayButton({ playing, onClick, label }: { playing: boolean; onClick: () => unknown; label?: string }) {
  return (
    <button type="button" className="play" onClick={onClick} aria-pressed={playing}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        {playing ? <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" /> : <path d="M3.5 2 12 7 3.5 12z" />}
      </svg>
      {label ?? (playing ? 'Stop' : 'Play')}
    </button>
  )
}

/** Renders a card paragraph, where `*word*` is bold. */
export function CardText({ text }: { text: string }) {
  return (
    <p>
      {text.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith('*') && part.endsWith('*') ? <b>{part.slice(1, -1)}</b> : part))}
    </p>
  )
}

const KIND_LABEL: Record<Card['kind'], string> = { concept: 'Concept', pattern: 'Pattern', tip: 'Tip', listen: 'Listen for' }

export function CardView({ card }: { card: Card }) {
  return (
    <div className={`card ${card.kind}`} id={`card-${card.id}`}>
      <span className="lab">{KIND_LABEL[card.kind]}</span>
      <h3>{card.title}</h3>
      {card.body.map((t, i) => (
        <CardText text={t} />
      ))}
    </div>
  )
}

/** Five staff lines with one note on them. */
export function Mark({ big }: { big?: boolean }) {
  return (
    <svg className={big ? 'mark big' : 'mark'} viewBox="0 0 32 32" aria-hidden="true">
      {[8, 12, 16, 20, 24].map((y) => (
        <line x1="2" x2="30" y1={y} y2={y} />
      ))}
      <ellipse cx="17" cy="14" rx="4.6" ry="3.4" transform="rotate(-20 17 14)" />
    </svg>
  )
}
