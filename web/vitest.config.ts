import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Keep the app's Vite plugins out of unit tests, but resolve ~/ like the app.
export default defineConfig({ resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } } })
