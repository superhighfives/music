import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import {
  CHORD_FAMILIES,
  CHORD_TYPES,
  LAYOUTS,
  NOTE_NAMES,
  SCALES,
  chordMatch,
  chordType,
  diatonicChords,
  mod,
  noteName,
  noteWithOctave,
  padGrid,
  scaleById,
  voicings,
  type Layout,
  type Pad,
  type Voicing,
} from '../lib/music'
import { usePiano } from '../lib/piano'
import { BUTTON, BUTTON_DIM, COLOR, STEP_NOTE, padNote, useMove, type Lights, type MoveStatus } from '../lib/move'
import { TUTORIALS, tutorialById, type Tutorial } from '../lib/tutorials'
import { EXERCISES, eventAllowedPcs, exerciseById, type PracticeEvent } from '../lib/practice'
import { PracticeCard, usePractice } from '../components/practice'
import {
  SONGS,
  chordLabel,
  parseSheet,
  songById,
  songEvents,
  songKey,
  unknownChords,
  type Song,
  type SongChord,
  type SongEvent,
} from '../lib/songs'

type Search = {
  key: number
  scale: string
  layout: Layout
  base: number
  root: number
  chord: string
  v: number
  sevenths: boolean
  all: boolean
  /** Active tutorial id and step index. */
  t?: string
  s: number
  /** Active song id and the index of the chord to play next. */
  song?: string
  p: number
  /** Active practice exercise id. */
  x?: string
}

const pc = (value: unknown, fallback: number) => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n < 12 ? n : fallback
}

export const Route = createFileRoute('/')({
  // All state lives in the URL, so any view can be bookmarked or shared.
  validateSearch: (s: Record<string, unknown>): Search => tutorialView(parseSearch(s)),
  component: App,
})

/** In a tutorial, the step decides the key, scale, layout and chord, so a shared link shows the same view. */
function tutorialView(search: Search): Search {
  const tutorial = tutorialById(search.t)
  if (!tutorial) return search
  // Step index steps.length is free play, where the player picks the chords.
  // An info step shows the chord of the next chord step, so the screen never shows an old chord.
  const shown = tutorial.steps.slice(search.s).find((s) => s.kind === 'chord')
  const view = { ...search, key: tutorial.key, scale: tutorial.scale, layout: tutorial.layout }
  return shown?.kind === 'chord' && search.s < tutorial.steps.length ? { ...view, root: shown.root, chord: shown.chord } : view
}

function parseSearch(s: Record<string, unknown>): Search {
  return {
    key: pc(s.key, 0),
    scale: SCALES.some((x) => x.id === s.scale) ? String(s.scale) : 'major',
    layout: LAYOUTS.some((x) => x.id === s.layout) ? (s.layout as Layout) : 'chromatic',
    base: pc(s.base, 9),
    root: pc(s.root, pc(s.key, 0)),
    // The router parses `chord=7` as a number, so compare as strings.
    chord: CHORD_TYPES.some((x) => x.id === String(s.chord)) ? String(s.chord) : 'maj',
    v: Math.max(0, Number.parseInt(String(s.v ?? 0), 10) || 0),
    sevenths: s.sevenths === true || s.sevenths === 'true',
    all: s.all === true || s.all === 'true',
    t: tutorialById(String(s.t)) ? String(s.t) : undefined,
    s: Math.max(0, Number.parseInt(String(s.s ?? 0), 10) || 0),
    // Pasted songs live in the browser's storage, so App checks that the id exists.
    song: typeof s.song === 'string' && s.song ? s.song : undefined,
    p: Math.max(0, Number.parseInt(String(s.p ?? 0), 10) || 0),
    x: exerciseById(String(s.x)) ? String(s.x) : undefined,
  }
}

type Tab = 'learn' | 'songs' | 'practice' | 'play'

const TABS: { id: Tab; name: string }[] = [
  { id: 'learn', name: 'Learn' },
  { id: 'songs', name: 'Songs' },
  { id: 'practice', name: 'Practice' },
  { id: 'play', name: 'Play' },
]

const SAVED_SONGS = 'movechords:songs'

/** A pasted chord sheet. We store the text, not the parsed song, so a better parser also reads old songs. */
type SavedSheet = { id: string; title: string; text: string }

const isSavedSheet = (v: unknown): v is SavedSheet =>
  typeof v === 'object' &&
  v !== null &&
  'id' in v &&
  'title' in v &&
  'text' in v &&
  typeof v.id === 'string' &&
  typeof v.title === 'string' &&
  typeof v.text === 'string'

/** Pasted songs, kept in this browser only. They load after the first render, so server and client HTML match. */
function readSheets(): SavedSheet[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SAVED_SONGS) ?? '[]')
    return Array.isArray(value) ? value.filter(isSavedSheet) : []
  } catch {
    // Bad JSON in storage: start with no saved songs.
    return []
  }
}

function useSavedSongs() {
  const [sheets, setSheets] = useState<SavedSheet[]>([])
  useEffect(() => setSheets(readSheets()), [])
  // Read storage again before each write, so a write during the first render cannot drop saved songs.
  const store = (change: (current: SavedSheet[]) => SavedSheet[]) => {
    const next = change(readSheets())
    setSheets(next)
    localStorage.setItem(SAVED_SONGS, JSON.stringify(next))
  }
  return {
    saved: sheets.map((sheet): Song => ({ id: sheet.id, ...parseSheet(sheet.text, sheet.title) })),
    /** Saves the sheet and returns its id. The same text saved again keeps its first id. */
    add: (title: string, text: string) => {
      const id = readSheets().find((s) => s.text === text)?.id ?? `my-${Date.now().toString(36)}`
      store((current) => (current.some((s) => s.id === id) ? current : [...current, { id, title, text }]))
      return id
    },
    remove: (id: string) => store((current) => current.filter((s) => s.id !== id)),
  }
}

/**
 * Bookmarklet for an Ultimate Guitar song page. It reads the chord sheet that the page already holds and
 * opens this app with it in the URL hash. As of November 2026 the sheet is in three places, tried in order:
 * 1. window.UGAPP.store, after the page's scripts start.
 * 2. The "js-store" element's JSON, before they start. The scripts then remove the element.
 * 3. The shown sheet in a <pre>, as plain chords above lyrics.
 * It runs in your own browser on a page you opened, so this app makes no requests to Ultimate Guitar.
 */
