import { Schema } from 'effect'
import { BUTTON, BUTTON_DIM, COLOR, STEP_NOTE, padNote, type Lights } from '../lib/move'
import {
  CHORD_TYPES,
  LAYOUTS,
  NOTE_NAMES,
  SCALES,
  chordMatch,
  chordType,
  diatonicChords,
  mod,
  padGrid,
  scaleById,
  voicings,
  type Layout,
  type Pad,
  type Voicing,
} from '../lib/music'
import { EXERCISES, eventAllowedPcs, exerciseById, judge, type PracticeEvent } from '../lib/practice'
import { parseSheet, songById, songEvents, songKey, type Song, type SongChord } from '../lib/songs'
import { TUTORIALS, tutorialById } from '../lib/tutorials'

/** Everything the URL holds, so any view can be bookmarked or shared. Absent ids are null. */
export const Search = Schema.Struct({
  key: Schema.Number,
  scale: Schema.String,
  layout: Schema.Literals(['chromatic', 'in-key-4ths', 'in-key-octaves'] as const satisfies ReadonlyArray<Layout>),
  base: Schema.Number,
  root: Schema.Number,
  chord: Schema.String,
  v: Schema.Number,
  sevenths: Schema.Boolean,
  all: Schema.Boolean,
  /** Active tutorial id and step index. */
  t: Schema.NullOr(Schema.String),
  s: Schema.Number,
  /** Active song id and the index of the chord to play next. */
  song: Schema.NullOr(Schema.String),
  p: Schema.Number,
  /** Active practice exercise id. */
  x: Schema.NullOr(Schema.String),
})
export type Search = typeof Search.Type

const pc = (value: string | null, fallback: number) => {
  const n = Number(value ?? NaN)
  return Number.isInteger(n) && n >= 0 && n < 12 ? n : fallback
}
const count = (value: string | null) => Math.max(0, Number.parseInt(value ?? '0', 10) || 0)

/** Reads the search from a URL query, with the same defaults and checks as before the port. */
export function parseSearch(query: URLSearchParams): Search {
  const get = (k: string) => query.get(k)
  return {
    key: pc(get('key'), 0),
    scale: SCALES.some((x) => x.id === get('scale')) ? String(get('scale')) : 'major',
    layout: LAYOUTS.some((x) => x.id === get('layout')) ? (get('layout') as Layout) : 'chromatic',
    base: pc(get('base'), 9),
    root: pc(get('root'), pc(get('key'), 0)),
    chord: CHORD_TYPES.some((x) => x.id === get('chord')) ? String(get('chord')) : 'maj',
    v: count(get('v')),
    sevenths: get('sevenths') === 'true',
    all: get('all') === 'true',
    t: tutorialById(get('t') ?? undefined) ? get('t') : null,
    s: count(get('s')),
    // Pasted songs live in the browser's storage, so derive checks that the id exists.
    song: get('song') || null,
    p: count(get('p')),
    x: exerciseById(get('x') ?? undefined) ? get('x') : null,
  }
}

/** Writes the search as a URL query. Defaults stay in, so a shared link shows exactly this view. */
export function searchQuery(search: Search): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(search)) if (v !== null) q.set(k, String(v))
  return q.toString()
}

/** In a tutorial, the step decides the key, scale, layout and chord, so a shared link shows the same view. */
export function tutorialView(search: Search): Search {
  const tutorial = tutorialById(search.t ?? undefined)
  if (!tutorial) return search
  // Step index steps.length is free play, where the player picks the chords.
  // An info step shows the chord of the next chord step, so the screen never shows an old chord.
  const shown = tutorial.steps.slice(search.s).find((s) => s.kind === 'chord')
  const view = { ...search, key: tutorial.key, scale: tutorial.scale, layout: tutorial.layout }
  return shown?.kind === 'chord' && search.s < tutorial.steps.length ? { ...view, root: shown.root, chord: shown.chord } : view
}

export const Sheet = Schema.Struct({ id: Schema.String, title: Schema.String, text: Schema.String })
export type Sheet = typeof Sheet.Type

