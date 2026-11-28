/** @jsxImportSource ~/content */
import { island, type Node } from '~/content/jsx-runtime'
import { EXTENSIONS } from '~/extensions'
import { Masthead, PadMark } from '~/islands/masthead'
import { TOOL_GROUPS, lessonLink } from '~/tools'

/*
 * Home and the plain pages that share its look: Extensions, Tools, Privacy and not found. They're content;
 * each card's shader art is an island the Site component fills in.
 */

/** A section's brand in the masthead: its pad mark and name, linking to it. */
const Brand = ({ href, lit, name }: { href: string; lit: number; name: string }) => (
  <a className="brand" href={href}>
    <PadMark lit={lit} />
    {name}
  </a>
)

/** Each card's art is the same dithered warp in its section's colours, as hex: the shaders don't read oklch. */
export const ART = [
  { type: '2x2', back: '#0b1517', front: '#00d6d7', size: 2, scale: 1.4, rotation: 0, speed: 0.6 },
  { type: '4x4', back: '#141a24', front: '#f7cd3a', size: 1.5, scale: 1.2, rotation: 90, speed: 0.4 },
  { type: '8x8', back: '#fbf6ee', front: '#bb4d2a', size: 1.5, scale: 1.6, rotation: 180, speed: 0.3 },
  { type: 'random', back: '#141414', front: '#70b1ed', size: 1.5, scale: 1.3, rotation: 270, speed: 0.5 },
  { type: '2x2', back: '#101a12', front: '#7fd18b', size: 1.5, scale: 1.5, rotation: 45, speed: 0.35 },
] as const

const CARDS = [
  {
    href: '/chords',
    name: 'Chords',
    blurb: 'Chord shapes on the Ableton Move pad grid, in any key, scale and layout. Learn, play along with songs, and practise to a playhead.',
  },
  {
    href: '/production',
    name: 'Production',
    blurb: 'A step-by-step course in music production with Ableton Live 12: sound, soundscapes, melody, songwriting, drums and mixing.',
  },
  {
    href: '/theory',
    name: 'Theory',
    blurb:
      'An illustrated music theory book you can play, from the first note to advanced harmony: reading music, scales, chords and theory for songwriting. One idea a day by email, if you like.',
  },
  { href: '/ableton', name: 'Extensions', blurb: 'Right-click tools for Live 12 that write chords, progressions and ambient soundscapes into your Set.' },
  {
    href: '/tools',
    name: 'Tools',
    blurb: 'The whole studio, from Live and a field recorder to Melodyne, RX and Ozone, with exercises to learn each tool and links to Production lessons.',
  },
]

// Plain links between sections: each loads its own styles, so a full page load keeps them apart.
export function HomePage(): Node {
  return (
    <>
      <Masthead />
      <section className="hero">
        <h1>music</h1>
        <p className="lede">Tools and theory for making music, with Ableton Live and Move.</p>
      </section>
      <ul className="cards">
        {CARDS.map((c, i) => (
          <li>
            <a className="card" href={c.href}>
              {island('Art', { index: i })}
              <span className="name">{c.name}</span>
              <span className="blurb">{c.blurb}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

export function AbletonPage(): Node {
  return (
    <>
      <Masthead brand={<Brand href="/ableton" lit={3} name="Extensions" />} />
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
              <li className="card">
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
    </>
  )
}

// Plain links to Production, like everywhere else between sections: it loads its own styles.
export function ToolsPage(): Node {
  return (
    <>
      <Masthead brand={<Brand href="/tools" lit={10} name="Tools" />} />
      <section className="hero">
        <PadMark lit={10} big />
        <h1>Tools</h1>
        <p className="lede">
          Everything in the studio, what each tool is for, and short exercises to learn it. Lessons link to <a href="/production">Production</a>, where
          the techniques are taught in order.
        </p>
      </section>
      <div className="home">
        {TOOL_GROUPS.map((group) => (
          <section className="block">
            <h2>
              {group.name} <span className="dim">{group.about}</span>
            </h2>
            <ul className="cards">
              {group.tools.map((tool) => {
                const links = [
                  ...tool.lessons.flatMap((key) => {
                    const link = lessonLink(key)
                    return link ? [{ label: link.title, href: link.href }] : []
                  }),
                  ...(tool.links ?? []),
                ]
                return (
                  <li className="card">
                    <span className="name">{tool.name}</span>
                    <span className="blurb">{tool.what}</span>
                    <span className="lab">Learn it</span>
                    <ol className="steps">
                      {tool.learn.map((step) => (
                        <li>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    {links.length > 0 ? (
                      <p className="src">
                        See:{' '}
                        {links.map((l, i) => (
                          <span>
                            {i > 0 ? ' · ' : null}
                            <a href={l.href}>{l.label}</a>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

export function PrivacyPage(): Node {
  return (
    <>
      <Masthead brand={<Brand href="/privacy" lit={15} name="Privacy" />} />
      <section className="hero">
        <PadMark lit={15} big />
        <h1>Privacy</h1>
        <p className="lede dim">Last updated 26 November 2026.</p>
      </section>
      <div className="home">
        <section className="block">
          <h2>Without an account</h2>
          <p>
            Chords, Production and Theory save your settings, pasted chord sheets, course progress and chapters read in your browser's own storage. They
            never leave your device. Clearing your browser's data for this site removes them.
          </p>
        </section>
        <section className="block">
          <h2>With an account</h2>
          <p>
            Signing in is optional. Sign-in is handled by <a href="https://clerk.com/privacy">Clerk</a>, which keeps your email address and, if you sign
            in with Google, your name and profile picture from Google. This site asks Google only for your email address and basic profile, nothing
            else.
          </p>
          <p>
            Signed in, the same things your browser saves are also kept with your account, so they follow you to other devices: your pasted chord
            sheets, Production's key, mode, tempo and lessons done, and the Theory chapters you've read and checks you've passed. They're stored on{' '}
            <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>, which runs this site, and only you can read or change them through this
            site.
          </p>
          <p>Nothing is sold, shared for advertising, or used to track you. There are no analytics or ad cookies.</p>
        </section>
        <section className="block">
          <h2>The daily email</h2>
          <p>
            Theory's daily email is off unless you turn it on, signed in. Turning it on keeps your account's email address and a record of which ideas
            you've been sent, so you don't get the same one twice. Emails are sent through{' '}
            <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>. Every email has a link to stop them, and turning it off in the book stops
            them too.
          </p>
        </section>
        <section className="block">
          <h2>Deleting your data</h2>
          <p>
            To delete your account and everything saved with it, email <a href="mailto:hi@charliegleason.com">hi@charliegleason.com</a>.
          </p>
        </section>
      </div>
    </>
  )
}

export function NotFoundPage(): Node {
  return (
    <>
      <Masthead />
      <section className="empty">
        <h1>Not found</h1>
        <p>
          Nothing lives at this address. <a href="/">Back to music</a>
        </p>
      </section>
    </>
  )
}
