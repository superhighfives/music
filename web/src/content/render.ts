import type { View } from '@effect/ui'
import type { Html } from '@effect/ui/html'
import type { Node } from './jsx-runtime'

/** How a page renders each island by name. `index` counts earlier islands of that name, to key them apart. */
/** One rendered child: an element or a component, or text. */
export type Child<M> = View.Content<M, never> | string

export type Islands<M> = Readonly<Record<string, (h: Html.H<M>, props: Readonly<Record<string, unknown>>, index: number) => Child<M>>>

/** SVG attributes that keep their camelCase; React's other camelCase SVG names are written kebab-case. */
const CAMEL_SVG = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'patternUnits', 'markerWidth', 'markerHeight', 'refX', 'refY'])

const attributeName = (name: string) =>
  name === 'className' ? 'class' : name === 'htmlFor' ? 'for' : CAMEL_SVG.has(name) || !/[A-Z]/.test(name) ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const cssText = (style: Readonly<Record<string, unknown>>) =>
  Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k.startsWith('--') ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${typeof v === 'number' && !k.startsWith('--') && !/opacity|z-index|flex|weight|line-height/i.test(k) ? `${v}px` : String(v)}`)
    .join(';')

/**
 * Turns a content tree into Effect UI children. Elements become `h.el` builders with their attributes;
 * islands render through `islands`. The content has no event handlers: anything interactive is an island.
 */
export function render<M>(h: Html.H<M>, node: Node, islands: Islands<M> = {}): Array<Child<M>> {
  const seen = new Map<string, number>()
  const walk = (n: Node): Array<Child<M>> => {
    if (n === null || n === undefined || typeof n === 'boolean') return []
    if (typeof n === 'string' || typeof n === 'number') return [String(n)]
    if (Array.isArray(n)) return n.flatMap(walk)
    const el = n as Exclude<Node, ReadonlyArray<Node> | string | number | boolean | null | undefined>
    if (el._tag === 'Island') {
      const view = islands[el.name]
      if (!view) throw new Error(`No island view for ${el.name}`)
      const index = seen.get(el.name) ?? 0
      seen.set(el.name, index + 1)
      return [view(h, el.props, index)]
    }
    let b = h.el(el.tag)
    for (const [name, value] of Object.entries(el.props)) {
      if (name === 'key' || value === undefined || value === null || value === false) continue
      if (name === 'style' && typeof value === 'object') b = b.attr('style', cssText(value as Record<string, unknown>))
      else b = b.attr(attributeName(name), value === true ? '' : String(value))
    }
    const kids = walk(el.children)
    return [kids.length ? b.children(kids) : b]
  }
  return walk(node)
}
