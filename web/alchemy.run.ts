import * as Cloudflare from '@alchemy.run/cloudflare'
import * as Alchemy from 'alchemy'
import { Stage } from 'alchemy/Stage'
import { Config } from 'effect'
import * as Effect from 'effect/Effect'

// The "prod" stage is the live site and keeps the existing names. Every other stage (dev_<user>,
// pr-<number>) gets its own Worker and database, with generated names, so it never touches prod.
const isProd = Effect.gen(function* () {
  return (yield* Stage) === 'prod'
})

// What signed-in people save. Tables are in migrations/.
export const DB = Cloudflare.D1.Database(
  'DB',
  Effect.map(isProd, (prod) => ({ name: prod ? 'music' : undefined, migrations: './migrations' })),
)

// The theory book's daily email (src/theory/email/). charliegleason.com must be onboarded to Email Service.
export const Email = Cloudflare.Email.SendEmail('Email', { allowedSenderAddresses: ['theory@charliegleason.com'] })

export const Website = Cloudflare.Website.Vite(
  'Website',
  Effect.map(isProd, (prod) => ({
    name: prod ? 'music' : undefined,
    domain: prod ? 'music.charliegleason.com' : undefined,
    compatibility: { date: '2026-11-23', flags: ['nodejs_compat'] },
    // The daily email goes out at 07:00 UTC; later runs retry anyone a failure skipped. Only prod
    // sends it, so a preview never emails real subscribers.
    crons: prod ? ['0 7-23 * * *'] : [],
    observability: { enabled: true },
    env: {
      DB,
      EMAIL: Email,
      // Clerk's keys: read from the environment at deploy time and bound as secrets.
      CLERK_SECRET_KEY: Config.Redacted('CLERK_SECRET_KEY'),
      CLERK_PUBLISHABLE_KEY: Config.Redacted('CLERK_PUBLISHABLE_KEY'),
    },
  })),
)

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>

export default Alchemy.Stack(
  'music',
  // Deploy state lives in the account's alchemy-state-store Worker, so CI and every machine share it.
  // Set it up once with `alchemy state bootstrap`.
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const website = yield* Website
    return { url: website.url.as<string>() }
  }),
)
