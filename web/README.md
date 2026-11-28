# web

[music.charliegleason.com](https://music.charliegleason.com): an
[Astro](https://astro.build) site on a Cloudflare Worker, deployed with
[Alchemy](https://alchemy.run).

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Home | `src/pages/index.astro` |
| `/chords` | chords: chord shapes on the Ableton Move pad grid | `src/chords/`, `src/pages/chords.astro` |
| `/production` | Production: a step-by-step course in music production with Ableton Live 12 | `src/production/`, `src/pages/production/` |
| `/theory` | Theory: an illustrated, playable music theory book, with a daily email | `src/theory/`, `src/pages/theory/` |
| `/ableton` | The Ableton Live Extensions, with downloads | `src/pages/ableton.astro`, `src/extensions.ts` |
| `/tools` | The studio setup, with exercises for each tool and links to Production lessons | `src/pages/tools.astro`, `src/tools.ts` |

## How it fits together

Every page is an Astro page in `src/pages/`, rendered in the Worker. Anything
that runs in the browser is an island: Preact components (`.tsx`) for Production
and Theory, and Effect UI for Chords. A page marks each island with a `client:`
directive (`client:load`, or `client:visible` to wait until it scrolls into
view); everything else is plain HTML with no script. Endpoints are `.ts` files in
`src/pages/` (`/api/saved`, `/api/theory/email`, the `.ablx` redirects and the
unsubscribe page). `src/worker.ts` wraps Astro's handler and adds the cron's
`scheduled` handler.

Every section shares one look, `src/site.css`: its tokens, the masthead, cards
and lists, with one accent per section (`data-section`). Each section's
stylesheet imports it and adds its own parts: chords uses Tailwind
(`src/chords/styles.css`, which scans only chords' files and maps its colours
onto the shared tokens), Production `src/production/styles/app.css`, and Theory
`src/theory/styles/theory.css`. Every page uses `src/layouts/Page.astro` and the
same masthead (`src/components/Masthead.astro`): home, the section's mark and
name, its controls, the light/dark toggle and sign-in. The toggle's choice
(`music.theme`) covers every section, and Clerk's dialog and menu follow it.
Links between sections are plain `<a>`s.

Settings, saved songs and course progress live in each visitor's browser
(localStorage). Signing in also keeps them in an account (see Accounts). Islands
on one page share state through signals (`src/production/islands/store.ts`,
`src/theory/islands/store.ts`). An island draws the server's defaults until it
has hydrated, then this browser's values, so hydration always matches.

### chords

All of a view's state is in the URL, so any view can be bookmarked or shared.
Without Move connected, only the chord lookup (Play) works; Learn, Songs and
Practice check what you play on Move.

Chords is an [Effect UI](https://ui.effect.website) app, used in
`src/pages/chords.astro` as one island. The app is in `src/chords/app/`:

- `state.ts`: the Model, the URL search, and `derive`, which works out
  everything the view and Move's lights show.
- `Chords.ts`: the component. `update` is a pure reducer, `reduce`, tested in
  `chords.test.ts` by sending it Move's pad and button messages.
- `effects.ts`: Commands, Subscriptions and mounts for the piano, Move, the URL,
  storage, the account and the signed-in user.
- `view.ts`: the view.

`integrations/effect-ui` is the Astro integration that makes this work, as the
local package `astro-effect-ui`: it renders an Effect UI component on the server
and hydrates it in the browser from the state the server wrote. An Effect UI
island takes no children or slots, and anything it adds to the head is left out.

Effect UI isn't on npm yet. `vendor/effect-ui-22128c6.tgz` is the snapshot from
pkg.pr.new for commit `22128c6`. It needs `exactOptionalPropertyTypes`, which
`tsconfig.json` turns on.

### Production

The course is in `src/production/`:

- **`catalog.ts`**: six themes, each a list of `lessons` plus `planned` titles
  still to write, and the recipes. To add a lesson, write its MDX file, add it to
  its theme's `lessons`, and remove its title from `planned`.
- **`lessons/<theme>/<lesson>.mdx`**: each lesson's text.
- **`recipes/<id>.mdx`**: short tutorials that rebuild one sound from a real
  record. Cite where any claim about the record comes from.

Lessons are MDX: prose and HTML, plus the course's components, with no imports
(`mdx/index.ts` lists them): `Sheet`, `Row`, `Cell`, `Steps` (each step an
`<li><div>…</div></li>`), `Task`, `Note`, `KeyBox`, `Arrangement` and the
diagrams. `<V k="quarter" />` is a value that follows the key and tempo in the
masthead; `Derived` in `lib/music.ts` lists them.

When a theme or recipe lands, add a line to the edition log in
`src/pages/production/index.astro`.

### Theory

A music theory book, beginner to advanced, in five parts, in `src/theory/`:

- **`content/book.ts`**: the parts in reading order, each with its written
  `chapters` and the `planned` ones still to write, plus the edition `LOG`. To add
  a chapter, write it, add it to its part's `chapters`, and remove its title from
  `planned`. Add a line to `LOG`.
- **`content/chapters/<id>.tsx`**: a chapter's `id` (its address,
  `/theory/<id>`, and the key progress is saved under, so never rename one),
  title, summary, `cards` and `check`, plus any figures only it uses.
- **`chapters/<id>.mdx`**: the chapter's text.
- **Cards** are a chapter's key ideas: plain text, each one making sense on its
  own, because the daily email sends them one at a time. `*word*` is bold. Never
  rename a card's `id` either; the email tracks what each person was sent by it.

A chapter's MDX imports what it uses: the prose pieces in `mdx/` (`Section`,
`Big`, `Aside`, `Try`, `Term`) and the figures in `components/`: `Keyboard` and
`Staff` (both playable), `Rhythm` (notation that plays to a metronome) and the
explorers (`NoteFinder`, `IntervalExplorer`, `ScaleExplorer`, `NoteNamer`).
Anything that plays or responds to a press takes `client:visible`. The
contents beside a chapter list its `Section`s. The theory itself (spelling,
intervals, scales, key signatures, triads, rhythm) is in `lib/theory.ts`, with
tests. Sound is chords' sampled piano, one for the whole page (`lib/audio.ts`,
with hooks in `lib/hooks.ts`); only one figure plays at a time.

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
Each email has a one-click unsubscribe link, `/theory/unsubscribe?t=<token>`
(`src/pages/theory/unsubscribe.ts`).

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

Sign-in is [Clerk](https://dashboard.clerk.com), application "music", through
`@clerk/astro`. Its middleware (`src/middleware.ts`) checks the session on every
request, so pages render signed in and endpoints read `locals.auth()`. Its
components draw the masthead's sign-in button and account menu, and islands
follow the signed-in user through its `$authStore`.

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

Clerk's keys are Worker secrets, read from `CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` in the environment at deploy time. The publishable key is bound
as `PUBLIC_CLERK_PUBLISHABLE_KEY`, the name `@clerk/astro` reads. Locally they go in `.dev.vars`
(git-ignored), using the development instance's keys. Development has "Challenge suspicious sign-ups" turned off under Protect,
because its check fails on localhost.

To add a synced value, add its key to `SYNC_KEYS` and connect it with
`createAccountSync` (`src/islands/sync.ts`) where the section keeps it.

## Develop

```sh
pnpm install
pnpm dev        # alchemy dev: the app in the local Workers runtime, at localhost:1337
pnpm typecheck
pnpm test
```

`pnpm typecheck` checks the `.ts` and `.tsx` files, not the `.astro` ones: `astro
check` doesn't support TypeScript 7, and `@astrojs/ts-content-mapper`, which lets
`tsc` check `.astro` files, needs TypeScript 7.1 (in beta). Add it once 7.1 is
released. Run Astro through Alchemy, not `astro dev`: Alchemy adds the Cloudflare
adapter that Clerk's integration needs.

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
