import { defineConfig } from 'vitest/config'

// Keep the app's Vite plugins (TanStack Start, Cloudflare) out of unit tests, but resolve ~/ like the app.
export default defineConfig({ resolve: { tsconfigPaths: true } })
