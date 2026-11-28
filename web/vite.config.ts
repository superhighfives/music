import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

/**
 * Builds the client entry of each Effect UI page and tells the Worker its built file names through
 * `virtual:islands`. TanStack Start's client build allows one entry, so while it still serves the other
 * pages the islands build as their own environment, into `.islands`, and are copied into the client
 * output before the Worker builds. In dev, Vite serves the source paths.
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
      return {
        environments: {
          islands: { consumer: 'client', build: { outDir: '.islands', emptyOutDir: true, rollupOptions: { input: entries } } },
        },
      }
    },
    buildApp: {
      order: 'pre',
      async handler(builder) {
        const { client, islands } = builder.environments
        if (!client || !islands) return
        // The client build empties its folder, so it goes first; then the islands join it.
        if (!client.isBuilt) await builder.build(client)
        await builder.build(islands)
        await cp(join(islands.config.root, '.islands'), client.config.build.outDir, { recursive: true })
      },
    },
    generateBundle(_, bundle) {
      if (this.environment.name !== 'islands') return
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
  // An alias, not tsconfig paths: those apply only to files tsconfig.json includes, and the Effect UI code is in tsconfig.chords.json.
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [islands({ chords: 'src/chords/app/client.ts', home: 'src/pages/home.client.ts', static: 'src/islands/static.ts', production: 'src/production/app/client.ts' }), tailwindcss(), tanstackStart(), react({ exclude: [/\/src\/content\//, /\/src\/production\//] })],
})
