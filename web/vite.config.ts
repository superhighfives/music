import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Builds the client entry of each Effect UI page into the client bundle, and tells the Worker its built
 * file names through `virtual:islands`. TanStack Start builds the client before the server, so the names
 * are known by the time the Worker's build reads them. In dev, Vite serves the source paths.
 */
function islands(entries: Record<string, string>): Plugin {
  const built: Record<string, { js: string; css: string[] }> = {}
  let command: 'serve' | 'build' = 'serve'
  return {
    name: 'islands',
    sharedDuringBuild: true,
    configResolved(config) {
      command = config.command
    },
    buildStart() {
      if (command !== 'build' || this.environment.name !== 'client') return
      for (const [name, id] of Object.entries(entries)) this.emitFile({ type: 'chunk', id, name: `island-${name}` })
    },
    generateBundle(_, bundle) {
      if (this.environment.name !== 'client') return
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk' || !chunk.isEntry || !chunk.facadeModuleId) continue
        const name = Object.entries(entries).find(([, id]) => chunk.facadeModuleId?.endsWith(id))?.[0]
        if (name) built[name] = { js: `/${chunk.fileName}`, css: [...(chunk.viteMetadata?.importedCss ?? [])].map((f) => `/${f}`) }
      }
    },
    resolveId(id) {
      if (id === 'virtual:islands') return '\0virtual:islands'
    },
    load(id) {
      if (id !== '\0virtual:islands') return
      const value = command === 'serve' ? Object.fromEntries(Object.entries(entries).map(([name, path]) => [name, { js: path, css: [] }])) : built
      return `export default ${JSON.stringify(value)}`
    },
  }
}

// Alchemy adds its own Cloudflare plugin when it runs Vite (alchemy dev, alchemy deploy).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [islands({ chords: '/src/chords/app/client.ts' }), tailwindcss(), tanstackStart(), react()],
})
