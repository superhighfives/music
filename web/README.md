# web

[music.charliegleason.com](https://music.charliegleason.com): one TanStack Start
app on Cloudflare Workers, deployed with the `cf` CLI.

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Home | `src/routes/index.tsx` |
| `/chords` | chords: chord shapes on the Ableton Move pad grid | `src/routes/chords/`, `src/chords/` |
| `/sounds` | sounds: a step-by-step course in music production with Ableton Live 12 | `src/routes/sounds/`, `src/sounds/` |
| `/theory` | Theory: an illustrated, playable music theory book, with a daily email | `src/routes/theory/`, `src/theory/` |
| `/ableton` | The Ableton Live Extensions, with downloads | `src/routes/ableton.tsx` |

## Sections

Each section brings its own styles in its route's `head`, so they never meet:
chords uses Tailwind (`src/chords/styles.css`, which scans only chords' files),
sounds uses its own CSS (`src/sounds/styles/app.css`), theory uses its own
(`src/theory/styles/theory.css`), and home, `/ableton` and
`/privacy` share `src/site.css`. chords is always dark, like Move. sounds and Theory have
a light/dark toggle, and the other pages follow the system setting. Clerk's
sign-in dialog and account menu follow each section (`appearance` on
`AccountButton`). The root route is a bare shell. Links between sections are
plain `<a>`s, so each one is a full page load with only its own styles.

Settings, saved songs and course progress live in each visitor's browser
(localStorage). Signing in also keeps them in an account (see Accounts).

### chords

All of a view's state is in the URL, so any view can be bookmarked or shared.
Without Move connected, only the chord lookup (Play) works; Learn, Songs and
Practice check what you play on Move.

### sounds

The course is plain data in `src/sounds/content/`:

- **`themes.tsx`**: six themes, each a list of `lessons` plus `planned` titles
  still to write. A lesson is an `id`, a `title` and a `Body` component. To add
  one, append it to `lessons` and remove its title from `planned`.
- **`recipes.tsx`**: short tutorials that rebuild one sound from a real record.
  Cite where any claim about the record comes from.

Lessons build from the components in `src/sounds/components/ui.tsx` (`Sheet`,
`Row`, `Cell`, `Steps`, `Task`, `Note`, `KeyBox`) and the diagrams in
`src/sounds/components/diagrams.tsx`. Anything that depends on the key or tempo
reads `useValues()`, so it follows the controls in the header.

When a theme or recipe lands, add a line to the edition log in
`src/routes/sounds/index.tsx`.

### Theory

A music theory book, beginner to advanced, in five parts. It's plain data in
`src/theory/content/`:

- **`book.ts`**: the parts in reading order, each with its written `chapters` and
  the `planned` ones still to write, plus the edition `LOG`. To add a chapter,
  write it in `chapters/`, add it to its part's `chapters`, and remove its title
  from `planned`. Add a line to `LOG`.
- **`chapters/*.tsx`**: one chapter each (`keyboard.tsx` is the model). A chapter
  is an `id` (its address, `/theory/<id>`, and the key progress is saved under, so
  never rename one), a `Body`, its `cards` and a `check`.
- **Cards** are a chapter's key ideas: plain text, each one making sense on its
  own, because the daily email sends them one at a time. `*word*` is bold. Never
  rename a card's `id` either; the email tracks what each person was sent by it.

Chapters build from `src/theory/components/`: `Keyboard` and `Staff` (both
playable), `Rhythm` (notation that plays to a metronome), the explorers
(`NoteFinder`, `IntervalExplorer`, `ScaleExplorer`, `NoteNamer`), and the prose
pieces in `ui.tsx` (`Section`, `Big`, `Aside`, `Try`, `Term`). The theory itself
(spelling, intervals, scales, key signatures, triads, rhythm) is in
`src/theory/lib/theory.ts`, with tests. Sound is chords' sampled piano, one
instance for the whole book (`src/theory/lib/audio.tsx`).

Progress (chapters read, checks passed, where you were) syncs to an account as
`theory.book`.

#### The daily email

Signed in, the book's home page has a switch for one card a day by email. A cron
(`0 7-23 * * *`, in `cloudflare.config.ts`) runs `sendDaily` in
`src/theory/email/daily.ts`: each subscriber gets the first card in reading order
they haven't had, so cards from new chapters join the queue wherever they fall;
once they've had every card, the one sent longest ago comes round as review.
The 07:00 UTC run sends; later runs that day only retry anyone a failure skipped,
since each person's last send day is recorded. "Send one now" sends a preview
that doesn't count, at most once every ten minutes.
Subscribers and what they've been sent are in D1 (`migrations/0002_theory_email.sql`).
Each email has a one-click unsubscribe link, `/theory/unsubscribe?t=<token>`,
served by `src/server.ts`.

Email goes out through Cloudflare Email Service (the `EMAIL` binding), from
`theory@charliegleason.com`. Before it can send to anyone, `charliegleason.com`
must be onboarded to Email Service in the Cloudflare dashboard (Email → Email
Sending), which adds its SPF and DKIM records. Locally, `pnpm dev` simulates the
binding. To run the cron locally:

```sh
curl -X POST 'http://localhost:5173/cdn-cgi/local/explorer/api/local/scheduled?worker=music' \
  -H 'Content-Type: application/json' -d '{"cron":"0 7-23 * * *"}'
```

### Ableton Extensions

`/ableton/<extension>.ablx` redirects to that extension's newest release on
GitHub (tags `ableton/<extension>-<version>`), so the page never needs a version
bump. To add an extension, add it to `src/extensions.ts`; its `id` must match
its release tags.

## Accounts

Sign-in is [Clerk](https://dashboard.clerk.com), application "music". The root
route wraps every section in one `ClerkProvider`, and `src/start.ts` runs
`clerkMiddleware()` on every request so server functions can call `auth()`.
Each section has a Sign in button (`src/account/AccountButton.tsx`).

Signed in, chords' pasted songs (`chords.songs`), sounds' settings and
progress (`sounds.course`) and Theory's progress (`theory.book`) are also kept in the D1 database `music`, one JSON
value per person and key (`migrations/0001_saved.sql`). `src/account/saved.ts`
has the two server functions, which only ever touch the signed-in person's rows.
`useAccountSync` (`src/account/sync.ts`) merges this browser's copy into the
account's once per sign-in, then saves every change:

- Songs: both lists, nothing dropped; the same sheet pasted twice is one song.
- Course: every lesson done on either side; the account's key, mode and tempo;
  this browser's last lesson.

Signed out, nothing changes: everything stays in the browser, as before.

Clerk's keys are Worker secrets, `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
Locally they go in `.dev.vars` (git-ignored), using the development instance's
keys. Development has "Challenge suspicious sign-ups" turned off under Protect,
because its check fails on localhost.

To add a synced value, add its key to `SYNC_KEYS` and call `useAccountSync` where
the section keeps it.

## Develop

```sh
pnpm install
pnpm dev        # cf dev: the app in the local Workers runtime
pnpm typecheck
pnpm test
pnpm build      # cf build, into .cloudflare/
```

Before the first `pnpm dev`, put Clerk's development keys in `.dev.vars` and
create the local database:

```sh
pnpm exec cf d1 migrations apply 517b7f2f-2e66-4d48-938a-ed41db5eb64c --local
```

## Deploy

`cloudflare.config.ts` names the Worker (`music`) and its domains. Every push to
`main` that touches `web/` checks, builds and deploys it
(`.github/workflows/web.yml`); pull requests are checked and dry-run only. It
uses the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

To deploy by hand: `pnpm run deploy` (not `pnpm deploy`, which is a pnpm
built-in).
