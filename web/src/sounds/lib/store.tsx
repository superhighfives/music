import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAccountSync } from "~/account/sync";
import { type Derived, derived, DEFAULT_SETTINGS, type Settings } from "./music";
import { mergeSaved, parseSaved, type Saved } from "./saved";

/**
 * Settings (key, mode, tempo) and progress live in this browser's localStorage.
 * The server always renders the defaults; saved values load after hydration.
 */
const KEY = "sounds.v1";


interface Store extends Saved {
  values: Derived;
  ready: boolean;
  setSettings: (patch: Partial<Settings>) => void;
  toggleDone: (key: string) => void;
  visit: (key: string) => void;
}

const StoreContext = createContext<Store | null>(null);

function load(): Saved | null {
  try {
    return parseSaved(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ settings: DEFAULT_SETTINGS, done: {}, last: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = load();
    if (s) setSaved(s);
    setReady(true);
  }, []);

  // Signed in, progress and settings also live in the account, so they follow you to other devices.
  useAccountSync({ key: "sounds.course", value: saved, ready, parse: parseSaved, merge: mergeSaved, apply: setSaved });

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // Private windows and blocked storage: progress just won't persist.
    }
  }, [saved, ready]);

  const setSettings = useCallback(
    (patch: Partial<Settings>) => setSaved((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    [],
  );
  const toggleDone = useCallback(
    (key: string) =>
      setSaved((p) => {
        const done = { ...p.done };
        if (done[key]) delete done[key];
        else done[key] = true;
        return { ...p, done };
      }),
    [],
  );
  const visit = useCallback((key: string) => setSaved((p) => (p.last === key ? p : { ...p, last: key })), []);

  const value = useMemo<Store>(
    () => ({ ...saved, values: derived(saved.settings), ready, setSettings, toggleDone, visit }),
    [saved, ready, setSettings, toggleDone, visit],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}

/** Shorthand for the key- and tempo-dependent values. */
export function useValues(): Derived {
  return useStore().values;
}
