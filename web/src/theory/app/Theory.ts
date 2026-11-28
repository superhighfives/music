import { Command, Component, Mount, Subscription, UiSchema } from '@effect/ui'
import { Html } from '@effect/ui/html'
import { Effect, Queue, Schema, Stream } from 'effect'
import { render } from '~/content/render'
import { OpenSignIn } from '~/islands/auth'
import { ToggleTheme } from '~/islands/theme'
import { SiteFooter, mastheadIslands } from '~/islands/views'
import { EMPTY, parseSaved, type Saved } from '~/theory/lib/saved'
import type { EmailStatus, PreviewResult } from '~/theory/email/api'
import { Figure, PlayNotes } from './Figure'
import { ChapterPage, chapterSections, HomePage, Masthead, NotFoundPage, routeOf } from './pages'

export const TheoryProps = Schema.Struct({
  /** The page's path, such as /theory/keyboard. */
  path: Schema.String,
  userId: Schema.NullOr(Schema.String),
  /** Days since 1970 on the server, UTC, so today's card matches on the server and in the browser. */
  day: Schema.Number,
})
export type TheoryProps = typeof TheoryProps.Type

const True = Schema.Record(Schema.String, Schema.Literal(true))
const SavedSchema = Schema.Struct({ read: True, checks: True, last: Schema.NullOr(Schema.String) })

const EmailStatusSchema = Schema.Union([
  Schema.Struct({ signedIn: Schema.Literal(false) }),
  Schema.Struct({ signedIn: Schema.Literal(true), subscribed: Schema.Boolean, email: Schema.NullOr(Schema.String) }),
])

export const TheoryModel = Schema.Struct({
  saved: SavedSchema,
  /** False until this browser's storage has been read; the server renders an unread book. */
  storageReady: Schema.Boolean,
  /** The open chapter's section being read, for its contents. */
  active: Schema.NullOr(Schema.String),
  email: Schema.Struct({ status: Schema.NullOr(EmailStatusSchema), busy: Schema.Boolean, note: Schema.NullOr(Schema.String) }),
})
export type TheoryModel = typeof TheoryModel.Type

export const TheoryMessage = UiSchema.TaggedEnum({
  /** From a plain Keyboard or Staff in a chapter's text. */
  Play: { notes: Schema.Array(Schema.Number), strum: Schema.Boolean },
  ToggledRead: { chapterId: Schema.String },
  PassedCheck: { chapterId: Schema.String },
  ClickedThemeToggle: {},
  ClickedSignIn: {},
  CompletedReadStorage: { saved: Schema.NullOr(SavedSchema) },
  ReceivedAccount: { saved: SavedSchema },
  ScrolledTo: { id: Schema.NullOr(Schema.String) },
  ChangedUser: { userId: Schema.NullOr(Schema.String) },
  ClickedDailyEmail: { on: Schema.Boolean },
  ClickedPreview: {},
  GotEmailStatus: { status: EmailStatusSchema },
  FinishedEmail: { note: Schema.NullOr(Schema.String) },
})
export type TheoryMessage = typeof TheoryMessage.Type

const isMessage = Schema.is(TheoryMessage)

const KEY = 'theory.v1'

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
      // Bad JSON in storage: start unread.
    }
    return TheoryMessage.CompletedReadStorage({ saved })
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

const request = <T>(path: string, init: RequestInit | undefined, check: (u: unknown) => u is T) =>
  Effect.tryPromise(async () => {
    const r = await fetch(path, init)
    if (!r.ok) throw new Error(`${path}: ${r.status}`)
    const body: unknown = await r.json()
    if (!check(body)) throw new Error(`${path}: unexpected response`)
    return body
  })

const isStatus = Schema.is(EmailStatusSchema)
const isPreview = Schema.is(Schema.Union([Schema.Struct({ title: Schema.NullOr(Schema.String) }), Schema.Struct({ waitMinutes: Schema.Number })]))
const post = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

const LoadEmail = Command.make('LoadEmail', {}, () =>
  request<EmailStatus>('/api/theory/email', undefined, isStatus).pipe(
    Effect.map((status) => TheoryMessage.GotEmailStatus({ status })),
    Effect.catch(() => Effect.succeed(TheoryMessage.FinishedEmail({ note: "Couldn't check your email setting. Try reloading." }))),
  ),
)

