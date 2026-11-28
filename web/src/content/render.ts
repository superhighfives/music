import type { View } from '@effect/ui'
import type { Html } from '@effect/ui/html'
import type { Node } from './jsx-runtime'

/** One rendered child: an element or a component, or text. */
export type Child<M> = View.Content<M, never> | string

/** How a page renders each island by name. `index` counts earlier islands of that name, to key them apart. */
export type Islands<M> = Readonly<Record<string, (h: Html.H<M>, props: Readonly<Record<string, unknown>>, index: number) => Child<M>>>

/** SVG attributes that keep their camelCase; React's other camelCase SVG names are written kebab-case. */
const CAMEL_SVG = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'patternUnits', 'markerWidth', 'markerHeight', 'refX', 'refY'])

/** React's attribute names as HTML and SVG spell them: tabIndex is tabindex, but strokeWidth is stroke-width. */
const attributeName = (name: string, svg: boolean) =>
  name === 'className'
    ? 'class'
    : name === 'htmlFor'
      ? 'for'
      : !svg || name === 'tabIndex'
        ? name.toLowerCase()
        : CAMEL_SVG.has(name)
          ? name
          : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const UNITLESS = /opacity|z-index|flex|weight|line-height/i

const cssText = (style: object) =>
  Object.entries(style)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => {
      const custom = k.startsWith('--')
      const name = custom ? k : k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
      return `${name}:${typeof v === 'number' && !custom && !UNITLESS.test(k) ? `${v}px` : String(v)}`
    })
    .join(';')

/** For content with no handlers: it sends nothing. */
export const noMessages = (_: unknown): _ is never => false

// Array.isArray doesn't narrow a readonly array.
const isList = (n: Node): n is ReadonlyArray<Node> => Array.isArray(n)

/** Events whose default the page cancels when a handler sends a message: a pressed key shouldn't also scroll or select. */
const PREVENT = new Set(['pointerdown', 'keydown'])

/**
 * Turns a content tree into Effect UI children. Elements become `h.el` builders with their attributes;
 * islands render through `islands`. An `onX` prop is a handler for event `x`: what it returns is sent to
 * the component when `isMessage` accepts it, so content can only send that component's messages.
 */
export function render<M>(h: Html.H<M>, node: Node, islands: Islands<M>, isMessage: (u: unknown) => u is M): Array<Child<M>> {
  const seen = new Map<string, number>()
  const walk = (n: Node, svg: boolean): Array<Child<M>> => {
    if (n === null || n === undefined || typeof n === 'boolean') return []
    if (typeof n === 'string' || typeof n === 'number') return [String(n)]
    if (isList(n)) return n.flatMap((c) => walk(c, svg))
    const el = n
    if (el._tag === 'Island') {
      const view = islands[el.name]
      if (!view) throw new Error(`No island view for ${el.name}`)
      const index = seen.get(el.name) ?? 0
      seen.set(el.name, index + 1)
      return [view(h, el.props, index)]
    }
    const inSvg = svg || el.tag === 'svg'
    let b = h.el(el.tag)
    for (const [name, value] of Object.entries(el.props)) {
      if (name === 'key' || value === undefined || value === null) continue
      // ARIA states are the strings "true" and "false"; other false attributes are left out.
      if (typeof value === 'boolean' && name.startsWith('aria-')) {
        b = b.attr(name, String(value))
        continue
      }
      if (value === false) continue
      if (typeof value === 'function' && /^on[A-Z]/.test(name)) {
        const event = name.slice(2).toLowerCase()
        const handler = (payload: unknown) => {
          const message: unknown = value(payload)
          return isMessage(message) ? message : undefined
        }
        b = PREVENT.has(event) ? b.on(event, handler, { preventDefault: true }) : b.on(event, handler)
      } else if (name === 'style' && typeof value === 'object') b = b.attr('style', cssText(value))
      else b = b.attr(attributeName(name, inSvg), value === true ? '' : String(value))
    }
    const kids = walk(el.children, inSvg)
    return [kids.length ? b.children(kids) : b]
  }
  return walk(node, false)
}
