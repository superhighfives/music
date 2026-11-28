/** @jsxImportSource ~/content */
import { island, type Node } from "~/content/jsx-runtime";
import { diatonicChords, keyName, scaleNotes, type Settings } from "~/production/lib/music";

/*
 * The parts lessons are written with. They're content, not React: each returns a tree that the page
 * renders. KeyBox reads the page's key, so it's an island the page fills in.
 */

/** A spec sheet: a headed grid of labelled cells. */
export function Sheet({ head, sub, children }: { head: Node; sub?: Node; children?: Node }) {
  return (
    <div className="gf">
      <div className="gf-h">
        {head}
        {sub ? <span>{sub}</span> : null}
      </div>
      {children}
    </div>
  );
}

type Tone = "lit" | "cool";

/** A labelled cell. `data-span` lets its Row count columns, since the cell is built before the row sees it. */
export function Cell({ l, children, span = 1, tone, num }: { l: Node; children?: Node; span?: number; tone?: Tone; num?: boolean }) {
  const cls = ["f", span > 1 ? `s${span}` : "", tone ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls} data-span={span}>
      <div className="lab">{l}</div>
      <div className={num ? "v num" : "v"}>{children}</div>
    </div>
  );
}

const spanOf = (n: Node): number =>
  n && typeof n === "object" && !Array.isArray(n) && "_tag" in n && n._tag === "Element" ? Number(n.props["data-span"] ?? 1) : 1;

/** A row of cells; its column count is the sum of the cells' spans. */
export function Row({ children }: { children?: Node }) {
  const kids = Array.isArray(children) ? children : [children];
  const cols = kids.filter((c) => c !== null && c !== undefined && c !== false).reduce<number>((n, c) => n + spanOf(c), 0);
  return (
    <div className="gf-r" style={{ "--cols": cols }}>
      {children}
    </div>
  );
}

export function Steps({ children }: { children?: Node }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <ol className="steps">
      {items.map((c) => (
        <li>
          <div>{c}</div>
        </li>
      ))}
    </ol>
  );
}

export function Task({ children }: { children?: Node }) {
  return (
    <div className="task">
      <div className="lab">Your turn</div>
      <div>{children}</div>
    </div>
  );
}

export function Note({ label, children }: { label: string; children?: Node }) {
  return (
    <p className="note">
      <b>{label}</b> {children}
    </p>
  );
}

export function Logo({ big }: { big?: boolean }) {
  return (
    <span className={big ? "logo big" : "logo"} aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => (
        <i className={i === 12 ? "on" : undefined} />
      ))}
    </span>
  );
}

/** The current key's scale and diatonic triads. The page fills it in from its settings. */
export const KeyBox = () => island("KeyBox");

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

export const CHORDS_URL = "/chords";
