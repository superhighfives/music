# sdks

This folder holds the Ableton Extensions SDK. Git ignores everything here except
this file. Ableton's SDK license forbids redistributing the SDK and treats beta
material as confidential, so do not commit it.

The extensions use **`extensions-sdk-1.0.0-beta.1`**. Their `package.json` files
read the SDK and CLI `.tgz` packages from that folder.

## Get the SDK

1. Join the Ableton Beta program at <https://www.ableton.com/en/beta/>.
2. Sign in to the Centercode portal that Ableton invites you to.
3. On the SDK release page, download `extensions-sdk-<version>.zip`.
4. Extract the zip here, so that you get
   `sdks/extensions-sdk-1.0.0-beta.1/ableton-extensions-sdk-1.0.0-beta.1.tgz`.

Keep a private copy outside the repo, for example in iCloud Drive. Older betas
may not stay on Centercode.

To move to a new SDK version, extract it here next to the old one. Change the
SDK and CLI paths in each `extensions/*/package.json`, then run `pnpm install`
and `pnpm build` in each extension. Read the new SDK's `upgrade.md` for API
changes, but not for its file layout: it expects a `vendor/` folder, which this
repo does not use.
