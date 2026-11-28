/** The parts of Clerk's browser SDK the Effect UI sections use. */
export type ClerkBrowser = {
  readonly user: { readonly id: string } | null | undefined
  load(options: { ui: { ClerkUI: unknown }; appearance?: unknown }): Promise<void>
  addListener(listener: (resources: { user?: { readonly id: string } | null | undefined }) => void): () => void
  openSignIn(props?: { appearance?: unknown }): void
  mountUserButton(node: HTMLDivElement, props?: { appearance?: unknown }): void
  unmountUserButton(node: HTMLDivElement): void
}

// Clerk's scripts set these globals. Clerk publishes no types for them, so this is the one place
// that reads them, as the shapes above.
const globals = globalThis as unknown as { Clerk?: ClerkBrowser; __internal_ClerkUICtor?: unknown }

/** The publishable key holds Clerk's frontend API host, base64-encoded and ending in "$". */
const frontendApi = (publishableKey: string) => atob(publishableKey.split('_')[2] ?? '').replace(/\$$/, '')

const script = (src: string, attributes: Record<string, string> = {}) =>
  new Promise<void>((resolve, reject) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.crossOrigin = 'anonymous'
    for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Couldn't load ${src}`))
    document.head.append(el)
  })

/**
 * Loads Clerk in the browser without its React SDK, the way that SDK does it: clerk-js and Clerk's UI from
 * the instance's frontend API, then `load` with the UI constructor. Clerk's UI hands that constructor over
 * as a global, `__internal_ClerkUICtor`, which Clerk could rename in a later version.
 */
export async function loadClerk(publishableKey: string, appearance: unknown): Promise<ClerkBrowser> {
  const host = frontendApi(publishableKey)
  await Promise.all([
    script(`https://${host}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, { 'data-clerk-publishable-key': publishableKey }),
    script(`https://${host}/npm/@clerk/ui@1/dist/ui.browser.js`),
  ])
  const clerk = globals.Clerk
  if (!clerk) throw new Error("Clerk didn't start")
  await clerk.load({ ui: { ClerkUI: globals.__internal_ClerkUICtor }, appearance })
  return clerk
}