const SetEmail = Command.make('SetEmail', { args: { on: Schema.Boolean } }, ({ on }) =>
  request<EmailStatus>('/api/theory/email', post({ on }), isStatus).pipe(
    Effect.map((status) => TheoryMessage.GotEmailStatus({ status })),
    Effect.catch(() => Effect.succeed(TheoryMessage.FinishedEmail({ note: "That didn't save. Try again in a moment." }))),
  ),
)

const previewNote = (result: PreviewResult) =>
  'waitMinutes' in result
    ? `You just sent one. Try again in ${result.waitMinutes} ${result.waitMinutes === 1 ? 'minute' : 'minutes'}.`
    : result.title
      ? `Sent “${result.title}”. It doesn't count as today's.`
      : 'Nothing to send yet.'

const SendPreview = Command.make('SendPreview', {}, () =>
  request<PreviewResult>('/api/theory/email/preview', post({}), isPreview).pipe(
    Effect.map((result) => TheoryMessage.FinishedEmail({ note: previewNote(result) })),
    Effect.catch(() => Effect.succeed(TheoryMessage.FinishedEmail({ note: "Couldn't send it. The email service may not be set up yet." }))),
  ),
)

/** The section being read: the last one whose top has scrolled past a third of the window. */
const scrolling = (ids: string[]) =>
  Stream.callback<TheoryMessage>(
    Effect.fnUntraced(function* (queue) {
      let last: string | null | undefined
      const onScroll = () => {
        let id: string | null = null
        for (const s of ids) {
          const el = document.getElementById(s)
          if (el && el.getBoundingClientRect().top < window.innerHeight / 3) id = s
        }
        if (id !== last) Queue.offerUnsafe(queue, TheoryMessage.ScrolledTo({ id }))
        last = id
      }
      yield* Effect.acquireRelease(
        Effect.sync(() => {
          onScroll()
          window.addEventListener('scroll', onScroll, { passive: true })
        }),
        () => Effect.sync(() => window.removeEventListener('scroll', onScroll)),
      )
    }),
  )

