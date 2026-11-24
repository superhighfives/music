import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import {
  CHORD_FAMILIES,
  CHORD_TYPES,
  LAYOUTS,
  NOTE_NAMES,
  SCALES,
  chordType,
  diatonicChords,
  mod,
  noteName,
  noteWithOctave,
  padGrid,
  scaleById,
  voicings,
  type Layout,
  type Pad,
  type Voicing,
} from '../lib/music'

type Search = {
  key: number
  scale: string
  layout: Layout
  base: number
  root: number
  chord: string
  v: number
  sevenths: boolean
  all: boolean
}

const pc = (value: unknown, fallback: number) => {
  const n = Number(value)
  return Number.isInteger(n) && n >= 0 && n < 12 ? n : fallback
}

export const Route = createFileRoute('/')({
  // All state lives in the URL, so any view can be bookmarked or shared.
  validateSearch: (s: Record<string, unknown>): Search => ({
    key: pc(s.key, 0),
    scale: SCALES.some((x) => x.id === s.scale) ? String(s.scale) : 'major',
    layout: LAYOUTS.some((x) => x.id === s.layout) ? (s.layout as Layout) : 'chromatic',
    base: pc(s.base, 9),
    root: pc(s.root, pc(s.key, 0)),
    // The router parses `chord=7` as a number, so compare as strings.
    chord: CHORD_TYPES.some((x) => x.id === String(s.chord)) ? String(s.chord) : 'maj',
    v: Math.max(0, Number.parseInt(String(s.v ?? 0), 10) || 0),
    sevenths: s.sevenths === true || s.sevenths === 'true',
    all: s.all === true || s.all === 'true',
  }),
  component: App,
})

type Tab = 'in-key' | 'root' | 'chord'

const TABS: { id: Tab; name: string }[] = [
  { id: 'in-key', name: 'In key' },
  { id: 'root', name: 'Root' },
  { id: 'chord', name: 'Chord type' },
]

