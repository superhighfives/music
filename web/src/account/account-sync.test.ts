import { describe, expect, it } from 'vitest'
import { AccountSync } from './account-sync'
import type { AccountCopy } from './store'

/** An in-memory account with the same version rule as the database. */
function fakeAccount(initial: AccountCopy | null = null) {
  let copy = initial
  return {
    get copy() {
      return copy
    },
    /** Another device saving. */
    elsewhere(value: unknown) {
      copy = { value: JSON.stringify(value), version: (copy?.version ?? 0) + 1 }
    },
    io: {
      load: async () => copy,
      store: async (value: string, base: number | null) => {
        if ((copy?.version ?? null) !== base) return { ok: false as const }
        copy = { value, version: (base ?? 0) + 1 }
        return { ok: true as const, version: copy.version }
      },
    },
  }
}

// Sets of strings, merged by union, like songs or finished lessons.
const rules = {
  parse: (json: unknown) => (Array.isArray(json) ? json.filter((x): x is string => typeof x === 'string') : null),
  merge: (local: string[], account: string[]) => [...new Set([...account, ...local])],
}

describe('AccountSync', () => {
  it("merges this browser's copy into the account's on sign-in", async () => {
    const account = fakeAccount({ value: '["a"]', version: 3 })
    expect(await new AccountSync(account.io, rules).join(['b'])).toEqual(['a', 'b'])
  })

  it('keeps this browser\'s copy when the account has none', async () => {
    const sync = new AccountSync(fakeAccount().io, rules)
    expect(await sync.join(['b'])).toEqual(['b'])
  })

  it('saves, then saves again from the new version', async () => {
    const account = fakeAccount()
    const sync = new AccountSync(account.io, rules)
    await sync.join([])
    expect(await sync.save(['a'])).toEqual({ saved: true })
    expect(await sync.save(['a', 'b'])).toEqual({ saved: true })
    expect(account.copy).toEqual({ value: '["a","b"]', version: 2 })
  })

  it("never overwrites another device's newer save: it merges with it instead", async () => {
    const account = fakeAccount({ value: '["a"]', version: 1 })
    const sync = new AccountSync(account.io, rules)
    await sync.join(['a'])
    account.elsewhere(['a', 'from-b'])
    expect(await sync.save(['a', 'from-me'])).toEqual({ saved: false, merged: ['a', 'from-b', 'from-me'] })
    expect(account.copy?.value).toBe('["a","from-b"]')
    // The merged value saves cleanly from the version it was merged with.
    expect(await sync.save(['a', 'from-b', 'from-me'])).toEqual({ saved: true })
  })

  it('refreshes only when another device has saved', async () => {
    const account = fakeAccount({ value: '["a"]', version: 1 })
    const sync = new AccountSync(account.io, rules)
    await sync.join(['a'])
    expect(await sync.refresh()).toBeNull()
    account.elsewhere(['a', 'b'])
    expect(await sync.refresh()).toEqual(['a', 'b'])
    expect(await sync.refresh()).toBeNull()
  })

  it('treats an unreadable account copy as empty', async () => {
    const sync = new AccountSync(fakeAccount({ value: 'not json', version: 1 }).io, rules)
    expect(await sync.join(['b'])).toEqual(['b'])
  })

  it('passes failures on, so the caller can retry', async () => {
    const io = { load: async () => Promise.reject(new Error('offline')), store: async () => ({ ok: false as const }) }
    await expect(new AccountSync(io, rules).join([])).rejects.toThrow('offline')
  })
})
