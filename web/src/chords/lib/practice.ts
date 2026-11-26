import { NOTE_NAMES, chordType, mod, noteName } from './music'

/*
 * Practice: play notes and chords on time against a moving playhead.
 * Times are in beats from the start of the exercise. The count-in comes before beat 0.
 */

export type PracticeEvent = { beat: number; length: number } & (
  | { kind: 'note'; midi: number }
  | { kind: 'chord'; root: number; chord: string }
)

export type Exercise = {
  id: string
  name: string
  summary: string
  bpm: number
  key: number
  scale: string
  beatsPerBar: number
  /** Length in beats. The run ends here. */
  beats: number
  events: PracticeEvent[]
}

/** A pad press on the run's clock: milliseconds from beat 0, at the speed the run uses. */
export type Press = { ms: number; midi: number }

export type Judgment = 'pending' | 'perfect' | 'early' | 'late' | 'missed'
export type Result = { judgment: Judgment; offsetMs?: number }

/** Short name for the playhead strip, such as "Am" or "E". */
export const eventLabel = (e: PracticeEvent) =>
  e.kind === 'note' ? noteName(e.midi) : NOTE_NAMES[e.root] + ({ maj: '', min: 'm' }[e.chord] ?? chordType(e.chord).name)

/** A press this close to the beat is perfect. */
export const PERFECT_MS = 50
/** A press this close to the beat still counts, as early or late. Later than this, the note is missed. */
export const HIT_MS = 120

/** Pitch classes that must sound for the event to count. Optional chord tones, such as a 5th, are left out. */
export const eventPcs = (e: PracticeEvent) =>
  e.kind === 'note'
    ? [mod(e.midi, 12)]
    : chordType(e.chord)
        .tones.filter((t) => !t.optional)
        .map((t) => mod(e.root + t.interval, 12))

/** Pitch classes that are correct for the event: its required tones and any optional ones. */
export const eventAllowedPcs = (e: PracticeEvent) =>
  e.kind === 'note' ? [mod(e.midi, 12)] : chordType(e.chord).tones.map((t) => mod(e.root + t.interval, 12))

/**
 * Scores the presses so far against the events.
 * Each event takes, for each of its required pitch classes, the earliest unused press within HIT_MS of the beat.
 * A chord's offset is the mean offset of its presses, so a quick strum still counts as on time.
 * `nowMs` decides which events can still be hit (pending) and which are missed.
 * `wrong` counts presses that no event used and no pending event can still use.
 */
export function judge(events: PracticeEvent[], presses: Press[], msPerBeat: number, nowMs: number) {
  const used = new Set<number>()
  const results: Result[] = events.map((e) => {
    const at = e.beat * msPerBeat
    const chosen: number[] = []
    for (const pc of eventPcs(e)) {
      const i = presses.findIndex((p, j) => !used.has(j) && !chosen.includes(j) && mod(p.midi, 12) === pc && Math.abs(p.ms - at) <= HIT_MS)
      if (i >= 0) chosen.push(i)
    }
    if (chosen.length === eventPcs(e).length) {
      for (const i of chosen) used.add(i)
      // Extra chord tones pressed with the chord, such as a doubled root, are part of the chord, not wrong notes.
      const allowed = eventAllowedPcs(e)
      presses.forEach((p, j) => {
        if (!used.has(j) && allowed.includes(mod(p.midi, 12)) && Math.abs(p.ms - at) <= HIT_MS) used.add(j)
      })
      const offsetMs = chosen.reduce((sum, i) => sum + presses[i].ms - at, 0) / chosen.length
      const judgment = Math.abs(offsetMs) <= PERFECT_MS ? 'perfect' : offsetMs < 0 ? 'early' : 'late'
      return { judgment, offsetMs }
    }
    return { judgment: nowMs > at + HIT_MS ? 'missed' : 'pending' }
  })
  const wrong = presses.filter((p, j) => {
    if (used.has(j)) return false
    // A press that a pending event can still use is not wrong yet.
    return !events.some(
      (e, i) =>
        results[i].judgment === 'pending' &&
        eventAllowedPcs(e).includes(mod(p.midi, 12)) &&
        Math.abs(p.ms - e.beat * msPerBeat) <= HIT_MS,
    )
  }).length
  return { results, wrong }
}

/** Totals for the end of a run. Accuracy counts a perfect hit as 1 and an early or late hit as 0.5. */
export function summarize(results: Result[], wrong: number) {
  const count = (j: Judgment) => results.filter((r) => r.judgment === j).length
  const perfect = count('perfect')
  const early = count('early')
  const late = count('late')
  const missed = count('missed')
  let streak = 0
  let bestStreak = 0
  for (const r of results) {
    streak = r.judgment === 'perfect' || r.judgment === 'early' || r.judgment === 'late' ? streak + 1 : 0
    bestStreak = Math.max(bestStreak, streak)
  }
  // Wrong notes count against the score, so pressing every pad cannot get 100%.
  const total = results.length + wrong
  const accuracy = total ? Math.round((100 * (perfect + 0.5 * (early + late))) / total) : 0
  return { perfect, early, late, missed, wrong, bestStreak, accuracy }
}