export const Tab = Schema.Literals(['learn', 'songs', 'practice', 'play'])
export type Tab = typeof Tab.Type
export const TABS: ReadonlyArray<{ id: Tab; name: string }> = [
  { id: 'learn', name: 'Learn' },
  { id: 'songs', name: 'Songs' },
  { id: 'practice', name: 'Practice' },
  { id: 'play', name: 'Play' },
]

export const MoveStatus = Schema.Literals(['idle', 'unsupported', 'connecting', 'connected', 'not-found', 'denied'])

export const PracticeMode = Schema.Literals(['play', 'wait'])
export type PracticeMode = typeof PracticeMode.Type

const RunSummary = Schema.Struct({
  accuracy: Schema.Number,
  perfect: Schema.Number,
  early: Schema.Number,
  late: Schema.Number,
  missed: Schema.Number,
  wrong: Schema.Number,
  bestStreak: Schema.Number,
})

/**
 * One exercise run against a clock. Beat 0 is the first beat after a one-bar count-in. `zero` is the
 * performance.now() time of beat 0, so MIDI time stamps, which use the same clock, give exact press times.
 * `audioZero` is beat 0 on the audio clock, for scheduling clicks.
 */
export const Practice = Schema.Struct({
  running: Schema.Boolean,
  mode: PracticeMode,
  speed: Schema.Number,
  loop: Schema.Boolean,
  /** The playhead in beats, updated every frame while running. */
  beat: Schema.Number,
  zero: Schema.Number,
  audioZero: Schema.Number,
  /** The next click to schedule, in beats from beat 0. */
  nextClick: Schema.Number,
  presses: Schema.Array(Schema.Struct({ ms: Schema.Number, midi: Schema.Number })),
  lastRun: Schema.NullOr(RunSummary),
})
export type Practice = typeof Practice.Type

/** What this browser has agreed with the signed-in account. */
export const Account = Schema.Struct({
  /** The user this browser is signed in as, from the page's Clerk session. */
  userId: Schema.NullOr(Schema.String),
  /** The user whose account the songs were merged with, so the merge runs once per sign-in. */
  joinedFor: Schema.NullOr(Schema.String),
  /** The JSON last saved to (or read from) the account, so unchanged songs aren't saved again. */
  lastSaved: Schema.NullOr(Schema.String),
  /** Failed loads or saves in a row, for the retry delay. */
  failures: Schema.Number,
})

export const ChordsModel = Schema.Struct({
  search: Search,
  tab: Tab,
  /** Without Move, the page is only Play: the chord lookup, with pads you click to hear. */
  browsing: Schema.Boolean,
  sidebarWidth: Schema.Number,
  /** While the resize handle is dragged: where on the handle it was grabbed, so the edge doesn't jump. */
  sidebarGrab: Schema.NullOr(Schema.Number),
  /** Sustain is on while the screen button is on or while Shift on Move is held, like a pedal. */
  sustainLatched: Schema.Boolean,
  pedal: Schema.Boolean,
  moveStatus: MoveStatus,
  /** Pads held on Move, and pads let go of while sustain is on, as "col-row" keys. */
  held: Schema.Array(Schema.String),
  ringing: Schema.Array(Schema.String),
  /** Key of the tutorial step or song chord the player has played, e.g. "t:first-chords:2". */
  completed: Schema.NullOr(Schema.String),
  freePlayStarted: Schema.Boolean,
  /** Frame of the "press →" cue animation. */
  frame: Schema.Number,
  /** Pasted songs, kept in this browser and, signed in, in the account. */
  sheets: Schema.Array(Sheet),
  practice: Practice,
  account: Account,
})
export type ChordsModel = typeof ChordsModel.Type

export const SIDEBAR_DEFAULT = 392
export const SIDEBAR_MIN = 320
export const SIDEBAR_MAX = 720
export const clampSidebar = (px: number) => Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, px)))

export const initialPractice: Practice = {
  running: false,
  mode: 'play',
  speed: 1,
  loop: false,
  beat: 0,
  zero: 0,
  audioZero: 0,
  nextClick: 0,
  presses: [],
  lastRun: null,
}

