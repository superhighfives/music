import { createFileRoute } from '@tanstack/react-router'
import { AccountButton } from '../account/AccountButton'
import css from '../site.css?url'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'music · Charlie Gleason' },
      {
        name: 'description',
        content: 'Music tools: chord shapes for Ableton Move, a production course for Live 12, and Live Extensions.',
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
  return (
    <main>
      <div className="account">
        <AccountButton className="signin" />
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
            <h3>Fog &amp; Pulse</h3>
            <p>
              A step-by-step course in music production with Ableton Live 12: sound, soundscapes, melody, songwriting,
              drums and mixing.
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
      <p className="footer">
        <a href="/privacy">Privacy</a>
      </p>
    </main>
  )
}
