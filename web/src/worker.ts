import handler from '@alchemy.run/frontend-frameworks/astro/entrypoints/server'
import type { WebsiteEnv } from '../alchemy.run'
import { sendDaily } from './theory/email/daily'

/** Astro serves every request; the cron in alchemy.run.ts sends the theory book's daily email. */
export default {
  ...handler,
  scheduled(_controller: unknown, env: WebsiteEnv, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(sendDaily(env))
  },
}
