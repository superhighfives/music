import { Command, Component, Mount, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { Effect, Schema } from 'effect'
import { render } from '../../content/render'
import { OpenSignIn } from '../../islands/auth'
import { ToggleTheme } from '../../islands/theme'
import { SiteFooter, mastheadIslands } from '../../islands/views'
import { ArrangementView } from '../components/diagrams'
import { KeyBoxView } from '../content/kit'
import { DEFAULT_SETTINGS, FLAT, MODES, SHARP, derived, type ModeId } from '../lib/music'
import { parseSaved, type Saved } from '../lib/saved'
import { HomePage, Masthead, NotFoundPage, RecipePage, ThemePage, lessonOf, routeOf } from './pages'

export const ProductionProps = Schema.Struct({
  /** The page's path, such as /production/themes/sound/gain. */
  path: Schema.String,
  userId: Schema.NullOr(Schema.String),
})
export type ProductionProps = typeof ProductionProps.Type

const ModeIds = Schema.Literals(['minor', 'major', 'dorian', 'mixolydian', 'lydian', 'phrygian'] as const satisfies ReadonlyArray<ModeId>)

const SavedSchema = Schema.Struct({
  settings: Schema.Struct({ root: Schema.Number, mode: ModeIds, bpm: Schema.Number }),
  done: Schema.Record(Schema.String, Schema.Literal(true)),
  last: Schema.NullOr(Schema.String),
})

export const ProductionModel = Schema.Struct({
  saved: SavedSchema,
  /** False until this browser's storage has been read; the server renders the defaults. */
  storageReady: Schema.Boolean,
})
export type ProductionModel = typeof ProductionModel.Type

export const ProductionMessage = UiSchema.TaggedEnum({
  PickedKey: { root: Schema.Number },
  PickedMode: { mode: ModeIds },
  ChangedTempo: { bpm: Schema.Number },
  ToggledDone: { key: Schema.String },
  ClickedThemeToggle: {},
  ClickedSignIn: {},
  CompletedReadStorage: { saved: Schema.NullOr(SavedSchema) },
  /** The account's copy, merged with this browser's, from the account sync. */
  ReceivedAccount: { saved: SavedSchema },
})
export type ProductionMessage = typeof ProductionMessage.Type

const isMessage = Schema.is(ProductionMessage)

const KEY = 'production.v1'

/** Where saved changes go besides this browser: the account sync, which the client entry sets up. */
let reportSaved: (saved: Saved) => void = () => {}
export const setReportSaved = (f: (saved: Saved) => void) => {
  reportSaved = f
}

const ReadStorage = Command.make('ReadStorage', {}, () =>
  Effect.sync(() => {
    let saved: Saved | null = null
    try {
      saved = parseSaved(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
    } catch {
      // Bad JSON in storage: start with the defaults.
    }
    return ProductionMessage.CompletedReadStorage({ saved })
  }),
)

const StoreSaved = Command.make('StoreSaved', { args: { saved: SavedSchema } }, ({ saved }) =>
  Effect.sync(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // Private windows and blocked storage: progress just won't persist.
    }
    reportSaved(saved)
  }).pipe(Effect.as(Component.noop)),
)

const clampBpm = (v: number) => Math.min(200, Math.max(40, Math.round(v) || 70))

const initialSaved: Saved = { settings: DEFAULT_SETTINGS, done: {}, last: null }

