/**
 * The built client entry of each Effect UI page, from the `islands` Vite plugin in vite.config.ts:
 * its script, and the stylesheets it imports. In dev these are the source paths Vite serves.
 */
declare module 'virtual:islands' {
  const islands: Record<string, { readonly js: string; readonly css: ReadonlyArray<string> }>
  export default islands
}
