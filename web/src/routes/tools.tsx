import { createFileRoute } from '@tanstack/react-router'
import { SiteFooter } from '../SiteFooter'
import css from '../site.css?url'
import { lessonLink, TOOL_GROUPS } from '../tools'

export const Route = createFileRoute('/tools')({
  head: () => ({
    meta: [
      { title: 'Tools · music' },
      {
        name: 'description',
        content: 'The whole studio setup: Live, recording, editing, effects and mastering, with exercises to learn each tool and links to Production lessons.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: css },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  component: Tools,
})

// Plain links to Production, like everywhere else between sections: it loads its own styles.
function Tools() {
  return (
    <main>
      <a className="back" href="/">
        ← music
      </a>
      <h1>Tools</h1>
      <p>
        Everything in the studio, what each tool is for, and short exercises to learn it. Lessons link to{' '}
        <a href="/production">Production</a>, where the techniques are taught in order.
      </p>

      {TOOL_GROUPS.map((group) => (
        <section key={group.name}>
          <h2>{group.name}</h2>
          <p className="group-about">{group.about}</p>
          <ul className="cards">
            {group.tools.map((tool) => {
              const links = [
                ...tool.lessons.flatMap((key) => {
                  const link = lessonLink(key)
                  return link ? [{ label: link.title, href: link.href }] : []
                }),
                ...(tool.links ?? []),
              ]
              return (
                <li key={tool.name} className="card">
                  <h3>{tool.name}</h3>
                  <p>{tool.what}</p>
                  <h4>Learn it</h4>
                  <ul className="learn">
                    {tool.learn.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                  {links.length > 0 ? (
                    <p className="how">
                      See:{' '}
                      {links.map((l, i) => (
                        <span key={l.href}>
                          {i > 0 ? ' · ' : null}
                          <a href={l.href}>{l.label}</a>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <SiteFooter current="tools" />
    </main>
  )
}
