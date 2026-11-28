import { findTheme, lessonKey } from '~/production/catalog'
import { useSaved } from './store'

const href = (themeId: string, lessonId: string) => `/production/themes/${themeId}/${lessonId}`

/** A theme's lessons beside the one open, with a tick for each one done. */
export default function LessonRail({ themeId, index }: { themeId: string; index: number }) {
  const { done } = useSaved()
  const theme = findTheme(themeId)
  if (!theme) return null
  return (
    <nav className="rail" aria-label="Lessons">
      {theme.lessons.map((l, i) => {
        const isDone = !!done[lessonKey(theme, l)]
        return (
          <a key={l.id} href={href(theme.id, l.id)} className={isDone ? 'done' : undefined} aria-current={i === index ? 'page' : undefined}>
            <span className="n">{isDone ? '✓' : String(i + 1).padStart(2, '0')}</span>
            <span>{l.title}</span>
          </a>
        )
      })}
      {theme.planned.map((p) => (
        <span key={p} className="planned">
          <span className="n">··</span>
          <span>{p}</span>
        </span>
      ))}
    </nav>
  )
}
