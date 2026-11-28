import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Masthead, PadMark } from "~/Masthead";
import { SiteFooter } from "~/SiteFooter";
import { MODES, type ModeId, SHARP, FLAT } from "~/production/lib/music";
import { StoreProvider, useStore } from "~/production/lib/store";
import appCss from "~/production/styles/app.css?url";

// Production, the course. Its styles load only under /production.
export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Production" },
      {
        name: "description",
        content: "A step-by-step course in music production with Ableton Live 12: sound quality, soundscapes, melody, songwriting, drums and mixing.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <StoreProvider>
      <div className="page" data-section="production">
        <ProductionMast />
        <Outlet />
        <SiteFooter current="production" />
      </div>
    </StoreProvider>
  );
}

function ProductionMast() {
  const { settings, setSettings } = useStore();
  const setBpm = (v: number) => setSettings({ bpm: Math.min(200, Math.max(40, Math.round(v) || 70)) });
  return (
    <Masthead
      brand={
        <Link className="brand" to="/production">
          <PadMark lit={12} />
          Production
        </Link>
      }
    >
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
    </Masthead>
  );
}
