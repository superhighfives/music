import { RECIPES } from '~/production/catalog'
import { useSaved } from './store'

export default function RecipeRail({ current }: { current: string }) {
  const { done } = useSaved()
  return (
    <nav className="rail" aria-label="Recipes">
      {RECIPES.map((r) => (
        <a key={r.id} href={`/production/recipes/${r.id}`} aria-current={r.id === current ? 'page' : undefined}>
          <span className="n">{done[`recipe.${r.id}`] ? '✓' : '··'}</span>
          <span>{r.title}</span>
        </a>
      ))}
    </nav>
  )
}
