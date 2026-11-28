import { createFileRoute } from '@tanstack/react-router'
import { EXTENSIONS } from '~/extensions'
import { Masthead, PadMark } from '~/Masthead'
import { SiteFooter } from '~/SiteFooter'
import css from '~/site.css?url'

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
    <div className="page" data-section="ableton">
      <Masthead
        brand={
          <a className="brand" href="/ableton">
            <PadMark lit={3} />
            Extensions
          </a>
        }
      />
      <section className="hero">
        <PadMark lit={3} big />
        <h1>Extensions</h1>
        <p className="lede">
          Tools that read and rewrite a Live Set, run from right-click menus inside Live. They need Live 12.4.5 Suite (public beta) or later.
        </p>
      </section>
      <div className="home">
        <section className="block">
          <h2>
            Extensions <span className="dim">Download one, then install it below.</span>
          </h2>
          <ul className="cards">
            {EXTENSIONS.map((x) => (
              <li key={x.id} className="card">
                <span className="name">{x.id}</span>
                <span className="blurb">{x.about}</span>
                <span className="src">{x.how}</span>
                <span className="meta">
                  <a className="btn primary" href={`/ableton/${x.id}.ablx`}>
                    Download
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="block">
          <h2>Install</h2>
          <ol className="steps">
            <li>
              <span>
                Download the <code>.ablx</code> for an extension.
              </span>
            </li>
            <li>
              <span>In Live, open Settings → Extensions.</span>
            </li>
            <li>
              <span>
                Drag the <code>.ablx</code> onto the Extensions page, then turn it on. Restart Live if it asks.
              </span>
            </li>
          </ol>
          <p className="dim">
            Source, older versions and release notes are on <a href="https://github.com/superhighfives/music/releases">GitHub</a>.
          </p>
        </section>
      </div>
      <SiteFooter current="ableton" />
    </div>
  )
}
