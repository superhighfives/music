import { useEffect, useRef, useState } from 'preact/hooks'
import { piano, sequence, type Step } from './audio'

/** Starts loading the piano's samples once a figure is on screen; later calls do nothing. */
const useSamples = () => useEffect(() => piano.load(), [])

/** Plays notes once, together or strummed. Every figure on the page shares one piano. */
export function useAudio() {
  useSamples()
  return { play: (notes: number[], strum?: boolean) => piano.play(notes, strum) }
}

/**
 * A sequence a figure can start and stop, and which step is sounding now. Only one figure plays at a
 * time; starting another stops this one.
 */
export function usePlayer() {
  useSamples()
  const [current, setCurrent] = useState<number | null>(null)
  const cancel = useRef<(() => void) | null>(null)
  useEffect(() => () => cancel.current?.(), [])
  return {
    current,
    playing: current !== null,
    start: (steps: Step[], opts: { bpm: number; click?: number }) => {
      cancel.current = sequence(steps, { bpm: opts.bpm, click: opts.click, onStep: setCurrent })
    },
    stop: () => cancel.current?.(),
    play: (notes: number[], strum?: boolean) => piano.play(notes, strum),
  }
}
