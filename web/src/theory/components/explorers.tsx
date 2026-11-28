/** @jsxImportSource ~/content */
import { Schema } from 'effect'
import { figure } from '~/theory/app/define'
import {
  BOTTOM_LINE,
  type Clef,
  interval,
  LETTERS,
  midiOf,
  type Note,
  noteName,
  parseNote,
  pitchName,
  scale,
  SCALE_TYPES,
  scaleType,
  SEMITONE_NAMES,
  spell,
  stepPattern,
} from '~/theory/lib/theory'
import { Keyboard, type Mark } from './Keyboard'
import { Staff } from './Staff'
import { PlayButton } from './ui'

/** "Find every D": press keys until you've found each one in range. */
export const NoteFinder = figure('NoteFinder', {
  args: Schema.Struct({ letter: Schema.String, from: Schema.optionalKey(Schema.Number), to: Schema.optionalKey(Schema.Number) }),
  state: Schema.Struct({ found: Schema.Array(Schema.Number), miss: Schema.NullOr(Schema.Number) }),
  init: () => ({ found: [], miss: null }),
  view: ({ letter, from = 48, to = 83 }, { found, miss }, act) => {
    const target = parseNote(`${letter}4`)
    const pc = midiOf(target) % 12
    const all: number[] = []
    for (let m = from; m <= to; m++) if (m % 12 === pc) all.push(m)
    const marks: Record<number, Mark> = {}
    for (const m of found) marks[m] = { tone: 'good', label: pitchName(target) }
    if (miss !== null) marks[miss] = { tone: 'bad', label: pitchName(spell(miss)) }
    const done = found.length === all.length
    return (
      <div className="explorer">
        <p className="prompt">
          {done ? (
            <>
              All {all.length} found. Every {pitchName(target)} sits in the same spot in the pattern of black keys.{' '}
              <button type="button" className="link" onClick={() => act.set({ found: [], miss: null })}>
                Again
              </button>
            </>
          ) : (
            <>
              Find every <b>{pitchName(target)}</b>: {found.length} of {all.length}
            </>
          )}
        </p>
        <Keyboard
          from={from}
          to={to}
          names="none"
          marks={marks}
          label={`Keyboard: find every ${pitchName(target)}`}
          onKey={(m) =>
            act.set(m % 12 === pc ? { found: found.includes(m) ? found : [...found, m], miss: null } : { found, miss: m }, { play: [m] })
          }
        />
      </div>
    )
  },
})

/** Press two keys to see how far apart they are, in semitones and by name. */
export const IntervalExplorer = figure('IntervalExplorer', {
  args: Schema.Struct({
    from: Schema.optionalKey(Schema.Number),
    to: Schema.optionalKey(Schema.Number),
    mode: Schema.optionalKey(Schema.Literals(['semitones', 'steps'])),
  }),
  state: Schema.Struct({ picked: Schema.Array(Schema.Number) }),
  init: () => ({ picked: [60, 64] }),
  view: ({ from = 60, to = 83, mode = 'semitones' }, { picked }, act) => {
    const [a, b] = [...picked].sort((x, y) => x - y)
    const semis = a !== undefined && b !== undefined ? b - a : 0
    const marks: Record<number, Mark> = {}
    if (a !== undefined) marks[a] = { tone: 'lit' }
    if (b !== undefined) marks[b] = { tone: 'cool' }
    const arcs: { from: number; to: number; label: string }[] = []
    if (a !== undefined && b !== undefined && mode === 'steps') for (let m = a; m < b; m++) arcs.push({ from: m, to: m + 1, label: '½' })
    else if (a !== undefined && b !== undefined && b !== a) arcs.push({ from: a, to: b, label: `${semis}` })
    const description =
      b === undefined
        ? 'Now press a second key.'
        : mode === 'steps'
          ? `${semis} half ${semis === 1 ? 'step' : 'steps'}${semis % 2 === 0 && semis > 0 ? `, or ${semis / 2} whole ${semis === 2 ? 'step' : 'steps'}` : ''}`
          : semis <= 12
            ? `${semis} ${semis === 1 ? 'semitone' : 'semitones'}: a ${SEMITONE_NAMES[semis]}`
            : `${semis} semitones`
    return (
      <div className="explorer">
        <div className="figbar">
          <PlayButton
            playing={act.playing}
            label="Play both"
            onClick={() =>
              a !== undefined && b !== undefined
                ? act.start(
                    [
                      { notes: [a], beats: 1 },
                      { notes: [b], beats: 1 },
                      { notes: [a, b], beats: 2 },
                    ],
                    { bpm: 90 },
                  )
                : undefined
            }
          />
          <span className="readout">
            {a !== undefined ? noteName(spell(a)) : ''}
            {b !== undefined ? ` → ${noteName(spell(b))}` : ''} <b>{description}</b>
          </span>
        </div>
        <Keyboard
          from={from}
          to={to}
          names="white"
          marks={marks}
          arcs={arcs}
          label="Keyboard: press two keys to measure the distance between them"
          onKey={(m) => act.set({ picked: picked.length >= 2 ? [m] : [...picked, m] }, { play: [m] })}
        />
      </div>
    )
  },
})

/** Major-key tonics, spelled the way their key signatures spell them. */
const ROOTS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