function notePads(grid: Pad[][], midi: number): Voicing {
  const pads = grid.flat()
  const exact = pads.filter((p) => p.midi === midi)
  const shown = exact.length ? exact : pads.filter((p) => mod(p.midi, 12) === mod(midi, 12))
  return { pads: shown.map((p) => ({ ...p, interval: 0, optional: false })), missing: [], fromChart: true }
}

const chordTones = (c: SongChord) => chordType(c.chord).tones.map((t) => mod(c.root + t.interval, 12))

export const savedSongs = (sheets: ReadonlyArray<Sheet>): Song[] =>
  sheets.map((sheet): Song => ({ id: sheet.id, ...parseSheet(sheet.text, sheet.title) }))

/**
 * The practice state an exercise implies at this moment: the beat, results and the event to play next.
 * After a run, the strip shows its results, so every event is final. Before a run, none are.
 */
export function practiceView(model: ChordsModel) {
  const exercise = exerciseById(model.search.x ?? undefined)
  const p = model.practice
  const countIn = exercise?.beatsPerBar ?? 4
  const msPerBeat = exercise ? 60000 / (exercise.bpm * p.speed) : 500
  const beat = p.running ? p.beat : -countIn
  const nowMs = p.running ? Math.floor(beat * 4) / 4 * msPerBeat : p.presses.length ? Infinity : -Infinity
  const { results, wrong } = exercise ? judge(exercise.events, [...p.presses], msPerBeat, nowMs) : { results: [], wrong: 0 }
  // The event to play next: the first one not yet hit or missed. Between runs, the first event.
  const target = !exercise ? -1 : p.running ? exercise.events.findIndex((_, i) => results[i].judgment === 'pending') : 0
  const lastJudged = results.length - 1 - [...results].reverse().findIndex((r) => r.judgment !== 'pending')
  return { exercise, countIn, msPerBeat, beat, results, wrong, target, lastJudged }
}

/**
 * Everything the view and Move's lights show, worked out from the Model. This is the React version's
 * render body, kept as one pure function so the view, the lights and `update` all agree.
 */
