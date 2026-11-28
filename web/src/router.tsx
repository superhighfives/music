import { createRouter } from '@tanstack/react-router'
import { Masthead } from './Masthead'
import { routeTree } from './routeTree.gen'
import css from './site.css?url'

export function getRouter() {
  return createRouter({ routeTree, scrollRestoration: true, defaultNotFoundComponent: NotFound })
}

function NotFound() {
  return (
    <div className="page">
      <link rel="stylesheet" href={css} precedence="default" />
      <Masthead />
      <section className="empty">
        <h1>Not found</h1>
        <p>
          Nothing lives at this address. <a href="/">Back to music</a>
        </p>
      </section>
    </div>
  )
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
