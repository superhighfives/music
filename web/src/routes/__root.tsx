import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { HANDOVER_SCRIPT } from '../moved'

// The shell is bare on purpose. Each section (home, chords, sounds) brings its own styles in its route's head.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    scripts: [{ children: HANDOVER_SCRIPT }],
  }),
  component: Shell,
})

function Shell() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
