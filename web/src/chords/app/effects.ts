import { Command, Component, Mount } from '@effect/ui'
import { Duration, Effect, Queue, Schema, Stream } from 'effect'
import { AccountSync, type SyncIO } from '../../account/account-sync'
import { createMove, type MoveEvent } from '../lib/move'
import { createPiano } from '../lib/piano'
import { mergeSheets, parseSheets } from '../lib/sheets'
import { parseSheet } from '../lib/songs'
import { ChordsMessage } from './messages'
import { SIDEBAR_DEFAULT, SIDEBAR_MAX, SIDEBAR_MIN, Sheet, withFades, type MoveView } from './state'

/*
 * The page's one piano and one Move connection. They hold browser resources (an AudioContext and a MIDI
 * port), so there is one of each per page, and Commands, Subscriptions and mounts reach them here.
 */
export const piano = createPiano()
export const move = createMove()

const SAVED_SONGS = 'movechords:songs'
const SIDEBAR_KEY = 'movechords:sidebar'

/** Pasted songs kept in this browser. Bad JSON in storage reads as no songs. */
function readSheets(): ReadonlyArray<Sheet> {
  try {
    return parseSheets(JSON.parse(localStorage.getItem(SAVED_SONGS) ?? '[]')) ?? []
  } catch {
    return []
  }
}

const noop = <A>(f: () => A) => Effect.sync(f).pipe(Effect.as(Component.noop))

/**
 * Reads what this browser keeps, once the page is running in it. The Ultimate Guitar bookmarklet opens
 * "/chords#import=<sheet>": the sheet comes along here, and the hash leaves the URL.
 */
export const ReadStorage = Command.make('ReadStorage', {}, () =>
  Effect.sync(() => {
    const saved = Number(localStorage.getItem(SIDEBAR_KEY))
    const hash = /^#import=(.*)$/s.exec(location.hash)?.[1]
    let imported: Sheet | null = null
    if (hash !== undefined) {
      history.replaceState(history.state, '', location.pathname + location.search)
      const text = decodeURIComponent(hash)
      imported = { id: `my-${Date.now().toString(36)}`, title: parseSheet(text).title, text }
    }
    return ChordsMessage.CompletedReadStorage({
      sheets: readSheets(),
      sidebar: saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX ? saved : SIDEBAR_DEFAULT,
      imported,
    })
  }),
)

export const PlayNotes = Command.make(
  'PlayNotes',
  { args: { notes: Schema.Array(Schema.Number), strum: Schema.Boolean } },
  ({ notes, strum }) => noop(() => piano.play(notes, strum)),
)

export const StartNote = Command.make(
  'StartNote',
  { args: { id: Schema.String, midi: Schema.Number, velocity: Schema.Number } },
  ({ id, midi, velocity }) => noop(() => piano.noteOn(id, midi, velocity)),
)

export const StopNote = Command.make('StopNote', { args: { id: Schema.String } }, ({ id }) => noop(() => piano.noteOff(id)))

export const SetSustain = Command.make('SetSustain', { args: { on: Schema.Boolean } }, ({ on }) => noop(() => piano.setSustain(on)))

export const ConnectMove = Command.make('ConnectMove', {}, () => noop(() => void move.connect()))

/** Keeps the URL in step with the view, without a history entry per change, as the React version did. */
export const ReplaceUrl = Command.make('ReplaceUrl', { args: { query: Schema.String } }, ({ query }) =>
  noop(() => history.replaceState(history.state, '', `${location.pathname}?${query}`)),
)

export const StoreSheets = Command.make('StoreSheets', { args: { sheets: Schema.Array(Sheet) } }, ({ sheets }) =>
  noop(() => localStorage.setItem(SAVED_SONGS, JSON.stringify(sheets))),
)

export const StoreSidebar = Command.make('StoreSidebar', { args: { width: Schema.Number } }, ({ width }) =>
  noop(() => localStorage.setItem(SIDEBAR_KEY, String(width))),
)

/** Reads both clocks at the moment Start is pressed. The first call starts the AudioContext, which needs a click. */
export const ReadPracticeClock = Command.make('ReadPracticeClock', {}, () =>
  Effect.sync(() => {
    const { now, latency } = piano.clock()
    return ChordsMessage.CompletedReadPracticeClock({ now: performance.now(), audioNow: now, latency })
  }),
)

