import { diatonicChords, keyName, scaleNotes, type Settings } from "~/production/lib/music";

/** The current key's scale and diatonic triads. */
export function KeyBoxView({ settings }: { settings: Settings }) {
  const notes = scaleNotes(settings);
  const chords = diatonicChords(settings);
  return (
    <div className="keybox">
      <div className="gf-h">
        In this key<span>{keyName(settings)}</span>
      </div>
      <div className="keyrow">
        {notes.map((n, i) => (
          <div className={i === 0 ? "tonic" : undefined}>
            <small>{i + 1}</small>
            <b>{n}</b>
          </div>
        ))}
      </div>
      <div className="keyrow">
        {chords.map((c) => (
          <div className={c.tonic ? "tonic" : undefined}>
            <small className="rn">{c.roman}</small>
            <b>{c.name}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
