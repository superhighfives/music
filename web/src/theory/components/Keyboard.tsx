import type { ComponentChildren as ReactNode } from 'preact'
import { useId } from 'preact/hooks'
import { useAudio } from '~/theory/lib/hooks'
import { isBlackKey, pitchName, spell } from '~/theory/lib/theory'

export type Tone = 'lit' | 'cool' | 'good' | 'bad' | 'soft'

/** How one key is marked: a colour, and a label written on it. */
export type Mark = { tone?: Tone; label?: string }

interface Props {
  /** Lowest and highest MIDI notes shown. Both should be white keys. */
  from?: number
  to?: number
  /** Keys to colour or label, by MIDI note. */
  marks?: Record<number, Mark>
  /** Names on keys without a mark: none, only the Cs, every white key, or every key. */
  names?: 'none' | 'c' | 'white' | 'all'
  /** Spell black keys with sharps or flats. */
  prefer?: 'sharp' | 'flat'
  /** Called on a key press, after it plays. */
  onKey?: (midi: number) => void
  /** Keys don't sound when false. */
  sound?: boolean
  /** Arcs drawn between keys, such as steps in a scale, each with a label. Pass [] to keep room for arcs to come. */
  arcs?: { from: number; to: number; label: string; tone?: Tone | undefined }[]
  caption?: ReactNode
  /** Describes what's marked, for screen readers. */
  label: string
}

const W = 26
const H = 128
const BW = 16
const BH = 80
const ARC_SPACE = 34

/** A playable piano keyboard. Press a key to hear it. */
export function Keyboard({ from = 60, to = 83, marks = {}, names = 'c', prefer = 'sharp', onKey, sound = true, arcs, caption, label }: Props) {
  const audio = useAudio()
  const titleId = useId()
  const whites: number[] = []
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m)
  // Space for arcs is kept whenever arcs are passed, even none yet, so the keyboard doesn't jump when the first appears.
  const top = arcs ? ARC_SPACE : 0
  const width = whites.length * W
  const x = (midi: number) => {
    if (!isBlackKey(midi)) return whites.indexOf(midi) * W
    return whites.indexOf(midi - 1) * W + W - BW / 2
  }
  const centre = (midi: number) => x(midi) + (isBlackKey(midi) ? BW / 2 : W / 2)

  const press = (midi: number) => {
    if (sound) audio.play([midi])
    onKey?.(midi)
  }

  const key = (midi: number) => {
    const black = isBlackKey(midi)
    const mark = marks[midi]
    const name = mark?.label ?? keyName(midi, names, prefer)
    const w = black ? BW : W
    const h = black ? BH : H
    const cls = ['key', black ? 'black' : 'white', mark?.tone ?? ''].filter(Boolean).join(' ')
    return (
      <g
        key={midi}
        className={cls}
        role="button"
        tabIndex={0}
        aria-label={`${pitchName(spell(midi, prefer))}${spell(midi, prefer).octave}`}
        onPointerDown={(e) => {
          e.preventDefault()
          press(midi)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            press(midi)
          }
        }}
      >
        <rect x={x(midi)} y={top} width={w} height={h} rx={black ? 2.5 : 4} />
        {name ? (
          <text x={x(midi) + w / 2} y={top + h - (black ? 9 : 12)} textAnchor="middle" className="keyname">
            {name}
          </text>
        ) : null}
      </g>
    )
  }

  return (
    <figure className="fig keyboard">
      <svg viewBox={`-1 -1 ${width + 2} ${top + H + 2}`} role="group" aria-labelledby={titleId} style={{ maxWidth: width * 1.25 }}>
        <title id={titleId}>{label}</title>
        {arcs?.map((a, i) => {
          const x1 = centre(a.from)
          const x2 = centre(a.to)
          const mid = (x1 + x2) / 2
          return (
            <g key={i} className={`arc ${a.tone ?? ''}`}>
              <path d={`M${x1},${top - 4} Q${mid},${top - 26} ${x2},${top - 4}`} />
              <text x={mid} y={top - 18} textAnchor="middle">
                {a.label}
              </text>
            </g>
          )
        })}
        {whites.map(key)}
        {Array.from({ length: to - from + 1 }, (_, i) => from + i)
          .filter(isBlackKey)
          .map(key)}
      </svg>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
}

function keyName(midi: number, names: Props['names'], prefer: 'sharp' | 'flat') {
  if (names === 'none') return null
  const n = spell(midi, prefer)
  if (names === 'c') return midi % 12 === 0 ? `C${n.octave}` : null
  if (names === 'white' && isBlackKey(midi)) return null
  return pitchName(n)
}
