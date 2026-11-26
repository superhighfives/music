import { ClerkProvider } from '@clerk/tanstack-react-start'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

// The shell is bare on purpose. Each section (home, chords, sounds) brings its own styles in its route's head.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  }),
  component: Shell,
})

function Shell() {
  // One Clerk session across every section, so signing in once covers chords and sounds.
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body>
          <Outlet />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  )
}
