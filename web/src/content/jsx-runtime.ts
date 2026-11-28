/**
 * A JSX runtime for the site's written content, with no React. JSX here builds plain data: a tree of tags,
 * props and children. Components are plain functions that return more tree, and run as the tree is built.
 * Interactive parts are islands: named nodes that a page renders as Effect UI components. `render.ts`
 * turns a tree into an Effect UI view.
 *
 * A content file opts in with `/** @jsxImportSource ~/content *\/` at the top.
 */

export type Island = { readonly _tag: 'Island'; readonly name: string; readonly props: Readonly<Record<string, unknown>> }
export type Element = { readonly _tag: 'Element'; readonly tag: string; readonly props: Readonly<Record<string, unknown>>; readonly children: Node }
export type Node = string | number | boolean | null | undefined | Element | Island | ReadonlyArray<Node>

type Props = Record<string, unknown> & { children?: Node }

export function jsx(type: string | ((props: never) => Node), props: Props): Node {
  if (typeof type === 'function') return (type as (props: Props) => Node)(props)
  const { children, ...rest } = props
  return { _tag: 'Element', tag: type, props: rest, children }
}
export const jsxs = jsx
export const jsxDEV = jsx

export function Fragment(props: { children?: Node }): Node {
  return props.children
}

/** A named interactive part, rendered by the page as an Effect UI component. */
export const island = (name: string, props: Record<string, unknown> = {}): Island => ({ _tag: 'Island', name, props })

export declare namespace JSX {
  type Element = Node
  interface ElementChildrenAttribute {
    children: {}
  }
  interface IntrinsicAttributes {
    key?: string | number | undefined
  }
  /**
   * Handlers return a message for the component that renders the content; anything else is ignored.
   * Payloads are Effect UI's: `{ value }` for a change, `{ key }` for a key.
   */
  type Handlers = {
    onClick?: ((payload: {}) => unknown) | undefined
    onPointerDown?: ((payload: {}) => unknown) | undefined
    onChange?: ((payload: { value: string }) => unknown) | undefined
    onKeyDown?: ((payload: { key: string }) => unknown) | undefined
  }
  interface IntrinsicElements {
    [tag: string]: Record<string, unknown> & Handlers & { children?: Node }
  }
}
