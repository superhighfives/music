import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import css from './site.css?url'

export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true, defaultNotFoundComponent: NotFound })
}

function NotFound() {
  return (
    <main>
      <link rel="stylesheet" href={css} />
      <h1>Not found</h1>
      <p>
        Nothing lives at this address. <a href="/">Back to music</a>
      </p>
    </main>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