const ugBookmarklet = (origin: string) =>
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
  window.open(${JSON.stringify(origin)} + '/#import=' + encodeURIComponent(head + text), '_blank')
})()`)

const SIDEBAR_DEFAULT = 392
const SIDEBAR_MIN = 320
const SIDEBAR_MAX = 720
const SIDEBAR_KEY = 'movechords:sidebar'

/** Desktop sidebar width, saved in this browser. It loads after the first render, so server and client HTML match. */
function useSidebarWidth() {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT)
  useEffect(() => {
    const saved = Number(localStorage.getItem(SIDEBAR_KEY))
    if (saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX) setWidth(saved)
  }, [])
  const set = (px: number) => {
    const next = Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, px)))
    setWidth(next)
    localStorage.setItem(SIDEBAR_KEY, String(next))
  }
  return { width, set }
}

function notePads(grid: Pad[][], midi: number): Voicing {
  const pads = grid.flat()
  const exact = pads.filter((p) => p.midi === midi)
  const shown = exact.length ? exact : pads.filter((p) => mod(p.midi, 12) === mod(midi, 12))
  return { pads: shown.map((p) => ({ ...p, interval: 0, optional: false })), missing: [], fromChart: true }
}

const chordTones = (c: SongChord) => chordType(c.chord).tones.map((t) => mod(c.root + t.interval, 12))

function App() {
  const raw = Route.useSearch()
  const savedSongs = useSavedSongs()
  const sidebar = useSidebarWidth()
  // In a song, the song decides the key and the chord, like a tutorial step does in tutorialView.
  const song = songById(raw.song, savedSongs.saved)
  const events = song ? songEvents(song) : []
  const songPos = Math.min(raw.p, events.length)
  const songEvent: SongEvent | undefined = events[songPos]
  const songScale = song ? songKey(events, chordTones) : undefined
  const piano = usePiano()
  const play = piano.play
  // In practice, the exercise decides the key, and the next chord to play is the shown chord.
  const exercise = exerciseById(raw.x)
  const practice = usePractice(exercise, piano)
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
  const navigate = useNavigate({ from: '/' })
  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, v: 0, ...patch }), replace: true, resetScroll: false })
  // The sidebar tab. It starts on Learn, because the connect screen comes before it.
  const [tab, setTab] = useState<Tab>('learn')

  const scale = scaleById(search.scale)
  const type = chordType(search.chord)
  const grid = padGrid(search.layout, search.key, scale, search.base)
  const options = voicings(grid, search.root, type, search.layout)
  // A practice note lights every pad with that pitch, or with that note name in another octave
  // if a custom bottom-left pad moves the pitch off the grid.
  const voicing =
    practiceEvent?.kind === 'note'
      ? notePads(grid, practiceEvent.midi)
      : options.length
        ? options[mod(search.v, options.length)]
        : undefined
  const inScale = new Set(scale.intervals.map((i) => mod(search.key + i, 12)))
  const diatonic = diatonicChords(search.key, scale, search.sevenths)
  const current = diatonic.find((c) => c.rootPc === search.root && c.type.id === search.chord)
  const chordPcs = type.tones.map((tone) => mod(search.root + tone.interval, 12))
  const outOfKey = chordPcs.filter((p) => !inScale.has(p))
  // Sustain is on while the screen button is on or while Shift on Move is held, like a pedal.
  const [sustainLatched, setSustainLatched] = useState(false)
  const [pedal, setPedal] = useState(false)
  const sustain = sustainLatched || pedal
  // Pads let go of while sustain is on keep their light while the note rings.
  const [ringing, setRinging] = useState<Set<string>>(() => new Set())
  const sustainRef = useRef(sustain)
  sustainRef.current = sustain
  useEffect(() => {
    piano.setSustain(sustain)
    if (!sustain) setRinging(new Set())
  }, [sustain])
  // Roots with at least one shape that has every required tone of the current chord.
  const playableRoots = new Set(
    NOTE_NAMES.flatMap((_, i) =>
      voicings(grid, i, type, search.layout).some((v) => v.missing.length === 0) ? [i] : [],
    ),
  )

  const tutorial = tutorialById(search.t)
  // After the last step comes free play: the tutorial's key and layout, with any chord.
  const stepIndex = tutorial ? Math.min(search.s, tutorial.steps.length) : 0
  const step = tutorial?.steps[stepIndex]
  const freePlay = !!tutorial && !step
  const nextTutorial = tutorial && TUTORIALS[TUTORIALS.indexOf(tutorial) + 1]
  // Key of the tutorial step or song chord the player has played, e.g. "t:first-chords:2".
  const [completed, setCompleted] = useState<string | null>(null)
  const goTo = (t: Tutorial, i: number) => {
    setCompleted(null)
    setFreePlayStarted(false)
    // tutorialView sets the key, scale, layout and chord for the step.
    set({ t: t.id, s: i, all: false, song: undefined, p: 0, x: undefined })
  }
  const goToSong = (id: string, p: number) => {
    setCompleted(null)
    set({ song: id, p, t: undefined, s: 0, all: false, x: undefined })
  }
  const goToExercise = (id: string | undefined) => set({ x: id, t: undefined, s: 0, song: undefined, p: 0 })
  const exitSong = () => set({ song: undefined, p: 0 })

  // The Ultimate Guitar bookmarklet opens "/#import=<sheet>". Save the sheet, then remove it from the URL.
  useEffect(() => {
    const m = /^#import=(.*)$/s.exec(window.location.hash)
    if (!m) return
    history.replaceState(null, '', window.location.pathname + window.location.search)
    const text = decodeURIComponent(m[1])
    goToSong(savedSongs.add(parseSheet(text).title, text), 0)
    setTab('songs')
  }, [])
  const exitTutorial = () => {
    setCompleted(null)
    set({ t: undefined, s: 0 })
  }

  const move = useMove({
    onPad: (col, row, velocity, time) => {
      piano.noteOn(`pad-${col}-${row}`, grid[row][col].midi, velocity)
      practice.press(grid[row][col].midi, time)
      setRinging((r) => (r.has(`${col}-${row}`) ? new Set([...r].filter((k) => k !== `${col}-${row}`)) : r))
      if (freePlay) setFreePlayStarted(true)
    },
    onPadUp: (col, row) => {
      piano.noteOff(`pad-${col}-${row}`)
      if (sustainRef.current) setRinging((r) => new Set(r).add(`${col}-${row}`))
    },
    onButtonUp: (cc) => {
      if (cc === BUTTON.shift) setPedal(false)
    },
    // Move's arrows step through a tutorial, so you can keep your hands on the device.
    onButton: (cc) => {
      if (cc === BUTTON.shift) return setPedal(true)
      if (exercise) {
        if (cc === BUTTON.play) practice.running ? practice.stop() : practice.start()
        return
      }
      if (song) {
        if (cc === BUTTON.right) goToSong(song.id, songPos < events.length ? songPos + 1 : 0)
        if (cc === BUTTON.left && songPos > 0) goToSong(song.id, songPos - 1)
        return
      }
      if (!tutorial) return
      if (cc === BUTTON.right) next()
      if (cc === BUTTON.left && stepIndex > 0) goTo(tutorial, stepIndex - 1)
    },
  })
  const heldMidi = [...move.held].map((key) => {
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
  // Info steps and free play have no chord, so they wait for →.
  const stepKey = song && songEvent ? `song:${song.id}:${songPos}` : tutorial && step?.kind === 'chord' ? `t:${tutorial.id}:${stepIndex}` : null
  const played = stepKey !== null && completed === stepKey
  const allReleased = move.held.size === 0
  useEffect(() => {
    if (!stepKey) return
    if (completed !== stepKey) {
      if (match === 'complete') setCompleted(stepKey)
    } else if (allReleased) {
      if (song) goToSong(song.id, songPos + 1)
      else if (tutorial) goTo(tutorial, stepIndex + 1)
    }
  }, [match, allReleased, stepKey, completed])
  const waitingForNext = !!tutorial && step?.kind === 'info'
  function next() {
    if (!tutorial) return
    if (!freePlay) goTo(tutorial, stepIndex + 1)
    else if (nextTutorial) goTo(nextTutorial, 0)
    else exitTutorial()
  }

  // "Press →" cue: green chevrons flow to the right across the pads, and the right arrow blinks.
  // It shows on info steps, at the end of a song, and in free play until you play a pad.
  const [freePlayStarted, setFreePlayStarted] = useState(false)
  const cue =
    move.status === 'connected' &&
    ((tutorial && (step?.kind === 'info' || (freePlay && !freePlayStarted))) || (song && !songEvent && events.length > 0))
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!cue) return
    const id = setInterval(() => setFrame((f) => f + 1), 150)
    return () => clearInterval(id)
  }, [cue])

  // Mirror the screen on Move: root cyan, chord tones white, other lit pads dim.
  // A held pad is green when it is in the chord and red when it is not.
  // With sustain on, a pad you let go of stays lit while its note rings.
  // A pad you let go of fades back slowly, like the note. A new chord fades in quickly.
  // Pressing a pad lights it at once.
  const lights: Lights = { notes: new Map(), ccs: new Map(), fade: new Map() }
  const chordId = `${search.root}:${search.chord}:${search.key}:${search.scale}:${practice.target}`
  // In practice, notes of the next event and of the one just played are right, so a held chord stays green.
  const practiceRight = exercise
    ? new Set([practiceEvent, exercise.events[practice.lastJudged]].flatMap((e) => (e ? eventAllowedPcs(e) : [])))
    : undefined
  const lastChord = useRef(chordId)
  const chordChanged = lastChord.current !== chordId
  useEffect(() => {
    lastChord.current = chordId
  })
  const lit = new Set([...move.held, ...ringing])
  const wasLit = useRef(lit)
  useEffect(() => {
    wasLit.current = lit
  })
  for (const pad of grid.flat()) {
    const hit = voicing?.pads.find((p) => p.col === pad.col && p.row === pad.row)
    const pcOfPad = mod(pad.midi, 12)
    let color: number = hit
      ? hit.interval === 0
        ? COLOR.cyan
        : COLOR.white
      : search.layout !== 'chromatic' || inScale.has(pcOfPad)
        ? COLOR.dim
        : COLOR.off
    const right = practiceRight
      ? practiceRight.has(pcOfPad)
      : chordPcs.includes(pcOfPad) || pcOfPad === songEvent?.chord.bass
    const key = `${pad.col}-${pad.row}`
    if (move.held.has(key) || ringing.has(key)) color = right ? COLOR.green : COLOR.red
    if (!cue && !lit.has(key)) {
      if (wasLit.current.has(key)) lights.fade?.set(padNote(pad.col, pad.row), 'slow')
      else if (chordChanged) lights.fade?.set(padNote(pad.col, pad.row), 'quick')
    }
    if (cue) {
      // Chevrons 4 columns apart. The middle rows are the tip, one column ahead of the outer rows.
      const tip = pad.row === 1 || pad.row === 2 ? 0 : 1
      color = mod(pad.col + tip - frame, 4) === 0 ? COLOR.green : COLOR.off
    }
    lights.notes.set(padNote(pad.col, pad.row), color)
  }
  const arrowBlink = cue && frame % 4 < 2 ? 127 : BUTTON_DIM
  if (tutorial) {
    // Step buttons show progress: done green, current white, to do dim.
    tutorial.steps.slice(0, 16).forEach((_, i) => {
      const done = freePlay || i < stepIndex || (i === stepIndex && played)
      lights.notes.set(STEP_NOTE + i, done ? COLOR.green : i === stepIndex ? COLOR.white : COLOR.dim)
    })
    // The arrow LEDs are white only, and the value sets the brightness.
    lights.ccs.set(BUTTON.left, stepIndex > 0 ? BUTTON_DIM : 0)
    lights.ccs.set(BUTTON.right, arrowBlink)
  }
  if (song) {
    // Step buttons show the chords of the current line: played green, current white, to come dim.
    const line = songEvent?.line
    events
      .filter((e) => e.line === line)
      .slice(0, 16)
      .forEach((e, i) => {
        const at = events.indexOf(e)
        lights.notes.set(STEP_NOTE + i, at < songPos ? COLOR.green : at === songPos ? COLOR.white : COLOR.dim)
      })
    lights.ccs.set(BUTTON.left, songPos > 0 ? BUTTON_DIM : 0)
    lights.ccs.set(BUTTON.right, arrowBlink)
  }
  if (exercise) {
    // The step buttons are one bar of sixteenth notes. The playhead step is white, and each beat is dim.
    const playhead = mod(Math.floor(practice.beat * 4), 16)
    for (let i = 0; i < 16; i++) {
      lights.notes.set(STEP_NOTE + i, practice.running && i === playhead ? COLOR.white : i % 4 === 0 ? COLOR.dim : COLOR.off)
    }
    lights.ccs.set(BUTTON.play, practice.running ? COLOR.green : COLOR.dim)
  }
  lights.ccs.set(BUTTON.shift, sustain ? 127 : BUTTON_DIM)
  useEffect(() => move.show(lights))

  const pianoCredit = (
    <p className="text-[11px] text-neutral-600">
      Piano: <a className="underline hover:text-neutral-400" href="https://github.com/Tonejs/audio/tree/master/salamander">Salamander Grand Piano</a> by
      Alexander Holm, <a className="underline hover:text-neutral-400" href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>.
    </p>
  )
  const layoutControls = (
    <>
      <Segmented options={LAYOUTS} value={search.layout} onChange={(layout) => set({ layout })} />
      {search.layout === 'chromatic' && (
        <Field label="Bottom-left pad" inline>
          <select
            className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm text-neutral-200"
            value={search.base}
            onChange={(e) => set({ base: Number(e.target.value) })}
          >
            {NOTE_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  )

  const connected = move.status === 'connected'

  const learnPicker = (
    <Group label="Learn">
      <div className="flex flex-col gap-1">
        {TUTORIALS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tutorial?.id === t.id}
            onClick={() => goTo(t, 0)}
            className={[
              'rounded-md px-2.5 py-1.5 text-left transition-colors',
              tutorial?.id === t.id ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800',
            ].join(' ')}
          >
            <span className="block text-[13px] font-medium">{t.name}</span>
            <span className="block text-xs opacity-60">{t.summary}</span>
          </button>
        ))}
      </div>
    </Group>
  )

  const practicePicker = (
    <Group label="Practice">
      <div className="flex flex-col gap-1">
        {EXERCISES.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={exercise?.id === x.id}
            onClick={() => goToExercise(x.id)}
            className={[
              'rounded-md px-2.5 py-1.5 text-left transition-colors',
              exercise?.id === x.id ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800',
            ].join(' ')}
          >
            <span className="block text-[13px] font-medium">{x.name}</span>
            <span className="block text-xs opacity-60">
              {x.summary} · {x.bpm} BPM
            </span>
          </button>
        ))}
      </div>
    </Group>
  )

  // While a song plays, the Songs tab shows the player. "All songs" goes back to the list.
  const songPicker = song ? (
    <SongCard
      song={song}
      events={events}
      pos={songPos}
      played={played}
      connected={move.status === 'connected'}
      match={match}
      held={heldMidi}
      onBack={() => goToSong(song.id, songPos - 1)}
      onNext={() => goToSong(song.id, songEvent ? songPos + 1 : 0)}
      onJump={(p) => goToSong(song.id, p)}
      onExit={exitSong}
    />
  ) : (
    <Group
      label="Songs"
      action={
        <a
          // React blocks javascript: URLs in props, so set the bookmarklet after render, in the browser only.
          ref={(el) => el?.setAttribute('href', ugBookmarklet(window.location.origin))}
          onClick={(e) => e.preventDefault()}
          title="Drag this to your bookmarks bar. Then open a Chords page on Ultimate Guitar and click the bookmark."
          className="cursor-grab rounded-full border border-neutral-700 px-2 py-px text-[11px] tracking-normal text-neutral-400 normal-case hover:border-neutral-500"
        >
          Send to chords
        </a>
      }
    >
      <div className="flex flex-col gap-1">
        {[...SONGS, ...savedSongs.saved].map((s) => (
          <div key={s.id} className="flex items-stretch gap-1">
            <button
              type="button"
              onClick={() => goToSong(s.id, 0)}
              className="min-w-0 flex-1 rounded-md bg-neutral-900 px-2.5 py-1.5 text-left text-neutral-300 transition-colors hover:bg-neutral-800"
            >
              <span className="block truncate text-[13px] font-medium">{s.title}</span>
              {s.artist && <span className="block truncate text-xs opacity-60">{s.artist}</span>}
            </button>
            {!SONGS.includes(s) && (
              <button
                type="button"
                aria-label={`Delete ${s.title}`}
                onClick={() => savedSongs.remove(s.id)}
                className="rounded-md bg-neutral-900 px-2 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </Group>
  )

  const inKeyPicker =
    diatonic.length > 0 ? (
      <Group
        label="In key"
        action={
          <button
            type="button"
            aria-pressed={search.sevenths}
            onClick={() => set({ sevenths: !search.sevenths })}
            className={[
              'rounded-full border px-2 py-px text-[11px] tracking-normal normal-case',
              search.sevenths ? 'border-led text-led' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500',
            ].join(' ')}
          >
            7ths {search.sevenths ? 'on' : 'off'}
          </button>
        }
      >
        <div className="grid grid-cols-4 gap-1">
          {diatonic.map((c) => (
            <Chip
              key={c.degree}
              active={search.root === c.rootPc && search.chord === c.type.id}
              onClick={() => set({ root: c.rootPc, chord: c.type.id })}
            >
              <span className="block text-[10px] leading-tight opacity-55">{c.numeral}</span>
              {chordSymbol(c.rootPc, c.type.id, c.type.name)}
            </Chip>
          ))}
        </div>
      </Group>
    ) : (
      <p className="text-xs text-neutral-500">In-key chords need a seven-note scale.</p>
    )

  const rootPicker = (
    <Group label="Root">
      <div className="grid grid-cols-6 gap-1">
        {NOTE_NAMES.map((name, i) => (
          <Chip
            key={name}
            active={search.root === i}
            dim={!inScale.has(i)}
            disabled={!playableRoots.has(i)}
            title={playableRoots.has(i) ? undefined : `No full ${type.name} shape from ${name} in this layout`}
            onClick={() => set({ root: i })}
          >
            {name}
          </Chip>
        ))}
      </div>
    </Group>
  )

  const chordPicker = (
    <div className="flex flex-col gap-1.5">
      {CHORD_FAMILIES.map((family) => (
        <div key={family.name} className="grid grid-cols-[3.25rem_1fr] items-start gap-2">
          <div className="pt-1.5 text-[10px] font-medium tracking-wider text-neutral-500 uppercase">{family.name}</div>
          <div className="grid grid-cols-5 gap-1">
            {family.ids.map((id) => (
              <Chip key={id} active={search.chord === id} onClick={() => set({ chord: id })}>
                {chordType(id).name}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const showAll = search.all
  const hasNotes =
    !voicing ||
    voicing.missing.length > 0 ||
    (search.layout === 'chromatic' && (outOfKey.length > 0 || !voicing.fromChart))

  // Until Move is connected, there is nothing to play, so the page is only the way to connect.
  if (!connected) return <ConnectScreen status={move.status} onConnect={move.connect} />

  return (
    <main className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <aside
        ref={(el) => el?.style.setProperty('--sidebar', `${sidebar.width}px`)}
        className="flex shrink-0 flex-col gap-3 px-4 pt-4 lg:w-[var(--sidebar,392px)] lg:gap-4 lg:overflow-y-auto lg:px-6 lg:py-5"
      >
        <div className="flex items-center gap-2">
          <h1 className="mr-auto text-lg font-semibold tracking-tight text-white">chords</h1>
          {/* Phone: key and scale sit beside the title to save height. */}
          <div className="flex gap-2 lg:hidden">
            <KeySelect value={search.key} onChange={(key) => set({ key, root: key })} />
            <ScaleSelect value={scale.id} onChange={(id) => set({ scale: id })} />
          </div>
        </div>
        {/* Phone: the layout stays at the top. The pickers are in tabs below the pads. */}
        <div className="flex flex-col gap-3 lg:hidden">{layoutControls}</div>
        <div className="hidden flex-col gap-4 lg:flex">
          <Segmented options={TABS} value={tab} onChange={setTab} />
          {tab === 'learn' ? (
            learnPicker
          ) : tab === 'songs' ? (
            songPicker
          ) : tab === 'practice' ? (
            practicePicker
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Key">
                  <KeySelect value={search.key} onChange={(key) => set({ key, root: key })} />
                </Field>
                <Field label="Scale" className="col-span-2">
                  <ScaleSelect value={scale.id} onChange={(id) => set({ scale: id })} />
                </Field>
              </div>
              {layoutControls}
              {inKeyPicker}
              {rootPicker}
              {chordPicker}
            </>
          )}
          {pianoCredit}
        </div>
      </aside>
      {/* Desktop: drag this edge to resize the sidebar. Arrow keys work too, and a double-click resets it. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Sidebar width"
        aria-valuenow={sidebar.width}
        aria-valuemin={SIDEBAR_MIN}
        aria-valuemax={SIDEBAR_MAX}
        tabIndex={0}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && sidebar.set(e.clientX)}
        onDoubleClick={() => sidebar.set(SIDEBAR_DEFAULT)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') sidebar.set(sidebar.width - 16)
          if (e.key === 'ArrowRight') sidebar.set(sidebar.width + 16)
        }}
        className="hidden w-1 shrink-0 cursor-col-resize bg-neutral-900 transition-colors hover:bg-neutral-600 focus-visible:bg-led focus-visible:outline-none lg:block"
      />

      <section className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 lg:gap-4 lg:px-8 lg:py-5">
        {exercise && <PracticeCard exercise={exercise} practice={practice} onExit={() => goToExercise(undefined)} />}
        {tutorial && (
          <TutorialCard
            tutorial={tutorial}
            nextTutorial={nextTutorial}
            index={stepIndex}
            connected={move.status === 'connected'}
            done={played}
            waitingForNext={waitingForNext || freePlay}
            match={match}
            held={heldMidi}
            onBack={() => goTo(tutorial, stepIndex - 1)}
            onNext={next}
            onExit={exitTutorial}
          />
        )}
        <div className="flex items-end justify-between gap-3">
          {showAll ? (
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">{search.sevenths ? 'Sevenths' : 'Triads'} in key</div>
              <h2 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {NOTE_NAMES[search.key]} {scale.name}
              </h2>
              <p className="text-sm text-neutral-400">Select a chord to open it.</p>
            </div>
          ) : (
            <div className="min-w-0">
              {current && practiceEvent?.kind !== 'note' && (
                <div className="text-xs text-neutral-500">
                  {current.numeral}
                  {search.sevenths ? '7' : ''} in {NOTE_NAMES[search.key]} {scale.name}
                </div>
              )}
              <h2 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {practiceEvent?.kind === 'note' ? noteWithOctave(practiceEvent.midi) : chordSymbol(search.root, type.id, type.name)}
              </h2>
              <p className="text-sm text-neutral-400">
                {practiceEvent?.kind === 'note' ? 'Next note' : chordPcs.map((p) => NOTE_NAMES[p]).join(' · ')}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!showAll && !exercise && (
              <div className="hidden items-center gap-2 lg:flex">
                <ShapeNav count={options.length} index={search.v} onChange={(v) => set({ v })} />
              </div>
            )}
            <button
              type="button"
              hidden={!!exercise}
              aria-pressed={showAll}
              onClick={() => set({ all: !showAll })}
              className={[
                'min-h-11 rounded-lg border px-3 text-sm lg:min-h-9',
                showAll ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500',
              ].join(' ')}
            >
              All in key
            </button>
            <button
              type="button"
              aria-pressed={sustain}
              title="Hold Shift on Move to sustain while you hold it."
              onClick={() => setSustainLatched(!sustainLatched)}
              className={[
                'min-h-11 rounded-lg border px-3 text-sm lg:min-h-9',
                sustain ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500',
              ].join(' ')}
            >
              Sustain
            </button>
            {!showAll && (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-led px-4 font-medium text-neutral-950 disabled:opacity-40 lg:min-h-9"
                disabled={!voicing}
                onClick={() => voicing && play(voicing.pads.map((p) => p.midi), true)}
              >
                Play
              </button>
            )}
          </div>
        </div>

        {showAll ? (
          diatonic.length > 0 ? (
            // Two full-width columns. Only this area scrolls, so the header and sidebar stay put.
            // The negative margin and padding keep the selected card's ring from being clipped.
            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                {diatonic.map((c) => {
                  const [best] = voicings(grid, c.rootPc, c.type, search.layout)
                  const selected = c.rootPc === search.root && c.type.id === search.chord
                  return (
                    <button
                      key={c.degree}
                      type="button"
                      onClick={() => set({ root: c.rootPc, chord: c.type.id, all: false })}
                      className="group flex flex-col gap-1.5 text-left [container-type:inline-size]"
                    >
                      <span className="flex h-5 items-baseline gap-2 text-sm">
                        <span className="text-xs text-neutral-500">{c.numeral}</span>
                        <span className={selected ? 'font-semibold text-led' : 'font-medium text-white'}>
                          {chordSymbol(c.rootPc, c.type.id, c.type.name)}
                        </span>
                        <span className="truncate text-xs text-neutral-500">
                          {c.type.tones.map((t) => NOTE_NAMES[mod(c.rootPc + t.interval, 12)]).join(' · ')}
                        </span>
                      </span>
                      <PadGrid
                        compact
                        grid={grid}
                        voicing={best}
                        keyPc={search.key}
                        inScale={inScale}
                        layout={search.layout}
                        className={[
                          'w-full rounded-xl p-[1.5%] ring-1 transition-colors',
                          selected ? 'ring-led' : 'ring-neutral-800 group-hover:ring-neutral-600',
                        ].join(' ')}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">In-key chords need a seven-note scale. Pick another scale.</p>
          )
        ) : (
          <>
            {/* Desktop: the 8×4 grid fits the smaller of the full width and twice the free height,
                leaving room under it for the legend and any notes. */}
            <div className="flex shrink-0 flex-col items-start gap-4 lg:min-h-0 lg:flex-1 lg:[container-type:size]">
              <PadGrid
                grid={grid}
                voicing={voicing}
                keyPc={search.key}
                inScale={inScale}
                layout={search.layout}
                held={move.held}
                chordPcs={chordPcs}
                onPad={(midi) => play([midi])}
                className={[
                  'w-full rounded-2xl p-[1.6cqmin] ring-1 ring-neutral-800',
                  hasNotes ? 'lg:w-[min(100cqw,calc((100cqh-4.5rem)*2))]' : 'lg:w-[min(100cqw,calc((100cqh-2.5rem)*2))]',
                ].join(' ')}
              />
              <div className="hidden flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500 lg:flex">
                <Swatch className="bg-led">Chord root</Swatch>
                <Swatch className="bg-white">Chord tone</Swatch>
                <Swatch className="bg-neutral-700/70">In scale</Swatch>
                {search.layout === 'chromatic' && (
                  <Swatch className="bg-neutral-950 ring-1 ring-neutral-700">Unlit on Move</Swatch>
                )}
                {voicing?.pads.some((p) => p.optional) && (
                  <Swatch className="ring-1 ring-white/70 ring-inset">Optional</Swatch>
                )}
              </div>
              {hasNotes && (
                <p className="text-xs text-neutral-500">
                  {!voicing && <span className="text-amber-400">This chord doesn't fit on the grid. </span>}
                  {voicing && voicing.missing.length > 0 && (
                    <span className="text-amber-400">
                      Can't play {voicing.missing.map((i) => NOTE_NAMES[mod(search.root + i, 12)]).join(', ')} in
                      key.{' '}
                    </span>
                  )}
                  {search.layout === 'chromatic' && voicing && !voicing.fromChart && (
                    <span>Not the chart shape: the chart shape doesn't fit from this root. </span>
                  )}
                  {search.layout === 'chromatic' && outOfKey.length > 0 && (
                    <span>Outside the scale: {outOfKey.map((p) => NOTE_NAMES[p]).join(', ')}.</span>
                  )}
                </p>
              )}
            </div>

            <div className={`flex items-center justify-center gap-3 lg:hidden ${exercise ? 'hidden' : ''}`}>
              <ShapeNav count={options.length} index={search.v} onChange={(v) => set({ v })} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 border-t border-neutral-900 pt-3 lg:hidden">
              <Segmented options={TABS} value={tab} onChange={setTab} />
              <div className="min-h-0 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  {tab === 'learn' ? learnPicker : tab === 'songs' ? songPicker : tab === 'practice' ? practicePicker : (
                    <>
                      {inKeyPicker}
                      {rootPicker}
                      {chordPicker}
                    </>
                  )}
                  {pianoCredit}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

/**
 * The 8×4 Move pad grid with one chord shape lit. With `onPad` each pad is a button.
 * `compact` drops interval labels and uses a thinner ring for small previews.
 */
function PadGrid({
  grid,
  voicing,
  keyPc,
  inScale,
  layout,
  compact,
  held,
  chordPcs,
  onPad,
  className,
}: {
  grid: Pad[][]
  voicing: Voicing | undefined
  keyPc: number
  inScale: Set<number>
  layout: Layout
  compact?: boolean
  /** Pads held on Move, as "col-row" keys. They get a green outline in the chord and red outside it. */
  held?: Set<string>
  chordPcs?: number[]
  onPad?: (midi: number) => void
  className: string
}) {
  const ring = compact ? 'ring-[1.5px] ring-white ring-offset-1 ring-offset-neutral-900' : chordRing
  return (
    <div
      className={`grid grid-cols-8 bg-neutral-900 ${compact ? 'gap-[1.2%]' : 'gap-[1.2cqmin]'} ${className}`}
    >
      {[...grid].reverse().flatMap((row) =>
        row.map((pad) => {
          const hit = voicing?.pads.find((p) => p.col === pad.col && p.row === pad.row)
          const isKeyRoot = mod(pad.midi, 12) === keyPc
          const lit = layout !== 'chromatic' || inScale.has(mod(pad.midi, 12))
          const padClass = [
            'flex aspect-square flex-col items-center justify-center rounded-[18%] font-medium transition-colors',
            compact ? 'text-[clamp(6px,2.4cqw,11px)]' : 'text-[clamp(9px,2.4cqmin,14px)]',
            hit
              ? hit.interval === 0
                ? `${ring} bg-led text-neutral-950 shadow-[0_0_24px_-4px_var(--color-led)]`
                : hit.optional
                  ? 'bg-neutral-800 text-white outline-2 -outline-offset-2 outline-white/70 outline-dashed'
                  : `${ring} bg-white text-neutral-950 shadow-[0_0_20px_-6px_white]`
              : isKeyRoot
                ? 'bg-led/25 text-led'
                : lit
                  ? 'bg-neutral-700/70 text-neutral-300'
                  : 'bg-neutral-950 text-neutral-600',
            held?.has(`${pad.col}-${pad.row}`) &&
              (chordPcs?.includes(mod(pad.midi, 12))
                ? 'outline-4 outline-offset-0 outline-solid outline-emerald-400'
                : 'outline-4 outline-offset-0 outline-solid outline-red-500'),
          ]
            .filter(Boolean)
            .join(' ')
          const label = (
            <>
              <span>{noteName(pad.midi)}</span>
              {hit && !compact && <span className="text-[0.75em] opacity-70">{intervalLabel(hit.interval)}</span>}
            </>
          )
          return onPad ? (
            <button
              key={`${pad.col}-${pad.row}`}
              type="button"
              onClick={() => onPad(pad.midi)}
              title={noteWithOctave(pad.midi)}
              className={padClass}
            >
              {label}
            </button>
          ) : (
            <span key={`${pad.col}-${pad.row}`} className={padClass}>
              {label}
            </span>
          )
        }),
      )}
    </div>
  )
}

/** Why connecting failed. Other statuses show no message. */
const CONNECT_PROBLEM: Partial<Record<MoveStatus, string>> = {
  unsupported: 'This browser has no Web MIDI. Use Chrome or Edge.',
  'not-found': 'Move not found. Check the USB-C cable and that Move is in Control Live Mode.',
  denied: 'MIDI access is blocked. Allow MIDI in the site settings, then try again.',
}

/** C major in Chromatic, as the pads show it: the played root cyan, other roots dim cyan, chord tones white. */
const ART_LIT: Record<string, string> = {
  '3-0': 'bg-led',
  '7-0': 'bg-white',
  '5-1': 'bg-white',
  '5-2': 'bg-led/40',
  '0-3': 'bg-led/40',
}

function ConnectScreen({ status, onConnect }: { status: MoveStatus; onConnect: () => void }) {
  const problem = CONNECT_PROBLEM[status]
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div aria-hidden className="grid grid-cols-8 gap-1.5">
          {[3, 2, 1, 0].flatMap((row) =>
            Array.from({ length: 8 }, (_, col) => (
              <div key={`${col}-${row}`} className={`size-5 rounded ${ART_LIT[`${col}-${row}`] ?? 'bg-neutral-800'}`} />
            )),
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-white">chords</h1>
          <p className="text-neutral-400">Learn chords and play along with songs on Ableton Move.</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onConnect}
            disabled={status === 'connecting'}
            className="min-h-11 rounded-xl bg-led px-6 text-base font-medium text-neutral-950 disabled:opacity-40"
          >
            {status === 'connecting' ? 'Connecting…' : 'Connect Move'}
          </button>
          {problem && <p className="text-sm text-amber-300">{problem}</p>}
        </div>
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-left text-sm text-neutral-500">
          <li>Connect Move to this computer with USB-C.</li>
          <li>On Move, hold Shift, press Step 2, select Control Live, then press the wheel.</li>
          <li>Move shows "Connect Live via USB-C". That is correct: Live does not have to be open.</li>
        </ol>
      </div>
    </main>
  )
}

function TutorialCard({
  tutorial,
  nextTutorial,
  index,
  connected,
  done,
  waitingForNext,
  match,
  held,
  onBack,
  onNext,
  onExit,
}: {
  tutorial: Tutorial
  nextTutorial: Tutorial | undefined
  index: number
  connected: boolean
  done: boolean
  waitingForNext: boolean
  match: ReturnType<typeof chordMatch>
  held: number[]
  onBack: () => void
  onNext: () => void
  onExit: () => void
}) {
  const step = tutorial.steps.at(index)
  const last = index === tutorial.steps.length - 1
  const heldNames = [...new Set(held.map(noteName))].join(' ')
  const nextKey = connected ? 'Press → on Move' : 'Press Next'
  // The prompt says what the player does now. It is the hand-over from the tutorial to the player.
  const prompt: { tone: string; text: string } = !step
    ? {
        tone: 'text-white',
        text: nextTutorial ? `${nextKey} for the next lesson: ${nextTutorial.name}.` : `${nextKey} to finish.`,
      }
    : step.kind === 'info'
      ? { tone: 'text-white', text: `${nextKey} to continue.` }
      : done
        ? { tone: 'text-emerald-300', text: last ? 'Correct. Let go for free play.' : 'Correct. Let go for the next step.' }
        : !connected
          ? { tone: 'text-neutral-400', text: 'Connect Move to check your playing, or press Next.' }
          : match === 'wrong'
            ? { tone: 'text-red-400', text: `${heldNames}: one or more notes are not in this chord.` }
            : match === 'partial'
              ? { tone: 'text-white', text: `${heldNames}: keep going.` }
              : { tone: 'text-white', text: 'Play the chord on Move.' }
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-medium text-neutral-300">{tutorial.name}</span>
        <span>{step ? `Step ${index + 1} of ${tutorial.steps.length}` : 'Free play'}</span>
        <button type="button" onClick={onExit} className="ml-auto hover:text-neutral-300">
          Exit
        </button>
      </div>
      <p className="text-sm text-neutral-300">
        {step
          ? step.text
          : 'You finished this lesson. Play anything you like. When you play a pad, the arrows on Move give way to the chord you pick in the sidebar.'}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`mr-auto flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 ring-1 ${
            waitingForNext ? 'bg-emerald-950/60 ring-emerald-700' : 'bg-neutral-800/60 ring-neutral-700'
          }`}
        >
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Your turn</span>
          <span className={prompt.tone}>{prompt.text}</span>
        </div>
        <div className="flex shrink-0 gap-2">
          <Chip label="Previous step" disabled={index === 0} onClick={onBack}>
            Back
          </Chip>
          <Chip label={!step ? (nextTutorial ? 'Next lesson' : 'Finish') : 'Next step'} onClick={onNext}>
            {!step ? (nextTutorial ? 'Next lesson' : 'Finish') : 'Next'}
          </Chip>
        </div>
      </div>
    </div>
  )
}

function SongCard({
  song,
  events,
  pos,
  played,
  connected,
  match,
  held,
  onBack,
  onNext,
  onJump,
  onExit,
}: {
  song: Song
  events: SongEvent[]
  pos: number
  played: boolean
  connected: boolean
  match: ReturnType<typeof chordMatch>
  held: number[]
  onBack: () => void
  onNext: () => void
  /** Goes to the chord at this index in `events`. */
  onJump: (pos: number) => void
  onExit: () => void
}) {
  const event = events.at(pos)
  const finished = !event
  const unknown = unknownChords(song)
  const heldNames = [...new Set(held.map(noteName))].join(' ')
  const nextKey = connected ? 'Press → on Move' : 'Press Again'
  const prompt: { tone: string; text: string } = events.length === 0
    ? { tone: 'text-neutral-400', text: 'This song has no chords that this app can read.' }
    : finished
      ? { tone: 'text-emerald-300', text: `Song finished. ${nextKey} to play it again.` }
      : !connected
        ? { tone: 'text-neutral-400', text: `Connect Move to play along, or press Skip. Next chord: ${chordLabel(event.chord)}.` }
        : played
          ? { tone: 'text-emerald-300', text: 'Correct. Let go to move on.' }
          : match === 'wrong'
          ? { tone: 'text-red-400', text: `${heldNames}: one or more notes are not in ${chordLabel(event.chord)}.` }
          : match === 'partial'
            ? { tone: 'text-white', text: `${heldNames}: keep going.` }
            : { tone: 'text-white', text: `Play ${chordLabel(event.chord)} on Move.` }
  const line = event?.line ?? song.lines.length
  const upNext = events.slice(pos + 1, pos + 5)
  // This card fills the Songs tab while a song plays, so it stacks for a narrow sidebar.
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onExit} className="self-start text-xs text-neutral-400 hover:text-white">
        ← All songs
      </button>
      <div className="min-w-0">
        <div className="truncate font-medium text-white">{song.title}</div>
        <div className="flex gap-2 text-xs text-neutral-500">
          {song.artist && <span className="truncate">{song.artist}</span>}
          <span className="shrink-0 tabular-nums">
            Chord {Math.min(pos + 1, events.length)} of {events.length}
          </span>
        </div>
      </div>
      {/* The whole song scrolls here, with the current line kept in the middle. Click a line to jump to it. */}
      <div className="relative flex max-h-[45vh] flex-col gap-1 overflow-y-auto rounded-xl bg-neutral-900 px-1.5 py-2 ring-1 ring-neutral-800">
        {song.lines.map((l, i) => {
          const first = events.findIndex((e) => e.line === i)
          const current = i === line
          return (
            <LyricLine
              key={i}
              line={l}
              current={current}
              onJump={first >= 0 && !current ? () => onJump(first) : undefined}
              state={(j) =>
                i < line || (current && j < (event?.index ?? 0)) ? 'done' : current && j === event?.index ? 'now' : 'later'
              }
            />
          )
        })}
      </div>
      {unknown.length > 0 && (
        <p className="text-xs text-neutral-500">Skipped chords that this app cannot read: {unknown.join(', ')}.</p>
      )}
      <div
        className={`flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ring-1 ${
          finished ? 'bg-emerald-950/60 ring-emerald-700' : 'bg-neutral-800/60 ring-neutral-700'
        }`}
      >
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Your turn</span>
        <span className={prompt.tone}>{prompt.text}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {upNext.length > 0 && (
          <div className="mr-auto flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            Then
            {upNext.map((e, i) => (
              <span key={i} className="rounded bg-neutral-800 px-1.5 py-0.5 font-medium text-neutral-300">
                {chordLabel(e.chord)}
              </span>
            ))}
          </div>
        )}
        <div className="ml-auto flex shrink-0 gap-2 text-sm">
          <Chip label="Start the song again" disabled={pos === 0} onClick={() => onJump(0)}>
            Start again
          </Chip>
          <Chip label="Previous chord" disabled={pos === 0} onClick={onBack}>
            Previous
          </Chip>
          <Chip label={finished ? 'Play again' : 'Skip chord'} onClick={onNext}>
            {finished ? 'Again' : 'Skip'}
          </Chip>
        </div>
      </div>
    </div>
  )
}

/**
 * A lyric line with each chord name above the syllable where it starts.
 * The current line is large and scrolls to the middle of its box. Other lines are small, and a click jumps to them.
 */
function LyricLine({
  line,
  state,
  current,
  onJump,
}: {
  line: Song['lines'][number]
  state: (index: number) => 'done' | 'now' | 'later'
  current: boolean
  onJump?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!current || !el || !box) return
    // Scroll only the lyrics box, not the sidebar or the page.
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' })
  }, [current])
  const first = line.chords[0]?.at ?? line.lyric.length
  const hasChords = line.chords.length > 0
  // Each word is its own box, so a narrow sidebar wraps between words. A chord sits on the first word of its part.
  const word = (text: string, key: string, chord?: React.ReactNode) => (
    <span key={key} className="inline-flex flex-col">
      {hasChords && <span className="h-5 self-start">{chord}</span>}
      <span className="whitespace-pre">{text || ' '}</span>
    </span>
  )
  const split = (text: string) => text.match(/\S*\s*/g)?.filter(Boolean) ?? []
  const words = (
    <>
      {split(line.lyric.slice(0, first)).map((w, k) => word(w, `lead-${k}`))}
      {line.chords.map((c, j) => {
        const text = line.lyric.slice(c.at, line.chords[j + 1]?.at ?? line.lyric.length)
        const st = state(j)
        const chordClass = !c.parsed
          ? 'text-neutral-600 line-through'
          : !current
            ? st === 'done'
              ? 'text-neutral-600'
              : 'text-led/60'
            : st === 'now'
              ? 'rounded bg-led px-1 text-neutral-950'
              : st === 'done'
                ? 'text-emerald-400'
                : 'text-led'
        const label = (
          <span className={`mr-2 text-sm font-semibold ${chordClass}`}>{c.parsed ? chordLabel(c.parsed) : c.name}</span>
        )
        const parts = split(text)
        return parts.length === 0
          ? word('', `c${j}`, label)
          : parts.map((w, k) => word(w, `c${j}-${k}`, k === 0 ? label : undefined))
      })}
    </>
  )
  const lineClass = `flex flex-wrap items-end rounded-lg px-1.5 py-1 text-left ${
    current ? 'bg-neutral-800/70 text-lg text-white' : 'text-sm text-neutral-500'
  }`
  return onJump ? (
    <div ref={ref}>
      <button type="button" onClick={onJump} title="Jump to this line" className={`${lineClass} w-full hover:bg-neutral-800 hover:text-neutral-300`}>
        {words}
      </button>
    </div>
  ) : (
    <div ref={ref} className={lineClass}>
      {words}
    </div>
  )
}

/** Short chord symbols, e.g. "E7", "F♯m", "DM7". */
function chordSymbol(rootPc: number, id: string, name: string) {
  const suffix = id === 'maj' ? '' : id === 'min' ? 'm' : id === '7' ? '7' : name
  return NOTE_NAMES[rootPc] + suffix
}

function ShapeNav({ count, index, onChange }: { count: number; index: number; onChange: (v: number) => void }) {
  if (count < 2) return null
  return (
    <>
      <Chip label="Previous shape" onClick={() => onChange(mod(index - 1, count))}>
        ←
      </Chip>
      <span className="text-xs tabular-nums text-neutral-400">
        Shape {mod(index, count) + 1} / {count}
      </span>
      <Chip label="Next shape" onClick={() => onChange(mod(index + 1, count))}>
        →
      </Chip>
    </>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; name: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-neutral-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={[
            'min-h-9 rounded-md px-2 text-[13px] transition-colors lg:min-h-8',
            value === o.id ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white',
          ].join(' ')}
        >
          {o.name}
        </button>
      ))}
    </div>
  )
}

function Group({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-medium tracking-wider text-neutral-500 uppercase">
        {label}
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  inline,
  className = '',
  children,
}: {
  label: string
  inline?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label
      className={[
        'flex gap-1 text-[10px] font-medium tracking-wider text-neutral-500 uppercase',
        inline ? 'items-center gap-2' : 'flex-col',
        className,
      ].join(' ')}
    >
      {label}
      {children}
    </label>
  )
}

const selectClass =
  'min-h-9 rounded-md border border-neutral-800 bg-neutral-900 px-2 text-sm font-normal tracking-normal text-neutral-200 normal-case lg:min-h-8'

function KeySelect({ value, onChange }: { value: number; onChange: (key: number) => void }) {
  return (
    <select aria-label="Key" className={selectClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {NOTE_NAMES.map((name, i) => (
        <option key={name} value={i}>
          {name}
        </option>
      ))}
    </select>
  )
}

function ScaleSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <select aria-label="Scale" className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {SCALES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}

function Swatch({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] ${className}`} />
      {children}
    </span>
  )
}

// A white ring with a gap in the grid's color marks every pad to press. Optional pads keep their dashed outline.
const chordRing = 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900'

const INTERVALS: Record<number, string> = {
  0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7',
  13: '♭9', 14: '9', 15: '♯9', 17: '11', 18: '♯11', 21: '13',
}
const intervalLabel = (i: number) => INTERVALS[i] ?? String(i)

function Chip({
  active,
  dim,
  disabled,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean
  dim?: boolean
  disabled?: boolean
  label?: string
  title?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={title}
      className={[
        'min-h-8 min-w-8 truncate rounded-md px-1.5 py-1 text-[13px] transition-colors',
        active
          ? 'bg-white text-neutral-950'
          : disabled
            ? 'cursor-not-allowed text-neutral-700 ring-1 ring-neutral-900 ring-inset'
            : dim
            ? 'bg-neutral-900 text-neutral-600 hover:bg-neutral-800'
            : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
