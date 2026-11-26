/**
 * The next card for someone, given when they were sent each card before (by card key).
 * The first card in reading order they haven't had wins, so a chapter added early in the book is
 * picked up next. Once they've had every card, the one sent longest ago comes round again.
 */
export function pickCard<T extends { key: string }>(cards: T[], sent: Map<string, number>): { card: T; review: boolean } | null {
  if (!cards.length) return null
  const fresh = cards.find((c) => !sent.has(c.key))
  if (fresh) return { card: fresh, review: false }
  const oldest = cards.reduce((a, b) => ((sent.get(b.key) ?? 0) < (sent.get(a.key) ?? 0) ? b : a))
  return { card: oldest, review: true }
}

/** The UTC day, YYYY-MM-DD. */
export const utcDay = (d: Date) => d.toISOString().slice(0, 10)