export function derive(model: ChordsModel) {
  const raw = model.search
  const saved = savedSongs(model.sheets)
  // In a song, the song decides the key and the chord, like a tutorial step does in tutorialView.
  const song = songById(raw.song ?? undefined, saved)
  const events = song ? songEvents(song) : []
  const songPos = Math.min(raw.p, events.length)
  const songEvent = events[songPos]
  const songScale = song ? songKey(events, chordTones) : undefined
  // In practice, the exercise decides the key, and the next chord to play is the shown chord.
  const practice = practiceView(model)
  const exercise = practice.exercise
  const practiceEvent: PracticeEvent | undefined = exercise?.events[practice.target]
  const search: Search = exercise
    ? {
        ...raw,
        key: exercise.key,
        scale: exercise.scale,
        layout: 'chromatic',
        all: false,
        ...(practiceEvent?.kind === 'chord' && { root: practiceEvent.root, chord: practiceEvent.chord }),
      }
    : song && songScale
      ? {
          ...raw,
          ...songScale,
          layout: 'chromatic',
          all: false,
          ...(songEvent && { root: songEvent.chord.root, chord: songEvent.chord.chord }),
        }
      : raw

  const scale = scaleById(search.scale)
  const type = chordType(search.chord)
  const grid = padGrid(search.layout, search.key, scale, search.base)
  const options = voicings(grid, search.root, type, search.layout)
  // A practice note lights every pad with that pitch, or with that note name in another octave
  // if a custom bottom-left pad moves the pitch off the grid.
  const voicing =
    practiceEvent?.kind === 'note' ? notePads(grid, practiceEvent.midi) : options.length ? options[mod(search.v, options.length)] : undefined
  const inScale = new Set(scale.intervals.map((i) => mod(search.key + i, 12)))
  const diatonic = diatonicChords(search.key, scale, search.sevenths)
  const current = diatonic.find((c) => c.rootPc === search.root && c.type.id === search.chord)
  const chordPcs = type.tones.map((tone) => mod(search.root + tone.interval, 12))
  const outOfKey = chordPcs.filter((p) => !inScale.has(p))
  const sustain = model.sustainLatched || model.pedal
  // Roots with at least one shape that has every required tone of the current chord.
  const playableRoots = new Set(
    NOTE_NAMES.flatMap((_, i) => (voicings(grid, i, type, search.layout).some((v) => v.missing.length === 0) ? [i] : [])),
  )

  const tutorial = tutorialById(search.t ?? undefined)
  // After the last step comes free play: the tutorial's key and layout, with any chord.
  const stepIndex = tutorial ? Math.min(search.s, tutorial.steps.length) : 0
  const step = tutorial?.steps[stepIndex]
  const freePlay = !!tutorial && !step
  const nextTutorial = tutorial && TUTORIALS[TUTORIALS.indexOf(tutorial) + 1]

  const held = new Set(model.held)
  const heldMidi = model.held.map((key) => {
    const [col, row] = key.split('-').map(Number)
    return grid[row][col].midi
  })
  const match = songEvent
    ? // A slash chord's bass note, such as the B in G/B, is also correct.
      chordMatch(
        heldMidi.filter((m) => mod(m, 12) !== songEvent.chord.bass),
        songEvent.chord.root,
        chordType(songEvent.chord.chord),
      )
    : step?.kind === 'chord'
      ? chordMatch(heldMidi, step.root, chordType(step.chord))
      : chordMatch(heldMidi, search.root, type)

  // Play the chord, then let go of every pad to move on. Waiting for the release means
  // the chord rings as long as you hold it, and a held chord can never count for the next one.
  const stepKey =
    song && songEvent ? `song:${song.id}:${songPos}` : tutorial && step?.kind === 'chord' ? `t:${tutorial.id}:${stepIndex}` : null
  const played = stepKey !== null && model.completed === stepKey
  const waitingForNext = !!tutorial && step?.kind === 'info'
  const connected = model.moveStatus === 'connected'
  // "Press →" cue: it shows on info steps, at the end of a song, and in free play until you play a pad.
  const cue =
    connected &&
    ((!!tutorial && (step?.kind === 'info' || (freePlay && !model.freePlayStarted))) || (!!song && !songEvent && events.length > 0))
  const hasNotes =
    !voicing || voicing.missing.length > 0 || (search.layout === 'chromatic' && (outOfKey.length > 0 || !voicing.fromChart))

  return {
    search,
    saved,
    song,
    events,
    songPos,
    songEvent,
    practice,
    exercise,
    practiceEvent,
    scale,
    type,
    grid,
    options,
    voicing,
    inScale,
    diatonic,
    current,
    chordPcs,
    outOfKey,
    sustain,
    playableRoots,
    tutorial,
    stepIndex,
    step,
    freePlay,
    nextTutorial,
    held,
    heldMidi,
    match,
    stepKey,
    played,
    waitingForNext,
    connected,
    cue,
    hasNotes,
  }
}
export type Derived = ReturnType<typeof derive>

/** What Move should show, plus what the lights mount needs to choose fades. */
export type MoveView = {
  readonly lights: { readonly notes: ReadonlyArray<readonly [number, number]>; readonly ccs: ReadonlyArray<readonly [number, number]> }
  /** Pad notes held or ringing now. */
  readonly lit: ReadonlyArray<number>
  /** Changes when the shown chord changes, so its pads fade in. */
  readonly chordId: string
  readonly cue: boolean
}

/**
 * Move's lights for the current state: root cyan, chord tones white, other lit pads dim. A held pad is
 * green when it is in the chord and red when it is not. With sustain on, a pad you let go of stays lit
 * while its note rings.
 */
