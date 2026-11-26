# setup

How the Mac Mini studio is set up: tools, Claude driving Live, plugins and their
licences, and the workarounds we hit. Follow it top to bottom to rebuild the Mini
or set up another machine. [`GUIDE.md`](GUIDE.md) is the wider "AI in Ableton"
starter guide: what each tool is for and what's worth buying.

Last checked: 26 November 2026.

## System

Homebrew, uv, tmux and ffmpeg come from
[dotfiles](https://github.com/superhighfives/dotfiles) (`Brewfile`, and mise for
uv). Ableton itself is deliberately kept out of dotfiles.

| What | Version / setting |
| --- | --- |
| Live | 12 Suite, beta (Live 12.4.5 or later, for Extensions). Live 13 Suite pre-ordered |
| Audio | 48 kHz; record at 24-bit (Settings → Record, Warp & Launch) |
| Plug-Ins | VST3 System Folders **on**, VST2 **off**. Prefer VST3 versions in sets |
| Extensions | Developer Mode on, for `pnpm start` in `ableton/extensions/*` |

## Claude drives Live (AbletonMCP)

[ableton-mcp](https://github.com/ahujasid/ableton-mcp) lets Claude Code create
tracks, write MIDI, load devices and set tempo. The MCP server is configured for
this repo in [`.mcp.json`](../.mcp.json) at the root, with telemetry and dataset
sharing off, so it loads whenever Claude Code runs inside `music/`.

1. Install the Remote Script into Live's User Library:
   ```sh
   uvx --from ableton-mcp ableton-mcp-install-script
   ```
   It lands in `~/Music/Ableton/User Library/Remote Scripts/AbletonMCP`.
2. Restart Live. In **Settings → Link, Tempo & MIDI**, set a Control Surface to
   **AbletonMCP**, Input and Output **None**.
3. Start Claude Code in `music/` and approve the project's AbletonMCP server.

**Keep port 9877 on localhost.** The socket takes unauthenticated commands. The
Remote Script binds `127.0.0.1` unless `ABLETON_MCP_HOST` is set, so never set
it. To check: `lsof -nP -iTCP:9877 -sTCP:LISTEN` should show `127.0.0.1:9877`.

## Talking to Live from a laptop or phone

Run Claude Code on the Mini and reach it with Remote Control:

```sh
cd ~/Development/music      # dotfiles open terminals inside tmux
claude remote-control --name Ableton
```

Detach with **Ctrl+a d**, then pick **Ableton** at claude.ai/code or in the Claude
app. `claude remote-control --continue` reattaches within about 4 hours. Turn on
**Prevent automatic sleeping when the display is off** (System Settings →
Energy), or the session drops.

## Plugins

Installers aren't in git: download them from each vendor's account, check the
signature (`pkgutil --check-signature <pkg>`), then install with
[`scripts/install-pkgs.sh`](scripts/install-pkgs.sh).

| Plugin | Version | Licence / where to get it |
| --- | --- | --- |
| Soundtoys bundle | 5.5.5 (23 plugins, incl. SuperPlate and SpaceBlender) | soundtoys.com account. V5.5 upgrade bought Nov 2026; activate in iLok License Manager |
| FabFilter Saturn 2, Timeless 3, Twin 3, Volcano 3 | 2.13, 3.10, 3.10, 3.09 | fabfilter.com account; enter each key on first open. Upgraded Nov 2026 |
| FabFilter Saturn, Timeless 2, Twin 2, Volcano 2 | 1.31, 2.41 (legacy) | Same licence; still installed for older sets. fabfilter.com/support/downloads |
| Synplant 2 + PhenoType | 2.0.2 | soniccharge.com account; authorise in Sonic Charge Authenticator. Install with [`scripts/install-synplant.sh`](scripts/install-synplant.sh) |
| Magenta RealTime 2 (AU + standalone) | 0.0.1 | Free, from Google Magenta ([magenta.withgoogle.com/mrt2](https://magenta.withgoogle.com/mrt2)). Move `MRT2 (AU).app`, `MRT2 - Collider.app` and `MRT2 - Jam.app` to /Applications before first open; opening the AU app once registers the plugin. The Mini's base M4 runs the small model; first launch downloads its weights (about 450 MB) |
| iZotope Ozone 12 Elements | 12.2.0 | Bought Nov 2026. Installed (AU + VST3); authorise through your iZotope / Native Instruments account (Native Access) |
| ClyphX Pro | 1.3.1 | Isotonik account (order #487061, 2019). Copy `Remote Scripts/*` to User Library → Remote Scripts and `Factory Packs (Lessons)/*` to Factory Packs |
| Chord-O-Mat 3 | 3.3 | user.soundmanufacture.net (order Jun 2023). `.amxd` files in User Library → Presets → MIDI Effects → Max MIDI Effect |
| Circle of Fifth | 1.0.2 | user.soundmanufacture.net (same account as Chord-O-Mat). Same Max MIDI Effect folder. The zip holds 1.0.0 and 1.0.1; if the circle draws offset, try the other |
| Own extensions: ambient, chords, progressive, reverse-midi | 1.0.0 | [Releases](https://github.com/superhighfives/music/releases); drag the `.ablx` onto Settings → Extensions |

### Gotchas

- **Synplant won't install from the 2024.08.30 bundle.** Its postinstall script
  fails its own MD5 check and macOS rolls everything back. The workaround is at
  the top of `scripts/install-synplant.sh`.
- **A plugin installed by hand doesn't appear.** Refresh macOS's Audio Unit
  cache with `killall -9 AudioComponentRegistrar`, then click **Rescan** in Live's
  Plug-Ins settings.
- **Claude's shell can't see third-party Audio Units.** `auval` there lists only
  Apple's. Check Live's browser instead (Claude can, through AbletonMCP).
- **Soundtoys licence missing in iLok.** Check your Soundtoys account's iLok ID
  matches the one you're signed in with. Upgrades replace the old licence.

## Generated textures

[`ableton/textures/gen_textures.py`](../ableton/textures/) generates Stable
Audio 2.5 textures on Replicate into `~/Music/Ableton/User Library/Samples/AI
Textures`. It needs `REPLICATE_API_TOKEN` in the environment and ffmpeg.

## Still open

- The old `chords` repo's Cloudflare token can be deleted at
  dash.cloudflare.com/profile/api-tokens; deploys now use the `music` repo's own.
