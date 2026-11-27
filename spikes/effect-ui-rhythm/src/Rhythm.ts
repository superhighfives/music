import { Command, Component, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { Duration, Effect, Schema } from 'effect'
import { beatsOf, countAt, parseRhythm } from './music.ts'

export const RhythmProps = Schema.Struct({ rhythm: Schema.String, bpm: Schema.Number, beats: Schema.Number })

// Which step is sounding, or null when stopped. Everything else is derived from the props.
export const RhythmModel = Schema.Struct({ current: Schema.NullOr(Schema.Number) })

export const RhythmMessage = UiSchema.TaggedEnum({
  ClickedPlay: {},
  ClickedStop: {},
  ReachedStep: { index: Schema.Number },
  Finished: {},
})

/**
 * Waits out one step, then reports the next one, or that the line has finished. One step at a time,
 * so Stop only has to interrupt the step that is waiting. The React version keeps a list of timers.
 */
export class WaitStep extends Command.Service<WaitStep>()('rhythm/WaitStep', {
  args: { index: Schema.Number, millis: Schema.Number, last: Schema.Boolean },
  success: RhythmMessage,
  mode: 'switch',
}) {
  static readonly layer = this.toLayer(({ index, millis, last }) =>
    Effect.sleep(Duration.millis(millis)).pipe(
      Effect.as(last ? RhythmMessage.Finished() : RhythmMessage.ReachedStep({ index: index + 1 })),
    ),
  )
}

const stepMillis = (rhythm: string, bpm: number) => parseRhythm(rhythm).map((e) => (beatsOf(e) * 60_000) / bpm)

const RhythmDef = Html.component({ name: 'Rhythm', props: RhythmProps, model: RhythmModel, message: RhythmMessage })

export const RhythmNoDeps = RhythmDef.make({
  init: () => ({ current: null }),
  update: ($, message) => {
    const steps = stepMillis($.props.rhythm, $.props.bpm)
    const wait = (index: number) => WaitStep.make({ index, millis: steps[index], last: index === steps.length - 1 })
    return RhythmMessage.match(message, {
      // Nothing to play, or no usable tempo: Play does nothing rather than wait forever.
      ClickedPlay: () => (steps.length === 0 || !($.props.bpm > 0) ? $.model : $.set({ current: 0 }).run(wait(0))),
      ClickedStop: () => $.set({ current: null }).run(Command.interrupt(WaitStep)),
      ReachedStep: ({ index }) => $.set({ current: index }).run(wait(index)),
      Finished: () => $.set({ current: null }),
    })
  },
  view: (h, model) => {
    const { rhythm, bpm, beats } = h.props
    const events = parseRhythm(rhythm)
    const starts: number[] = []
    events.reduce((t, e) => (starts.push(t), t + beatsOf(e)), 0)
    const playing = model.current !== null
    return h.figure.class('rhythm').children(
      h.div.class('figbar').children(
        h.button
          .on('click', playing ? RhythmMessage.ClickedStop() : RhythmMessage.ClickedPlay())
          .attr('aria-label', playing ? 'Stop' : 'Play')
          .children(playing ? 'Stop' : 'Play'),
        h.span.class('lab').children(`${bpm} bpm`),
      ),
      h.ol.class('notes').children(
        events.map((e, i) =>
          h.li
            .key(String(i))
            .class(model.current === i ? 'ev now' : 'ev')
            .attr('aria-current', model.current === i ? 'step' : 'false')
            .children(e.rest ? `(${countAt(starts[i], beats)})` : countAt(starts[i], beats)),
        ),
      ),
    )
  },
})

export const Rhythm = RhythmNoDeps.pipe(Component.provide(WaitStep.layer))
