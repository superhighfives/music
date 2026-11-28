import clerk from '@clerk/astro'
import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import effectUi from './integrations/effect-ui'

// Alchemy adds the Cloudflare adapter when it builds or runs the site (alchemy.run.ts).
export default defineConfig({
  output: 'server',
  // Preact renders the .tsx islands. Effect UI renders Chords, whose components are plain .ts.
  integrations: [preact(), mdx(), clerk(), effectUi()],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  },
})
