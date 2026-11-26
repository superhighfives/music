import { DEFAULT_SETTINGS, MODES, type Settings } from "./music";

export interface Saved {
  settings: Settings;
  done: Record<string, true>;
  last: string | null;
}

/** Reads saved settings and progress, from this browser or an account, keeping only valid values. */
export function parseSaved(raw: unknown): Saved | null {
  if (!raw || typeof raw !== "object") return null;
  const { settings, done, last } = raw as Record<string, unknown>;
  const s = (settings && typeof settings === "object" ? settings : {}) as Record<string, unknown>;
  const root = Number(s.root);
  const bpm = Number(s.bpm);
  const mode = MODES.find((m) => m.id === s.mode)?.id;
  return {
    settings: {
      root: typeof s.root === "number" && Number.isInteger(root) && root >= 0 && root < 12 ? root : DEFAULT_SETTINGS.root,
      mode: mode ?? DEFAULT_SETTINGS.mode,
      bpm: typeof s.bpm === "number" && Number.isFinite(bpm) && bpm >= 40 && bpm <= 200 ? bpm : DEFAULT_SETTINGS.bpm,
    },
    // Only lesson keys marked true count as done.
    done:
      done && typeof done === "object"
        ? Object.fromEntries(Object.entries(done).filter(([, v]) => v === true).map(([k]) => [k, true as const]))
        : {},
    last: typeof last === "string" ? last : null,
  };
}

/**
 * Merges this browser's course into an account's: every lesson done on either counts, the account's
 * key, mode and tempo win (a new device would otherwise reset them to defaults), and this browser's
 * last lesson wins, since it's the one in front of you.
 */
export function mergeSaved(local: Saved, account: Saved): Saved {
  return { settings: account.settings, done: { ...account.done, ...local.done }, last: local.last ?? account.last };
}
