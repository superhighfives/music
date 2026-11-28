/** @jsxImportSource ~/content */
import { Schema } from 'effect'
import { figure, NoState } from '~/theory/app/define'
import { beatsOf, parseRhythm, type RhythmEvent } from '~/theory/lib/theory'
import { PlayButton } from './ui'

const Args = Schema.Struct({
  /** Shorthand: w h q e s for whole to sixteenth, "." for a dot, "r" before for a rest. "q q e e h". */
  rhythm: Schema.String,
  /** Beats in a bar, for barlines, counting and the metronome's accent. */
  beats: Schema.optionalKey(Schema.Number),
  bpm: Schema.optionalKey(Schema.Number),
  /** The note it plays, as MIDI. */
  pitch: Schema.optionalKey(Schema.Number),
  /** Count each note under it: 1 & 2 &. */
  counts: Schema.optionalKey(Schema.Boolean),
  /** Show the time signature, as [beats, note value]. */
  time: Schema.optionalKey(Schema.Tuple([Schema.Number, Schema.Number])),
  caption: Schema.optionalKey(Schema.String),
  label: Schema.String,
})

const LINE = 58
const STEM = 30

/** One line of rhythm, played on a note with a metronome. Each note lights up as it sounds. */
export const Rhythm = figure('Rhythm', {
  args: Args,
  state: NoState,
  init: () => ({}),
  view: ({ rhythm, beats = 4, bpm = 84, pitch = 72, counts = true, time, caption, label }, _state, player) => {
  const events = parseRhythm(rhythm)
  const starts: number[] = []
  events.reduce((t, e) => (starts.push(t), t + beatsOf(e)), 0)
  // Like engraved music, space grows more slowly than length, so sixteenths have room and whole notes don't sprawl.
  const evX: number[] = []
  const barX: number[] = []
  let cursor = time ? 46 : 18
  events.forEach((e, i) => {
    evX.push(cursor)
    cursor += 22 + beatsOf(e) * 40
    const end = starts[i] + beatsOf(e)
    if (Math.abs(end / beats - Math.round(end / beats)) < 1e-6) {
      barX.push(cursor - 8)
      cursor += 12
    }
  })
  const width = cursor + 4
  const height = LINE + (counts ? 40 : 18)

  // Eighths and sixteenths in the same beat share a beam.
  const beamOf = events.map(() => -1)
  let group = 0
  events.forEach((e, i) => {
    const beamable = !e.rest && DURATIONS_BEAMED.has(e.value)
    const prev = i - 1
    if (beamable && prev >= 0 && beamOf[prev] >= 0 && Math.floor(starts[prev]) === Math.floor(starts[i])) beamOf[i] = beamOf[prev]
    else if (beamable) beamOf[i] = ++group
  })
  const groups = new Map<number, number[]>()
  beamOf.forEach((g, i) => g >= 0 && groups.set(g, [...(groups.get(g) ?? []), i]))
  const beamed = (i: number) => (groups.get(beamOf[i])?.length ?? 0) > 1

    const toggle = () =>
    player.playing
      ? player.stop()
      : player.start(
          events.map((e) => ({ notes: e.rest ? [] : [pitch], beats: beatsOf(e) })),
          { bpm, click: beats },
        )

  return (
    <figure className="fig rhythm">
      <div className="figbar">
        <PlayButton playing={player.playing} onClick={toggle} />
        <span className="lab">{bpm} bpm</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} style={{ maxWidth: width * 1.2 }}>
        <title>{label}</title>
        <line className="line" x1={4} x2={width - 4} y1={LINE} y2={LINE} />
        {time ? (
          <g className="time">
            <text x={26} y={LINE - 4} textAnchor="middle">
              {time[0]}
            </text>
            <text x={26} y={LINE + 18} textAnchor="middle">
              {time[1]}
            </text>
          </g>
        ) : null}
        {barX.map((bx, b) => (
          <line className="line" x1={bx} x2={bx} y1={LINE - 14} y2={LINE + 14} />
        ))}
        {events.map((e, i) => (
          <EventMark e={e} x={evX[i] + 10} lit={player.current === i} flag={!beamed(i)} />
        ))}
        {[...groups.values()]
          .filter((g) => g.length > 1)
          .map((g) => {
            const a = evX[g[0]] + 10 + 5.8
            const b = evX[g[g.length - 1]] + 10 + 5.8
            const stem = (i: number) => evX[i] + 10 + 5.8
            const isSixteenth = (i: number) => events[i]?.value === 'sixteenth' && g.includes(i)
            // Sixteenths side by side share a second beam; one on its own gets a short stub towards its neighbour.
            const second = g.flatMap((i, j) => {
              if (!isSixteenth(i)) return []
              if (isSixteenth(g[j + 1])) return [[stem(i), stem(g[j + 1])]]
              if (isSixteenth(g[j - 1])) return []
              return [j + 1 < g.length ? [stem(i), stem(i) + 9] : [stem(i) - 9, stem(i)]]
            })
            return (
              <g className="beam">
                <rect x={a - 0.8} y={LINE - STEM - 1} width={b - a + 1.6} height={5} />
                {second.map(([x1, x2]) => (
                  <rect x={x1 - 0.8} y={LINE - STEM + 7} width={x2 - x1 + 1.6} height={5} />
                ))}
              </g>
            )
          })}
        {counts
          ? events.map((e, i) => (
              <text className={player.current === i ? 'count now' : 'count'} x={evX[i] + 10} y={LINE + 34} textAnchor="middle">
                {e.rest ? `(${countAt(starts[i], beats)})` : countAt(starts[i], beats)}
              </text>
            ))
          : null}
      </svg>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  )
  },
})