export const ScheduleClicks = Command.make(
  'ScheduleClicks',
  { args: { clicks: Schema.Array(Schema.Struct({ at: Schema.Number, accent: Schema.Boolean })) } },
  ({ clicks }) => noop(() => clicks.forEach((c) => piano.click(c.at, c.accent))),
)

/** Move's events as messages, for as long as the page is open. Connects at once if MIDI is already allowed. */
export const moveMessages = Stream.callback<ChordsMessage>(
  Effect.fnUntraced(function* (queue) {
    const toMessage = (e: MoveEvent): ChordsMessage =>
      e._tag === 'Status'
        ? ChordsMessage.ChangedMoveStatus({ status: e.status })
        : e._tag === 'Pad'
          ? e.down
            ? ChordsMessage.PressedPad({ col: e.col, row: e.row, velocity: e.velocity, time: e.time })
            : ChordsMessage.ReleasedPad({ col: e.col, row: e.row })
          : e.down
            ? ChordsMessage.PressedButton({ cc: e.cc })
            : ChordsMessage.ReleasedButton({ cc: e.cc })
    yield* Effect.acquireRelease(
      Effect.sync(() => move.listen((e) => Queue.offerUnsafe(queue, toMessage(e)))),
      (unlisten) => Effect.sync(unlisten),
    )
    yield* Effect.sync(() => move.connectIfAllowed())
  }),
)

/** A message every `ms`, for as long as the Subscription runs. */
export const every = (ms: number, message: ChordsMessage) =>
  Stream.callback<ChordsMessage>(
    Effect.fnUntraced(function* (queue) {
      yield* Effect.acquireRelease(
        Effect.sync(() => setInterval(() => Queue.offerUnsafe(queue, message), ms)),
        (id) => Effect.sync(() => clearInterval(id)),
      )
    }),
  )

/*
 * The account's copy of the pasted songs. The client entry hands over the /api/saved calls, so this file
 * never makes requests itself and its tests need no network.
 */
let accountIO: SyncIO | null = null
let sync: AccountSync<ReadonlyArray<Sheet>> | null = null
export const setAccountIO = (io: SyncIO) => {
  accountIO = io
}

const failed = (what: string) => (e: unknown) =>
  Effect.sync(() => {
    console.warn(`Couldn't ${what} chords.songs in your account; trying again.`, e)
    return ChordsMessage.FailedAccount({ what })
  })

/** On sign-in: this browser's songs merged into the account's. */
export const JoinAccount = Command.make(
  'JoinAccount',
  { args: { userId: Schema.String, local: Schema.Array(Sheet) } },
  ({ userId, local }) =>
    Effect.tryPromise(() => {
      if (!accountIO) throw new Error('No account connection')
      const s = new AccountSync<ReadonlyArray<Sheet>>(accountIO, {
        parse: parseSheets,
        merge: (l, a) => mergeSheets([...l], [...a]),
      })
      return s.join(local).then((merged) => {
        sync = s
        return merged
      })
    }).pipe(
      Effect.map((merged) => ChordsMessage.SucceededJoinAccount({ userId, merged })),
      Effect.catch(failed('load')),
    ),
)

/** Waits a moment after a change before saving, so a quick run of changes saves once. A new save replaces a waiting one. */
export const SaveToAccount = Command.make(
  'SaveToAccount',
  { args: { sheets: Schema.Array(Sheet) }, mode: 'switch' },
  ({ sheets }) =>
    Effect.sleep(Duration.millis(400)).pipe(
      Effect.andThen(
        Effect.tryPromise(() => {
          if (!sync) throw new Error('Not joined')
          return sync.save(sheets)
        }),
      ),
      Effect.map((result) =>
        result.saved
          ? ChordsMessage.SucceededSaveAccount({ json: JSON.stringify(sheets) })
          : ChordsMessage.ConflictedSaveAccount({ merged: result.merged }),
      ),
      Effect.catch(failed('save')),
    ),
)

/** What other devices saved since this one last looked, or null. */
export const RefreshAccount = Command.make('RefreshAccount', {}, () =>
  Effect.tryPromise(() => sync?.refresh() ?? Promise.resolve(null)).pipe(
    Effect.map((sheets) => ChordsMessage.RefreshedAccount({ sheets })),
    Effect.catch((e) =>
      Effect.sync(() => {
        console.warn("Couldn't refresh chords.songs from your account.", e)
        return ChordsMessage.RefreshedAccount({ sheets: null })
      }),
    ),
  ),
)

/** After a failed load or save, try again after 2 s, then 4 s, 8 s and so on, up to a minute. */
export const WaitToRetry = Command.make('WaitToRetry', { args: { failures: Schema.Number }, mode: 'switch' }, ({ failures }) =>
  Effect.sleep(Duration.millis(Math.min(60_000, 2000 * 2 ** (failures - 1)))).pipe(Effect.as(ChordsMessage.RetriedAccount())),
)

export const MoveViewSchema = Schema.Struct({
  lights: Schema.Struct({
    notes: Schema.Array(Schema.Tuple([Schema.Number, Schema.Number])),
    ccs: Schema.Array(Schema.Tuple([Schema.Number, Schema.Number])),
  }),
  lit: Schema.Array(Schema.Number),
  chordId: Schema.String,
  cue: Schema.Boolean,
})

/**
 * Mirrors the view on Move. It sends only the lights that changed, picks fades from the change, and turns
 * every light off when the page closes, so Move is not left showing a stale chord.
 */
export const ShowOnMove = Mount.makeStream('ShowOnMove', { args: { view: MoveViewSchema } }, (_node: HTMLElement, { view }, changes) =>
  Stream.callback<never>(
    Effect.fnUntraced(function* () {
      let before: MoveView = view
      move.show(withFades(view, null))
      const off = () => move.off()
      yield* Effect.acquireRelease(
        Effect.sync(() => window.addEventListener('pagehide', off)),
        () => Effect.sync(() => (window.removeEventListener('pagehide', off), off())),
      )
      yield* Stream.runForEach(changes, ({ view: now }) =>
        Effect.sync(() => {
          move.show(withFades(now, before))
          before = now
        }),
      ).pipe(Effect.forkScoped)
    }),
  ),
)

/** Scrolls only the lyrics box, not the sidebar or the page, so the current line sits in its middle. */
export const CenterInBox = Mount.make('CenterInBox', {}, (node: HTMLElement) =>
  Effect.sync(() => {
    const box = node.parentElement
    box?.scrollTo({ top: node.offsetTop - box.clientHeight / 2 + node.clientHeight / 2, behavior: 'smooth' })
  }).pipe(Effect.as(Component.noop)),
)

/**
 * Bookmarklet for an Ultimate Guitar song page. It reads the chord sheet that the page already holds and
 * opens this app (its full URL, `home`) with it in the URL hash. As of November 2026 the sheet is in three places, tried in order:
 * 1. window.UGAPP.store, after the page's scripts start.
 * 2. The "js-store" element's JSON, before they start. The scripts then remove the element.
 * 3. The shown sheet in a <pre>, as plain chords above lyrics.
 * It runs in your own browser on a page you opened, so this app makes no requests to Ultimate Guitar.
 */
const ugBookmarklet = (home: string) =>
  'javascript:' +
  encodeURIComponent(`(() => {
  let data = window.UGAPP?.store?.page?.data
  if (!data?.tab_view) try { data = JSON.parse(document.querySelector('.js-store').dataset.content).store.page.data } catch {}
  let text = data?.tab_view?.wiki_tab?.content
  let title = data?.tab?.song_name
  let artist = data?.tab?.artist_name
  if (!text) {
    const pre = [...document.querySelectorAll('pre')].sort((a, b) => b.innerText.length - a.innerText.length)[0]
    text = pre?.innerText
    title = document.querySelector('h1')?.innerText.replace(/\\s+(chords|tab|ukulele)\\s*$/i, '')
  }
  if (!text) return alert('chords: no chord sheet on this page. Open a "Chords" page on Ultimate Guitar.')
  const head = (title ? '{title: ' + title + '}\\n' : '') + (artist ? '{artist: ' + artist + '}\\n' : '')
  window.open(${JSON.stringify(home)} + '#import=' + encodeURIComponent(head + text), '_blank')
})()`)

/** Sets the bookmarklet link in the browser only. A click on the page does nothing: it's for dragging to the bar. */
export const SetBookmarklet = Mount.make('SetBookmarklet', {}, (node: HTMLAnchorElement) =>
  Effect.sync(() => {
    node.setAttribute('href', ugBookmarklet(`${location.origin}/chords`))
    node.addEventListener('click', (e) => e.preventDefault())
  }).pipe(Effect.as(Component.noop)),
)

export { OpenSignIn, ShowUserButton, setAuthUI, type AuthUI } from '../../islands/auth'
