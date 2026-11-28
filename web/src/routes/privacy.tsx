import { createFileRoute } from '@tanstack/react-router'
import { Masthead, PadMark } from '~/Masthead'
import { SiteFooter } from '~/SiteFooter'
import css from '~/site.css?url'

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy · music' },
      { name: 'description', content: 'What music.charliegleason.com stores, and why.' },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Privacy,
})

function Privacy() {
  return (
    <div className="page">
      <Masthead
        brand={
          <a className="brand" href="/privacy">
            <PadMark lit={15} />
            Privacy
          </a>
        }
      />
      <section className="hero">
        <PadMark lit={15} big />
        <h1>Privacy</h1>
        <p className="lede dim">Last updated 26 November 2026.</p>
      </section>
      <div className="home">
        <section className="block">
          <h2>Without an account</h2>
          <p>
            Chords, Production and Theory save your settings, pasted chord sheets, course progress and chapters read in
            your browser's own storage. They never leave your device. Clearing your browser's data for this site removes them.
          </p>
        </section>
        <section className="block">
          <h2>With an account</h2>
          <p>
            Signing in is optional. Sign-in is handled by <a href="https://clerk.com/privacy">Clerk</a>, which keeps your
            email address and, if you sign in with Google, your name and profile picture from Google. This site asks Google
            only for your email address and basic profile, nothing else.
          </p>
          <p>
            Signed in, the same things your browser saves are also kept with your account, so they follow you to other
            devices: your pasted chord sheets, Production's key, mode, tempo and lessons done, and the Theory chapters
            you've read and checks you've passed. They're stored on{' '}
            <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>, which runs this site, and only you can read
            or change them through this site.
          </p>
          <p>Nothing is sold, shared for advertising, or used to track you. There are no analytics or ad cookies.</p>
        </section>
        <section className="block">
          <h2>The daily email</h2>
          <p>
            Theory's daily email is off unless you turn it on, signed in. Turning it on keeps your account's email address
            and a record of which ideas you've been sent, so you don't get the same one twice. Emails are sent through{' '}
            <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare</a>. Every email has a link to stop them, and
            turning it off in the book stops them too.
          </p>
        </section>
        <section className="block">
          <h2>Deleting your data</h2>
          <p>
            To delete your account and everything saved with it, email{' '}
            <a href="mailto:hi@charliegleason.com">hi@charliegleason.com</a>.
          </p>
        </section>
      </div>
      <SiteFooter current="privacy" />
    </div>
  )
}
