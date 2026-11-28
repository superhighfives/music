import { useEffect, useRef, useState } from 'react'
import { mod } from '../lib/music'
import { HIT_MS, eventAllowedPcs, eventLabel, judge, summarize, type Exercise, type Press, type Result } from '../lib/practice'

export type PracticeMode = 'play' | 'wait'

/** The audio parts of usePiano that the practice clock needs. */
type Audio = {
  clock: () => { now: number; latency: number }
  click: (at: number, accent: boolean) => void
}

/** Seconds between pressing Start and the first count-in click, so the first click is never late. */
const LEAD = 0.15
/** How far ahead clicks are scheduled on the audio clock, in seconds. */
const LOOKAHEAD = 0.2
const PX_PER_BEAT = 96
/** Where the hit line is in the strip, in pixels from the left. */
const HIT_X = 112

/**
 * Runs one exercise against a clock.
 * Beat 0 is the first beat after a one-bar count-in. `zero` is the performance.now() time of beat 0,
 * so MIDI time stamps, which use the same clock, give exact press times.
 * The click sounds `latency` after its audio time, so beat 0 is moved by that much to match what you hear.
 * In wait mode the clock stops at each event until you play it, and there is no click.
 */
export function usePractice(exercise: Exercise | undefined, audio: Audio) {
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<PracticeMode>('play')
  const [speed, setSpeed] = useState(1)
  const [loop, setLoop] = useState(false)
  // Sixteenth notes from beat 0. It changes about 8 times a second, so it drives the lights and the results.
  const [tick, setTick] = useState(-Infinity)
  const [presses, setPresses] = useState<Press[]>([])
  const [lastRun, setLastRun] = useState<ReturnType<typeof summarize> | null>(null)
  const zero = useRef(0)
  const audioZero = useRef(0)
  const nextClick = useRef(0)
  const pressesRef = useRef<Press[]>([])
  const strip = useRef<HTMLDivElement | null>(null)
  const settings = useRef({ mode, loop })
  settings.current = { mode, loop }

  const countIn = exercise?.beatsPerBar ?? 4
  const msPerBeat = exercise ? 60000 / (exercise.bpm * speed) : 500
  const beatNow = () => (running ? (performance.now() - zero.current) / msPerBeat : -countIn)

  function start() {
    if (!exercise) return
    const { now, latency } = audio.clock()
    audioZero.current = now + LEAD + (countIn * msPerBeat) / 1000
    zero.current = performance.now() + (LEAD + latency) * 1000 + countIn * msPerBeat
    nextClick.current = -countIn
    pressesRef.current = []
    setPresses([])
    setRunning(true)
  }

  /** Ends the run. The strip keeps the run's results until the next start. */
  function finish() {
    setRunning(false)
    setTick(-Infinity)
  }

  /** Stops early. A part-played run has no results to keep. */
  function stop() {
    finish()
    pressesRef.current = []
    setPresses([])
  }

  /** A pad press at `time` on the performance.now() clock. */
  function press(midi: number, time: number) {
    if (!running || !exercise) return
    let ms = time - zero.current
    if (mode === 'wait' && ms >= 0) {
      // Wait mode does not grade timing: a right note before the playhead gets there moves the playhead to it.
      const { results } = judge(exercise.events, pressesRef.current, msPerBeat, ms)
      const next = exercise.events.find((_, i) => results[i].judgment === 'pending')
      if (next && eventAllowedPcs(next).includes(mod(midi, 12)) && ms < next.beat * msPerBeat - HIT_MS) {
        zero.current = time - next.beat * msPerBeat
        ms = next.beat * msPerBeat
      }
    }
    const p = { ms, midi }
    pressesRef.current = [...pressesRef.current, p]
    setPresses(pressesRef.current)
  }

  // Stop when the exercise changes, and start the speed over at the new exercise's tempo.
  useEffect(() => {
    stop()
    setLastRun(null)
  }, [exercise?.id])

  // The frame loop: moves the strip, holds the clock in wait mode, schedules clicks and ends the run.
  useEffect(() => {
    if (!exercise) return
    const place = (beat: number) => strip.current?.style.setProperty('transform', `translateX(${HIT_X - beat * PX_PER_BEAT}px)`)
    if (!running) {
      place(-countIn)
      return
    }
    let frame = 0
    const step = () => {
      const now = performance.now()
      let beat = (now - zero.current) / msPerBeat
      if (settings.current.mode === 'wait') {
        const { results } = judge(exercise.events, pressesRef.current, msPerBeat, beat * msPerBeat)
        const waiting = exercise.events.find((e, i) => results[i].judgment === 'pending' && beat > e.beat)
        if (waiting) {
          // Hold the playhead on the event: move beat 0 so that now is the event's beat.
          zero.current = now - waiting.beat * msPerBeat
          beat = waiting.beat
        }
      } else {
        const { now: audioNow } = audio.clock()
        const secPerBeat = msPerBeat / 1000
        while (audioZero.current + nextClick.current * secPerBeat < audioNow + LOOKAHEAD) {
          const at = audioZero.current + nextClick.current * secPerBeat
          if (at >= audioNow) audio.click(at, mod(nextClick.current, exercise.beatsPerBar) === 0)
          nextClick.current++
        }
      }
      place(beat)
      setTick(Math.floor(beat * 4))
      if (beat >= exercise.beats) {
        const { results, wrong } = judge(exercise.events, pressesRef.current, msPerBeat, Infinity)
        setLastRun(summarize(results, wrong))
        if (!settings.current.loop) return finish()
        // Loop: the next run starts on the next beat, with no count-in. The click carries on.
        zero.current += exercise.beats * msPerBeat
        audioZero.current += (exercise.beats * msPerBeat) / 1000
        nextClick.current -= exercise.beats
        pressesRef.current = []
        setPresses([])
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [running, exercise, msPerBeat])

  const beat = running ? tick / 4 : -countIn
  // After a run, the strip shows its results, so every event is final. Before a run, none are.
  const nowMs = running ? beat * msPerBeat : presses.length ? Infinity : -Infinity
  const { results, wrong } = exercise ? judge(exercise.events, presses, msPerBeat, nowMs) : { results: [], wrong: 0 }
  // The event to play next: the first one not yet hit or missed. Between runs, the first event.
  const target = !exercise ? -1 : running ? exercise.events.findIndex((_, i) => results[i].judgment === 'pending') : 0
  // The project's TypeScript lib has no findLastIndex, so count from the end.
  const lastJudged = results.length - 1 - [...results].reverse().findIndex((r) => r.judgment !== 'pending')

  return {
    running,
    start,
    stop,
    press,
    mode,
    setMode,
    speed,
    setSpeed,
    loop,
    setLoop,
    beat,
    countIn,
    results,
    wrong,
    target,
    lastJudged,
    lastRun,
    strip,
    beatNow,
  }
}

export type Practice = ReturnType<typeof usePractice>

const JUDGMENT_STYLE: Record<Result['judgment'], string> = {
  pending: 'bg-neutral-700 text-white',
  perfect: 'bg-emerald-500 text-neutral-950',
  early: 'bg-amber-300 text-neutral-950',
  late: 'bg-amber-300 text-neutral-950',
  missed: 'bg-transparent text-red-400 ring-1 ring-red-500/70 ring-inset',
}

const JUDGMENT_TEXT: Record<Result['judgment'], string> = {
  pending: '',
  perfect: 'On time',
  early: 'Early',
  late: 'Late',
  missed: 'Missed',
}

export function PracticeCard({ exercise, practice, onExit }: { exercise: Exercise; practice: Practice; onExit: () => void }) {
  const { running, mode, speed, loop, results, lastJudged, lastRun, beat, countIn } = practice
  const last = results[lastJudged]
  const counting = running && beat < 0 && Number.isFinite(beat)
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="font-medium text-neutral-300">{exercise.name}</span>
        <span>
          {exercise.summary} · {Math.round(exercise.bpm * speed)} BPM
        </span>
        <button type="button" onClick={onExit} className="ml-auto hover:text-neutral-300">
          Exit
        </button>
      </div>

      {/* The strip moves left under the hit line. Each block is one note or chord, as long as it lasts. */}
      <div className="relative h-14 overflow-hidden rounded-lg bg-neutral-950 ring-1 ring-neutral-800">
        <div ref={practice.strip} className="absolute inset-y-0 left-0 will-change-transform">
          {Array.from({ length: exercise.beats + countIn + 1 }, (_, i) => i - countIn).map((b) => (
            <div
              key={b}
              className={`absolute inset-y-0 w-px ${b % exercise.beatsPerBar === 0 ? 'bg-neutral-700' : 'bg-neutral-800/70'}`}
              style={{ left: b * PX_PER_BEAT }}
            />
          ))}
          {exercise.events.map((e, i) => (
            <div
              key={i}
              className={`absolute top-2 bottom-2 flex items-center rounded-md px-2 text-sm font-semibold ${JUDGMENT_STYLE[results[i]?.judgment ?? 'pending']} ${
                i === practice.target ? 'ring-2 ring-led' : ''
              }`}
              style={{ left: e.beat * PX_PER_BEAT + 2, width: e.length * PX_PER_BEAT - 4 }}
            >
              {eventLabel(e)}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: HIT_X }} />
        {counting && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-end pr-4 text-2xl font-semibold text-white">
            {Math.ceil(-beat)}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={running ? practice.stop : practice.start}
          className={`min-h-9 rounded-lg px-4 font-medium ${running ? 'bg-white text-neutral-950' : 'bg-led text-on-led'}`}
        >
          {running ? 'Stop' : 'Start'}
        </button>
        <span className="text-xs text-neutral-500">or press Play on Move</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 rounded-lg bg-neutral-950 p-0.5 text-[13px]">
            {(['play', 'wait'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                disabled={running}
                title={m === 'wait' ? 'The playhead stops at each note until you play it.' : 'The playhead keeps time. Play along with the click.'}
                onClick={() => practice.setMode(m)}
                className={`min-h-8 rounded-md px-2.5 ${mode === m ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white disabled:text-neutral-600'}`}
              >
                {m === 'play' ? 'Play' : 'Wait'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            Speed
            <select
              value={speed}
              disabled={running}
              onChange={(e) => practice.setSpeed(Number(e.target.value))}
              className="rounded-md border border-neutral-800 bg-neutral-950 px-1.5 py-1 text-sm text-neutral-200 disabled:opacity-50"
            >
              {[0.5, 0.75, 0.9, 1].map((s) => (
                <option key={s} value={s}>
                  {s * 100}%
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            aria-pressed={loop}
            onClick={() => practice.setLoop(!loop)}
            className={`min-h-8 rounded-lg border px-2.5 text-[13px] ${loop ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'}`}
          >
            Loop
          </button>
        </div>
      </div>

      <p className="min-h-5 text-sm text-neutral-400" aria-live="polite">
        {running ? (
          counting ? (
            'Get ready…'
          ) : last ? (
            <>
              <span className={last.judgment === 'perfect' ? 'text-emerald-300' : last.judgment === 'missed' ? 'text-red-400' : 'text-amber-300'}>
                {JUDGMENT_TEXT[last.judgment]}
              </span>
              {last.offsetMs !== undefined && mode === 'play' && Math.abs(last.offsetMs) > 0 && (
                <span className="text-neutral-500"> {Math.round(Math.abs(last.offsetMs))} ms</span>
              )}
            </>
          ) : (
            'Play the highlighted pads as each block reaches the line.'
          )
        ) : lastRun ? (
          <>
            <span className="font-semibold text-white">{lastRun.accuracy}%</span> · {lastRun.perfect} on time ·{' '}
            {lastRun.early} early · {lastRun.late} late · {lastRun.missed} missed · {lastRun.wrong} wrong · best streak{' '}
            {lastRun.bestStreak}
          </>
        ) : mode === 'wait' ? (
          'Wait mode: the playhead stops at each block until you play it.'
        ) : (
          'Press Start. You get one bar of clicks, then play each block as it reaches the line.'
        )}
      </p>
    </div>
  )
}
