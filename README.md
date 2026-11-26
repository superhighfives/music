# music

Music tools and sites, one folder each. Every folder is self-contained, with its
own `package.json` and lockfile; nothing is shared between them.

| Folder | What it is | Where it lives |
| --- | --- | --- |
| [`web/`](web/) | music.charliegleason.com: chords (chord shapes on the Ableton Move pad grid), Fog & Pulse (a course in music production with Live 12), and the Ableton Extensions page | [music.charliegleason.com](https://music.charliegleason.com) |
| [`ableton/`](ableton/) | Ableton Live 12 Extensions, plus a Stable Audio texture generator | [Releases](https://github.com/superhighfives/music/releases) |
| [`setup/`](setup/) | The Mac Mini studio setup: tools, Claude driving Live, plugins and licences, plus the AI-in-Ableton guide | [`setup/README.md`](setup/README.md) |

## Claude and Live

[`.mcp.json`](.mcp.json) adds the AbletonMCP server (telemetry and dataset
sharing off) whenever Claude Code runs in this repo, so it can drive Live. See
[`setup/README.md`](setup/README.md) for the Live side.

## Working in a folder

`cd` into it and use its own scripts: `pnpm install`, then `pnpm dev`, `pnpm build`
and so on. Each folder's README has the details.

## Deploys

`web/` is one TanStack Start app on Cloudflare Workers, deployed with the `cf`
CLI. Its workflow, `.github/workflows/web.yml`, only runs when `web/` changes:
pull requests are type-checked, tested, built and dry-run; pushes to `main`
deploy. It uses the repository secrets `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID`.

`ableton/` doesn't deploy. Extensions are released by hand as `.ablx` files, with
tags prefixed `ableton/` (see its README).

## History

`chords/` and `ableton/` were separate repos, `superhighfives/chords` and
`superhighfives/ableton`, now archived. Their full histories were moved into
these folders, so `git log --follow` on a chords file goes back to the first
commit. chords and sounds were separate apps at chords.charliegleason.com and
sounds.charliegleason.com until they moved into `web/`; those addresses now
redirect. Ableton's
earlier release tags are `ableton/progressive-1.0.0` and
`ableton/reverse-midi-1.0.0`.
