import { clerkMiddleware } from '@clerk/astro/server'

// Every request knows who is signed in: pages render signed in, and endpoints check the session.
export const onRequest = clerkMiddleware()
