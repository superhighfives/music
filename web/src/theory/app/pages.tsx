/** @jsxImportSource ~/content */
import { island, type Node } from '~/content/jsx-runtime'
import { Masthead as SiteMasthead } from '~/islands/masthead'
import { CardView, Mark } from '~/theory/components/ui'
import { BOOK_SUBTITLE, BOOK_TITLE, CARDS, CHAPTERS, CONTENTS, chapterNumber, type Entry, findChapter, LOG, PARTS, partOf } from '~/theory/content/book'
import type { Chapter } from '~/theory/content/types'
import type { Saved } from '~/theory/lib/saved'
import { Quiz } from './Quiz'

/*
 * The book's pages, as content. The controls are islands the Theory component fills in: the light or
 * dark switch, sign-in, the daily email, and the button that marks a chapter read. Links between pages
 * are plain links, so each page renders on the server.
 */

export type Route = { readonly _tag: 'Home' } | { readonly _tag: 'Chapter'; readonly chapter: Chapter } | { readonly _tag: 'NotFound' }

export function routeOf(path: string): Route {
  const parts = path.replace(/\/+$/, '').split('/').slice(2)
  if (parts.length === 0) return { _tag: 'Home' }
  const chapter = parts.length === 1 && parts[0] ? findChapter(parts[0]) : undefined
  return chapter ? { _tag: 'Chapter', chapter } : { _tag: 'NotFound' }
}

