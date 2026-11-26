import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CONTENTS, PARTS, type Entry } from '~/theory/content/book'
import { useStore } from '~/theory/lib/store'

/** The whole book's contents, as a rail beside a chapter. The open chapter lists its sections. */
export function Contents({ current }: { current?: string }) {
  const { read, ready } = useStore()
  const sections = useSections(current)
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

function ContentsLine({ entry, current, done, children }: { entry: Entry; current?: string; done: boolean; children?: React.ReactNode }) {
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
      <Link
        className={done ? 'cline done' : 'cline'}
        to="/theory/$chapterId"
        params={{ chapterId: entry.chapter.id }}
        aria-current={entry.chapter.id === current ? 'page' : undefined}
      >
        <span className="n">{done ? '✓' : n}</span>
        <span>{entry.chapter.title}</span>
      </Link>
      {children}
    </>
  )
}

/** The open chapter's sections, read from the page once it's rendered. */
function useSections(chapterId?: string) {
  const [sections, setSections] = useState<{ id: string; title: string }[]>([])
  useEffect(() => {
    const found = [...document.querySelectorAll<HTMLElement>('article .sec')].map((el) => ({
      id: el.id,
      title: el.querySelector('h2')?.textContent?.replace(/^§/, '') ?? '',
    }))
    setSections(found)
  }, [chapterId])
  return sections
}

/** The section being read: the last one whose top has scrolled past a third of the window. */
function useActiveSection(sections: { id: string }[]) {
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
