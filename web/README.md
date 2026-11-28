# web

[music.charliegleason.com](https://music.charliegleason.com): one Cloudflare
Worker that renders every page with [Effect UI](https://ui.effect.website),
deployed with [Alchemy](https://alchemy.run).

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Home | `src/pages/Home.ts` |
| `/chords` | chords: chord shapes on the Ableton Move pad grid | `src/chords/` |
| `/production` | Production: a step-by-step course in music production with Ableton Live 12 | `src/production/` |
| `/theory` | Theory: an illustrated, playable music theory book, with a daily email | `src/theory/` |
| `/ableton` | The Ableton Live Extensions, with downloads | `src/pages/Static.ts` |
| `/tools` | The studio setup, with exercises for each tool and links to Production lessons | `src/pages/Static.ts`, `src/tools.ts` |

## Sections

`src/server.ts` sends each path to its section. A section renders its page on the
server with `HtmlServer.renderToHtml`, and its client entry hydrates it in the
browser (`src/islands/document.ts` writes the page). Vite builds each section's
client entry; the `islands` plugin in `vite.config.ts` tells the Worker the built
file names. `/ableton`, `/tools` and `/privacy` send no script at all.

Each section brings only its own styles, so they never meet:
chords uses Tailwind (`src/chords/styles.css`, which scans only chords' files),
Production uses its own CSS (`src/production/styles/app.css`), theory uses its own
(`src/theory/styles/theory.css`), and home, `/ableton`, `/tools` and
`/privacy` share `src/site.css`. chords is always dark, like Move. Production and Theory have
a light/dark toggle, and the other pages follow the system setting. Clerk's
sign-in dialog and account menu follow each section (the `appearance` each client
entry passes to `connectClerk`). Links between sections are
plain `<a>`s, so each one is a full page load with only its own styles.

Settings, saved songs and course progress live in each visitor's browser
(localStorage). Signing in also keeps them in an account (see Accounts).

### chords

All of a view's state is in the URL, so any view can be bookmarked or shared.
Without Move connected, only the chord lookup (Play) works; Learn, Songs and
Practice check what you play on Move.

The app is in `src/chords/app/`:

- `state.ts`: the Model, the URL search, and `derive`, which works out
  everything the view and Move's lights show.
- `Chords.ts`: the component. `update` is a pure reducer, `reduce`, tested in
  `chords.test.ts` by sending it Move's pad and button messages.
- `effects.ts`: Commands, Subscriptions and mounts for the piano, Move, the URL,
  storage and the account.
- `view.ts`: the view. `page.ts` renders it on the Worker for the URL's view;
  `client.ts` hydrates it.

Effect UI isn't on npm yet. `vendor/effect-ui-22128c6.tgz` is the snapshot from
pkg.pr.new for commit `22128c6`. It needs `exactOptionalPropertyTypes`, which
`tsconfig.json` turns on.

### Production

The course is plain data in `src/production/content/`:

- **`themes.tsx`**: six themes, each a list of `lessons` plus `planned` titles
  still to write. A lesson is an `id`, a `title` and a `Body` component. To add
  one, append it to `lessons` and remove its title from `planned`.
- **`recipes.tsx`**: short tutorials that rebuild one sound from a real record.
  Cite where any claim about the record comes from.

Lessons are JSX, but not React: `src/content/jsx-runtime.ts` builds a plain tree,
and `src/content/render.ts` turns it into an Effect UI view, so every page renders
on the server. Each content file starts with `/** @jsxImportSource ~/content */`.
Lessons build from the parts in `src/production/content/kit.tsx` (`Sheet`, `Row`,
`Cell`, `Steps`, `Task`, `Note`, `KeyBox`) and the diagrams in
`src/production/components/diagrams.tsx`. A lesson's `Body` gets `{ values }`, the
values that follow the key and tempo in the header. Content has no event handlers:
anything that follows settings or responds to clicks is an island, which
`src/production/app/Production.ts` fills in.

When a theme or recipe lands, add a line to the edition log in
`src/production/app/pages.tsx`.

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

Chapters are JSX content, like Production's lessons. They build from
`src/theory/components/`: `Keyboard` and `Staff` (both playable), `Rhythm`
(notation that plays to a metronome), the explorers (`NoteFinder`,
`IntervalExplorer`, `ScaleExplorer`, `NoteNamer`), and the prose pieces in
`ui.tsx` (`Section`, `Big`, `Aside`, `Try`, `Term`). The theory itself
(spelling, intervals, scales, key signatures, triads, rhythm) is in
`src/theory/lib/theory.ts`, with tests. Sound is chords' sampled piano, one
instance for the whole book (`src/theory/lib/audio.ts`).

Anything with its own state, such as an explorer, a player that lights keys as it
plays, or the check at the end, is a figure: `figure()` in
`src/theory/app/define.ts` gives it a name, its args and state as Schemas, and a
view whose handlers return what to do (`set`, `start`, `stop`). Each use renders
as its own `Figure` component, so two on one page share nothing. Only one figure
plays at a time.

Progress (chapters read, checks passed, where you were) syncs to an account as
`theory.book`.

#### The daily email

Signed in, the book's home page has a switch for one card a day by email
(`/api/theory/email`, in `src/theory/email/api.ts`). A cron
(`0 7-23 * * *`, in `alchemy.run.ts`, prod only) runs `sendDaily` in
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
binding and writes each email to `.alchemy/local/email`. To run the cron locally:

```sh
curl 'http://localhost:1337/cdn-cgi/handler/scheduled?cron=0+7+*+*+*'
```

### Ableton Extensions

`/ableton/<extension>.ablx` redirects to that extension's newest release on
GitHub (tags `ableton/<extension>-<version>`), so the page never needs a version
bump. To add an extension, add it to `src/extensions.ts`; its `id` must match
its release tags.

## Accounts

Sign-in is [Clerk](https://dashboard.clerk.com), application "music". Pages load
Clerk's browser SDK and UI directly (`src/islands/clerk.ts`), as Clerk's React SDK
does. This relies on Clerk's `__internal_ClerkUICtor` global, which a Clerk update
could rename. The Worker checks the session with `@clerk/backend` (`userOf` in
`src/account/api.ts`), so pages render signed in.

Signed in, chords' pasted songs (`chords.songs`), Production's settings and
progress (`production.course`) and Theory's progress (`theory.book`) are also kept in the D1 database `music`, one JSON
value per person and key (`migrations/0001_saved.sql`). `GET` and `POST
/api/saved` (`src/account/api.ts`) only ever touch the signed-in person's rows.
`AccountSync` (`src/account/account-sync.ts`) merges this browser's copy into the
account's once per sign-in, then saves every change:

- Songs: both lists, nothing dropped; the same sheet pasted twice is one song.
- Course: every lesson done on either side; the account's key, mode and tempo;
  this browser's last lesson.

Signed out, nothing changes: everything stays in the browser, as before.

Clerk's keys are Worker secrets, `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`,
read from the environment at deploy time. Locally they go in `.dev.vars`
(git-ignored), using the development instance's keys. Development has "Challenge suspicious sign-ups" turned off under Protect,
because its check fails on localhost.

To add a synced value, add its key to `SYNC_KEYS` and connect it with
`createAccountSync` (`src/islands/sync.ts`) in the section's client entry.

## Develop

```sh
pnpm install
pnpm dev        # alchemy dev: the app in the local Workers runtime, at localhost:1337
pnpm typecheck
pnpm test
```

Before the first `pnpm dev`, copy `.dev.vars.example` to `.dev.vars` and fill in
Clerk's development keys. Alchemy needs a profile with Cloudflare connected:
`pnpm exec alchemy profile edit` in a terminal. The local database is created and
migrated on start.

Alchemy pins its own `workerd`, which is older than our compatibility date. The
`pnpm.overrides` entry in `package.json` raises it; remove it once Alchemy's pin
reaches the date in `alchemy.run.ts`.

## Deploy

`alchemy.run.ts` declares the Worker, the D1 database, the email binding, the
cron and the secrets. A stage is one copy of all of it:

- `prod` is the live site: the Worker `music`, the database `music`, the domain
  and the cron.
- Every other stage gets its own Worker and database with generated names, and
  no domain or cron.

`.github/workflows/web.yml` deploys every pull request that touches `web/` to a
`pr-<number>` stage, with Clerk's development keys, and destroys it when the pull
request closes. Every push to `main` deploys `prod`. New migrations in
`migrations/` apply on deploy. Deploy state is in the account's
`alchemy-state-store` Worker, so CI and every machine share it.

`prod` took over the resources `cf` created (the Worker `music`, its domain and
cron, and the D1 database `music`, `517b7f2f-2e66-4d48-938a-ed41db5eb64c`) on
27 November 2026 with a one-time `alchemy deploy --stage prod --adopt`. The
database kept its data, and its `d1_migrations` history was copied into
`__alchemy_migrations`. Without `--adopt`, Alchemy refuses to touch a resource it
doesn't own (`OwnedBySomeoneElse`), so a deploy can't replace the live database
by accident. If the state store is ever lost, run the same command again to take
the resources back over.

CI uses the repository secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` and their `_DEV` versions.

To deploy by hand: `pnpm run deploy` (not `pnpm deploy`, which is a pnpm
built-in), with the production Clerk keys in the environment.
