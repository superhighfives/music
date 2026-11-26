import { createFileRoute } from '@tanstack/react-router'
import { AccountButton, useSiteAppearance } from '../account/AccountButton'
import { SiteFooter } from '../SiteFooter'
import css from '../site.css?url'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'music · Charlie Gleason' },
      {
        name: 'description',
        content: 'Music tools: chord shapes for Ableton Move, a production course for Live 12, an illustrated theory book, and Live Extensions.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Home,
})

// Plain links, not <Link>: each section loads its own styles, so a full page load keeps them apart.
function Home() {
  const appearance = useSiteAppearance()
  return (
    <main>
      <div className="account">
        <AccountButton className="signin" appearance={appearance} />
      </div>
      <h1>music</h1>
      <p>Tools for making music with Ableton Live and Move.</p>
      <ul className="cards">
        <li>
          <a className="card" href="/chords">
            <h3>chords</h3>
            <p>
              Chord shapes on the Ableton Move pad grid, in any key, scale and layout. Learn, play along with songs, and
              practise to a playhead.
            </p>
          </a>
        </li>
        <li>
          <a className="card" href="/sounds">
            <h3>sounds</h3>
            <p>
              A step-by-step course in music production with Ableton Live 12: sound, soundscapes, melody, songwriting,
              drums and mixing.
            </p>
          </a>
        </li>
        <li>
          <a className="card" href="/theory">
            <h3>Theory</h3>
            <p>
              An illustrated music theory book you can play, from the first note to advanced harmony: reading music, scales,
              chords and theory for songwriting. One idea a day by email, if you like.
            </p>
          </a>
        </li>
        <li>
          <a className="card" href="/ableton">
            <h3>Ableton Extensions</h3>
            <p>Right-click tools for Live 12 that write chords, progressions and ambient soundscapes into your Set.</p>
          </a>
        </li>
      </ul>
      <SiteFooter current="home" />
    </main>
  )
}
