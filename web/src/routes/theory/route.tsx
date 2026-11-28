import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Masthead } from '~/Masthead'
import { SiteFooter } from '~/SiteFooter'
import { BOOK_SUBTITLE, BOOK_TITLE, CHAPTERS } from '~/theory/content/book'
import { Mark } from '~/theory/components/ui'
import { AudioProvider } from '~/theory/lib/audio'
import { StoreProvider, useStore } from '~/theory/lib/store'
import css from '~/theory/styles/theory.css?url'

// The theory book. Its styles, and Noto Music for its notation, load only under /theory.
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
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Music&display=swap' },
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Root,
})

function Root() {
  return (
    <StoreProvider>
      <AudioProvider>
        <div className="page" data-section="theory">
          <TheoryMast />
          <Outlet />
          <SiteFooter current="theory" />
        </div>
      </AudioProvider>
    </StoreProvider>
  )
}

function TheoryMast() {
  const { read, ready } = useStore()
  const done = CHAPTERS.filter((c) => read[c.id]).length
  return (
    <Masthead
      brand={
        <Link className="brand" to="/theory">
          <Mark />
          {BOOK_TITLE}
        </Link>
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
    </Masthead>
  )
}
