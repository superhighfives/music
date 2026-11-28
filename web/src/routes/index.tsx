import { Dithering } from '@paper-design/shaders-react'
import { createFileRoute } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { Masthead } from '~/Masthead'
import { SiteFooter } from '~/SiteFooter'
import css from '~/site.css?url'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'music · Charlie Gleason' },
      {
        name: 'description',
        content: 'Music tools: chord shapes for Ableton Move, a production course for Live 12, an illustrated theory book, Live Extensions, and the studio setup.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Home,
})

// Each card's art is the same dithered warp in its section's colours, as hex: the shaders don't read oklch.
const CYAN = '#00d6d7'
const YELLOW = '#f7cd3a'
const BLUE = '#70b1ed'
const TERRACOTTA = '#bb4d2a'
const GREEN = '#7fd18b'
const PAPER = '#fbf6ee'

const reducedMotion = matchMediaStore('(prefers-reduced-motion: reduce)')

// Plain links, not <Link>: each section loads its own styles, so a full page load keeps them apart.
function Home() {
  // The server can't know, so it renders still art; motion starts after hydration unless reduced.
  const still = useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => true)
  const speed = (s: number) => (still ? 0 : s)
  return (
    <div className="page">
      <Masthead />
      <section className="hero">
        <h1>music</h1>
        <p className="lede">Tools and theory for making music, with Ableton Live and Move.</p>
      </section>
      <ul className="cards">
        <li>
          <a className="card" href="/chords">
            <Dithering className="art" shape="warp" type="2x2" colorBack="#0b1517" colorFront={CYAN} size={2} scale={1.4} speed={speed(0.6)} />
            <span className="name">Chords</span>
            <span className="blurb">
              Chord shapes on the Ableton Move pad grid, in any key, scale and layout. Learn, play along with songs, and practise to a
              playhead.
            </span>
          </a>
        </li>
        <li>
          <a className="card" href="/production">
            <Dithering className="art" shape="warp" type="4x4" colorBack="#141a24" colorFront={YELLOW} size={1.5} scale={1.2} rotation={90} speed={speed(0.4)} />
            <span className="name">Production</span>
            <span className="blurb">
              A step-by-step course in music production with Ableton Live 12: sound, soundscapes, melody, songwriting, drums and mixing.
            </span>
          </a>
        </li>
        <li>
          <a className="card" href="/theory">
            <Dithering className="art" shape="warp" type="8x8" colorBack={PAPER} colorFront={TERRACOTTA} size={1.5} scale={1.6} rotation={180} speed={speed(0.3)} />
            <span className="name">Theory</span>
            <span className="blurb">
              An illustrated music theory book you can play, from the first note to advanced harmony: reading music, scales, chords and theory
              for songwriting. One idea a day by email, if you like.
            </span>
          </a>
        </li>
        <li>
          <a className="card" href="/ableton">
            <Dithering className="art" shape="warp" type="random" colorBack="#141414" colorFront={BLUE} size={1.5} scale={1.3} rotation={270} speed={speed(0.5)} />
            <span className="name">Extensions</span>
            <span className="blurb">Right-click tools for Live 12 that write chords, progressions and ambient soundscapes into your Set.</span>
          </a>
        </li>
        <li>
          <a className="card" href="/tools">
            <Dithering className="art" shape="warp" type="2x2" colorBack="#101a12" colorFront={GREEN} size={1.5} scale={1.5} rotation={45} speed={speed(0.35)} />
            <span className="name">Tools</span>
            <span className="blurb">
              The whole studio, from Live and a field recorder to Melodyne, RX and Ozone, with exercises to learn each tool and links to
              Production lessons.
            </span>
          </a>
        </li>
      </ul>
      <SiteFooter current="home" />
    </div>
  )
}

function matchMediaStore(query: string) {
  return {
    get: () => matchMedia(query).matches,
    subscribe: (onChange: () => void) => {
      const list = matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
  }
}