/** Pick a root and a scale; see it on the keyboard and staff, with its steps, and hear it. */
export const ScaleExplorer = figure('ScaleExplorer', {
  args: Schema.Struct({ types: Schema.optionalKey(Schema.Array(Schema.String)), initial: Schema.optionalKey(Schema.String) }),
  state: Schema.Struct({ root: Schema.String, typeId: Schema.String }),
  init: ({ types, initial }) => ({ root: initial ?? 'C', typeId: types?.[0] ?? 'major' }),
  view: ({ types = ['major'] }, { root, typeId }, player) => {
    const notes = scale(parseNote(`${root}4`), scaleType(typeId))
    const midis = notes.map(midiOf)
    const steps = stepPattern(notes)
    const playingIndex = player.current === null ? null : player.current < notes.length ? player.current : notes.length * 2 - 2 - player.current
    const marks: Record<number, Mark> = {}
    midis.forEach((m, i) => (marks[m] = { tone: i === playingIndex ? 'lit' : i === 0 || i === 7 ? 'cool' : 'soft', label: pitchName(notes[i]!) }))
    const arcs = steps.flatMap((s, i) => {
      const from = midis[i]
      const to = midis[i + 1]
      return from === undefined || to === undefined ? [] : [s === 'H' ? { from, to, label: s, tone: 'lit' as const } : { from, to, label: s }]
    })
    const run = [...midis, ...midis.slice(0, -1).reverse()]
    const name = `${pitchName(notes[0]!)} ${scaleType(typeId).name.toLowerCase()}`
    return (
      <div className="explorer">
        <div className="figbar">
          <label className="pick">
            <span className="lab">Root</span>
            <select value={root} onChange={(e) => player.set({ root: e.value, typeId })}>
              {ROOTS.map((r) => (
                <option value={r} selected={r === root}>
                  {pitchName(parseNote(`${r}4`))}
                </option>
              ))}
            </select>
          </label>
          {types.length > 1 ? (
            <label className="pick">
              <span className="lab">Scale</span>
              <select value={typeId} onChange={(e) => player.set({ root, typeId: e.value })}>
                {SCALE_TYPES.filter((t) => types.includes(t.id)).map((t) => (
                  <option value={t.id} selected={t.id === typeId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <PlayButton
            playing={player.playing}
            onClick={() => (player.playing ? player.stop() : player.start(run.map((m) => ({ notes: [m], beats: 0.5 })), { bpm: 100 }))}
          />
        </div>
        <Keyboard from={60} to={84} names="none" marks={marks} arcs={arcs} label={`${name} scale on the keyboard`} />
        <Staff items={notes.map((n, i) => (i === playingIndex ? { notes: [n], tone: 'lit' as const } : { notes: [n] }))} names label={`${name} scale on the staff`} />
        <p className="readout center">
          {steps.map((s) => (
            <span className={s === 'H' ? 'stepchip h' : 'stepchip'}>{s}</span>
          ))}
        </p>
      </div>
    )
  },
})

/** Shows two intervals spelled from the same root, to compare by letter as well as sound. */
export function SpelledInterval({ a, b }: { a: string; b: string }) {
  const iv = interval(parseNote(a), parseNote(b))
  return (
    <span className="readout">
      {noteName(parseNote(a))} → {noteName(parseNote(b))}: <b>{iv.name}</b> ({iv.semitones} semitones)
    </span>
  )
}

const NoteSchema = Schema.Struct({ letter: Schema.Number, acc: Schema.Number, octave: Schema.Number })

/** A random note on the staff; name it. Keeps a streak. */
export const NoteNamer = figure('NoteNamer', {
  args: Schema.Struct({
    clef: Schema.optionalKey(Schema.Literals(['treble', 'bass'])),
    range: Schema.optionalKey(Schema.Tuple([Schema.String, Schema.String])),
  }),
  state: Schema.Struct({ note: NoteSchema, streak: Schema.Number, best: Schema.Number, wrong: Schema.NullOr(Schema.Number) }),
  // The server and first render use the clef's middle line, so hydration matches; new notes are random.
  init: ({ clef = 'treble' }) => {
    const middle = BOTTOM_LINE[clef] + 4
    return { note: { letter: middle % 7, acc: 0, octave: Math.floor(middle / 7) }, streak: 0, best: 0, wrong: null }
  },
  view: ({ clef = 'treble', range }, state, act) => {
    const [lo, hi] = range ?? (clef === 'treble' ? ['C4', 'A5'] : ['E2', 'C4'])
    const { note, streak, best, wrong } = state
    // Runs when a letter is pressed, not while drawing, so the random pick only happens in the browser.
    const pick = (): Note => {
      const a = parseNote(lo)
      const b = parseNote(hi)
      const s0 = a.octave * 7 + a.letter
      const s1 = b.octave * 7 + b.letter
      const s = s0 + Math.floor(Math.random() * (s1 - s0 + 1))
      return { letter: s % 7, acc: 0, octave: Math.floor(s / 7) }
    }
    const answer = (letter: number) => {
      if (letter !== note.letter) return act.set({ ...state, wrong: letter, streak: 0 })
      let next = pick()
      while (next.letter === note.letter && next.octave === note.octave) next = pick()
      return act.set({ note: next, streak: streak + 1, best: Math.max(best, streak + 1), wrong: null }, { play: [midiOf(note)] })
    }
    const c: Clef = clef
    return (
      <div className="explorer namer">
        <Staff clef={c} items={[{ notes: [note] }]} label={`A note on the ${clef} staff to name`} />
        <div className="opts letters" role="group" aria-label="Note names">
          {LETTERS.map((l, i) => (
            <button type="button" className={wrong === i ? 'opt bad' : 'opt'} onClick={() => answer(i)}>
              {l}
            </button>
          ))}
        </div>
        <p className="readout center">
          Streak <b>{streak}</b> · best {best}
          {wrong !== null ? ` · that's not ${LETTERS[wrong]}: count up from a line you know` : ''}
        </p>
      </div>
    )
  },
})
