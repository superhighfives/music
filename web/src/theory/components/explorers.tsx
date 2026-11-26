import { useState } from 'react'
import { usePlayer } from '~/theory/lib/audio'
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
export function NoteFinder({ letter, from = 48, to = 83 }: { letter: string; from?: number; to?: number }) {
  const target = parseNote(`${letter}4`)
  const pc = midiOf(target) % 12
  const all: number[] = []
  for (let m = from; m <= to; m++) if (m % 12 === pc) all.push(m)
  const [found, setFound] = useState<number[]>([])
  const [miss, setMiss] = useState<number | null>(null)
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
            <button type="button" className="link" onClick={() => setFound([])}>
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
        onKey={(m) => {
          if (m % 12 === pc) {
            setMiss(null)
            setFound((f) => (f.includes(m) ? f : [...f, m]))
          } else setMiss(m)
        }}
      />
    </div>
  )
}

/** Press two keys to see how far apart they are, in semitones and by name. */
export function IntervalExplorer({ from = 60, to = 83, mode = 'semitones' }: { from?: number; to?: number; mode?: 'semitones' | 'steps' }) {
  const [picked, setPicked] = useState<number[]>([60, 64])
  const player = usePlayer()
  const [a, b] = [...picked].sort((x, y) => x - y)
  const semis = b !== undefined ? b - a : 0
  const marks: Record<number, Mark> = {}
  if (a !== undefined) marks[a] = { tone: 'lit' }
  if (b !== undefined) marks[b] = { tone: 'cool' }
  const arcs = []
  if (b !== undefined && mode === 'steps') for (let m = a; m < b; m++) arcs.push({ from: m, to: m + 1, label: '½' })
  else if (b !== undefined && b !== a) arcs.push({ from: a, to: b, label: `${semis}` })
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
          playing={player.playing}
          label="Play both"
          onClick={() =>
            b !== undefined &&
            player.start(
              [
                { notes: [a], beats: 1 },
                { notes: [b], beats: 1 },
                { notes: [a, b], beats: 2 },
              ],
              { bpm: 90 },
            )
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
        onKey={(m) => setPicked((p) => (p.length >= 2 ? [m] : [...p, m]))}
      />
    </div>
  )
}

/** Major-key tonics, spelled the way their key signatures spell them. */
const ROOTS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

/** Pick a root and a scale; see it on the keyboard and staff, with its steps, and hear it. */
export function ScaleExplorer({ types = ['major'], initial = 'C' }: { types?: string[]; initial?: string }) {
  const [root, setRoot] = useState(initial)
  const [typeId, setTypeId] = useState(types[0])
  const player = usePlayer()
  const notes = scale(parseNote(`${root}4`), scaleType(typeId))
  const midis = notes.map(midiOf)
  const steps = stepPattern(notes)
  const playingIndex = player.current === null ? null : player.current < notes.length ? player.current : notes.length * 2 - 2 - player.current
  const marks: Record<number, Mark> = {}
  midis.forEach((m, i) => (marks[m] = { tone: i === playingIndex ? 'lit' : i === 0 || i === 7 ? 'cool' : 'soft', label: pitchName(notes[i]) }))
  const arcs = steps.map((s, i) => ({ from: midis[i], to: midis[i + 1], label: s, tone: s === 'H' ? ('lit' as const) : undefined }))
  const run = [...midis, ...midis.slice(0, -1).reverse()]
  return (
    <div className="explorer">
      <div className="figbar">
        <label className="pick">
          <span className="lab">Root</span>
          <select value={root} onChange={(e) => setRoot(e.target.value)}>
            {ROOTS.map((r) => (
              <option key={r} value={r}>
                {pitchName(parseNote(`${r}4`))}
              </option>
            ))}
          </select>
        </label>
        {types.length > 1 ? (
          <label className="pick">
            <span className="lab">Scale</span>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {SCALE_TYPES.filter((t) => types.includes(t.id)).map((t) => (
                <option key={t.id} value={t.id}>
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
      <Keyboard from={60} to={84} names="none" marks={marks} arcs={arcs} label={`${pitchName(notes[0])} ${scaleType(typeId).name.toLowerCase()} scale on the keyboard`} />
      <Staff
        items={notes.map((n, i) => ({ notes: [n], tone: i === playingIndex ? 'lit' : undefined }))}
        names
        label={`${pitchName(notes[0])} ${scaleType(typeId).name.toLowerCase()} scale on the staff`}
      />
      <p className="readout center">
        {steps.map((s, i) => (
          <span key={i} className={s === 'H' ? 'stepchip h' : 'stepchip'}>
            {s}
          </span>
        ))}
      </p>
    </div>
  )
}

/** Shows two intervals spelled from the same root, to compare by letter as well as sound. */
export function SpelledInterval({ a, b }: { a: string; b: string }) {
  const iv = interval(parseNote(a), parseNote(b))
  return (
    <span className="readout">
      {noteName(parseNote(a))} → {noteName(parseNote(b))}: <b>{iv.name}</b> ({iv.semitones} semitones)
    </span>
  )
}

/** A random note on the staff; name it. Keeps a streak. */
export function NoteNamer({ clef = 'treble', range }: { clef?: Clef; range?: [string, string] }) {
  const [lo, hi] = range ?? (clef === 'treble' ? ['C4', 'A5'] : ['E2', 'C4'])
  const pick = (): Note => {
    const a = parseNote(lo)
    const b = parseNote(hi)
    const s0 = a.octave * 7 + a.letter
    const s1 = b.octave * 7 + b.letter
    const s = s0 + Math.floor(Math.random() * (s1 - s0 + 1))
    return { letter: s % 7, acc: 0, octave: Math.floor(s / 7) }
  }
  // The server and first render use the clef's middle line, so hydration matches; new notes are random.
  const [note, setNote] = useState<Note>(() => ({ letter: (BOTTOM_LINE[clef] + 4) % 7, acc: 0, octave: Math.floor((BOTTOM_LINE[clef] + 4) / 7) }))
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [wrong, setWrong] = useState<number | null>(null)
  const player = usePlayer()
  const answer = (letter: number) => {
    if (letter === note.letter) {
      player.play([midiOf(note)])
      setStreak((s) => {
        setBest((b) => Math.max(b, s + 1))
        return s + 1
      })
      setWrong(null)
      let next = pick()
      while (next.letter === note.letter && next.octave === note.octave) next = pick()
      setNote(next)
    } else {
      setWrong(letter)
      setStreak(0)
    }
  }
  return (
    <div className="explorer namer">
      <Staff clef={clef} items={[{ notes: [note] }]} label={`A note on the ${clef} staff to name`} />
      <div className="opts letters" role="group" aria-label="Note names">
        {LETTERS.map((l, i) => (
          <button key={l} type="button" className={wrong === i ? 'opt bad' : 'opt'} onClick={() => answer(i)}>
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
}
