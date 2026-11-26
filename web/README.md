# web

[music.charliegleason.com](https://music.charliegleason.com): one TanStack Start
app on Cloudflare Workers, deployed with the `cf` CLI.

| Path | What it is | Code |
| --- | --- | --- |
| `/` | Home | `src/routes/index.tsx` |
| `/chords` | chords: chord shapes on the Ableton Move pad grid | `src/routes/chords/`, `src/chords/` |
| `/sounds` | Fog & Pulse: a step-by-step course in music production with Ableton Live 12 | `src/routes/sounds/`, `src/sounds/` |
| `/ableton` | The Ableton Live Extensions, with downloads | `src/routes/ableton.tsx` |

## Sections

Each section brings its own styles in its route's `head`, so they never meet:
chords uses Tailwind (`src/chords/styles.css`, which scans only chords' files),
sounds uses its own CSS (`src/sounds/styles/app.css`), and home and `/ableton`
share `src/site.css`. The root route is a bare shell. Links between sections are
plain `<a>`s, so each one is a full page load with only its own styles.

Settings, saved songs and course progress live in each visitor's browser
(localStorage); there's no backend.

### chords

All of a view's state is in the URL, so any view can be bookmarked or shared.
Without Move connected, only the chord lookup (Play) works; Learn, Songs and
Practice check what you play on Move.

### Fog & Pulse

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

### Ableton Extensions

`/ableton/<extension>.ablx` redirects to that extension's newest release on
GitHub (tags `ableton/<extension>-<version>`), so the page never needs a version
bump. A new extension needs a card in `src/routes/ableton.tsx` and its name in
`EXTENSIONS` in `src/server.ts`.

## Old addresses

chords and sounds used to be separate apps at chords.charliegleason.com and
sounds.charliegleason.com. Both domains now point at this Worker, and
`src/server.ts` answers them with a page from `src/moved.ts`: it copies that
address's localStorage into the new URL's hash, then goes to the same path under
`/chords` or `/sounds`. `HANDOVER_SCRIPT`, in the root route's head, writes it
back without replacing anything already saved here, and only for chords' and
sounds' own keys, since anyone can make a `#handover=` link. The "Send to chords"
bookmarklet's `#import=` survives the trip.

## Develop

```sh
pnpm install
pnpm dev        # cf dev: the app in the local Workers runtime
pnpm typecheck
pnpm test
pnpm build      # cf build, into .cloudflare/
```

## Deploy

`cloudflare.config.ts` names the Worker (`music`) and its domains. Every push to
`main` that touches `web/` checks, builds and deploys it
(`.github/workflows/web.yml`); pull requests are checked and dry-run only. It
uses the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

To deploy by hand: `pnpm run deploy` (not `pnpm deploy`, which is a pnpm
built-in).
