/** A D1 stand-in that records each statement and its values, and answers every write with `changes`. */
export function fakeDb(changes = 0) {
  const calls: { sql: string; values: unknown[] }[] = []
  const db: D1Database = {
    prepare(sql) {
      const statement = {
        bind(...values: unknown[]) {
          calls.push({ sql, values })
          return statement
        },
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { changes } }),
      }
      return statement
    },
  }
  return { db, calls }
}