export const Theory = Html.component({ name: 'Theory', props: TheoryProps, model: TheoryModel, message: TheoryMessage }).make({
  init: ($) => $.set({ saved: EMPTY, storageReady: false, active: null, email: { status: null, busy: false, note: null } }).run(ReadStorage.make({})),
  update: ($, message) => {
    const save = (saved: Saved) => $.set({ ...$.model, saved, storageReady: true }).run(StoreSaved.make({ saved }))
    const { saved, email } = $.model
    return TheoryMessage.match(message, {
      Play: ({ notes, strum }) => $.set($.model).run(PlayNotes.make({ notes, strum })),
      ToggledRead: ({ chapterId }) => {
        const read = { ...saved.read }
        if (read[chapterId]) delete read[chapterId]
        else read[chapterId] = true
        return save({ ...saved, read })
      },
      // Getting a check right through also counts the chapter as read.
      PassedCheck: ({ chapterId }) =>
        saved.checks[chapterId] ? $.model : save({ ...saved, checks: { ...saved.checks, [chapterId]: true }, read: { ...saved.read, [chapterId]: true } }),
      ClickedThemeToggle: () => $.set($.model).run(ToggleTheme.make({})),
      ClickedSignIn: () => $.set($.model).run(OpenSignIn.make({})),
      CompletedReadStorage: ({ saved: stored }) => {
        // A chapter page is where you were, for Continue on the book's home.
        const route = routeOf($.props.path)
        const base = stored ?? EMPTY
        return save(route._tag === 'Chapter' ? { ...base, last: route.chapter.id } : base)
      },
      ReceivedAccount: ({ saved: merged }) => save(merged),
      ScrolledTo: ({ id }) => ({ ...$.model, active: id }),
      ChangedUser: ({ userId }) =>
        userId === null
          ? { ...$.model, email: { status: { signedIn: false } as const, busy: false, note: null } }
          : $.set({ ...$.model, email: { ...email, status: null } }).run(LoadEmail.make({})),
      ClickedDailyEmail: ({ on }) => $.set({ ...$.model, email: { ...email, busy: true, note: null } }).run(SetEmail.make({ on })),
      ClickedPreview: () => $.set({ ...$.model, email: { ...email, busy: true } }).run(SendPreview.make({})),
      GotEmailStatus: ({ status }) => ({ ...$.model, email: { status, busy: false, note: null } }),
      FinishedEmail: ({ note }) => ({ ...$.model, email: { ...email, busy: false, note } }),
    })
  },
  subscriptions: ({ props }) => {
    const route = routeOf(props.path)
    return [
      Subscription.make('user', props.userId ?? '', () => Stream.make(TheoryMessage.ChangedUser({ userId: props.userId }))),
      route._tag === 'Chapter' &&
        Subscription.make('sections', route.chapter.id, () => scrolling(chapterSections(route.chapter).map((s) => s.id))),
    ]
  },
  view: (h, model) => {
    const { saved, storageReady: ready, email } = model
    const route = routeOf(h.props.path)
    const page =
      route._tag === 'Home'
        ? HomePage({ saved, ready, day: h.props.day })
        : route._tag === 'Chapter'
          ? ChapterPage({ chapter: route.chapter, active: model.active, saved, ready })
          : NotFoundPage()
    const status = email.status
    const islands = {
      Figure: (_: unknown, props: Readonly<Record<string, unknown>>, index: number) =>
        Figure(h, {
          key: `${String(props.name)}-${index}`,
          props: { name: String(props.name), args: props.args },
          onEmit: {
            Emitted: ({ event }) => (event === 'passed' && route._tag === 'Chapter' ? TheoryMessage.PassedCheck({ chapterId: route.chapter.id }) : undefined),
          },
        }),
      ...mastheadIslands(h, { userId: h.props.userId, theme: TheoryMessage.ClickedThemeToggle(), signIn: TheoryMessage.ClickedSignIn() }),
      ReadButton: (_: unknown, props: Readonly<Record<string, unknown>>) => {
        const chapterId = String(props.chapterId)
        const read = !!saved.read[chapterId]
        return h.button
          .attr('type', 'button')
          .class(read ? 'btn isdone' : 'btn primary')
          .on('click', TheoryMessage.ToggledRead({ chapterId }))
          .children(read ? '✓ Read' : 'Mark chapter read')
      },
      DailyEmail: () =>
        h.section.class('daily').attr('aria-labelledby', 'daily-h').children(
          h.h2.attr('id', 'daily-h').class('lab').children('Daily email'),
          h.p.children(
            "One idea from the book each morning, in reading order: a concept, a pattern or a tip, with a link back to its chapter. New chapters join the queue as they're written.",
          ),
          !status
            ? h.p.class('dim').children('…')
            : !status.signedIn
              ? h.p.class('dim').children('Sign in (top right) to get it. Your progress follows you to other devices too.')
              : status.subscribed
                ? h.div.children(
                    h.p.children('On, to ', h.b.children(status.email ?? ''), '.'),
                    h.div.class('row').children(
                      h.button.attr('type', 'button').class('btn').disabled(email.busy).on('click', TheoryMessage.ClickedDailyEmail({ on: false })).children('Turn off'),
                      h.button.attr('type', 'button').class('btn').disabled(email.busy).on('click', TheoryMessage.ClickedPreview()).children('Send one now'),
                    ),
                  )
                : h.div.children(
                    h.button
                      .attr('type', 'button')
                      .class('btn primary')
                      .disabled(email.busy || !status.email)
                      .on('click', TheoryMessage.ClickedDailyEmail({ on: true }))
                      .children('Send me one a day'),
                    h.p.class('dim small').children(status.email ? `To ${status.email}.` : 'Your account needs an email address.'),
                  ),
          email.note ? h.p.class('small').attr('role', 'status').children(email.note) : false,
        ),
    }
    return h.div.class('page').attr('data-section', 'theory').children(
      ...render(h, Masthead({ saved, ready }), islands, isMessage),
      ...render(h, page, islands, isMessage),
      SiteFooter(h, { current: 'theory' }),
    )
  },
})
