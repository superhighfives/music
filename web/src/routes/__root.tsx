import { ClerkProvider } from '@clerk/tanstack-react-start'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'

// The shell is bare on purpose. Each section (home, Chords, Production, Theory) brings its own styles in its route's head.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
  }),
  component: Shell,
})

function Shell() {
  // One Clerk session, so signing in once covers every section.
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
