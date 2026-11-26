import { createFileRoute } from '@tanstack/react-router'
import { EXTENSIONS } from '../extensions'
import css from '../site.css?url'

export const Route = createFileRoute('/ableton')({
  head: () => ({
    meta: [
      { title: 'Ableton Extensions · music' },
      { name: 'description', content: 'Ableton Live 12 Extensions for chords, progressions and ambient soundscapes.' },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Ableton,
})

function Ableton() {
  return (
    <main>
      <a className="back" href="/">
        ← music
      </a>
      <h1>Ableton Extensions</h1>
      <p>
        Tools that read and rewrite a Live Set, run from right-click menus inside Live. They need Live 12.4.5 Suite
        (public beta) or later.
      </p>

      <h2>Extensions</h2>
      <ul className="cards">
        {EXTENSIONS.map((x) => (
          <li key={x.id} className="card">
            <h3>{x.id}</h3>
            <p>{x.about}</p>
            <p className="how">{x.how}</p>
            <a className="download" href={`/ableton/${x.id}.ablx`}>
              Download
            </a>
          </li>
        ))}
      </ul>

      <h2>Install</h2>
      <ol>
        <li>
          Download the <code>.ablx</code> for an extension.
        </li>
        <li>In Live, open Settings → Extensions.</li>
        <li>
          Drag the <code>.ablx</code> onto the Extensions page, then turn it on. Restart Live if it asks.
        </li>
      </ol>
      <p>
        Source, older versions and release notes are on{' '}
        <a href="https://github.com/superhighfives/music/releases">GitHub</a>.
      </p>
    </main>
  )
}
