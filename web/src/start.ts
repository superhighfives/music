import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createServerOnlyFn, createStart } from '@tanstack/react-start'

/**
 * Clerk's keys are Worker secrets (.dev.vars locally). This file is in the browser bundle too, so the
 * Worker env is read only on the server; the publishable key reaches the browser in Clerk's initial state.
 */
const clerkKeys = createServerOnlyFn(async () => {
  const { env } = await import('cloudflare:workers')
  return { secretKey: env.CLERK_SECRET_KEY, publishableKey: env.CLERK_PUBLISHABLE_KEY }
})

// Every request reads its Clerk session, so server functions can call auth().
export const startInstance = createStart(() => ({ requestMiddleware: [clerkMiddleware(clerkKeys)] }))
