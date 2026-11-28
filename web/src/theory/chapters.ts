/** A chapter's MDX, and the sections its contents list: every `<Section>` in it, then its key ideas and its check. */
type Mdx = { default: (props: Record<string, unknown>) => unknown }

const bodies = import.meta.glob<Mdx>('./chapters/*.mdx')
const sources = import.meta.glob<string>('./chapters/*.mdx', { query: '?raw', import: 'default', eager: true })

export const chapterBody = async (id: string) => (await bodies[`./chapters/${id}.mdx`]?.())?.default

export function chapterSections(id: string, hasCheck: boolean) {
  const source = sources[`./chapters/${id}.mdx`] ?? ''
  const sections = [...source.matchAll(/<Section id="([^"]+)" title="([^"]+)"/g)].map((m) => ({ id: m[1]!, title: m[2]! }))
  return [...sections, { id: 'key-ideas', title: 'Key ideas' }, ...(hasCheck ? [{ id: 'check', title: 'Check yourself' }] : [])]
}
