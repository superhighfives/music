import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Keep the app's Vite plugins (TanStack Start, Cloudflare) out of unit tests, but resolve ~/ like the app.
// An alias, not tsconfig paths: those apply only to files tsconfig.json includes, and the Effect UI code is in tsconfig.chords.json.
export default defineConfig({ resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } } })
