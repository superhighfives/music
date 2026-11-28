import { Subscription } from '@effect/ui'
import { Html, HtmlSubscription } from '@effect/ui/html'
import { Schema } from 'effect'
import { BUTTON } from '../lib/move'
import { mod } from '../lib/music'
import { HIT_MS, eventAllowedPcs, judge, summarize } from '../lib/practice'
import { tutorialById, type Tutorial } from '../lib/tutorials'
import {
  ConnectMove,
  JoinAccount,
  PlayNotes,
  ReadPracticeClock,
  ReadStorage,
  RefreshAccount,
  ReplaceUrl,
  SaveToAccount,
  ScheduleClicks,
  SetSustain,
  StartNote,
  StopNote,
  StoreSheets,
  StoreSidebar,
  WaitToRetry,
  signedInUser,
  every,
  moveMessages,
  piano,
} from './effects'
import { ChordsMessage } from './messages'
import {
  ChordsModel,
  SIDEBAR_DEFAULT,
  Search,
  clampSidebar,
  derive,
  initialPractice,
  practiceView,
  searchQuery,
  tutorialView,
} from './state'
import { ChordsView } from './view'

export const ChordsProps = Schema.Struct({
  /** The view the URL asks for. */
  initialSearch: Search,
  /** The page's signed-in user, kept current once Clerk has loaded. */
  userId: Schema.NullOr(Schema.String),
})
export type ChordsProps = typeof ChordsProps.Type

/** Seconds between pressing Start and the first count-in click, so the first click is never late. */
const LEAD = 0.15
/** How far ahead clicks are scheduled on the audio clock, in seconds. */
const LOOKAHEAD = 0.2

// The update is a reducer: each message gives the next Model and the Commands to run.
type Commands = Array<
  | ReturnType<typeof PlayNotes.make>
  | ReturnType<typeof StartNote.make>
  | ReturnType<typeof StopNote.make>
  | ReturnType<typeof SetSustain.make>
  | ReturnType<typeof ConnectMove.make>
  | ReturnType<typeof ReplaceUrl.make>
  | ReturnType<typeof StoreSheets.make>
  | ReturnType<typeof StoreSidebar.make>
  | ReturnType<typeof ReadPracticeClock.make>
  | ReturnType<typeof ScheduleClicks.make>
  | ReturnType<typeof JoinAccount.make>
  | ReturnType<typeof SaveToAccount.make>
  | ReturnType<typeof RefreshAccount.make>
  | ReturnType<typeof WaitToRetry.make>
  | ReturnType<typeof ReadStorage.make>
>
type Next = { model: ChordsModel; run: Commands }
const done = (model: ChordsModel, ...run: Commands): Next => ({ model, run })

/** A new search from a control or a step. A tutorial decides the key, scale, layout and chord, as a shared link would. */
const setSearch = (model: ChordsModel, patch: Partial<Search>): ChordsModel => ({
  ...model,
  search: tutorialView({ ...model.search, v: 0, ...patch }),
})

const goTo = (model: ChordsModel, t: Tutorial, i: number): ChordsModel =>
  setSearch({ ...model, completed: null, freePlayStarted: false }, { t: t.id, s: i, all: false, song: null, p: 0, x: null })

const goToSong = (model: ChordsModel, id: string, p: number): ChordsModel =>
  setSearch({ ...model, completed: null }, { song: id, p, t: null, s: 0, all: false, x: null })

/** A new exercise stops the run and starts the speed over at its tempo. */
const goToExercise = (model: ChordsModel, id: string | null): ChordsModel =>
  setSearch({ ...model, practice: { ...initialPractice, mode: model.practice.mode, loop: model.practice.loop } }, { x: id, t: null, s: 0, song: null, p: 0 })

const exitTutorial = (model: ChordsModel) => setSearch({ ...model, completed: null }, { t: null, s: 0 })

function nextStep(model: ChordsModel): ChordsModel {
  const d = derive(model)
  if (!d.tutorial) return model
  if (!d.freePlay) return goTo(model, d.tutorial, d.stepIndex + 1)
  return d.nextTutorial ? goTo(model, d.nextTutorial, 0) : exitTutorial(model)
}

function startPractice(model: ChordsModel, clocks: { now: number; audioNow: number; latency: number }): ChordsModel {
  const { exercise, countIn, msPerBeat } = practiceView(model)
  if (!exercise) return model
  return {
    ...model,
    practice: {
      ...model.practice,
      running: true,
      beat: -countIn,
      audioZero: clocks.audioNow + LEAD + (countIn * msPerBeat) / 1000,
      zero: clocks.now + (LEAD + clocks.latency) * 1000 + countIn * msPerBeat,
      nextClick: -countIn,
      presses: [],
    },
  }
}

/** Stops early. A part-played run has no results to keep. */
const stopPractice = (model: ChordsModel): ChordsModel => ({ ...model, practice: { ...model.practice, running: false, presses: [] } })

/** A pad press at `time` on the performance.now() clock. */
function pressPractice(model: ChordsModel, midi: number, time: number): ChordsModel {
  const { exercise, msPerBeat } = practiceView(model)
  const p = model.practice
  if (!p.running || !exercise) return model
  let zero = p.zero
  let ms = time - zero
  if (p.mode === 'wait' && ms >= 0) {
    // Wait mode does not grade timing: a right note before the playhead gets there moves the playhead to it.
    const { results } = judge(exercise.events, [...p.presses], msPerBeat, ms)
    const next = exercise.events.find((_, i) => results[i].judgment === 'pending')
    if (next && eventAllowedPcs(next).includes(mod(midi, 12)) && ms < next.beat * msPerBeat - HIT_MS) {
      zero = time - next.beat * msPerBeat
      ms = next.beat * msPerBeat
    }
  }
  return { ...model, practice: { ...p, zero, presses: [...p.presses, { ms, midi }] } }
}

/** One frame: moves the playhead, holds it in wait mode, schedules clicks and ends the run. */
function tickPractice(model: ChordsModel, now: number, audioNow: number): Next {
  const { exercise, msPerBeat } = practiceView(model)
  const p = model.practice
  if (!p.running || !exercise) return done(model)
  let { zero, audioZero, nextClick, presses } = p
  let beat = (now - zero) / msPerBeat
  const clicks: Array<{ at: number; accent: boolean }> = []
  if (p.mode === 'wait') {
    const { results } = judge(exercise.events, [...presses], msPerBeat, beat * msPerBeat)
    const waiting = exercise.events.find((e, i) => results[i].judgment === 'pending' && beat > e.beat)
    if (waiting) {
      // Hold the playhead on the event: move beat 0 so that now is the event's beat.
      zero = now - waiting.beat * msPerBeat
      beat = waiting.beat
    }
  } else {
    const secPerBeat = msPerBeat / 1000
    while (audioZero + nextClick * secPerBeat < audioNow + LOOKAHEAD) {
      const at = audioZero + nextClick * secPerBeat
      if (at >= audioNow) clicks.push({ at, accent: mod(nextClick, exercise.beatsPerBar) === 0 })
      nextClick++
    }
  }
  let next: ChordsModel['practice'] = { ...p, beat, zero, audioZero, nextClick }
  if (beat >= exercise.beats) {
    const { results, wrong } = judge(exercise.events, [...presses], msPerBeat, Infinity)
    const lastRun = summarize(results, wrong)
    next = p.loop
      ? // Loop: the next run starts on the next beat, with no count-in. The click carries on.
        {
          ...next,
          lastRun,
          zero: zero + exercise.beats * msPerBeat,
          audioZero: audioZero + (exercise.beats * msPerBeat) / 1000,
          nextClick: nextClick - exercise.beats,
          presses: (presses = []),
        }
      : // The strip keeps the run's results until the next start.
        { ...next, lastRun, running: false }
  }
  const run: Commands = clicks.length ? [ScheduleClicks.make({ clicks })] : []
  return done({ ...model, practice: next }, ...run)
}

const joined = (model: ChordsModel) => model.account.userId !== null && model.account.joinedFor === model.account.userId

function handle(model: ChordsModel, message: ChordsMessage): Next {
  const d = derive(model)
  return ChordsMessage.match(message, {
    PickedView: ({ patch }) => done(setSearch(model, patch)),
    ClickedTutorial: ({ id, step }) => {
      const t = tutorialById(id)
      return done(t ? goTo(model, t, Math.max(0, step)) : model)
    },
    ClickedNextStep: () => done(nextStep(model)),
    ClickedExitTutorial: () => done(exitTutorial(model)),
    ClickedSong: ({ id, pos }) => done(goToSong(model, id, Math.max(0, pos))),
    ClickedExitSong: () => done(setSearch(model, { song: null, p: 0 })),
    ClickedDeleteSong: ({ id }) => done({ ...model, sheets: model.sheets.filter((s) => s.id !== id) }),
    ClickedExercise: ({ id }) => done(goToExercise(model, id)),
    SelectedTab: ({ tab }) => done({ ...model, tab }),
    ClickedBrowse: () => done(setSearch({ ...model, browsing: true, tab: 'play' }, { t: null, s: 0, song: null, p: 0, x: null })),
    ClickedConnect: () => done(model, ConnectMove.make({})),
    ToggledSustain: () => done({ ...model, sustainLatched: !model.sustainLatched }),
    ClickedPlayChord: () => done(model, ...(d.voicing ? [PlayNotes.make({ notes: d.voicing.pads.map((p) => p.midi), strum: true })] : [])),
    ClickedPad: ({ midi }) => done(model, PlayNotes.make({ notes: [midi], strum: false })),
    GrabbedSidebar: ({ x }) => done({ ...model, sidebarGrab: x }),
    DraggedSidebar: ({ x }) =>
      done(model.sidebarGrab === null ? model : { ...model, sidebarWidth: clampSidebar(model.sidebarWidth + x - model.sidebarGrab) }),
    ReleasedSidebar: () => done({ ...model, sidebarGrab: null }, StoreSidebar.make({ width: model.sidebarWidth })),
    PressedSidebarKey: ({ key }) => {
      const width = clampSidebar(model.sidebarWidth + (key === 'ArrowLeft' ? -16 : 16))
      return done({ ...model, sidebarWidth: width }, StoreSidebar.make({ width }))
    },
    DoubleClickedSidebar: () => done({ ...model, sidebarWidth: SIDEBAR_DEFAULT }, StoreSidebar.make({ width: SIDEBAR_DEFAULT })),
    CompletedReadStorage: ({ sheets, sidebar, imported }) => {
      // The same text imported again keeps its first id.
      const existing = imported && sheets.find((s) => s.text === imported.text)
      const all = imported && !existing ? [...sheets, imported] : sheets
      const loaded = { ...model, sheets: all, sidebarWidth: sidebar, storageReady: true }
      const next = imported ? goToSong({ ...loaded, tab: 'songs' }, existing?.id ?? imported.id, 0) : loaded
      const { userId } = model.account
      return userId !== null && !joined(model) ? done(next, JoinAccount.make({ userId, local: all })) : done(next)
    },

    ChangedMoveStatus: ({ status }) =>
      // Reconnecting starts over: nothing is held on a fresh connection.
      done({ ...model, moveStatus: status, held: status === 'connected' || status === 'not-found' ? [] : model.held }),
    PressedPad: ({ col, row, velocity, time }) => {
      const key = `${col}-${row}`
      const midi = d.grid[row][col].midi
      const pressed = pressPractice(model, midi, time)
      return done(
        {
          ...pressed,
          held: model.held.includes(key) ? model.held : [...model.held, key],
          ringing: model.ringing.filter((k) => k !== key),
          freePlayStarted: model.freePlayStarted || d.freePlay,
        },
        StartNote.make({ id: `pad-${key}`, midi, velocity }),
      )
    },
    ReleasedPad: ({ col, row }) => {
      const key = `${col}-${row}`
      return done(
        { ...model, held: model.held.filter((k) => k !== key), ringing: d.sustain && !model.ringing.includes(key) ? [...model.ringing, key] : model.ringing },
        StopNote.make({ id: `pad-${key}` }),
      )
    },
    // Move's arrows step through a tutorial or song, so you can keep your hands on the device.
    PressedButton: ({ cc }) => {
      if (cc === BUTTON.shift) return done({ ...model, pedal: true })
      if (d.exercise) {
        if (cc !== BUTTON.play) return done(model)
        return model.practice.running ? done(stopPractice(model)) : done(model, ReadPracticeClock.make({}))
      }
      if (d.song) {
        if (cc === BUTTON.right) return done(goToSong(model, d.song.id, d.songPos < d.events.length ? d.songPos + 1 : 0))
        if (cc === BUTTON.left && d.songPos > 0) return done(goToSong(model, d.song.id, d.songPos - 1))
        return done(model)
      }
      if (!d.tutorial) return done(model)
      if (cc === BUTTON.right) return done(nextStep(model))
      if (cc === BUTTON.left && d.stepIndex > 0) return done(goTo(model, d.tutorial, d.stepIndex - 1))
      return done(model)
    },
    ReleasedButton: ({ cc }) => done(cc === BUTTON.shift ? { ...model, pedal: false } : model),
    TickedCue: () => done({ ...model, frame: model.frame + 1 }),

    ClickedStartPractice: () => done(model, ReadPracticeClock.make({})),
    ClickedStopPractice: () => done(stopPractice(model)),
    PickedPracticeMode: ({ mode }) => done({ ...model, practice: { ...model.practice, mode } }),
    PickedPracticeSpeed: ({ speed }) => done({ ...model, practice: { ...model.practice, speed } }),
    ToggledPracticeLoop: () => done({ ...model, practice: { ...model.practice, loop: !model.practice.loop } }),
    CompletedReadPracticeClock: (clocks) => done(startPractice(model, clocks)),
    TickedPractice: ({ now, audioNow }) => tickPractice(model, now, audioNow),

    ChangedUser: ({ userId }) => {
      // Signing out keeps what's in this browser, and the next sign-in merges again.
      const account = userId === null ? { userId, joinedFor: null, lastSaved: null, failures: 0 } : { ...model.account, userId }
      const next = { ...model, account }
      // The merge waits for this browser's songs, so it never merges an empty list over them.
      return userId !== null && account.joinedFor !== userId && model.storageReady
        ? done(next, JoinAccount.make({ userId, local: model.sheets }))
        : done(next)
    },
    SucceededJoinAccount: ({ userId, merged }) =>
      done(model.account.userId !== userId ? model : { ...model, sheets: merged, account: { ...model.account, joinedFor: userId, lastSaved: null, failures: 0 } }),
    SucceededSaveAccount: ({ json }) => done({ ...model, account: { ...model.account, lastSaved: json, failures: 0 } }),
    // Another device saved first: apply the merge, and save that.
    ConflictedSaveAccount: ({ merged }) => done({ ...model, sheets: merged, account: { ...model.account, lastSaved: null, failures: 0 } }),
    FailedAccount: () => {
      const failures = model.account.failures + 1
      return done({ ...model, account: { ...model.account, failures } }, WaitToRetry.make({ failures }))
    },
    RetriedAccount: () => {
      const { userId } = model.account
      if (userId === null) return done(model)
      if (!model.storageReady) return done(model)
      if (!joined(model)) return done(model, JoinAccount.make({ userId, local: model.sheets }))
      return JSON.stringify(model.sheets) === model.account.lastSaved ? done(model) : done(model, SaveToAccount.make({ sheets: model.sheets }))
    },
    // Back in view with nothing waiting to save: take what other devices saved.
    ChangedVisibility: ({ visible }) =>
      visible && joined(model) && JSON.stringify(model.sheets) === model.account.lastSaved ? done(model, RefreshAccount.make({})) : done(model),
    RefreshedAccount: ({ sheets }) =>
      done(sheets === null ? model : { ...model, sheets, account: { ...model.account, lastSaved: JSON.stringify(sheets) } }),
  })
}

/**
 * Runs after every message, as the React version's effects did after every render: moves a tutorial or song
 * on once the chord is played and every pad is let go, and keeps the piano, the URL and storage in step.
 */
function settle(before: ChordsModel, next: Next): Next {
  let model = next.model
  const run = [...next.run]
  // Play the chord, then let go of every pad to move on. Waiting for the release means the chord rings as
  // long as you hold it, and a held chord can never count for the next one.
  const d = derive(model)
  if (d.stepKey !== null) {
    if (model.completed !== d.stepKey) {
      if (d.match === 'complete') model = { ...model, completed: d.stepKey }
    } else if (model.held.length === 0) {
      if (d.song) model = goToSong(model, d.song.id, d.songPos + 1)
      else if (d.tutorial) model = goTo(model, d.tutorial, d.stepIndex + 1)
    }
  }
  const sustainBefore = before.sustainLatched || before.pedal
  const sustainNow = model.sustainLatched || model.pedal
  if (sustainNow !== sustainBefore) {
    run.push(SetSustain.make({ on: sustainNow }))
    if (!sustainNow) model = { ...model, ringing: [] }
  }
  const query = searchQuery(model.search)
  if (query !== searchQuery(before.search)) run.push(ReplaceUrl.make({ query }))
  if (model.sheets !== before.sheets) run.push(StoreSheets.make({ sheets: model.sheets }))
  // Signed in, the songs also live in the account, so they follow you to other devices.
  const changed = model.sheets !== before.sheets || (model.account.lastSaved === null && before.account.lastSaved !== null) || model.account.joinedFor !== before.account.joinedFor
  if (changed && joined(model) && JSON.stringify(model.sheets) !== model.account.lastSaved) {
    run.push(SaveToAccount.make({ sheets: model.sheets }))
  }
  return { model, run }
}

/** The Model a page opens with, from what the route read. */
export const initialModel = (props: ChordsProps): ChordsModel => ({
  search: tutorialView(props.initialSearch),
  tab: 'learn',
  browsing: false,
  sidebarWidth: SIDEBAR_DEFAULT,
  sidebarGrab: null,
  sustainLatched: false,
  pedal: false,
  moveStatus: 'idle',
  held: [],
  ringing: [],
  completed: null,
  freePlayStarted: false,
  frame: 0,
  sheets: [],
  storageReady: false,
  practice: initialPractice,
  account: { userId: null, joinedFor: null, lastSaved: null, failures: 0 },
})

/** One message: the next Model and the Commands to run. Pure, so tests can drive it without a browser. */
export const reduce = (model: ChordsModel, message: ChordsMessage): Next => settle(model, handle(model, message))

export const Chords = Html.component({ name: 'Chords', props: ChordsProps, model: ChordsModel, message: ChordsMessage }).make({
  init: ($) => $.set(initialModel($.props)).run(ReadStorage.make({})),
  update: ($, message) => {
    const next = reduce($.model, message)
    return $.set(next.model).run(...next.run)
  },
  subscriptions: ({ model, props }) => {
    const d = derive(model)
    return [
      Subscription.make('move', 'move', () => moveMessages),
      d.cue && Subscription.make('cue', 'cue', () => every(150, ChordsMessage.TickedCue())),
      model.practice.running &&
        HtmlSubscription.onAnimationFrame(() => ChordsMessage.TickedPractice({ now: performance.now(), audioNow: piano.clock().now })),
      Subscription.make('user', 'clerk', () => signedInUser),
      joined(model) && HtmlSubscription.onVisibility((visible) => ChordsMessage.ChangedVisibility({ visible })),
    ]
  },
  view: (h, model) => ChordsView(h, model, derive(model)),
})
