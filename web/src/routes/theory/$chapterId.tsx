import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Contents } from '~/theory/components/Contents'
import { CardView, Quiz } from '~/theory/components/ui'
import { BOOK_TITLE, CHAPTERS, chapterNumber, findChapter, partOf } from '~/theory/content/book'
import type { Chapter } from '~/theory/content/types'
import { useStore } from '~/theory/lib/store'

export const Route = createFileRoute('/theory/$chapterId')({
  loader: ({ params }) => {
    if (!findChapter(params.chapterId)) throw notFound()
  },
  head: ({ params }) => {
    const c = findChapter(params.chapterId)
    return { meta: [{ title: `${c?.title ?? 'Chapter'} · ${BOOK_TITLE}` }, { name: 'description', content: c?.summary ?? '' }] }
  },
  component: ChapterPage,
})

function ChapterPage() {
  const { chapterId } = Route.useParams()
  const chapter = findChapter(chapterId)
  // Remounts per chapter, so quizzes and explorers start fresh.
  return chapter ? <Reader key={chapter.id} chapter={chapter} /> : null
}

function Reader({ chapter }: { chapter: Chapter }) {
  const { read, checks, toggleRead, passCheck, visit } = useStore()
  const index = CHAPTERS.indexOf(chapter)
  const prev = CHAPTERS[index - 1]
  const next = CHAPTERS[index + 1]
  const part = partOf(chapter)
  const n = chapterNumber(chapter)

  useEffect(() => visit(chapter.id), [chapter.id, visit])

  return (
    <>
      <div className="readbar" aria-hidden="true" />
      <div className="reader">
        {/* A sticky rail on wide screens; on narrow ones, a closed disclosure above the chapter. */}
        <div className="rail">
          <Contents current={chapter.id} />
        </div>
        <details className="railmobile">
          <summary>Contents</summary>
          <Contents current={chapter.id} />
        </details>
        <article className="chapter">
          <header className="chead">
            <span className="lab">
              {part?.title} · Chapter {n}
            </span>
            <h1>{chapter.title}</h1>
            <p className="summary">{chapter.summary}</p>
            <span className="meta">
              About {chapter.minutes} minutes
              {read[chapter.id] ? ' · Read' : ''}
              {checks[chapter.id] ? ' · Check passed' : ''}
            </span>
          </header>
          <div className="prose">
            <chapter.Body />
          </div>

          <section className="sec ideas" id="key-ideas" aria-labelledby="key-ideas-h">
            <h2 id="key-ideas-h">Key ideas</h2>
            <div className="cards">
              {chapter.cards.map((c) => (
                <CardView key={c.id} card={c} />
              ))}
            </div>
          </section>

          {chapter.check.length ? (
            <section className="sec" id="check" aria-labelledby="check-h">
              <h2 id="check-h">Check yourself</h2>
              <Quiz questions={chapter.check} onPass={() => passCheck(chapter.id)} passed={!!checks[chapter.id]} />
            </section>
          ) : null}

          <div className="cfoot">
            <button type="button" className={read[chapter.id] ? 'btn isdone' : 'btn primary'} onClick={() => toggleRead(chapter.id)}>
              {read[chapter.id] ? '✓ Read' : 'Mark chapter read'}
            </button>
            <div className="navbtns">
              {prev ? (
                <Link className="btn" to="/theory/$chapterId" params={{ chapterId: prev.id }}>
                  ← {prev.title}
                </Link>
              ) : null}
              {next ? (
                <Link className="btn" to="/theory/$chapterId" params={{ chapterId: next.id }}>
                  {next.title} →
                </Link>
              ) : (
                <Link className="btn" to="/theory">
                  More chapters soon · Contents
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </>
  )
}
