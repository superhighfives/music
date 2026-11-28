import type { ComponentChildren as ReactNode } from 'preact'
import { useId } from 'preact/hooks'
import { useAudio, usePressed } from '~/theory/lib/hooks'
import {
  ACCIDENTALS,
  BOTTOM_LINE,
  type Clef,
  keySignatureSteps,
  midiOf,
  type Note,
  noteName,
  parseNote,
  signatureAccidentals,
  staffStep,
} from '~/theory/lib/theory'
import type { Tone } from './Keyboard'

/** One column on the staff: a note, a chord, or a barline. */
export type StaffItem =
  | { notes: (Note | string)[]; tone?: Tone | undefined; label?: string; /** Force the staff on a grand staff. */ staff?: Clef }
  | { bar: true }

interface Props {
  clef?: Clef | 'grand'
  /** Columns, or shorthand: "C4 E4 G4" for notes in turn, "C4+E4+G4" for a chord, "|" for a barline. */
  items: StaffItem[] | string
  /** Sharps (positive) or flats (negative) in the key signature. */
  keySig?: number
  time?: [number, number]
  /** Column to light up, such as the one sounding. */
  current?: number | null
  /** Open noteheads like whole notes (the default), or filled ones. */
  heads?: 'open' | 'filled'
  /** Write each note's name under it. */
  names?: boolean
  /** Click a column to hear it. */
  sound?: boolean
  caption?: ReactNode
  /** Describes the figure, for screen readers. */
  label: string
}

const GAP = 10
const HALF = GAP / 2
const COLUMN = 44
/** Space above and below each staff for ledger lines. */
const PAD = 42
/** Between the treble and bass staves of a grand staff. */
const GRAND_GAP = 56

export function parseItems(s: string): StaffItem[] {
  return s
    .trim()
    .split(/\s+/)
    .map((tok) => (tok === '|' ? { bar: true as const } : { notes: tok.split('+') }))
}

const toNote = (n: Note | string) => (typeof n === 'string' ? parseNote(n) : n)

