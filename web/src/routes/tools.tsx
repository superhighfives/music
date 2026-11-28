import { createFileRoute } from '@tanstack/react-router'
import { Masthead, PadMark } from '~/Masthead'
import { SiteFooter } from '~/SiteFooter'
import css from '~/site.css?url'
import { lessonLink, TOOL_GROUPS } from '~/tools'

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
    <div className="page" data-section="tools">
      <Masthead
        brand={
          <a className="brand" href="/tools">
            <PadMark lit={10} />
            Tools
          </a>
        }
      />
      <section className="hero">
        <PadMark lit={10} big />
        <h1>Tools</h1>
        <p className="lede">
          Everything in the studio, what each tool is for, and short exercises to learn it. Lessons link to <a href="/production">Production</a>,
          where the techniques are taught in order.
        </p>
      </section>
      <div className="home">
        {TOOL_GROUPS.map((group) => (
          <section key={group.name} className="block">
            <h2>
              {group.name} <span className="dim">{group.about}</span>
            </h2>
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
                    <span className="name">{tool.name}</span>
                    <span className="blurb">{tool.what}</span>
                    <span className="lab">Learn it</span>
                    <ol className="steps">
                      {tool.learn.map((step) => (
                        <li key={step}>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                    {links.length > 0 ? (
                      <p className="src meta">
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
      </div>
      <SiteFooter current="tools" />
    </div>
  )
}
