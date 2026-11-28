import { RECIPES, THEMES, lessonKey, type Theme } from '~/production/catalog'
import { useSaved } from './store'

type Done = Readonly<Record<string, true>>

function findLesson(key: string) {
  const [themeId, lessonId] = key.split('.')
  const theme = THEMES.find((t) => t.id === themeId)
  const lesson = theme?.lessons.find((l) => l.id === lessonId)
  return theme && lesson ? { theme, lesson } : null
}

/** Continue where you were. */
export function Continue() {
  const { last } = useSaved()
  const resume = last ? findLesson(last) : null
  if (!resume) return null
  return (
    <a className="continue" href={`/production/themes/${resume.theme.id}/${resume.lesson.id}`}>
      <span className="lab">Continue</span>
      <b>
        {resume.theme.name} · {resume.lesson.title}
      </b>
      <span className="dim">→</span>
    </a>
  )
}

function ThemeCard({ theme, index, done }: { theme: Theme; index: number; done: Done }) {
  const total = theme.lessons.length
  const complete = theme.lessons.filter((l) => done[lessonKey(theme, l)]).length
  const status =
    total === 0 ? <span className="chip">Planned</span> : complete === total ? <span className="chip lit">Done</span> : <span className="chip">{total} {total === 1 ? 'lesson' : 'lessons'}</span>
  return (
    <a className="card" href={`/production/themes/${theme.id}`}>
      <div className="top">
        <span className="num">{String(index + 1).padStart(2, '0')}</span>
        {status}
      </div>
      <div className="name">{theme.name}</div>
      <div className="blurb">{theme.blurb}</div>
      <div className="meta">
        {total === 0 ? (
          <span className="src">{theme.planned.length} lessons planned</span>
        ) : (
          <>
            <div className="bar" role="img" aria-label={`${complete} of ${total} done`}>
              <i style={{ width: `${(complete / total) * 100}%` }} />
            </div>
            <span className="src">
              {complete} of {total} done
            </span>
          </>
        )}
      </div>
    </a>
  )
}

/** The themes, each with how far through it you are. */
export function ThemeCards() {
  const { done } = useSaved()
  return (
    <div className="cards">
      {THEMES.map((t, i) => (
        <ThemeCard key={t.id} theme={t} index={i} done={done} />
      ))}
    </div>
  )
}

export function RecipeList() {
  const { done } = useSaved()
  return (
    <div className="list">
      {RECIPES.map((r) => (
        <a key={r.id} href={`/production/recipes/${r.id}`}>
          <span className="t">{r.title}</span>
          <span className={done[`recipe.${r.id}`] ? 'chip lit' : 'chip cool'}>{done[`recipe.${r.id}`] ? 'Done' : 'Recipe'}</span>
          <span className="s">
            {r.artist} · {r.track} · {r.summary}
          </span>
        </a>
      ))}
    </div>
  )
}
