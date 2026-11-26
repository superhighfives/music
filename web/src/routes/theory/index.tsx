import { useAuth } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CardView, Mark } from '~/theory/components/ui'
import { BOOK_SUBTITLE, BOOK_TITLE, cardOfTheDay, CHAPTERS, CONTENTS, findChapter, LOG, PARTS } from '~/theory/content/book'
import { emailStatus, type EmailStatus, sendPreview, setDailyEmail } from '~/theory/email/subscription'
import { useStore } from '~/theory/lib/store'

export const Route = createFileRoute('/theory/')({ component: Home })

function Home() {
  const { read, checks, last, ready } = useStore()
  const resume = ready && last ? findChapter(last) : null
  const first = CHAPTERS[0]
  const today = cardOfTheDay()
  const done = CHAPTERS.filter((c) => read[c.id]).length
  return (
    <div className="home">
      <section className="cover">
        <Mark big />
        <h1>{BOOK_TITLE}</h1>
        <p className="subtitle">{BOOK_SUBTITLE}</p>
        <p className="lede">
          A music theory book you can play. It starts at the first note and works up to advanced harmony: reading music, scales and keys, chords,
          and the patterns behind songs. Every idea is drawn, and almost every drawing makes a sound.
        </p>
        <div className="coverbtns">
          {resume ? (
            <Link className="btn primary" to="/theory/$chapterId" params={{ chapterId: resume.id }}>
              Continue: {resume.title} →
            </Link>
          ) : first ? (
            <Link className="btn primary" to="/theory/$chapterId" params={{ chapterId: first.id }}>
              Start reading →
            </Link>
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
      </section>

      <div className="homegrid">
        {today ? (
          <section className="today" aria-labelledby="today-h">
            <h2 id="today-h" className="lab">
              Today's idea
            </h2>
            <CardView card={today} />
            <Link className="more" to="/theory/$chapterId" params={{ chapterId: today.chapter.id }} hash={`card-${today.id}`}>
              From {today.chapter.title} →
            </Link>
          </section>
        ) : null}
        <DailyEmail />
      </div>

      <section className="toc" id="contents" aria-labelledby="contents-h">
        <h2 id="contents-h">Contents</h2>
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
                    <Link to="/theory/$chapterId" params={{ chapterId: e.chapter.id }} className={ready && read[e.chapter.id] ? 'done' : undefined}>
                      <span className="n">{String(e.n).padStart(2, '0')}</span>
                      <span className="t">
                        <b>{e.chapter.title}</b>
                        <span>{e.chapter.summary}</span>
                      </span>
                      <span className="st">
                        {ready && checks[e.chapter.id] ? 'Passed' : ready && read[e.chapter.id] ? 'Read' : `${e.chapter.minutes} min`}
                      </span>
                    </Link>
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
      </section>

      <section className="log" aria-labelledby="log-h">
        <h2 id="log-h">Edition log</h2>
        {LOG.map(([date, text]) => (
          <div key={date + text}>
            <time dateTime={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
            <span>{text}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

/** Turn the daily email on or off. Signed out, it explains that it needs an account. */
function DailyEmail() {
  const { isSignedIn, isLoaded } = useAuth()
  const [status, setStatus] = useState<EmailStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return setStatus({ signedIn: false })
    emailStatus()
      .then(setStatus)
      .catch(() => setNote("Couldn't check your email setting. Try reloading."))
  }, [isLoaded, isSignedIn])

  const toggle = async (on: boolean) => {
    setBusy(true)
    setNote(null)
    try {
      setStatus(await setDailyEmail({ data: on }))
    } catch {
      setNote("That didn't save. Try again in a moment.")
    } finally {
      setBusy(false)
    }
  }

  const preview = async () => {
    setBusy(true)
    try {
      const result = await sendPreview()
      if ('waitMinutes' in result)
        setNote(`You just sent one. Try again in ${result.waitMinutes} ${result.waitMinutes === 1 ? 'minute' : 'minutes'}.`)
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
        One idea from the book each morning, in reading order: a concept, a pattern or a tip, with a link back to its chapter. New chapters join
        the queue as they're written.
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