const DURATIONS_BEAMED = new Set(['eighth', 'sixteenth'])

const REST_GLYPHS: Record<string, string> = { whole: '𝄻', half: '𝄼', quarter: '𝄽', eighth: '𝄾', sixteenth: '𝄿' }
/** A half rest sits on top of the line and a whole rest hangs below it, which is how you tell them apart. */
const REST_SHIFT: Record<string, number> = { half: -7, whole: 1 }

/** A filled eighth-note flag hanging from the top of a stem at (x, y). */
const flagPath = (x: number, y: number) =>
  `M${x},${y} C${x + 1},${y + 8} ${x + 13},${y + 11} ${x + 9},${y + 25} C${x + 10},${y + 16} ${x + 4},${y + 13} ${x},${y + 11}Z`

/** "1", "&", "e" or "a", for where a note starts in the bar. */
function countAt(beat: number, beats: number) {
  const inBar = beat % beats
  const whole = Math.floor(inBar + 1e-6)
  const frac = Math.round((inBar - whole) * 4) / 4
  if (frac === 0) return String(whole + 1)
  if (frac === 0.5) return '&'
  return frac === 0.25 ? 'e' : 'a'
}

function EventMark({ e, x, lit, flag }: { e: RhythmEvent; x: number; lit: boolean; flag: boolean }) {
  const cls = lit ? 'ev now' : 'ev'
  if (e.rest)
    return (
      <g className={cls}>
        <text className="glyph rest" x={x} y={LINE + (REST_SHIFT[e.value] ?? 0)} fontSize={36} textAnchor="middle" dominantBaseline="central">
          {REST_GLYPHS[e.value]}
        </text>
        {e.dot ? <circle className="dot" cx={x + 12} cy={LINE - 3} r={2.2} /> : null}
      </g>
    )
  const open = e.value === 'whole' || e.value === 'half'
  const stem = e.value !== 'whole'
  const sx = x + 5.8
  return (
    <g className={cls}>
      <ellipse className={open ? 'head open' : 'head'} cx={x} cy={LINE} rx={6.6} ry={4.8} transform={`rotate(-20 ${x} ${LINE})`} />
      {stem ? <line className="stem" x1={sx} x2={sx} y1={LINE - 1.5} y2={LINE - STEM} /> : null}
      {flag && (e.value === 'eighth' || e.value === 'sixteenth') ? (
        <path className="flag" d={flagPath(sx, LINE - STEM)} />
      ) : null}
      {flag && e.value === 'sixteenth' ? <path className="flag" d={flagPath(sx, LINE - STEM + 8)} /> : null}
      {e.dot ? <circle className="dot" cx={x + 11} cy={LINE - 3} r={2.2} /> : null}
    </g>
  )
}
