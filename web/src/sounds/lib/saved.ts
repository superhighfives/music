import { DEFAULT_SETTINGS, MODES, type Settings } from "./music";

export interface Saved {
  settings: Settings;
  done: Record<string, true>;
  last: string | null;
}

/** Reads saved settings and progress, from this browser or an account, keeping only valid values. */
export function parseSaved(raw: any): Saved | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw.settings ?? {};
  return {
      settings: {
        root: Number.isInteger(s.root) && s.root >= 0 && s.root < 12 ? s.root : DEFAULT_SETTINGS.root,
        mode: MODES.some((m) => m.id === s.mode) ? s.mode : DEFAULT_SETTINGS.mode,
        bpm: Number.isFinite(s.bpm) && s.bpm >= 40 && s.bpm <= 200 ? s.bpm : DEFAULT_SETTINGS.bpm,
      },
      done: raw.done && typeof raw.done === "object" ? raw.done : {},
      last: typeof raw.last === "string" ? raw.last : null,
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
