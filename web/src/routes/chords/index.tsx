import { useAuth, useClerk } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { DARK_APPEARANCE } from '~/account/AccountButton'
import { loadSaved, storeSaved } from '~/account/saved'
import type { ChordsHandle } from '~/chords/app/mount'
import css from '~/chords/styles.css?url'
import footerCss from '~/site-footer.css?url'

export const Route = createFileRoute('/chords/')({
  head: () => ({
    meta: [
      { title: 'chords · chord shapes for Ableton Move' },
      { name: 'description', content: 'See chord shapes on the Ableton Move pad grid in any key, scale and layout.' },
    ],
    // Tailwind loads only under /chords, so it never meets the other sections' styles.
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'stylesheet', href: footerCss },
      { rel: 'icon', href: '/chords/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: ChordsPage,
})

/**
 * Chords is an Effect UI app. This route is its shell: it keeps the document head and the Clerk session,
 * mounts the app in the browser, and tells it who is signed in. The app reads and writes the URL itself.
 */
function ChordsPage() {
  const node = useRef<HTMLDivElement>(null)
  const chords = useRef<ChordsHandle | null>(null)
  const clerk = useClerk()
  const { userId } = useAuth()
  const user = useRef(userId ?? null)
  user.current = userId ?? null

  useEffect(() => {
    let cancelled = false
    // Loaded in the browser only: Chords talks to Move over Web MIDI and plays audio, so it has nothing to render on the server.
    void import('~/chords/app/mount').then(({ mountChords }) => {
      if (cancelled || !node.current) return
      chords.current = mountChords(node.current, {
        io: {
          load: () => loadSaved({ data: 'chords.songs' }),
          store: (value, base) => storeSaved({ data: { key: 'chords.songs', value, base } }),
        },
        auth: {
          openSignIn: () => clerk.openSignIn({ appearance: DARK_APPEARANCE }),
          mountUserButton: (el) => clerk.mountUserButton(el, { appearance: DARK_APPEARANCE }),
          unmountUserButton: (el) => clerk.unmountUserButton(el),
        },
        userId: user.current,
      })
    })
    return () => {
      cancelled = true
      chords.current?.dispose()
      chords.current = null
    }
  }, [clerk])

  useEffect(() => chords.current?.setUser(userId ?? null), [userId])

  return <div ref={node} className="min-h-dvh bg-neutral-950 font-sans text-neutral-200 antialiased" />
}