export function moveView(model: ChordsModel, d: Derived): MoveView {
  const notes: Array<readonly [number, number]> = []
  const ccs: Array<readonly [number, number]> = []
  const litNotes: number[] = []
  const { search, voicing, inScale, chordPcs, songEvent, exercise, practiceEvent, cue } = d
  // In practice, notes of the next event and of the one just played are right, so a held chord stays green.
  const practiceRight = exercise
    ? new Set([practiceEvent, exercise.events[d.practice.lastJudged]].flatMap((e) => (e ? eventAllowedPcs(e) : [])))
    : undefined
  const lit = new Set([...model.held, ...model.ringing])
  for (const pad of d.grid.flat()) {
    const hit = voicing?.pads.find((p) => p.col === pad.col && p.row === pad.row)
    const pcOfPad = mod(pad.midi, 12)
    let color: number = hit
      ? hit.interval === 0
        ? COLOR.cyan
        : COLOR.white
      : search.layout !== 'chromatic' || inScale.has(pcOfPad)
        ? COLOR.dim
        : COLOR.off
    const right = practiceRight ? practiceRight.has(pcOfPad) : chordPcs.includes(pcOfPad) || pcOfPad === songEvent?.chord.bass
    if (lit.has(`${pad.col}-${pad.row}`)) {
      color = right ? COLOR.green : COLOR.red
      litNotes.push(padNote(pad.col, pad.row))
    }
    if (cue) {
      // Chevrons 4 columns apart. The middle rows are the tip, one column ahead of the outer rows.
      const tip = pad.row === 1 || pad.row === 2 ? 0 : 1
      color = mod(pad.col + tip - model.frame, 4) === 0 ? COLOR.green : COLOR.off
    }
    notes.push([padNote(pad.col, pad.row), color])
  }
  const arrowBlink = cue && model.frame % 4 < 2 ? 127 : BUTTON_DIM
  const { tutorial, song, events, songPos } = d
  if (tutorial) {
    // Step buttons show progress: done green, current white, to do dim.
    tutorial.steps.slice(0, 16).forEach((_, i) => {
      const done = d.freePlay || i < d.stepIndex || (i === d.stepIndex && d.played)
      notes.push([STEP_NOTE + i, done ? COLOR.green : i === d.stepIndex ? COLOR.white : COLOR.dim])
    })
    // The arrow LEDs are white only, and the value sets the brightness.
    ccs.push([BUTTON.left, d.stepIndex > 0 ? BUTTON_DIM : 0], [BUTTON.right, arrowBlink])
  }
  if (song) {
    // Step buttons show the chords of the current line: played green, current white, to come dim.
    const line = songEvent?.line
    events
      .filter((e) => e.line === line)
      .slice(0, 16)
      .forEach((e, i) => {
        const at = events.indexOf(e)
        notes.push([STEP_NOTE + i, at < songPos ? COLOR.green : at === songPos ? COLOR.white : COLOR.dim])
      })
    ccs.push([BUTTON.left, songPos > 0 ? BUTTON_DIM : 0], [BUTTON.right, arrowBlink])
  }
  if (exercise) {
    // The step buttons are one bar of sixteenth notes. The playhead step is white, and each beat is dim.
    const playhead = mod(Math.floor(d.practice.beat * 4), 16)
    for (let i = 0; i < 16; i++) {
      notes.push([STEP_NOTE + i, model.practice.running && i === playhead ? COLOR.white : i % 4 === 0 ? COLOR.dim : COLOR.off])
    }
    ccs.push([BUTTON.play, model.practice.running ? COLOR.green : COLOR.dim])
  }
  ccs.push([BUTTON.shift, d.sustain ? 127 : BUTTON_DIM])
  const chordId = `${search.root}:${search.chord}:${search.key}:${search.scale}:${d.practice.target}`
  return { lights: { notes, ccs }, lit: litNotes, chordId, cue }
}

/**
 * Adds fades: a pad you let go of fades back slowly, like the note, and a new chord fades in quickly.
 * Pads 68–99 are the grid; step buttons and CCs never fade.
 */
export function withFades(now: MoveView, before: MoveView | null): Lights {
  const fade: Array<readonly [number, 'quick' | 'slow']> = []
  if (before && !now.cue) {
    const litNow = new Set(now.lit)
    const litBefore = new Set(before.lit)
    for (const [note] of now.lights.notes) {
      if (note < 68 || litNow.has(note)) continue
      if (litBefore.has(note)) fade.push([note, 'slow'])
      else if (before.chordId !== now.chordId) fade.push([note, 'quick'])
    }
  }
  return { ...now.lights, fade }
}

export { EXERCISES, NOTE_NAMES, TUTORIALS }
