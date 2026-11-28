import clerk from '@clerk/astro'
import mdx from '@astrojs/mdx'
import preact from '@astrojs/preact'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import effectUi from 'astro-effect-ui'

// Alchemy adds the Cloudflare adapter when it builds or runs the site (alchemy.run.ts).
export default defineConfig({
  output: 'server',
  // Preact renders the .tsx islands. Effect UI renders Chords, whose components are plain .ts.
  integrations: [
    preact(),
    mdx(),
    // The avatar fills the masthead's account circle (.account in site.css), the same size as the sign-in icon.
    clerk({ appearance: { elements: { userButtonAvatarBox: { width: '32px', height: '32px' } } } }),
    effectUi(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  },
})
