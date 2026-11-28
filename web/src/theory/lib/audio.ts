import { createPiano } from '~/chords/lib/piano'

/** One step of a sequence: notes sounding together (none for a rest) for some beats. */
export type Step = { notes: number[]; beats: number }

/**
 * One piano for the whole book, so every figure shares one audio context (browsers limit how many a
 * page may open). It's chords' sampled piano; the client entry loads its samples when the book opens.
 */
export const piano = createPiano()

let active: { timers: number[]; onStep: (i: number | null) => void } | null = null

function end() {
  if (!active) return
  const { timers, onStep } = active
  active = null
  timers.forEach(clearTimeout)
  onStep(null)
}

/**
 * Plays steps in time and reports the one sounding, then null once finished or stopped. Starting a
 * sequence stops any other, so only one figure plays at a time. `click` adds a metronome on each beat,
 * accented every `click` beats. Returns a cancel that does nothing once another sequence has started.
 */
export function sequence(steps: Step[], opts: { bpm: number; click?: number | undefined; onStep: (i: number | null) => void }): () => void {
  end()
  const beat = 60_000 / opts.bpm
  if (opts.click) {
    // The clicks run on the audio clock, so they stay steady even if a timer is late.
    const { now } = piano.clock()
    const total = steps.reduce((n, s) => n + s.beats, 0)
    for (let b = 0; b < Math.ceil(total); b++) piano.click(now + 0.05 + (b * beat) / 1000, b % opts.click === 0)
  }
  const run = { timers: [] as number[], onStep: opts.onStep }
  active = run
  let at = 50
  steps.forEach((s, i) => {
    const length = s.beats * beat
    run.timers.push(
      window.setTimeout(() => {
        opts.onStep(i)
        s.notes.forEach((m) => piano.noteOn(`seq-${i}-${m}`, m, 0.65))
      }, at),
      window.setTimeout(() => s.notes.forEach((m) => piano.noteOff(`seq-${i}-${m}`)), at + length * 0.92),
    )
    at += length
  })
  run.timers.push(window.setTimeout(end, at))
  return () => {
    if (active === run) end()
  }
}
