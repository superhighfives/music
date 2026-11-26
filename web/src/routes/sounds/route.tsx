import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { AccountButton } from "~/account/AccountButton";
import { Logo } from "~/sounds/components/ui";
import { MODES, type ModeId, SHARP, FLAT } from "~/sounds/lib/music";
import { StoreProvider, useStore } from "~/sounds/lib/store";
import appCss from "~/sounds/styles/app.css?url";

// Applies a saved light/dark choice before first paint, so there's no flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem("sounds.theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

// Fog & Pulse, the course. Its styles, fonts and theme load only under /sounds.
export const Route = createFileRoute("/sounds")({
  head: () => ({
    meta: [
      { title: "Fog & Pulse" },
      {
        name: "description",
        content: "A step-by-step course in music production with Ableton Live 12: sound quality, soundscapes, melody, songwriting, drums and mixing.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [{ children: THEME_SCRIPT }],
  }),
  component: Root,
});

function Root() {
  return (
    <StoreProvider>
      <div className="page">
        <Masthead />
        <Outlet />
      </div>
    </StoreProvider>
  );
}

function Masthead() {
  const { settings, setSettings } = useStore();
  const setBpm = (v: number) => setSettings({ bpm: Math.min(200, Math.max(40, Math.round(v) || 70)) });
  return (
    <header className="mast">
      <Link className="brand" to="/sounds">
        <Logo />
        Fog &amp; Pulse
      </Link>
      <div className="ctrls">
        <label className="ctrl">
          <span className="lab">Key</span>
          <select value={settings.root} onChange={(e) => setSettings({ root: Number(e.target.value) })}>
            {SHARP.map((n, i) => (
              <option key={n} value={i}>
                {n === FLAT[i] ? n : `${n}/${FLAT[i]}`}
              </option>
            ))}
          </select>
        </label>
        <label className="ctrl">
          <span className="lab">Mode</span>
          <select value={settings.mode} onChange={(e) => setSettings({ mode: e.target.value as ModeId })}>
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <div className="ctrl">
          <label className="lab" htmlFor="bpm">
            Tempo
          </label>
          <div className="stepper">
            <button type="button" aria-label="Slower" onClick={() => setBpm(settings.bpm - 1)}>
              −
            </button>
            <input id="bpm" type="number" min={40} max={200} inputMode="numeric" value={settings.bpm} onChange={(e) => setBpm(Number(e.target.value))} />
            <button type="button" aria-label="Faster" onClick={() => setBpm(settings.bpm + 1)}>
              +
            </button>
          </div>
        </div>
      </div>
      <ThemeToggle />
      <AccountButton className="btn" />
    </header>
  );
}

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("sounds.theme", next);
    } catch {
      // Not remembered, but the switch still applies.
    }
  };
  return (
    <button type="button" className="iconbtn" aria-label="Switch light or dark theme" onClick={toggle}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
