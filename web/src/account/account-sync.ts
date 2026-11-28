import type { AccountCopy, SaveResult } from './store'

/** How one section reads and combines its value. */
export type SyncRules<T> = {
  /** Validates the account's JSON the way the section validates its own storage; null if unreadable. */
  parse: (json: unknown) => T | null
  /** Combines this browser's copy with the account's without dropping anything. */
  merge: (local: T, account: T) => T
}

export type SyncIO = {
  load: () => Promise<AccountCopy | null>
  store: (value: string, base: number | null) => Promise<SaveResult>
}

/**
 * One value kept in step with an account. It remembers the account's version, so a save from a tab
 * that's behind never overwrites a newer copy: it merges with that copy instead, to be saved again.
 * It has no browser or framework ties, so it can be tested on its own; `islands/sync.ts` and Chords drive it.
 */
export class AccountSync<T> {
  private version: number | null = null

  constructor(
    private io: SyncIO,
    private rules: SyncRules<T>,
  ) {}

  private read(copy: AccountCopy | null): T | null {
    this.version = copy?.version ?? null
    if (!copy) return null
    try {
      return this.rules.parse(JSON.parse(copy.value))
    } catch {
      // Unreadable JSON in the account: treat it as empty, and the next save replaces it.
      return null
    }
  }

  /** On sign-in: this browser's copy merged into the account's. */
  async join(local: T): Promise<T> {
    const account = this.read(await this.io.load())
    return account === null ? local : this.rules.merge(local, account)
  }

  /** The account's copy, if another device saved since this one last looked; otherwise null. */
  async refresh(): Promise<T | null> {
    const copy = await this.io.load()
    if (!copy || copy.version === this.version) return null
    return this.read(copy)
  }

  /** Saves `local`. If another device saved first, returns `local` merged with that copy, to apply and save. */
  async save(local: T): Promise<{ saved: true } | { saved: false; merged: T }> {
    const result = await this.io.store(JSON.stringify(local), this.version)
    if (result.ok) {
      this.version = result.version
      return { saved: true }
    }
    const account = this.read(await this.io.load())
    return { saved: false, merged: account === null ? local : this.rules.merge(local, account) }
  }
}
