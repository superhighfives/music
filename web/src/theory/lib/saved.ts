/** What the book remembers: chapters read, checks passed, and where you were. */
export interface Saved {
  read: Record<string, true>
  checks: Record<string, true>
  last: string | null
}

export const EMPTY: Saved = { read: {}, checks: {}, last: null }

const trueOnly = (v: unknown): Record<string, true> =>
  v && typeof v === 'object'
    ? Object.fromEntries(Object.entries(v).filter(([, x]) => x === true).map(([k]) => [k, true as const]))
    : {}

/** Reads saved progress, from this browser or an account, keeping only valid values. */
export function parseSaved(raw: unknown): Saved | null {
  if (!raw || typeof raw !== 'object') return null
  const { read, checks, last } = raw as Record<string, unknown>
  return { read: trueOnly(read), checks: trueOnly(checks), last: typeof last === 'string' ? last : null }
}

/** Everything read or passed on either side counts; this browser's place wins, since it's the one in front of you. */
export function mergeSaved(local: Saved, account: Saved): Saved {
  return {
    read: { ...account.read, ...local.read },
    checks: { ...account.checks, ...local.checks },
    last: local.last ?? account.last,
  }
}
