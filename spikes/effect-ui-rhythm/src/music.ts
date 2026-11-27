// Copied from web/src/theory/lib/theory.ts and Rhythm.tsx, so the spike runs on its own.
type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export type RhythmEvent = { value: Duration; rest?: true | undefined; dot?: true | undefined }

const DURATIONS: Record<Duration, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 }

export const beatsOf = (e: RhythmEvent) => DURATIONS[e.value] * (e.dot ? 1.5 : 1)

/** Reads "q q e e h" style shorthand: w h q e s, "." for a dot, "r" before a letter for a rest. */
export function parseRhythm(s: string): RhythmEvent[] {
  const map: Record<string, Duration> = { w: 'whole', h: 'half', q: 'quarter', e: 'eighth', s: 'sixteenth' }
  return s
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const m = /^(r?)([whqes])(\.?)$/.exec(tok)
      if (!m) throw new Error(`Not a rhythm: ${tok}`)
      return { value: map[m[2]!]!, rest: m[1] === 'r' || undefined, dot: m[3] === '.' || undefined }
    })
}

/** "1", "&", "e" or "a", for where a note starts in the bar. */
export function countAt(beat: number, beats: number) {
  const inBar = beat % beats
  const whole = Math.floor(inBar + 1e-6)
  const frac = Math.round((inBar - whole) * 4) / 4
  if (frac === 0) return String(whole + 1)
  if (frac === 0.5) return '&'
  return frac === 0.25 ? 'e' : 'a'
}
