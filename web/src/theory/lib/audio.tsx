import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePiano } from '~/chords/lib/piano'

/** One step of a sequence: notes sounding together (none for a rest) for some beats. */
export type Step = { notes: number[]; beats: number }

interface Audio {
  /** Plays notes once, together or strummed. */
  play: (notes: number[], strum?: boolean) => void
  /**
   * Plays steps in time and reports the one sounding (null once finished), so a figure can light it up.
   * Starting a sequence stops any other. `click` adds a metronome on each beat, accented on each bar.
   */
  sequence: (steps: Step[], opts: { bpm: number; onStep?: (i: number | null) => void; click?: number }) => void
  stop: () => void
}

const AudioCtx = createContext<Audio | null>(null)

/**
 * One piano for the whole book, so every figure shares one audio context (browsers limit how many a
 * page may open). It's chords' sampled piano; samples load in the background when the book opens.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const piano = usePiano()
  const ref = useRef(piano)
  ref.current = piano
  const timers = useRef<number[]>([])
  const report = useRef<((i: number | null) => void) | undefined>(undefined)

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    report.current?.(null)
    report.current = undefined
  }, [])

  const sequence = useCallback<Audio['sequence']>(
    (steps, { bpm, onStep, click }) => {
      stop()
      report.current = onStep
      const beat = 60_000 / bpm
      const p = ref.current
      if (click) {
        // The clicks run on the audio clock, so they stay steady even if a timer is late.
        const { now } = p.clock()
        const total = steps.reduce((n, s) => n + s.beats, 0)
        for (let b = 0; b < Math.ceil(total); b++) p.click(now + 0.05 + (b * beat) / 1000, b % click === 0)
      }
      let at = 50
      steps.forEach((s, i) => {
        const length = s.beats * beat
        timers.current.push(
          window.setTimeout(() => {
            onStep?.(i)
            s.notes.forEach((m) => p.noteOn(`seq-${i}-${m}`, m, 0.65))
          }, at),
          window.setTimeout(() => s.notes.forEach((m) => p.noteOff(`seq-${i}-${m}`)), at + length * 0.92),
        )
        at += length
      })
      timers.current.push(
        window.setTimeout(() => {
          onStep?.(null)
          report.current = undefined
        }, at),
      )
    },
    [stop],
  )

  useEffect(() => stop, [stop])

  const value = useMemo<Audio>(() => ({ play: (n, strum) => ref.current.play(n, strum), sequence, stop }), [sequence, stop])
  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}

export function useAudio(): Audio {
  const a = useContext(AudioCtx)
  if (!a) throw new Error('useAudio must be used inside AudioProvider')
  return a
}

/**
 * A sequence a figure can start and stop, and which step is sounding now.
 * Only one figure plays at a time; starting another stops this one.
 */
export function usePlayer() {
  const audio = useAudio()
  const [current, setCurrent] = useState<number | null>(null)
  const playing = current !== null
  const start = (steps: Step[], opts: { bpm: number; click?: number }) => audio.sequence(steps, { ...opts, onStep: setCurrent })
  return { current, playing, start, stop: audio.stop, play: audio.play }
}