function App() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, v: 0, ...patch }), replace: true, resetScroll: false })
  // Phone only: the pickers share one panel. Desktop shows them all in the sidebar.
  const [tab, setTab] = useState<Tab>('chord')

  const scale = scaleById(search.scale)
  const type = chordType(search.chord)
  const grid = padGrid(search.layout, search.key, scale, search.base)
  const options = voicings(grid, search.root, type, search.layout)
  const voicing = options.length ? options[mod(search.v, options.length)] : undefined
  const inScale = new Set(scale.intervals.map((i) => mod(search.key + i, 12)))
  const diatonic = diatonicChords(search.key, scale, search.sevenths)
  const current = diatonic.find((c) => c.rootPc === search.root && c.type.id === search.chord)
  const chordPcs = type.tones.map((tone) => mod(search.root + tone.interval, 12))
  const outOfKey = chordPcs.filter((p) => !inScale.has(p))
  const play = usePlayer()
  // Roots with at least one shape that has every required tone of the current chord.
  const playableRoots = new Set(
    NOTE_NAMES.flatMap((_, i) =>
      voicings(grid, i, type, search.layout).some((v) => v.missing.length === 0) ? [i] : [],
    ),
  )

  const inKeyPicker =
    diatonic.length > 0 ? (
      <Group
        label="In key"
        action={
          <button
            type="button"
            aria-pressed={search.sevenths}
            onClick={() => set({ sevenths: !search.sevenths })}
            className={[
              'rounded-full border px-2 py-px text-[11px] tracking-normal normal-case',
              search.sevenths ? 'border-led text-led' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500',
            ].join(' ')}
          >
            7ths {search.sevenths ? 'on' : 'off'}
          </button>
        }
      >
        <div className="grid grid-cols-4 gap-1">
          {diatonic.map((c) => (
            <Chip
              key={c.degree}
              active={search.root === c.rootPc && search.chord === c.type.id}
              onClick={() => set({ root: c.rootPc, chord: c.type.id })}
            >
              <span className="block text-[10px] leading-tight opacity-55">{c.numeral}</span>
              {chordSymbol(c.rootPc, c.type.id, c.type.name)}
            </Chip>
          ))}
        </div>
      </Group>
    ) : (
      <p className="text-xs text-neutral-500">In-key chords need a seven-note scale.</p>
    )

  const rootPicker = (
    <Group label="Root">
      <div className="grid grid-cols-6 gap-1">
        {NOTE_NAMES.map((name, i) => (
          <Chip
            key={name}
            active={search.root === i}
            dim={!inScale.has(i)}
            disabled={!playableRoots.has(i)}
            title={playableRoots.has(i) ? undefined : `No full ${type.name} shape from ${name} in this layout`}
            onClick={() => set({ root: i })}
          >
            {name}
          </Chip>
        ))}
      </div>
    </Group>
  )

  const chordPicker = (
    <div className="flex flex-col gap-1.5">
      {CHORD_FAMILIES.map((family) => (
        <div key={family.name} className="grid grid-cols-[3.25rem_1fr] items-start gap-2">
          <div className="pt-1.5 text-[10px] font-medium tracking-wider text-neutral-500 uppercase">{family.name}</div>
          <div className="grid grid-cols-5 gap-1">
            {family.ids.map((id) => (
              <Chip key={id} active={search.chord === id} onClick={() => set({ chord: id })}>
                {chordType(id).name}
              </Chip>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const showAll = search.all
  const hasNotes =
    !voicing ||
    voicing.missing.length > 0 ||
    (search.layout === 'chromatic' && (outOfKey.length > 0 || !voicing.fromChart))

  return (
    <main className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-3 px-4 pt-4 lg:w-[392px] lg:gap-4 lg:overflow-y-auto lg:border-r lg:border-neutral-900 lg:px-6 lg:py-5">
        <div className="flex items-center gap-2">
          <h1 className="mr-auto text-lg font-semibold tracking-tight text-white">movechords</h1>
          {/* Phone: key and scale sit beside the title to save height. */}
          <div className="flex gap-2 lg:hidden">
            <KeySelect value={search.key} onChange={(key) => set({ key, root: key })} />
            <ScaleSelect value={scale.id} onChange={(id) => set({ scale: id })} />
          </div>
        </div>
        <div className="hidden grid-cols-3 gap-2 lg:grid">
          <Field label="Key">
            <KeySelect value={search.key} onChange={(key) => set({ key, root: key })} />
          </Field>
          <Field label="Scale" className="col-span-2">
            <ScaleSelect value={scale.id} onChange={(id) => set({ scale: id })} />
          </Field>
        </div>
        <Segmented
          options={LAYOUTS}
          value={search.layout}
          onChange={(layout) => set({ layout })}
        />
        {search.layout === 'chromatic' && (
          <Field label="Bottom-left pad" inline>
            <select
              className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm text-neutral-200"
              value={search.base}
              onChange={(e) => set({ base: Number(e.target.value) })}
            >
              {NOTE_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <div className="hidden flex-col gap-4 lg:flex">
          {inKeyPicker}
          {rootPicker}
          {chordPicker}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 lg:gap-4 lg:px-8 lg:py-5">
        <div className="flex items-end justify-between gap-3">
          {showAll ? (
            <div className="min-w-0">
              <div className="text-xs text-neutral-500">{search.sevenths ? 'Sevenths' : 'Triads'} in key</div>
              <h2 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {NOTE_NAMES[search.key]} {scale.name}
              </h2>
              <p className="text-sm text-neutral-400">Select a chord to open it.</p>
            </div>
          ) : (
            <div className="min-w-0">
              {current && (
                <div className="text-xs text-neutral-500">
                  {current.numeral}
                  {search.sevenths ? '7' : ''} in {NOTE_NAMES[search.key]} {scale.name}
                </div>
              )}
              <h2 className="text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                {chordSymbol(search.root, type.id, type.name)}
              </h2>
              <p className="text-sm text-neutral-400">{chordPcs.map((p) => NOTE_NAMES[p]).join(' · ')}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!showAll && (
              <div className="hidden items-center gap-2 lg:flex">
                <ShapeNav count={options.length} index={search.v} onChange={(v) => set({ v })} />
              </div>
            )}
            <button
              type="button"
              aria-pressed={showAll}
              onClick={() => set({ all: !showAll })}
              className={[
                'min-h-11 rounded-lg border px-3 text-sm lg:min-h-9',
                showAll ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500',
              ].join(' ')}
            >
              All in key
            </button>
            {!showAll && (
              <button
                type="button"
                className="min-h-11 rounded-lg bg-led px-4 font-medium text-neutral-950 disabled:opacity-40 lg:min-h-9"
                disabled={!voicing}
                onClick={() => voicing && play(voicing.pads.map((p) => p.midi), true)}
              >
                Play
              </button>
            )}
          </div>
        </div>

        {showAll ? (
          diatonic.length > 0 ? (
            // Four rows of two cards. Each card is a label plus a 2:1 grid, so the card width
            // is twice the row height minus the label, capped by the available width.
            <div className="min-h-0 flex-1 [container-type:size]">
              <div
                className="grid grid-cols-2 gap-x-4 gap-y-3"
                style={{ width: 'min(100cqw, calc(((100cqh - 2.25rem) / 4 - 1.75rem) * 4 + 1rem))' }}
              >
                {diatonic.map((c) => {
                  const [best] = voicings(grid, c.rootPc, c.type, search.layout)
                  const selected = c.rootPc === search.root && c.type.id === search.chord
                  return (
                    <button
                      key={c.degree}
                      type="button"
                      onClick={() => set({ root: c.rootPc, chord: c.type.id, all: false })}
                      className="group flex flex-col gap-1.5 text-left [container-type:inline-size]"
                    >
                      <span className="flex h-5 items-baseline gap-2 text-sm">
                        <span className="text-xs text-neutral-500">{c.numeral}</span>
                        <span className={selected ? 'font-semibold text-led' : 'font-medium text-white'}>
                          {chordSymbol(c.rootPc, c.type.id, c.type.name)}
                        </span>
                        <span className="truncate text-xs text-neutral-500">
                          {c.type.tones.map((t) => NOTE_NAMES[mod(c.rootPc + t.interval, 12)]).join(' · ')}
                        </span>
                      </span>
                      <PadGrid
                        compact
                        grid={grid}
                        voicing={best}
                        keyPc={search.key}
                        inScale={inScale}
                        layout={search.layout}
                        className={[
                          'w-full rounded-xl p-[1.5%] ring-1 transition-colors',
                          selected ? 'ring-led' : 'ring-neutral-800 group-hover:ring-neutral-600',
                        ].join(' ')}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">In-key chords need a seven-note scale. Pick another scale.</p>
          )
        ) : (
          <>
            {/* Desktop: the 8×4 grid fits the smaller of the full width and twice the free height,
                leaving room under it for the legend and any notes. */}
            <div className="flex shrink-0 flex-col items-start gap-4 lg:min-h-0 lg:flex-1 lg:[container-type:size]">
              <PadGrid
                grid={grid}
                voicing={voicing}
                keyPc={search.key}
                inScale={inScale}
                layout={search.layout}
                onPad={(midi) => play([midi])}
                className={[
                  'w-full rounded-2xl p-[1.6cqmin] ring-1 ring-neutral-800',
                  hasNotes ? 'lg:w-[min(100cqw,calc((100cqh-4.5rem)*2))]' : 'lg:w-[min(100cqw,calc((100cqh-2.5rem)*2))]',
                ].join(' ')}
              />
              <div className="hidden flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500 lg:flex">
                <Swatch className="bg-led">Chord root</Swatch>
                <Swatch className="bg-white">Chord tone</Swatch>
                <Swatch className="bg-neutral-700/70">In scale</Swatch>
                {search.layout === 'chromatic' && (
                  <Swatch className="bg-neutral-950 ring-1 ring-neutral-700">Unlit on Move</Swatch>
                )}
                {voicing?.pads.some((p) => p.optional) && (
                  <Swatch className="ring-1 ring-white/70 ring-inset">Optional</Swatch>
                )}
              </div>
              {hasNotes && (
                <p className="text-xs text-neutral-500">
                  {!voicing && <span className="text-amber-400">This chord doesn't fit on the grid. </span>}
                  {voicing && voicing.missing.length > 0 && (
                    <span className="text-amber-400">
                      Can't play {voicing.missing.map((i) => NOTE_NAMES[mod(search.root + i, 12)]).join(', ')} in
                      key.{' '}
                    </span>
                  )}
                  {search.layout === 'chromatic' && voicing && !voicing.fromChart && (
                    <span>Not the chart shape: the chart shape doesn't fit from this root. </span>
                  )}
                  {search.layout === 'chromatic' && outOfKey.length > 0 && (
                    <span>Outside the scale: {outOfKey.map((p) => NOTE_NAMES[p]).join(', ')}.</span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 lg:hidden">
              <ShapeNav count={options.length} index={search.v} onChange={(v) => set({ v })} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 border-t border-neutral-900 pt-3 lg:hidden">
              <Segmented options={TABS} value={tab} onChange={setTab} />
              <div className="min-h-0 overflow-y-auto">
                {tab === 'in-key' ? inKeyPicker : tab === 'root' ? rootPicker : chordPicker}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

/**
 * The 8×4 Move pad grid with one chord shape lit. With `onPad` each pad is a button.
 * `compact` drops interval labels and uses a thinner ring for small previews.
 */
function PadGrid({
  grid,
  voicing,
  keyPc,
  inScale,
  layout,
  compact,
  onPad,
  className,
}: {
  grid: Pad[][]
  voicing: Voicing | undefined
  keyPc: number
  inScale: Set<number>
  layout: Layout
  compact?: boolean
  onPad?: (midi: number) => void
  className: string
}) {
  const ring = compact ? 'ring-[1.5px] ring-white ring-offset-1 ring-offset-neutral-900' : chordRing
  return (
    <div
      className={`grid grid-cols-8 bg-neutral-900 ${compact ? 'gap-[1.2%]' : 'gap-[1.2cqmin]'} ${className}`}
    >
      {[...grid].reverse().flatMap((row) =>
        row.map((pad) => {
          const hit = voicing?.pads.find((p) => p.col === pad.col && p.row === pad.row)
          const isKeyRoot = mod(pad.midi, 12) === keyPc
          const lit = layout !== 'chromatic' || inScale.has(mod(pad.midi, 12))
          const padClass = [
            'flex aspect-square flex-col items-center justify-center rounded-[18%] font-medium transition-colors',
            compact ? 'text-[clamp(6px,2.4cqw,11px)]' : 'text-[clamp(9px,2.4cqmin,14px)]',
            hit
              ? hit.interval === 0
                ? `${ring} bg-led text-neutral-950 shadow-[0_0_24px_-4px_var(--color-led)]`
                : hit.optional
                  ? 'bg-neutral-800 text-white outline-2 -outline-offset-2 outline-white/70 outline-dashed'
                  : `${ring} bg-white text-neutral-950 shadow-[0_0_20px_-6px_white]`
              : isKeyRoot
                ? 'bg-led/25 text-led'
                : lit
                  ? 'bg-neutral-700/70 text-neutral-300'
                  : 'bg-neutral-950 text-neutral-600',
          ].join(' ')
          const label = (
            <>
              <span>{noteName(pad.midi)}</span>
              {hit && !compact && <span className="text-[0.75em] opacity-70">{intervalLabel(hit.interval)}</span>}
            </>
          )
          return onPad ? (
            <button
              key={`${pad.col}-${pad.row}`}
              type="button"
              onClick={() => onPad(pad.midi)}
              title={noteWithOctave(pad.midi)}
              className={padClass}
            >
              {label}
            </button>
          ) : (
            <span key={`${pad.col}-${pad.row}`} className={padClass}>
              {label}
            </span>
          )
        }),
      )}
    </div>
  )
}

/** Short chord symbols, e.g. "E7", "F♯m", "DM7". */
function chordSymbol(rootPc: number, id: string, name: string) {
  const suffix = id === 'maj' ? '' : id === 'min' ? 'm' : id === '7' ? '7' : name
  return NOTE_NAMES[rootPc] + suffix
}

function ShapeNav({ count, index, onChange }: { count: number; index: number; onChange: (v: number) => void }) {
  if (count < 2) return null
  return (
    <>
      <Chip label="Previous shape" onClick={() => onChange(mod(index - 1, count))}>
        ←
      </Chip>
      <span className="text-xs tabular-nums text-neutral-400">
        Shape {mod(index, count) + 1} / {count}
      </span>
      <Chip label="Next shape" onClick={() => onChange(mod(index + 1, count))}>
        →
      </Chip>
    </>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; name: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-neutral-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={[
            'min-h-9 rounded-md px-2 text-[13px] transition-colors lg:min-h-8',
            value === o.id ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white',
          ].join(' ')}
        >
          {o.name}
        </button>
      ))}
    </div>
  )
}

function Group({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[10px] font-medium tracking-wider text-neutral-500 uppercase">
        {label}
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  inline,
  className = '',
  children,
}: {
  label: string
  inline?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label
      className={[
        'flex gap-1 text-[10px] font-medium tracking-wider text-neutral-500 uppercase',
        inline ? 'items-center gap-2' : 'flex-col',
        className,
      ].join(' ')}
    >
      {label}
      {children}
    </label>
  )
}

const selectClass =
  'min-h-9 rounded-md border border-neutral-800 bg-neutral-900 px-2 text-sm font-normal tracking-normal text-neutral-200 normal-case lg:min-h-8'

function KeySelect({ value, onChange }: { value: number; onChange: (key: number) => void }) {
  return (
    <select aria-label="Key" className={selectClass} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {NOTE_NAMES.map((name, i) => (
        <option key={name} value={i}>
          {name}
        </option>
      ))}
    </select>
  )
}

function ScaleSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <select aria-label="Scale" className={selectClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {SCALES.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}

function Swatch({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] ${className}`} />
      {children}
    </span>
  )
}

// A white ring with a gap in the grid's color marks every pad to press. Optional pads keep their dashed outline.
const chordRing = 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900'

const INTERVALS: Record<number, string> = {
  0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7',
  13: '♭9', 14: '9', 15: '♯9', 17: '11', 18: '♯11', 21: '13',
}
const intervalLabel = (i: number) => INTERVALS[i] ?? String(i)

function Chip({
  active,
  dim,
  disabled,
  label,
  title,
  onClick,
  children,
}: {
  active?: boolean
  dim?: boolean
  disabled?: boolean
  label?: string
  title?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={title}
      className={[
        'min-h-8 min-w-8 truncate rounded-md px-1.5 py-1 text-[13px] transition-colors',
        active
          ? 'bg-white text-neutral-950'
          : disabled
            ? 'cursor-not-allowed text-neutral-700 ring-1 ring-neutral-900 ring-inset'
            : dim
            ? 'bg-neutral-900 text-neutral-600 hover:bg-neutral-800'
            : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/** A small Web Audio synth. The AudioContext starts on the first click, as browsers require. */
function usePlayer() {
  const ctx = useRef<AudioContext | null>(null)
  return (notes: number[], strum = false) => {
    ctx.current ??= new AudioContext()
    const ac = ctx.current
    const sorted = [...notes].sort((a, b) => a - b)
    sorted.forEach((midi, i) => {
      const start = ac.currentTime + (strum ? i * 0.035 : 0)
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.value = 440 * 2 ** ((midi - 69) / 12)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18 / Math.sqrt(sorted.length), start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.4)
      osc.connect(gain).connect(ac.destination)
      osc.start(start)
      osc.stop(start + 1.5)
    })
  }
}