/** The chapter's sections, for its contents: every Section in its text, in order. */
export function sectionsOf(node: Node): { id: string; title: string }[] {
  if (node === null || node === undefined || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(sectionsOf)
  if (!('_tag' in node) || node._tag !== 'Element') return []
  const { id, className } = node.props
  const title = node.props['data-title']
  const here = className === 'sec' && typeof id === 'string' && typeof title === 'string' ? [{ id, title }] : []
  return [...here, ...sectionsOf(node.children)]
}

/** Everything the chapter's contents list: its text's sections, then its key ideas and its check. */
export const chapterSections = (chapter: Chapter, body: Node = chapter.Body()) => [
  ...sectionsOf(body),
  { id: 'key-ideas', title: 'Key ideas' },
  ...(chapter.check.length ? [{ id: 'check', title: 'Check yourself' }] : []),
]

const chapterHref = (id: string) => `/theory/${id}`

type Progress = { saved: Saved; ready: boolean }

export function Masthead({ saved, ready }: Progress) {
  const done = CHAPTERS.filter((c) => saved.read[c.id]).length
  return (
    <SiteMasthead
      brand={
        <a className="brand" href="/theory">
          <Mark />
          {BOOK_TITLE}
        </a>
      }
    >
      {ready && done > 0 ? (
        <span className="mastprog" title={`${done} of ${CHAPTERS.length} chapters read`}>
          <span className="bar">
            <i style={{ width: `${(done / CHAPTERS.length) * 100}%` }} />
          </span>
          {done}/{CHAPTERS.length}
        </span>
      ) : null}
    </SiteMasthead>
  )
}

function ContentsLine({ entry, current, done, children }: { entry: Entry; current: string; done: boolean; children?: Node }) {
  const n = String(entry.n).padStart(2, '0')
  if ('planned' in entry)
    return (
      <span className="cline planned" title="Planned">
        <span className="n">{n}</span>
        <span>{entry.planned.title}</span>
      </span>
    )
  return (
    <>
      <a className={done ? 'cline done' : 'cline'} href={chapterHref(entry.chapter.id)} aria-current={entry.chapter.id === current ? 'page' : undefined}>
        <span className="n">{done ? '✓' : n}</span>
        <span>{entry.chapter.title}</span>
      </a>
      {children}
    </>
  )
}

/** The whole book's contents, as a rail beside a chapter. The open chapter lists its sections. */
function Contents({ current, sections, active, saved, ready }: Progress & { current: string; sections: { id: string; title: string }[]; active: string | null }) {
  return (
    <nav className="contents" aria-label="Contents">
      {PARTS.map((part) => (
        <div className="cpart">
          <div className="lab">{part.title}</div>
          {CONTENTS.filter((e) => e.part === part).map((e) => (
            <ContentsLine entry={e} current={current} done={ready && 'chapter' in e && !!saved.read[e.chapter.id]}>
              {'chapter' in e && e.chapter.id === current && sections.length ? (
                <ol className="csecs">
                  {sections.map((s) => (
                    <li>
                      <a href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              ) : null}
            </ContentsLine>
          ))}
        </div>
      ))}
    </nav>
  )
}

export function ChapterPage({ chapter, active, saved, ready }: Progress & { chapter: Chapter; active: string | null }) {
  const index = CHAPTERS.indexOf(chapter)
  const prev = CHAPTERS[index - 1]
  const next = CHAPTERS[index + 1]
  const part = partOf(chapter)
  const body = chapter.Body()
  const sections = chapterSections(chapter, body)
  const progress = { saved, ready }
  return (
    <>
      <div className="readbar" aria-hidden="true" />
      <div className="reader">
        {/* A sticky rail on wide screens; on narrow ones, a closed disclosure above the chapter. */}
        <div className="rail">
          <Contents current={chapter.id} sections={sections} active={active} {...progress} />
        </div>
        <details className="railmobile">
          <summary>Contents</summary>
          <Contents current={chapter.id} sections={sections} active={active} {...progress} />
        </details>
        <article className="chapter">
          <header className="chead">
            <span className="lab">
              {part?.title} · Chapter {chapterNumber(chapter)}
            </span>
            <h1>{chapter.title}</h1>
            <p className="summary">{chapter.summary}</p>
            <span className="meta">
              About {chapter.minutes} minutes
              {saved.read[chapter.id] ? ' · Read' : ''}
              {saved.checks[chapter.id] ? ' · Check passed' : ''}
            </span>
          </header>
          <div className="prose">{body}</div>
          <section className="sec ideas" id="key-ideas" aria-labelledby="key-ideas-h">
            <h2 id="key-ideas-h">Key ideas</h2>
            <div className="cards">
              {chapter.cards.map((c) => (
                <CardView card={c} />
              ))}
            </div>
          </section>
          {chapter.check.length ? (
            <section className="sec" id="check" aria-labelledby="check-h">
              <h2 id="check-h">Check yourself</h2>
              <Quiz chapterId={chapter.id} passed={!!saved.checks[chapter.id]} />
            </section>
          ) : null}
          <div className="cfoot">
            {island('ReadButton', { chapterId: chapter.id })}
            <div className="navbtns">
              {prev ? (
                <a className="btn" href={chapterHref(prev.id)}>
                  ← {prev.title}
                </a>
              ) : null}
              {next ? (
                <a className="btn" href={chapterHref(next.id)}>
                  {next.title} →
                </a>
              ) : (
                <a className="btn" href="/theory">
                  More chapters soon · Contents
                </a>
              )}
            </div>
          </div>
        </article>
      </div>
    </>
  )
}

export function HomePage({ saved, ready, day }: Progress & { day: number }) {
  const resume = ready && saved.last ? findChapter(saved.last) : null
  const first = CHAPTERS[0]
  const today = CARDS[day % CARDS.length]
  const done = CHAPTERS.filter((c) => saved.read[c.id]).length
  return (
    <>
      <section className="hero">
        <Mark big />
        <h1>{BOOK_TITLE}</h1>
        <p className="subtitle">{BOOK_SUBTITLE}</p>
        <p className="lede">
          A music theory book you can play. It starts at the first note and works up to advanced harmony: reading music, scales and keys, chords,
          and the patterns behind songs. Every idea is drawn, and almost every drawing makes a sound.
        </p>
        <div className="coverbtns">
          {resume ? (
            <a className="btn primary" href={chapterHref(resume.id)}>
              Continue: {resume.title} →
            </a>
          ) : first ? (
            <a className="btn primary" href={chapterHref(first.id)}>
              Start reading →
            </a>
          ) : null}
          <a className="btn" href="#contents">
            Contents
          </a>
        </div>
        {ready && done > 0 ? (
          <p className="meta">
            {done} of {CHAPTERS.length} written {CHAPTERS.length === 1 ? 'chapter' : 'chapters'} read · {Object.keys(saved.checks).length} checks passed
          </p>
        ) : null}
      </section>
      <div className="home">
        <div className="homegrid">
          {today ? (
            <section className="today" aria-labelledby="today-h">
              <h2 id="today-h" className="lab">
                Today's idea
              </h2>
              <CardView card={today} />
              <a className="more" href={`${chapterHref(today.chapter.id)}#card-${today.id}`}>
                From {today.chapter.title} →
              </a>
            </section>
          ) : null}
          {island('DailyEmail')}
        </div>
        <section className="block" id="contents" aria-labelledby="contents-h">
          <h2 id="contents-h">Contents</h2>
          {PARTS.map((part, pi) => (
            <div className="tocpart">
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
                    <li>
                      <a href={chapterHref(e.chapter.id)} className={ready && saved.read[e.chapter.id] ? 'done' : undefined}>
                        <span className="n">{String(e.n).padStart(2, '0')}</span>
                        <span className="t">
                          <b>{e.chapter.title}</b>
                          <span>{e.chapter.summary}</span>
                        </span>
                        <span className="st">
                          {ready && saved.checks[e.chapter.id] ? 'Passed' : ready && saved.read[e.chapter.id] ? 'Read' : `${e.chapter.minutes} min`}
                        </span>
                      </a>
                    </li>
                  ) : (
                    <li className="planned">
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
        <section className="block" aria-labelledby="log-h">
          <h2 id="log-h">Edition log</h2>
          <div className="log">
            {LOG.map(([date, text]) => (
              <div>
                <time dateTime={date}>{new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</time>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

export function NotFoundPage(): Node {
  return (
    <div className="home">
      <h1>Not found</h1>
      <p>
        <a href="/theory">Back to the book</a>
      </p>
    </div>
  )
}
