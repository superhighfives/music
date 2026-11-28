import type { ComponentChildren as ReactNode } from 'preact'
import { useState } from 'preact/hooks'
import type { Card, Question } from '~/theory/content/types'

/** A chapter section. Its heading links to itself, and the chapter's contents list it. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="sec" id={id} aria-labelledby={`${id}-h`}>
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
export function Big({ children }: { children: ReactNode }) {
  return <p className="big">{children}</p>
}

/** A side note: a tip, a why, or a "you might hear". */
export function Aside({ label = 'Note', children }: { label?: string; children: ReactNode }) {
  return (
    <aside className="aside">
      <span className="lab">{label}</span>
      <div>{children}</div>
    </aside>
  )
}

/** A panel to play with. Whatever's inside is the interaction. */
export function Try({ title = 'Try it', children }: { title?: string; children: ReactNode }) {
  return (
    <div className="try">
      <div className="lab">{title}</div>
      {children}
    </div>
  )
}

/** A word being defined, the first time it appears. */
export function Term({ children }: { children: ReactNode }) {
  return <dfn className="term">{children}</dfn>
}

export function PlayButton({ playing, onClick, label }: { playing: boolean; onClick: () => void; label?: string }) {
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
      {text.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith('*') && part.endsWith('*') ? <b key={i}>{part.slice(1, -1)}</b> : part))}
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
        <CardText key={i} text={t} />
      ))}
    </div>
  )
}

/**
 * Multiple-choice questions, one after another. Each shows why once answered. Answering every one
 * right on the first try calls `onPass`.
 */
export function Quiz({ questions, onPass, passed }: { questions: Question[]; onPass?: () => void; passed?: boolean }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const answered = answers.filter((a) => a !== null).length
  const right = answers.filter((a, i) => a === questions[i].answer).length
  const finished = answered === questions.length

  const choose = (qi: number, oi: number) => {
    if (answers[qi] !== null) return
    const next = answers.map((a, i) => (i === qi ? oi : a))
    setAnswers(next)
    if (next.every((a, i) => a === questions[i].answer)) onPass?.()
  }

  return (
    <div className="quiz">
      {questions.map((q, qi) => {
        const a = answers[qi]
        // One at a time: the next question appears once this one's answered.
        if (qi > 0 && answers[qi - 1] === null) return null
        return (
          <div key={qi} className="q">
            <div className="qp">
              <span className="qn">{qi + 1}</span>
              <div>{q.prompt}</div>
            </div>
            {q.figure}
            <div className="opts" role="group" aria-label={`Question ${qi + 1} answers`}>
              {q.options.map((o, oi) => {
                const state = a === null ? '' : oi === q.answer ? 'good' : oi === a ? 'bad' : 'idle'
                return (
                  <button key={oi} type="button" className={`opt ${state}`} disabled={a !== null} onClick={() => choose(qi, oi)}>
                    {o}
                  </button>
                )
              })}
            </div>
            {a !== null ? (
              <div className={a === q.answer ? 'why good' : 'why bad'} role="status">
                <b>{a === q.answer ? 'Yes.' : `Not quite: it's ${q.options[q.answer]}.`}</b> {q.why}
              </div>
            ) : null}
          </div>
        )
      })}
      {finished ? (
        <div className="qfoot">
          <span>
            {right} of {questions.length} right.{' '}
            {right === questions.length ? (passed ? 'Check passed.' : '') : 'Get them all to pass the check.'}
          </span>
          <button type="button" className="btn" onClick={() => setAnswers(questions.map(() => null))}>
            Try again
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** Five staff lines with one note on them. */
export function Mark({ big }: { big?: boolean }) {
  return (
    <svg className={big ? 'mark big' : 'mark'} viewBox="0 0 32 32" aria-hidden="true">
      {[8, 12, 16, 20, 24].map((y) => (
        <line key={y} x1="2" x2="30" y1={y} y2={y} />
      ))}
      <ellipse cx="17" cy="14" rx="4.6" ry="3.4" transform="rotate(-20 17 14)" />
    </svg>
  )
}
