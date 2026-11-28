import { ClerkProvider } from '@clerk/tanstack-react-start'
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { THEME_SCRIPT } from '~/Masthead'

// Every section shares the fonts and the light/dark choice. Each brings its own stylesheet in its route's head,
// built on site.css, so chords' Tailwind never meets the other sections' styles.
export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
    ],
    scripts: [{ children: THEME_SCRIPT }],
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