const C = 0
const F = 5
const G = 7
const A = 9

/** Notes in C, numbered as MIDI. On the default Chromatic grid, bottom-left A2, these are all on the pads. */
const N = { C3: 60, D3: 62, E3: 64, F3: 65, G3: 67, A3: 69, B3: 71, C4: 72 }

const chords = (list: [beat: number, length: number, root: number, chord: string][]): PracticeEvent[] =>
  list.map(([beat, length, root, chord]) => ({ kind: 'chord', beat, length, root, chord }))

/** Notes in order. Each length is in beats, and each note starts when the one before ends. */
function melody(notes: [midi: number, length: number][]): PracticeEvent[] {
  let beat = 0
  return notes.map(([midi, length]) => {
    const e: PracticeEvent = { kind: 'note', beat, length, midi }
    beat += length
    return e
  })
}

/** Four hits of each chord, one on every beat. */
const onTheBeat = [C, F, G, C].flatMap((root, bar) =>
  [0, 1, 2, 3].map((b): [number, number, number, string] => [bar * 4 + b, 1, root, 'maj']),
)

/*
 * Exercises written for this app. The melodies are public domain:
 * Ode to Joy (Beethoven, 1824) and Twinkle, Twinkle, Little Star (traditional).
 */
export const EXERCISES: Exercise[] = [
  {
    id: 'on-the-beat',
    name: 'On the beat',
    summary: 'C, F, G, C: one chord on every beat',
    bpm: 80,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: chords(onTheBeat),
  },
  {
    id: 'pop-halves',
    name: 'Pop loop in halves',
    summary: 'C, G, Am, F on beats 1 and 3',
    bpm: 90,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: chords(
      [C, G, A, F].flatMap((root, bar): [number, number, number, string][] => [
        [bar * 4, 2, root, root === A ? 'min' : 'maj'],
        [bar * 4 + 2, 2, root, root === A ? 'min' : 'maj'],
      ]),
    ),
  },
  {
    id: 'pushed',
    name: 'Pushed chords',
    summary: 'Am, F, C, G on 1, the "and" of 2, and 4',
    bpm: 76,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: chords(
      [A, F, C, G].flatMap((root, bar): [number, number, number, string][] => [
        [bar * 4, 1.5, root, root === A ? 'min' : 'maj'],
        [bar * 4 + 1.5, 1.5, root, root === A ? 'min' : 'maj'],
        [bar * 4 + 3, 1, root, root === A ? 'min' : 'maj'],
      ]),
    ),
  },
  {
    id: 'c-scale',
    name: 'C major scale',
    summary: 'Up and down one octave',
    bpm: 90,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: melody([
      [N.C3, 1], [N.D3, 1], [N.E3, 1], [N.F3, 1], [N.G3, 1], [N.A3, 1], [N.B3, 1], [N.C4, 1],
      [N.C4, 1], [N.B3, 1], [N.A3, 1], [N.G3, 1], [N.F3, 1], [N.E3, 1], [N.D3, 1], [N.C3, 1],
    ]),
  },
  {
    id: 'twinkle',
    name: 'Twinkle, Twinkle',
    summary: 'Melody, quarter and half notes',
    bpm: 90,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: melody([
      [N.C3, 1], [N.C3, 1], [N.G3, 1], [N.G3, 1], [N.A3, 1], [N.A3, 1], [N.G3, 2],
      [N.F3, 1], [N.F3, 1], [N.E3, 1], [N.E3, 1], [N.D3, 1], [N.D3, 1], [N.C3, 2],
    ]),
  },
  {
    id: 'ode-to-joy',
    name: 'Ode to Joy',
    summary: 'Melody with a dotted rhythm at the end',
    bpm: 100,
    key: C,
    scale: 'major',
    beatsPerBar: 4,
    beats: 16,
    events: melody([
      [N.E3, 1], [N.E3, 1], [N.F3, 1], [N.G3, 1], [N.G3, 1], [N.F3, 1], [N.E3, 1], [N.D3, 1],
      [N.C3, 1], [N.C3, 1], [N.D3, 1], [N.E3, 1], [N.E3, 1.5], [N.D3, 0.5], [N.D3, 2],
    ]),
  },
]

export const exerciseById = (id: string | undefined) => EXERCISES.find((e) => e.id === id)
