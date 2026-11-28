import { findTheme, lessonKey } from '~/production/catalog'
import { useSaved } from './store'

export default function ThemeProgress({ themeId }: { themeId: string }) {
  const { done } = useSaved()
  const theme = findTheme(themeId)
  if (!theme?.lessons.length) return null
  const complete = theme.lessons.filter((l) => done[lessonKey(theme, l)]).length
  return (
    <span className="src">
      {complete} of {theme.lessons.length} lessons done
      {theme.planned.length ? ` · ${theme.planned.length} planned` : ''}
    </span>
  )
}
