/** A lesson's or recipe's MDX: rendered with the course's components (mdx/index.ts). */
type Mdx = { default: (props: { components: Record<string, unknown> }) => unknown }

const lessons = import.meta.glob<Mdx>('./lessons/*/*.mdx')
const recipes = import.meta.glob<Mdx>('./recipes/*.mdx')

export const lessonContent = async (themeId: string, lessonId: string) => (await lessons[`./lessons/${themeId}/${lessonId}.mdx`]?.())?.default
export const recipeContent = async (id: string) => (await recipes[`./recipes/${id}.mdx`]?.())?.default
