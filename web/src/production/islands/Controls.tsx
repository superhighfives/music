import { FLAT, MODES, SHARP, type ModeId } from '~/production/lib/music'
import { setSettings, useSaved } from './store'

const setBpm = (v: number) => setSettings({ bpm: Math.min(200, Math.max(40, Math.round(v) || 70)) })

/** Key, mode and tempo, in the masthead. Every value in the lessons follows them. */
export default function Controls() {
  const { settings } = useSaved()
  return (
    <div className="ctrls">
      <label className="ctrl">
        <span className="lab">Key</span>
        <select value={String(settings.root)} onChange={(e) => setSettings({ root: Number(e.currentTarget.value) })}>
          {SHARP.map((n, i) => (
            <option key={n} value={String(i)}>
              {n === FLAT[i] ? n : `${n}/${FLAT[i]}`}
            </option>
          ))}
        </select>
      </label>
      <label className="ctrl">
        <span className="lab">Mode</span>
        <select
          value={settings.mode}
          onChange={(e) => {
            const mode = MODES.find((m) => m.id === e.currentTarget.value)?.id
            if (mode) setSettings({ mode: mode satisfies ModeId })
          }}
        >
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
          <input id="bpm" type="number" min={40} max={200} inputMode="numeric" value={settings.bpm} onChange={(e) => setBpm(Number(e.currentTarget.value))} />
          <button type="button" aria-label="Faster" onClick={() => setBpm(settings.bpm + 1)}>
            +
          </button>
        </div>
      </div>
    </div>
  )
}
