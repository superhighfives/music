import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/**
 * Builds each section's client entry and tells the Worker the built file names through
 * `virtual:islands`, so a page links its own script and styles. In dev, Vite serves the source paths.
 */
function islands(entries: Record<string, string>): Plugin {
  const built: Record<string, { js: string; css: string[] }> = {}
  let command: 'serve' | 'build' = 'serve'
  return {
    name: 'islands',
    sharedDuringBuild: true,
    config(_, env) {
      command = env.command
      if (env.command !== 'build') return
      return { environments: { client: { build: { rollupOptions: { input: entries } } } } }
    },
    buildApp: {
      // The Worker reads the client's file names, so the client builds first.
      order: 'pre',
      async handler(builder) {
        const { client } = builder.environments
        if (client && !client.isBuilt) await builder.build(client)
      },
    },
    generateBundle(_, bundle) {
      if (this.environment.name !== 'client') return
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry) continue
        built[chunk.name] = { js: `/${chunk.fileName}`, css: [...(chunk.viteMetadata?.importedCss ?? [])].map((f) => `/${f}`) }
      }
    },
    resolveId(id) {
      if (id === 'virtual:islands') return '\0virtual:islands'
    },
    load(id) {
      if (id !== '\0virtual:islands') return
      const value = command === 'serve' ? Object.fromEntries(Object.entries(entries).map(([name, path]) => [name, { js: `/${path}`, css: [] }])) : built
      return `export default ${JSON.stringify(value)}`
    },
  }
}

// Alchemy adds its own Cloudflare plugin when it runs Vite (alchemy dev, alchemy deploy).
export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    islands({
      site: 'src/pages/site.client.ts',
      chords: 'src/chords/app/client.ts',
      production: 'src/production/app/client.ts',
      theory: 'src/theory/app/client.ts',
    }),
    tailwindcss(),
  ],
})
