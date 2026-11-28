import { clerkMiddleware } from '@clerk/astro/server'
import { env } from 'cloudflare:workers'

// Every request knows who is signed in: pages render signed in, and endpoints check the session. With the
// instance's public key, Clerk checks a session without calling its API, so a slow or hanging Clerk can't
// hold up a signed-in request.
export const onRequest = clerkMiddleware({ jwtKey: env.CLERK_JWT_KEY })