/** A five-line staff (or a grand staff) with notes on it. Click a note to hear it. */
export function Staff({ clef = 'treble', items, keySig = 0, time, current, heads = 'open', names, sound = true, caption, label }: Props) {
  const audio = useAudio()
  const pressed = usePressed<number>()
  const titleId = useId()
  const cols = typeof items === 'string' ? parseItems(items) : items
  const staves: Clef[] = clef === 'grand' ? ['treble', 'bass'] : [clef]
  const tops: Record<Clef, number> = { treble: PAD, bass: clef === 'grand' ? PAD + 4 * GAP + GRAND_GAP : PAD }
  const y = (c: Clef, step: number) => tops[c] + (BOTTOM_LINE[c] + 8 - step) * HALF
  const sigAccs = signatureAccidentals(keySig)

  const left = clef === 'grand' ? 16 : 4
  const sigX = left + 40
  const timeX = sigX + Math.abs(keySig) * 10 + 8
  const startX = timeX + (time ? 30 : 8)
  const width = startX + cols.length * COLUMN + 12
  const height = (clef === 'grand' ? tops.bass : PAD) + 4 * GAP + PAD + (names ? 18 : 0)
  const staffFor = (n: Note, forced?: Clef): Clef => (clef !== 'grand' ? clef : (forced ?? (midiOf(n) >= 60 ? 'treble' : 'bass')))

  return (
    <figure className="fig staff">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={titleId} style={{ maxWidth: width * 1.35 }}>
        <title id={titleId}>{label}</title>
        {staves.map((c) => (
          <g key={c}>
            {[0, 1, 2, 3, 4].map((i) => (
              <line key={i} className="line" x1={left} x2={width - 4} y1={tops[c] + i * GAP} y2={tops[c] + i * GAP} />
            ))}
            {/* Noto Music's clefs sit on their baselines: these offsets put the treble curl round G4 and the bass dots round F3. */}
            <text className="glyph clef" x={left + 4} y={c === 'treble' ? y(c, 32) + 4 : y(c, 24) + 26} fontSize={GAP * 4}>
              {c === 'treble' ? '𝄞' : '𝄢'}
            </text>
            {keySignatureSteps(keySig, c).map((s, i) => (
              <text key={i} className="glyph acc" x={sigX + i * 10} y={y(c, s)} fontSize={GAP * 3} dominantBaseline="central">
                {keySig > 0 ? '♯' : '♭'}
              </text>
            ))}
            {time ? (
              <g className="time">
                <text x={timeX + 9} y={tops[c] + 2 * GAP - 1} textAnchor="middle">
                  {time[0]}
                </text>
                <text x={timeX + 9} y={tops[c] + 4 * GAP - 1} textAnchor="middle">
                  {time[1]}
                </text>
              </g>
            ) : null}
          </g>
        ))}
        {clef === 'grand' ? (
          <>
            <line className="line" x1={left} x2={left} y1={tops.treble} y2={tops.bass + 4 * GAP} />
            <path className="brace" d={bracePath(left - 4, tops.treble, tops.bass + 4 * GAP)} />
          </>
        ) : null}
        <line className="line" x1={width - 4} x2={width - 4} y1={tops.treble} y2={(clef === 'grand' ? tops.bass : tops[staves[0]]) + 4 * GAP} />
        {cols.map((item, i) => {
          const cx = startX + i * COLUMN + COLUMN / 2
          if ('bar' in item)
            return staves.map((c) => <line key={`${i}${c}`} className="line" x1={cx} x2={cx} y1={tops[c]} y2={tops[c] + 4 * GAP} />)
          const notes = item.notes.map(toNote)
          const lit = current === i
          const midis = notes.map(midiOf)
          const play = () => sound && audio.play(midis, notes.length > 2)
          const { press: hold, ...release } = pressed.handlers(i)
          // Notes a step apart in a chord can't share a column, so every other one moves right.
          const sorted = [...notes].sort((a, b) => staffStep(a) - staffStep(b))
          let shifted = false
          const offset = new Map<Note, number>()
          sorted.forEach((n, j) => {
            shifted = j > 0 && staffStep(n) - staffStep(sorted[j - 1]) === 1 && !shifted
            offset.set(n, shifted ? 11 : 0)
          })
          return (
            <g
              key={i}
              className={['col', item.tone ?? '', lit ? 'now' : '', pressed.down === i ? 'down' : ''].filter(Boolean).join(' ')}
              role={sound ? 'button' : undefined}
              tabIndex={sound ? 0 : undefined}
              aria-label={sound ? `Play ${notes.map(noteName).join(', ')}` : undefined}
              onPointerDown={
                sound
                  ? () => {
                      hold()
                      play()
                    }
                  : undefined
              }
              onKeyDown={(e) => {
                if (sound && (e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                  e.preventDefault()
                  hold()
                  play()
                }
              }}
              {...(sound ? release : {})}
            >
              <rect className="hit" x={cx - COLUMN / 2} y={0} width={COLUMN} height={height} />
              {notes.map((n, j) => {
                const c = staffFor(n, item.staff)
                const step = staffStep(n)
                const ny = y(c, step)
                const nx = cx + (offset.get(n) ?? 0)
                const bottom = BOTTOM_LINE[c]
                const ledgers: number[] = []
                for (let s = bottom - 2; s >= step; s -= 2) ledgers.push(s)
                for (let s = bottom + 10; s <= step; s += 2) ledgers.push(s)
                const showAcc = n.acc !== sigAccs[n.letter]
                return (
                  <g key={j}>
                    {ledgers.map((s) => (
                      <line key={s} className="line ledger" x1={nx - 10} x2={nx + 10} y1={y(c, s)} y2={y(c, s)} />
                    ))}
                    {showAcc ? (
                      <text className="glyph acc" x={nx - 11 - (offset.get(n) ?? 0)} y={ny} fontSize={GAP * 3} textAnchor="end" dominantBaseline="central">
                        {n.acc === 0 ? '♮' : ACCIDENTALS[n.acc]}
                      </text>
                    ) : null}
                    <ellipse
                      className={heads === 'open' ? 'head open' : 'head'}
                      cx={nx}
                      cy={ny}
                      rx={6.4}
                      ry={4.6}
                      transform={`rotate(-20 ${nx} ${ny})`}
                    />
                  </g>
                )
              })}
              {names || item.label ? (
                <text className="notelabel" x={cx} y={height - 6} textAnchor="middle">
                  {item.label ?? notes.map((n) => noteName(n)).join(' ')}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

/** A curly brace joining a grand staff's two staves. */
function bracePath(x: number, y1: number, y2: number) {
  const m = (y1 + y2) / 2
  const w = 9
  return `M${x},${y1} C${x - w},${y1 + 10} ${x},${m - 14} ${x - w},${m} C${x},${m + 14} ${x - w},${y2 - 10} ${x},${y2} C${x - w + 3},${y2 - 12} ${x - 3},${m + 12} ${x - w - 1},${m} C${x - 3},${m - 12} ${x - w + 3},${y1 + 12} ${x},${y1}Z`
}
