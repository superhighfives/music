import type { ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { CONTENTS, PARTS, type Entry } from '~/theory/content/book'
import { useSaved } from './store'

type SectionLink = { id: string; title: string }

/** The whole book's contents, as a rail beside a chapter. The open chapter lists its sections. */
export default function Contents({ current, sections }: { current: string; sections: SectionLink[] }) {
  const { read, ready } = useSaved()
  const active = useActiveSection(sections)
  return (
    <nav className="contents" aria-label="Contents">
      {PARTS.map((part) => (
        <div key={part.id} className="cpart">
          <div className="lab">{part.title}</div>
          {CONTENTS.filter((e) => e.part === part).map((e) => (
            <ContentsLine key={e.n} entry={e} current={current} done={ready && 'chapter' in e && !!read[e.chapter.id]}>
              {'chapter' in e && e.chapter.id === current && sections.length ? (
                <ol className="csecs">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} aria-current={active === s.id ? 'location' : undefined}>
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ol>
              ) : null}
            </ContentsLine>
          ))}
        </div>
      ))}
    </nav>
  )
}

function ContentsLine({ entry, current, done, children }: { entry: Entry; current: string; done: boolean; children?: ComponentChildren }) {
  const n = String(entry.n).padStart(2, '0')
  if ('planned' in entry)
    return (
      <span className="cline planned" title="Planned">
        <span className="n">{n}</span>
        <span>{entry.planned.title}</span>
      </span>
    )
  return (
    <>
      <a className={done ? 'cline done' : 'cline'} href={`/theory/${entry.chapter.id}`} aria-current={entry.chapter.id === current ? 'page' : undefined}>
        <span className="n">{done ? '✓' : n}</span>
        <span>{entry.chapter.title}</span>
      </a>
      {children}
    </>
  )
}

/** The section being read: the last one whose top has scrolled past a third of the window. */
function useActiveSection(sections: SectionLink[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    if (!sections.length) return
    const onScroll = () => {
      let id: string | null = null
      for (const s of sections) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top < window.innerHeight / 3) id = s.id
      }
      setActive(id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])
  return active
}
