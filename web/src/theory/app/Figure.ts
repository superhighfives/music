import { Command, Component, Subscription, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { Effect, Queue, Schema, Stream } from 'effect'
import { render } from '~/content/render'
import { piano, sequence, type Step } from '~/theory/lib/audio'
import { FigureMessage, registered } from './define'

/** Plays notes once, together or strummed. */
export const PlayNotes = Command.make('PlayNotes', { args: { notes: Schema.Array(Schema.Number), strum: Schema.Boolean } }, ({ notes, strum }) =>
  Effect.sync(() => piano.play([...notes], strum)).pipe(Effect.as(Component.noop)),
)

const Run = Schema.Struct({ id: Schema.Number, steps: Schema.Array(Schema.Struct({ notes: Schema.Array(Schema.Number), beats: Schema.Number })), bpm: Schema.Number, click: Schema.Number })

const FigureModel = Schema.Struct({
  state: Schema.Unknown,
  current: Schema.NullOr(Schema.Number),
  run: Schema.NullOr(Run),
  /** Counts sequences started, so starting the same one again restarts it. */
  runs: Schema.Number,
})

export const FigureEvents = UiSchema.TaggedEnum({ Emitted: { event: Schema.String } })

const isMessage = Schema.is(FigureMessage)

/** A sequence's steps as messages: each step as it sounds, then null when it ends or another starts. */
const steps = (run: typeof Run.Type) =>
  Stream.callback<FigureMessage>(
    Effect.fnUntraced(function* (queue) {
      const list: Step[] = run.steps.map((s) => ({ notes: [...s.notes], beats: s.beats }))
      yield* Effect.acquireRelease(
        Effect.sync(() => sequence(list, { bpm: run.bpm, click: run.click || undefined, onStep: (index) => Queue.offerUnsafe(queue, FigureMessage.Stepped({ index })) })),
        (cancel) => Effect.sync(cancel),
      )
    }),
  )

/** One interactive figure in a chapter, by name: see `figure` for how one is defined. */
export const Figure = Html.component({
  name: 'Figure',
  props: Schema.Struct({ name: Schema.String, args: Schema.Unknown }),
  model: FigureModel,
  message: FigureMessage,
  events: FigureEvents,
}).make({
  init: ($) => $.set({ state: registered($.props.name).init($.props.args), current: null, run: null, runs: 0 }),
  update: ($, message) =>
    FigureMessage.match(message, {
      Play: ({ notes, strum }) => $.set($.model).run(PlayNotes.make({ notes, strum })),
      Set: ({ state, play, emit }) => {
        const step = $.set({ ...$.model, state })
        const sounding = play.length ? step.run(PlayNotes.make({ notes: play, strum: false })) : step
        return emit === null ? sounding : sounding.emit(FigureEvents.Emitted({ event: emit }))
      },
      Start: ({ steps, bpm, click }) => $.set({ ...$.model, current: null, run: { id: $.model.runs + 1, steps, bpm, click }, runs: $.model.runs + 1 }),
      Stop: () => $.set({ ...$.model, current: null, run: null }),
      Stepped: ({ index }) => $.set({ ...$.model, current: index, run: index === null ? null : $.model.run }),
    }),
  subscriptions: ({ model }) => [model.run && Subscription.make('sequence', String(model.run.id), () => steps(model.run!))],
  view: (h, model) => {
    const view = registered(h.props.name).view(h.props.args, model.state, { current: model.current, playing: model.run !== null })
    return h.div.class('figure').children(render(h, view, {}, isMessage))
  },
})
