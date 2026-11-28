import { Command, Component, Mount } from '@effect/ui'
import { Effect, Stream } from 'effect'
import { loadClerk } from './clerk'

/**
 * Clerk's sign-in dialog and account menu, for every Effect UI section. A page's client entry connects
 * Clerk once with `connectClerk`; components open sign-in with `OpenSignIn` and draw the menu with
 * `ShowUserButton`.
 */
export type AuthUI = {
  openSignIn: () => void
  mountUserButton: (node: HTMLDivElement) => void
  unmountUserButton: (node: HTMLDivElement) => void
}

let authUI: AuthUI | null = null
export const setAuthUI = (ui: AuthUI) => {
  authUI = ui
}

export const OpenSignIn = Command.make('OpenSignIn', {}, () => Effect.sync(() => authUI?.openSignIn()).pipe(Effect.as(Component.noop)))

/** The signed-in person's menu, drawn by Clerk into this element for as long as it lives. */
export const ShowUserButton = Mount.makeStream('ShowUserButton', {}, (node: HTMLDivElement) =>
  Stream.callback<never>(
    Effect.fnUntraced(function* () {
      yield* Effect.acquireRelease(
        Effect.sync(() => authUI?.mountUserButton(node)),
        () => Effect.sync(() => authUI?.unmountUserButton(node)),
      )
    }),
  ),
)

/**
 * Loads Clerk after the page is running, so sign-in never holds up the page, and reports the signed-in
 * user now and on every change. The publishable key comes from the page's `data-clerk-key`.
 */
export function connectClerk(appearance: unknown, onUser: (userId: string | null) => void) {
  const publishableKey = document.body.dataset.clerkKey
  if (!publishableKey) return
  loadClerk(publishableKey, appearance)
    .then((clerk) => {
      setAuthUI({
        openSignIn: () => clerk.openSignIn({ appearance }),
        mountUserButton: (node) => clerk.mountUserButton(node, { appearance }),
        unmountUserButton: (node) => clerk.unmountUserButton(node),
      })
      onUser(clerk.user?.id ?? null)
      clerk.addListener(({ user }) => onUser(user?.id ?? null))
    })
    .catch((e) => console.warn("Sign-in couldn't load.", e))
}

export const absurd = (n: never): never => n
