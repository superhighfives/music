import { createFileRoute } from '@tanstack/react-router'
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

/** Each download is /ableton/<id>.ablx, which src/server.ts redirects to that extension's newest release. */
const EXTENSIONS = [
  {
    id: 'chords',
    about:
      'Every diatonic chord in a key as a grid. Click chords into named sections, then write one onto the Arrangement as a MIDI clip.',
    how: 'Right-click a MIDI track → Map Chords…',
  },
  {
    id: 'progressive',
    about: 'Famous chord progressions, like I–V–vi–IV, ii–V–I and the 12-bar blues, in any key or mode as MIDI clips.',
    how: 'Right-click a MIDI track → Generate Progressions…',
  },
  {
    id: 'ambient',
    about:
      'Ambient soundscapes as looping MIDI clips: phasing pads, evolving chords, shimmer, drums and bass, or a Push-ready rig that ties them together.',
    how: 'Right-click a MIDI track → Generate Ambient…',
  },
  {
    id: 'reverse-midi',
    about: 'Reverses the timing of every note in a MIDI clip, as one undo step.',
    how: 'Right-click a MIDI clip → Reverse Notes',
  },
]

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
