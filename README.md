# music

Music tools and sites, one folder each. Every folder is self-contained, with its
own `package.json` and lockfile; nothing is shared between them.

| Folder | What it is | Where it lives |
| --- | --- | --- |
| [`chords/`](chords/) | Chord shapes on the Ableton Move pad grid | [chords.charliegleason.com](https://chords.charliegleason.com) |
| [`sounds/`](sounds/) | Fog & Pulse, a step-by-step course in music production with Ableton Live 12 | [sounds.charliegleason.com](https://sounds.charliegleason.com) |
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

`chords/` and `sounds/` are TanStack Start apps on Cloudflare Workers, deployed
with the `cf` CLI. Each has a workflow in `.github/workflows/` that only runs
when its folder changes: pull requests are type-checked, built and dry-run;
pushes to `main` deploy. Both use the repository secrets `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID`.

`ableton/` doesn't deploy. Extensions are released by hand as `.ablx` files, with
tags prefixed `ableton/` (see its README).

## History

`chords/` and `ableton/` were separate repos, `superhighfives/chords` and
`superhighfives/ableton`, now archived. Their full histories were moved into
these folders, so `git log -- chords` goes back to the first commit. Ableton's
earlier release tags are `ableton/progressive-1.0.0` and
`ableton/reverse-midi-1.0.0`.
