/** A pasted chord sheet. We store the text, not the parsed song, so a better parser also reads old songs. */
export type SavedSheet = { id: string; title: string; text: string }

const isSavedSheet = (v: unknown): v is SavedSheet =>
  typeof v === 'object' &&
  v !== null &&
  'id' in v &&
  'title' in v &&
  'text' in v &&
  typeof v.id === 'string' &&
  typeof v.title === 'string' &&
  typeof v.text === 'string'

export const parseSheets = (value: unknown): SavedSheet[] | null => (Array.isArray(value) ? value.filter(isSavedSheet) : null)

/**
 * Both lists of pasted songs, with nothing dropped: the account's first, then this browser's that
 * the account doesn't have. The same sheet pasted on two devices has two ids, so text decides.
 */
export function mergeSheets(local: SavedSheet[], account: SavedSheet[]): SavedSheet[] {
  const texts = new Set(account.map((s) => s.text))
  const ids = new Set(account.map((s) => s.id))
  return [...account, ...local.filter((s) => !texts.has(s.text) && !ids.has(s.id))]
}