export const Production = Html.component({ name: 'Production', props: ProductionProps, model: ProductionModel, message: ProductionMessage }).make({
  init: ($) => $.set({ saved: initialSaved, storageReady: false }).run(ReadStorage.make({})),
  update: ($, message) => {
    const save = (saved: Saved) => $.set({ saved, storageReady: true }).run(StoreSaved.make({ saved }))
    const settings = $.model.saved.settings
    return ProductionMessage.match(message, {
      PickedKey: ({ root }) => save({ ...$.model.saved, settings: { ...settings, root } }),
      PickedMode: ({ mode }) => save({ ...$.model.saved, settings: { ...settings, mode } }),
      ChangedTempo: ({ bpm }) => save({ ...$.model.saved, settings: { ...settings, bpm: clampBpm(bpm) } }),
      ToggledDone: ({ key }) => {
        const done = { ...$.model.saved.done }
        if (done[key]) delete done[key]
        else done[key] = true
        return save({ ...$.model.saved, done })
      },
      ClickedThemeToggle: () => $.set($.model).run(ToggleTheme.make({})),
      ClickedSignIn: () => $.set($.model).run(OpenSignIn.make({})),
      CompletedReadStorage: ({ saved }) => {
        // A lesson page is where you were, for Continue on the course home.
        const route = routeOf($.props.path)
        const key = route._tag === 'Theme' ? lessonOf(route.theme, route.lessonId).key : null
        const base = saved ?? initialSaved
        return save(key ? { ...base, last: key } : base)
      },
      ReceivedAccount: ({ saved }) => $.set({ saved, storageReady: true }).run(StoreSaved.make({ saved })),
    })
  },
  view: (h, model) => {
    const { settings, done, last } = model.saved
    const lesson = { values: derived(settings) }
    const route = routeOf(h.props.path)
    const page =
      route._tag === 'Home'
        ? HomePage({ done, last: model.storageReady ? last : null })
        : route._tag === 'Theme'
          ? ThemePage({ theme: route.theme, lessonId: route.lessonId, done, lesson })
          : route._tag === 'Recipe'
            ? RecipePage({ recipe: route.recipe, done, lesson })
            : NotFoundPage()
    const islands = {
      KeyBox: () => render(h, KeyBoxView({ settings }), {}, isMessage)[0] ?? '',
      Arrangement: () => render(h, ArrangementView({ settings }), {}, isMessage)[0] ?? '',
      Controls: () =>
        h.div.class('ctrls').children(
          h.label.class('ctrl').children(
            h.span.class('lab').children('Key'),
            h.select
              .value(String(settings.root))
              .on('change', ({ value }) => ProductionMessage.PickedKey({ root: Number(value) }))
              .children(SHARP.map((n, i) => h.option.key(n).attr('value', String(i)).children(n === FLAT[i] ? n : `${n}/${FLAT[i]}`))),
          ),
          h.label.class('ctrl').children(
            h.span.class('lab').children('Mode'),
            h.select
              .value(settings.mode)
              .on('change', ({ value }) => {
                const mode = MODES.find((m) => m.id === value)?.id
                return mode ? ProductionMessage.PickedMode({ mode }) : undefined
              })
              .children(MODES.map((m) => h.option.key(m.id).attr('value', m.id).children(m.label))),
          ),
          h.div.class('ctrl').children(
            h.label.class('lab').attr('for', 'bpm').children('Tempo'),
            h.div.class('stepper').children(
              h.button.attr('type', 'button').attr('aria-label', 'Slower').on('click', ProductionMessage.ChangedTempo({ bpm: settings.bpm - 1 })).children('−'),
              h.input
                .attr('id', 'bpm')
                .attr('type', 'number')
                .attr('min', '40')
                .attr('max', '200')
                .attr('inputmode', 'numeric')
                .value(String(settings.bpm))
                .on('change', ({ value }) => ProductionMessage.ChangedTempo({ bpm: Number(value) })),
              h.button.attr('type', 'button').attr('aria-label', 'Faster').on('click', ProductionMessage.ChangedTempo({ bpm: settings.bpm + 1 })).children('+'),
            ),
          ),
        ),
      ...mastheadIslands(h, { userId: h.props.userId, theme: ProductionMessage.ClickedThemeToggle(), signIn: ProductionMessage.ClickedSignIn() }),
      DoneButton: (_: unknown, props: Readonly<Record<string, unknown>>) => {
        const key = String(props.key)
        return h.button
          .attr('type', 'button')
          .class(done[key] ? 'btn isdone' : 'btn primary')
          .on('click', ProductionMessage.ToggledDone({ key }))
          .children(done[key] ? '✓ Done' : String(props.label))
      },
    }
    return h.div.class('page').attr('data-section', 'production').children(...render(h, Masthead(), islands, isMessage), ...render(h, page, islands, isMessage), SiteFooter(h, { current: 'production' }))
  },
})
