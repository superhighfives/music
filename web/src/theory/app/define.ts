import { UiSchema } from '@effect/ui'
import { Schema } from 'effect'
import { island, type Node } from '~/content/jsx-runtime'
import type { Step } from '~/theory/lib/audio'

const StepSchema = Schema.Struct({ notes: Schema.Array(Schema.Number), beats: Schema.Number })

/**
 * What a figure's content can send. `Play` is also a message of the book itself, so the plain Keyboard
 * and Staff, which only play what you press, work in a chapter's text and inside a figure alike.
 */
export const FigureMessage = UiSchema.TaggedEnum({
  Play: { notes: Schema.Array(Schema.Number), strum: Schema.Boolean },
  /** The figure's new state; `play` sounds notes with it, and `emit` reports to the page. */
  Set: { state: Schema.Unknown, play: Schema.Array(Schema.Number), emit: Schema.NullOr(Schema.String) },
  Start: { steps: Schema.Array(StepSchema), bpm: Schema.Number, click: Schema.Number },
  Stop: {},
  Stepped: { index: Schema.NullOr(Schema.Number) },
})
export type FigureMessage = typeof FigureMessage.Type

/** Notes to play when pressed: what a plain Keyboard or Staff sends. */
export const play = (notes: number[], strum = false) => FigureMessage.Play({ notes, strum })

type Playing = { current: number | null; playing: boolean }

/** What a figure's view can do, as messages for its handlers to return. */
export type Act<S> = Playing & {
  set: (state: S, also?: { play?: number[]; emit?: string }) => FigureMessage
  start: (steps: Step[], opts: { bpm: number; click?: number }) => FigureMessage
  stop: () => FigureMessage
}

type Definition<A, S> = {
  args: Schema.Codec<A, unknown>
  state: Schema.Codec<S, unknown>
  init: (args: A) => S
  view: (args: A, state: S, act: Act<S>) => Node
}

/** A figure with its types erased, as the Figure component runs it. Args and state are decoded on the way in. */
type Registered = {
  init: (args: unknown) => unknown
  view: (args: unknown, state: unknown, playing: Playing) => Node
}

const registry = new Map<string, Registered>()

export const registered = (name: string): Registered => {
  const f = registry.get(name)
  if (!f) throw new Error(`No figure named ${name}`)
  return f
}

const actions = <S>(playing: Playing): Act<S> => ({
  ...playing,
  set: (state, also) => FigureMessage.Set({ state, play: also?.play ?? [], emit: also?.emit ?? null }),
  start: (steps, opts) => FigureMessage.Start({ steps, bpm: opts.bpm, click: opts.click ?? 0 }),
  stop: () => FigureMessage.Stop(),
})

/**
 * Defines an interactive figure: its own state, what it draws, and what it plays. Returns a content
 * component; the page renders each use as a Figure child component with its own state, so two of the
 * same figure on one page share nothing.
 */
export function figure<A, S>(name: string, def: Definition<A, S>): (args: A) => Node {
  if (registry.has(name)) throw new Error(`Two figures named ${name}`)
  const args = Schema.decodeUnknownSync(def.args)
  const state = Schema.decodeUnknownSync(def.state)
  registry.set(name, {
    init: (a) => def.init(args(a)),
    view: (a, s, playing) => def.view(args(a), state(s), actions(playing)),
  })
  return (a) => island('Figure', { name, args: a })
}

/** For figures with nothing to keep but what's playing. */
export const NoState = Schema.Struct({})
