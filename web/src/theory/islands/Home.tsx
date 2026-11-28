import { $authStore } from '@clerk/astro/client'
import { useEffect, useState } from 'preact/hooks'
import { CHAPTERS, CONTENTS, findChapter, PARTS } from '~/theory/content/book'
import type { EmailStatus, PreviewResult } from '~/theory/email/api'
import { useSaved } from './store'

/** Continue where you were, or start; then how far through the book you are. */
export function Cover() {
  const { read, checks, last, ready } = useSaved()
  const resume = ready && last ? findChapter(last) : null
  const first = CHAPTERS[0]
  const done = CHAPTERS.filter((c) => read[c.id]).length
  return (
    <>
      <div className="coverbtns">
        {resume ? (
          <a className="btn primary" href={`/theory/${resume.id}`}>
            Continue: {resume.title} →
          </a>
        ) : first ? (
          <a className="btn primary" href={`/theory/${first.id}`}>
            Start reading →
          </a>
        ) : null}
        <a className="btn" href="#contents">
          Contents
        </a>
      </div>
      {ready && done > 0 ? (
        <p className="meta">
          {done} of {CHAPTERS.length} written {CHAPTERS.length === 1 ? 'chapter' : 'chapters'} read · {Object.keys(checks).length} checks passed
        </p>
      ) : null}
    </>
  )
}

/** Every part's chapters, each marked read or passed. */
export function Toc() {
  const { read, checks, ready } = useSaved()
  return (
    <>
      {PARTS.map((part, pi) => (
        <div key={part.id} className="tocpart">
          <div className="tochead">
            <span className="lab">
              Part {pi + 1} · {part.level}
            </span>
            <h3>{part.title}</h3>
            <p>{part.blurb}</p>
          </div>
          <ol className="toclist">
            {CONTENTS.filter((e) => e.part === part).map((e) =>
              'chapter' in e ? (
                <li key={e.n}>
                  <a href={`/theory/${e.chapter.id}`} className={ready && read[e.chapter.id] ? 'done' : undefined}>
                    <span className="n">{String(e.n).padStart(2, '0')}</span>
                    <span className="t">
                      <b>{e.chapter.title}</b>
                      <span>{e.chapter.summary}</span>
                    </span>
                    <span className="st">{ready && checks[e.chapter.id] ? 'Passed' : ready && read[e.chapter.id] ? 'Read' : `${e.chapter.minutes} min`}</span>
                  </a>
                </li>
              ) : (
                <li key={e.n} className="planned">
                  <span className="n">{String(e.n).padStart(2, '0')}</span>
                  <span className="t">
                    <b>{e.planned.title}</b>
                    <span>{e.planned.summary}</span>
                  </span>
                  <span className="st">Soon</span>
                </li>
              ),
            )}
          </ol>
        </div>
      ))}
    </>
  )
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, init)
  if (!r.ok) throw new Error(`${path}: ${r.status}`)
  return r.json() as Promise<T>
}
const post = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

/** Turn the daily email on or off. Signed out, it explains that it needs an account. */
export function DailyEmail() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [status, setStatus] = useState<EmailStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  useEffect(() => $authStore.subscribe((a) => setUserId(a.userId)), [])
  useEffect(() => {
    if (userId === undefined) return
    if (userId === null) return setStatus({ signedIn: false })
    call<EmailStatus>('/api/theory/email')
      .then(setStatus)
      .catch(() => setNote("Couldn't check your email setting. Try reloading."))
  }, [userId])
  const toggle = async (on: boolean) => {
    setBusy(true)
    setNote(null)
    try {
      setStatus(await call<EmailStatus>('/api/theory/email', post({ on })))
    } catch {
      setNote("That didn't save. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }
  const preview = async () => {
    setBusy(true)
    try {
      const result = await call<PreviewResult>('/api/theory/email/preview', post({}))
      if ('waitMinutes' in result) setNote(`You just sent one. Try again in ${result.waitMinutes} ${result.waitMinutes === 1 ? 'minute' : 'minutes'}.`)
      else setNote(result.title ? `Sent “${result.title}”. It doesn't count as today's.` : 'Nothing to send yet.')
    } catch {
      setNote("Couldn't send it. The email service may not be set up yet.")
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="daily" aria-labelledby="daily-h">
      <h2 id="daily-h" className="lab">
        Daily email
      </h2>
      <p>
        One idea from the book each morning, in reading order: a concept, a pattern or a tip, with a link back to its chapter. New chapters join the
        queue as they're written.
      </p>
      {!status ? (
        <p className="dim">…</p>
      ) : !status.signedIn ? (
        <p className="dim">Sign in (top right) to get it. Your progress follows you to other devices too.</p>
      ) : status.subscribed ? (
        <>
          <p>
            On, to <b>{status.email}</b>.
          </p>
          <div className="row">
            <button type="button" className="btn" disabled={busy} onClick={() => toggle(false)}>
              Turn off
            </button>
            <button type="button" className="btn" disabled={busy} onClick={preview}>
              Send one now
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" className="btn primary" disabled={busy || !status.email} onClick={() => toggle(true)}>
            Send me one a day
          </button>
          {status.email ? <p className="dim small">To {status.email}.</p> : <p className="dim small">Your account needs an email address.</p>}
        </>
      )}
      {note ? (
        <p className="small" role="status">
          {note}
        </p>
      ) : null}
    </section>
  )
}
