import { Mount, type View } from '@effect/ui'
import type { Html } from '@effect/ui/html'
import type { MoveStatus } from '../lib/move'
import {
  CHORD_FAMILIES,
  LAYOUTS,
  NOTE_NAMES,
  SCALES,
  chordType,
  mod,
  noteName,
  noteWithOctave,
  voicings,
  type Layout,
  type Pad,
  type Voicing,
} from '../lib/music'
import { eventLabel, type Result } from '../lib/practice'
import { SONGS, chordLabel, unknownChords, type Song, type SongEvent } from '../lib/songs'
import { TUTORIALS, type Tutorial } from '../lib/tutorials'
import { SITE_LINKS } from '../../site-links'
import { CenterInBox, SetBookmarklet, ShowOnMove } from './effects'
import { ChordsMessage, type SearchPatch } from './messages'
import { EXERCISES, SIDEBAR_DEFAULT, SIDEBAR_MAX, SIDEBAR_MIN, TABS, moveView, type ChordsModel, type Derived, type Tab } from './state'

type H = Html.H<ChordsMessage>
type Match = Derived['match']

const cx = (...parts: ReadonlyArray<string | false | null | undefined>) => parts.filter(Boolean).join(' ')
const pick = (patch: SearchPatch) => ChordsMessage.PickedView({ patch })

/** Short chord symbols, e.g. "E7", "F♯m", "DM7". */
const chordSymbol = (rootPc: number, id: string, name: string) =>
  NOTE_NAMES[rootPc] + (id === 'maj' ? '' : id === 'min' ? 'm' : id === '7' ? '7' : name)

const INTERVALS: Record<number, string> = {
  0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7',
  13: '♭9', 14: '9', 15: '♯9', 17: '11', 18: '♯11', 21: '13',
}
const intervalLabel = (i: number) => INTERVALS[i] ?? String(i)

// A white ring with a gap in the grid's color marks every pad to press. Optional pads keep their dashed outline.
const chordRing = 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900'

const Chip = (
  h: H,
  o: { active?: boolean; dim?: boolean; disabled?: boolean; label?: string; title?: string | undefined; onClick: ChordsMessage },
) =>
  h.button
    .attr('type', 'button')
    .attr('aria-pressed', o.active === undefined ? undefined : String(o.active))
    .attr('aria-label', o.label)
    .attr('title', o.title)
    .disabled(!!o.disabled)
    .on('click', o.onClick)
    .class(
      cx(
        'min-h-8 min-w-8 truncate rounded-md px-1.5 py-1 text-[13px] transition-colors',
        o.active
          ? 'bg-white text-neutral-950'
          : o.disabled
            ? 'cursor-not-allowed text-neutral-700 ring-1 ring-neutral-900 ring-inset'
            : o.dim
              ? 'bg-neutral-900 text-neutral-600 hover:bg-neutral-800'
              : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800',
      ),
    )

const Group = <A extends View.Input<ChordsMessage>>(h: H, label: string, action: A) =>
  h.div.class('flex flex-col gap-1.5').children(
    h.div.class('flex items-center justify-between font-mono text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase').children(label, action),
  )

const Field = (h: H, label: string, o: { inline?: boolean; className?: string } = {}) =>
  h.label.class(
    cx('flex gap-1 font-mono text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase', o.inline ? 'items-center gap-2' : 'flex-col', o.className),
  ).children(label)

const selectClass =
  'min-h-9 rounded-md border border-neutral-800 bg-neutral-900 px-2 text-sm font-normal tracking-normal text-neutral-200 normal-case lg:min-h-8'

const KeySelect = (h: H, value: number) =>
  h.select
    .attr('aria-label', 'Key')
    .class(selectClass)
    .value(String(value))
    .on('change', ({ value: v }) => pick({ key: Number(v), root: Number(v) }))
    .children(NOTE_NAMES.map((name, i) => h.option.key(name).attr('value', String(i)).children(name)))

const ScaleSelect = (h: H, value: string) =>
  h.select
    .attr('aria-label', 'Scale')
    .class(selectClass)
    .value(value)
    .on('change', ({ value: v }) => pick({ scale: v }))
    .children(SCALES.map((s) => h.option.key(s.id).attr('value', s.id).children(s.name)))

const Segmented = <T extends string>(h: H, options: ReadonlyArray<{ id: T; name: string }>, value: T, onChange: (id: T) => ChordsMessage) =>
  h.div.class('grid auto-cols-fr grid-flow-col gap-0.5 rounded-lg bg-neutral-900 p-0.5').children(
    options.map((o) =>
      h.button
        .key(o.id)
        .attr('type', 'button')
        .attr('aria-pressed', String(value === o.id))
        .on('click', onChange(o.id))
        .class(
          cx(
            'min-h-9 rounded-md px-2 text-[13px] transition-colors lg:min-h-8',
            value === o.id ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white',
          ),
        )
        .children(o.name),
    ),
  )

const Swatch = (h: H, className: string, text: string) =>
  h.span.class('flex items-center gap-1.5').children(h.span.class(`size-2.5 rounded-[3px] ${className}`), text)

const ShapeNav = (h: H, count: number, index: number) =>
  count < 2
    ? []
    : [
        Chip(h, { label: 'Previous shape', onClick: pick({ v: mod(index - 1, count) }) }).children('←'),
        h.span.class('text-xs tabular-nums text-neutral-400').children(`Shape ${mod(index, count) + 1} / ${count}`),
        Chip(h, { label: 'Next shape', onClick: pick({ v: mod(index + 1, count) }) }).children('→'),
      ]

/**
 * The 8×4 Move pad grid with one chord shape lit. With `clickable` each pad is a button.
 * `compact` drops interval labels and uses a thinner ring for small previews.
 */
function PadGrid(
  h: H,
  o: {
    grid: Pad[][]
    voicing: Voicing | undefined
    keyPc: number
    inScale: ReadonlySet<number>
    layout: Layout
    compact?: boolean
    /** Pads held on Move, as "col-row" keys. They get a green outline in the chord and red outside it. */
    held?: ReadonlySet<string>
    chordPcs?: ReadonlyArray<number>
    clickable?: boolean
    className: string
  },
) {
  const ring = o.compact ? 'ring-[1.5px] ring-white ring-offset-1 ring-offset-neutral-900' : chordRing
  return h.div.class(cx('grid grid-cols-8 bg-neutral-900', o.compact ? 'gap-[1.2%]' : 'gap-[1.2cqmin]', o.className)).children(
    [...o.grid].reverse().flatMap((row) =>
      row.map((pad) => {
        const hit = o.voicing?.pads.find((p) => p.col === pad.col && p.row === pad.row)
        const isKeyRoot = mod(pad.midi, 12) === o.keyPc
        const lit = o.layout !== 'chromatic' || o.inScale.has(mod(pad.midi, 12))
        const padClass = cx(
          'flex aspect-square flex-col items-center justify-center rounded-[18%] font-medium transition-colors',
          o.compact ? 'text-[clamp(6px,2.4cqw,11px)]' : 'text-[clamp(9px,2.4cqmin,14px)]',
          hit
            ? hit.interval === 0
              ? `${ring} bg-led text-on-led shadow-[0_0_24px_-4px_var(--color-led)]`
              : hit.optional
                ? 'bg-neutral-800 text-white outline-2 -outline-offset-2 outline-white/70 outline-dashed'
                : `${ring} bg-white text-neutral-950 shadow-[0_0_20px_-6px_white]`
            : isKeyRoot
              ? 'bg-led/25 text-led-ink'
              : lit
                ? 'bg-neutral-700/70 text-neutral-300'
                : 'bg-neutral-950 text-neutral-600',
          o.held?.has(`${pad.col}-${pad.row}`) &&
            (o.chordPcs?.includes(mod(pad.midi, 12))
              ? 'outline-4 outline-offset-0 outline-solid outline-emerald-400'
              : 'outline-4 outline-offset-0 outline-solid outline-red-500'),
        )
        const label = [
          h.span.children(noteName(pad.midi)),
          hit && !o.compact && h.span.class('text-[0.75em] opacity-70').children(intervalLabel(hit.interval)),
        ]
        const key = `${pad.col}-${pad.row}`
        return o.clickable
          ? h.button
              .key(key)
              .attr('type', 'button')
              .attr('title', noteWithOctave(pad.midi))
              .on('click', ChordsMessage.ClickedPad({ midi: pad.midi }))
              .class(padClass)
              .children(label)
          : h.span.key(key).class(padClass).children(label)
      }),
    ),
  )
}

/** The site footer, as every section has it (src/components/SiteFooter.astro). Chords draws its own, inside the app's scroll area. */
const Footer = (h: H, extra: string) =>
  h.footer.class(`sitefoot chordsfoot ${extra}`.trim()).children(
    h.nav.attr('aria-label', 'music').children(
      SITE_LINKS.map((l) => h.a.key(l.id).attr('href', l.href).attr('aria-current', l.id === 'chords' ? 'page' : undefined).children(l.label)),
    ),
  )

/** Why connecting failed. Other statuses show no message. */
const CONNECT_PROBLEM: Partial<Record<MoveStatus, string>> = {
  unsupported: 'This browser has no Web MIDI. Use Chrome or Edge.',
  'not-found': 'Move not found. Check the USB-C cable and that Move is in Control Live Mode.',
  denied: 'MIDI access is blocked. Allow MIDI in the site settings, then try again.',
}

/** C major in Chromatic, as the pads show it: the played root cyan, other roots dim cyan, chord tones white. */
const ART_LIT: Record<string, string> = { '3-0': 'bg-led', '7-0': 'bg-white', '5-1': 'bg-white', '5-2': 'bg-led/40', '0-3': 'bg-led/40' }

const ConnectButton = (h: H, status: MoveStatus, className: string) =>
  h.button
    .attr('type', 'button')
    .on('click', ChordsMessage.ClickedConnect())
    .disabled(status === 'connecting')
    .class(className)
    .children(status === 'connecting' ? 'Connecting…' : 'Connect Move')

function ConnectScreen(h: H, status: MoveStatus) {
  const problem = CONNECT_PROBLEM[status]
  return h.main.class('flex flex-1 items-center justify-center overflow-y-auto px-6 py-12').children(
    h.div.class('flex w-full max-w-md flex-col items-center gap-8 text-center').children(
      h.div.attr('aria-hidden', 'true').class('grid grid-cols-8 gap-1.5').children(
        [3, 2, 1, 0].flatMap((row) =>
          Array.from({ length: 8 }, (_, col) => h.div.key(`${col}-${row}`).class(`size-5 rounded ${ART_LIT[`${col}-${row}`] ?? 'bg-neutral-800'}`)),
        ),
      ),
      h.div.class('flex flex-col gap-2').children(
        h.h1.class('text-4xl font-medium tracking-tight text-white').children('Chords'),
        h.p.class('text-neutral-400').children('Learn chords and play along with songs on Ableton Move.'),
      ),
      h.div.class('flex flex-col items-center gap-3').children(
        ConnectButton(h, status, 'min-h-11 rounded-xl bg-led px-6 text-base font-medium text-on-led disabled:opacity-40'),
        problem && h.p.class('text-sm text-amber-300').children(problem),
        h.button
          .attr('type', 'button')
          .on('click', ChordsMessage.ClickedBrowse())
          .class('min-h-11 text-sm text-neutral-400 underline-offset-4 hover:text-neutral-200 hover:underline')
          .children('Look up chords without Move'),
      ),
      h.ol.class('flex list-decimal flex-col gap-1 pl-5 text-left text-sm text-neutral-500').children(
        h.li.children('Connect Move to this computer with USB-C.'),
        h.li.children('On Move, hold Shift, press Step 2, select Control Live, then press the wheel.'),
        h.li.children('Move shows "Connect Live via USB-C". That is correct: Live does not have to be open.'),
      ),
      Footer(h, 'centred w-full'),
    ),
  )
}

/** In place of the tabs while Move is not connected. Only Play works without it. */
function OfflineBar(h: H, status: MoveStatus) {
  const problem = CONNECT_PROBLEM[status]
  return h.div.class('flex flex-col gap-1.5 rounded-lg border border-neutral-800 px-3 py-2').children(
    h.div.class('flex items-center gap-3').children(
      h.p.class('mr-auto text-xs text-neutral-400').children('Connect Move for Learn, Songs and Practice.'),
      ConnectButton(h, status, 'min-h-9 shrink-0 rounded-md bg-led px-3 text-sm font-medium text-on-led disabled:opacity-40'),
    ),
    problem && h.p.class('text-xs text-amber-300').children(problem),
  )
}

function TutorialCard(h: H, d: Derived, tutorial: Tutorial) {
  const index = d.stepIndex
  const step = tutorial.steps.at(index)
  const last = index === tutorial.steps.length - 1
  const heldNames = [...new Set(d.heldMidi.map(noteName))].join(' ')
  const nextKey = d.connected ? 'Press → on Move' : 'Press Next'
  // The prompt says what the player does now. It is the hand-over from the tutorial to the player.
  const prompt: { tone: string; text: string } = !step
    ? { tone: 'text-white', text: d.nextTutorial ? `${nextKey} for the next lesson: ${d.nextTutorial.name}.` : `${nextKey} to finish.` }
    : step.kind === 'info'
      ? { tone: 'text-white', text: `${nextKey} to continue.` }
      : d.played
        ? { tone: 'text-emerald-300', text: last ? 'Correct. Let go for free play.' : 'Correct. Let go for the next step.' }
        : !d.connected
          ? { tone: 'text-neutral-400', text: 'Connect Move to check your playing, or press Next.' }
          : d.match === 'wrong'
            ? { tone: 'text-red-400', text: `${heldNames}: one or more notes are not in this chord.` }
            : d.match === 'partial'
              ? { tone: 'text-white', text: `${heldNames}: keep going.` }
              : { tone: 'text-white', text: 'Play the chord on Move.' }
  const nextLabel = !step ? (d.nextTutorial ? 'Next lesson' : 'Finish') : 'Next step'
  return h.div.class('flex flex-col gap-2 rounded-xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800').children(
    h.div.class('flex items-center gap-2 text-xs text-neutral-500').children(
      h.span.class('font-medium text-neutral-300').children(tutorial.name),
      h.span.children(step ? `Step ${index + 1} of ${tutorial.steps.length}` : 'Free play'),
      h.button.attr('type', 'button').on('click', ChordsMessage.ClickedExitTutorial()).class('ml-auto hover:text-neutral-300').children('Exit'),
    ),
    h.p.class('text-sm text-neutral-300').children(
      step
        ? step.text
        : 'You finished this lesson. Play anything you like. When you play a pad, the arrows on Move give way to the chord you pick in the sidebar.',
    ),
    h.div.class('flex items-center gap-2 text-sm').children(
      h.div
        .class(
          cx(
            'mr-auto flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 ring-1',
            d.waitingForNext || d.freePlay ? 'bg-emerald-950/60 ring-emerald-700' : 'bg-neutral-800/60 ring-neutral-700',
          ),
        )
        .children(
          h.span.class('shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400').children('Your turn'),
          h.span.class(prompt.tone).children(prompt.text),
        ),
      h.div.class('flex shrink-0 gap-2').children(
        Chip(h, { label: 'Previous step', disabled: index === 0, onClick: ChordsMessage.ClickedTutorial({ id: tutorial.id, step: index - 1 }) }).children('Back'),
        Chip(h, { label: nextLabel, onClick: ChordsMessage.ClickedNextStep() }).children(!step ? nextLabel : 'Next'),
      ),
    ),
  )
}

/**
 * A lyric line with each chord name above the syllable where it starts.
 * The current line is large and scrolls to the middle of its box. Other lines are small, and a click jumps to them.
 */
function LyricLine(
  h: H,
  o: { index: number; line: Song['lines'][number]; current: boolean; jump: ChordsMessage | null; state: (j: number) => 'done' | 'now' | 'later' },
) {
  const { line, current } = o
  const first = line.chords[0]?.at ?? line.lyric.length
  const hasChords = line.chords.length > 0
  // Each word is its own box, so a narrow sidebar wraps between words. A chord sits on the first word of its part.
  const word = <C extends View.Input<ChordsMessage>>(text: string, key: string, chord: C) =>
    h.span.key(key).class('inline-flex flex-col').children(
      hasChords && h.span.class('h-5 self-start').children(chord),
      h.span.class('whitespace-pre').children(text || ' '),
    )
  const split = (text: string) => text.match(/\S*\s*/g)?.filter(Boolean) ?? []
  const words = [
    ...split(line.lyric.slice(0, first)).map((w, k) => word(w, `lead-${k}`, null)),
    ...line.chords.flatMap((c, j) => {
      const text = line.lyric.slice(c.at, line.chords[j + 1]?.at ?? line.lyric.length)
      const st = o.state(j)
      const chordClass = !c.parsed
        ? 'text-neutral-600 line-through'
        : !current
          ? st === 'done'
            ? 'text-neutral-600'
            : 'text-led-ink/60'
          : st === 'now'
            ? 'rounded bg-led px-1 text-on-led'
            : st === 'done'
              ? 'text-emerald-400'
              : 'text-led-ink'
      const label = h.span.class(`mr-2 text-sm font-semibold ${chordClass}`).children(c.parsed ? chordLabel(c.parsed) : c.name)
      const parts = split(text)
      return parts.length === 0 ? [word('', `c${j}`, label)] : parts.map((w, k) => word(w, `c${j}-${k}`, k === 0 ? label : null))
    }),
  ]
  const lineClass = cx(
    'flex flex-wrap items-end rounded-lg px-1.5 py-1 text-left',
    current ? 'bg-neutral-800/70 text-lg text-white' : 'text-sm text-neutral-500',
  )
  const box = h.div.key(String(o.index))
  const placed = current ? box.onMount(CenterInBox()) : box
  return o.jump !== null
    ? placed.children(
        h.button
          .attr('type', 'button')
          .attr('title', 'Jump to this line')
          .on('click', o.jump)
          .class(`${lineClass} w-full hover:bg-neutral-800 hover:text-neutral-300`)
          .children(words),
      )
    : placed.class(lineClass).children(words)
}

function SongCard(h: H, d: Derived, song: Song) {
  const { events, songPos: pos, played } = d
  const event = events.at(pos)
  const finished = !event
  const unknown = unknownChords(song)
  const heldNames = [...new Set(d.heldMidi.map(noteName))].join(' ')
  const nextKey = d.connected ? 'Press → on Move' : 'Press Again'
  const prompt: { tone: string; text: string } =
    events.length === 0
      ? { tone: 'text-neutral-400', text: 'This song has no chords that this app can read.' }
      : !event
        ? { tone: 'text-emerald-300', text: `Song finished. ${nextKey} to play it again.` }
        : !d.connected
          ? { tone: 'text-neutral-400', text: `Connect Move to play along, or press Skip. Next chord: ${chordLabel(event.chord)}.` }
          : played
            ? { tone: 'text-emerald-300', text: 'Correct. Let go to move on.' }
            : d.match === 'wrong'
              ? { tone: 'text-red-400', text: `${heldNames}: one or more notes are not in ${chordLabel(event.chord)}.` }
              : d.match === 'partial'
                ? { tone: 'text-white', text: `${heldNames}: keep going.` }
                : { tone: 'text-white', text: `Play ${chordLabel(event.chord)} on Move.` }
  const line = event?.line ?? song.lines.length
  const upNext = events.slice(pos + 1, pos + 5)
  const go = (p: number) => ChordsMessage.ClickedSong({ id: song.id, pos: p })
  // This card fills the Songs tab while a song plays, so it stacks for a narrow sidebar.
  return h.div.class('flex flex-col gap-3').children(
    h.button.attr('type', 'button').on('click', ChordsMessage.ClickedExitSong()).class('self-start text-xs text-neutral-400 hover:text-white').children('← All songs'),
    h.div.class('min-w-0').children(
      h.div.class('truncate font-medium text-white').children(song.title),
      h.div.class('flex gap-2 text-xs text-neutral-500').children(
        song.artist && h.span.class('truncate').children(song.artist),
        h.span.class('shrink-0 tabular-nums').children(`Chord ${Math.min(pos + 1, events.length)} of ${events.length}`),
      ),
    ),
    // The whole song scrolls here, with the current line kept in the middle. Click a line to jump to it.
    h.div.class('relative flex max-h-[45vh] flex-col gap-1 overflow-y-auto rounded-xl bg-neutral-900 px-1.5 py-2 ring-1 ring-neutral-800').children(
      song.lines.map((l, i) => {
        const first = events.findIndex((e: SongEvent) => e.line === i)
        const current = i === line
        return LyricLine(h, {
          index: i,
          line: l,
          current,
          jump: first >= 0 && !current ? go(first) : null,
          state: (j) => (i < line || (current && j < (event?.index ?? 0)) ? 'done' : current && j === event?.index ? 'now' : 'later'),
        })
      }),
    ),
    unknown.length > 0 && h.p.class('text-xs text-neutral-500').children(`Skipped chords that this app cannot read: ${unknown.join(', ')}.`),
    h.div
      .class(cx('flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ring-1', finished ? 'bg-emerald-950/60 ring-emerald-700' : 'bg-neutral-800/60 ring-neutral-700'))
      .children(
        h.span.class('shrink-0 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400').children('Your turn'),
        h.span.class(prompt.tone).children(prompt.text),
      ),
    h.div.class('flex flex-wrap items-center gap-2').children(
      upNext.length > 0 &&
        h.div.class('mr-auto flex flex-wrap items-center gap-1.5 text-xs text-neutral-500').children(
          'Then',
          upNext.map((e, i) => h.span.key(String(i)).class('rounded bg-neutral-800 px-1.5 py-0.5 font-medium text-neutral-300').children(chordLabel(e.chord))),
        ),
      h.div.class('ml-auto flex shrink-0 gap-2 text-sm').children(
        Chip(h, { label: 'Start the song again', disabled: pos === 0, onClick: go(0) }).children('Start again'),
        Chip(h, { label: 'Previous chord', disabled: pos === 0, onClick: go(pos - 1) }).children('Previous'),
        Chip(h, { label: finished ? 'Play again' : 'Skip chord', onClick: go(event ? pos + 1 : 0) }).children(finished ? 'Again' : 'Skip'),
      ),
    ),
  )
}

const PX_PER_BEAT = 96
/** Where the hit line is in the strip, in pixels from the left. */
const HIT_X = 112

const JUDGMENT_STYLE: Record<Result['judgment'], string> = {
  pending: 'bg-neutral-700 text-white',
  perfect: 'bg-emerald-500 text-neutral-950',
  early: 'bg-amber-300 text-neutral-950',
  late: 'bg-amber-300 text-neutral-950',
  missed: 'bg-transparent text-red-400 ring-1 ring-red-500/70 ring-inset',
}

const JUDGMENT_TEXT: Record<Result['judgment'], string> = { pending: '', perfect: 'On time', early: 'Early', late: 'Late', missed: 'Missed' }

function PracticeCard(h: H, model: ChordsModel, d: Derived) {
  const exercise = d.exercise
  if (!exercise) return null
  const p = model.practice
  const { results, lastJudged, beat, countIn, target } = d.practice
  const last = results[lastJudged]
  const counting = p.running && beat < 0
  const status = p.running
    ? counting
      ? ['Get ready…']
      : last
        ? [
            h.span
              .class(last.judgment === 'perfect' ? 'text-emerald-300' : last.judgment === 'missed' ? 'text-red-400' : 'text-amber-300')
              .children(JUDGMENT_TEXT[last.judgment]),
            last.offsetMs !== undefined &&
              p.mode === 'play' &&
              Math.abs(last.offsetMs) > 0 &&
              h.span.class('text-neutral-500').children(` ${Math.round(Math.abs(last.offsetMs))} ms`),
          ]
        : ['Play the highlighted pads as each block reaches the line.']
    : p.lastRun
      ? [
          h.span.class('font-semibold text-white').children(`${p.lastRun.accuracy}%`),
          ` · ${p.lastRun.perfect} on time · ${p.lastRun.early} early · ${p.lastRun.late} late · ${p.lastRun.missed} missed · ${p.lastRun.wrong} wrong · best streak ${p.lastRun.bestStreak}`,
        ]
      : p.mode === 'wait'
        ? ['Wait mode: the playhead stops at each block until you play it.']
        : ['Press Start. You get one bar of clicks, then play each block as it reaches the line.']
  return h.div.class('flex flex-col gap-3 rounded-xl bg-neutral-900 px-4 py-3 ring-1 ring-neutral-800').children(
    h.div.class('flex items-center gap-2 text-xs text-neutral-500').children(
      h.span.class('font-medium text-neutral-300').children(exercise.name),
      h.span.children(`${exercise.summary} · ${Math.round(exercise.bpm * p.speed)} BPM`),
      h.button.attr('type', 'button').on('click', ChordsMessage.ClickedExercise({ id: null })).class('ml-auto hover:text-neutral-300').children('Exit'),
    ),
    // The strip moves left under the hit line. Each block is one note or chord, as long as it lasts.
    h.div.class('relative h-14 overflow-hidden rounded-lg bg-neutral-950 ring-1 ring-neutral-800').children(
      h.div
        .class('absolute inset-y-0 left-0 will-change-transform')
        .style({ transform: `translateX(${HIT_X - beat * PX_PER_BEAT}px)` })
        .children(
          Array.from({ length: exercise.beats + countIn + 1 }, (_, i) => i - countIn).map((b) =>
            h.div
              .key(`b${b}`)
              .class(cx('absolute inset-y-0 w-px', b % exercise.beatsPerBar === 0 ? 'bg-neutral-700' : 'bg-neutral-800/70'))
              .style({ left: `${b * PX_PER_BEAT}px` }),
          ),
          exercise.events.map((e, i) =>
            h.div
              .key(`e${i}`)
              .class(
                cx(
                  'absolute top-2 bottom-2 flex items-center rounded-md px-2 text-sm font-semibold',
                  JUDGMENT_STYLE[results[i]?.judgment ?? 'pending'],
                  i === target && 'ring-2 ring-led',
                ),
              )
              .style({ left: `${e.beat * PX_PER_BEAT + 2}px`, width: `${e.length * PX_PER_BEAT - 4}px` })
              .children(eventLabel(e)),
          ),
        ),
      h.div.class('pointer-events-none absolute inset-y-0 w-0.5 bg-white').style({ left: `${HIT_X}px` }),
      counting &&
        h.div.class('pointer-events-none absolute inset-0 flex items-center justify-end pr-4 text-2xl font-semibold text-white').children(String(Math.ceil(-beat))),
    ),
    h.div.class('flex flex-wrap items-center gap-2 text-sm').children(
      h.button
        .attr('type', 'button')
        .on('click', p.running ? ChordsMessage.ClickedStopPractice() : ChordsMessage.ClickedStartPractice())
        .class(cx('min-h-9 rounded-lg px-4 font-medium', p.running ? 'bg-white text-neutral-950' : 'bg-led text-on-led'))
        .children(p.running ? 'Stop' : 'Start'),
      h.span.class('text-xs text-neutral-500').children('or press Play on Move'),
      h.div.class('ml-auto flex flex-wrap items-center gap-2').children(
        h.div.class('flex gap-0.5 rounded-lg bg-neutral-950 p-0.5 text-[13px]').children(
          (['play', 'wait'] as const).map((m) =>
            h.button
              .key(m)
              .attr('type', 'button')
              .attr('aria-pressed', String(p.mode === m))
              .attr('title', m === 'wait' ? 'The playhead stops at each note until you play it.' : 'The playhead keeps time. Play along with the click.')
              .disabled(p.running)
              .on('click', ChordsMessage.PickedPracticeMode({ mode: m }))
              .class(cx('min-h-8 rounded-md px-2.5', p.mode === m ? 'bg-white text-neutral-950' : 'text-neutral-300 hover:text-white disabled:text-neutral-600'))
              .children(m === 'play' ? 'Play' : 'Wait'),
          ),
        ),
        h.label.class('flex items-center gap-1.5 text-xs text-neutral-400').children(
          'Speed',
          h.select
            .value(String(p.speed))
            .disabled(p.running)
            .on('change', ({ value }) => ChordsMessage.PickedPracticeSpeed({ speed: Number(value) }))
            .class('rounded-md border border-neutral-800 bg-neutral-950 px-1.5 py-1 text-sm text-neutral-200 disabled:opacity-50')
            .children([0.5, 0.75, 0.9, 1].map((s) => h.option.key(String(s)).attr('value', String(s)).children(`${s * 100}%`))),
        ),
        h.button
          .attr('type', 'button')
          .attr('aria-pressed', String(p.loop))
          .on('click', ChordsMessage.ToggledPracticeLoop())
          .class(cx('min-h-8 rounded-lg border px-2.5 text-[13px]', p.loop ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'))
          .children('Loop'),
      ),
    ),
    h.p.class('min-h-5 text-sm text-neutral-400').attr('aria-live', 'polite').children(status),
  )
}

const pianoCredit = (h: H) =>
  h.p.class('text-[11px] text-neutral-600').children(
    'Piano: ',
    h.a.class('underline hover:text-neutral-400').attr('href', 'https://github.com/Tonejs/audio/tree/master/salamander').children('Salamander Grand Piano'),
    ' by Alexander Holm, ',
    h.a.class('underline hover:text-neutral-400').attr('href', 'https://creativecommons.org/licenses/by/3.0/').children('CC BY 3.0'),
    '.',
  )

/** The pickers for one sidebar tab. */
function TabPanel(h: H, model: ChordsModel, d: Derived, tab: Tab) {
  const { search, tutorial, exercise, song } = d
  if (tab === 'learn')
    return Group(h, 'Learn', null).children(
      h.div.class('flex flex-col gap-1').children(
        TUTORIALS.map((t) =>
          h.button
            .key(t.id)
            .attr('type', 'button')
            .attr('aria-pressed', String(tutorial?.id === t.id))
            .on('click', ChordsMessage.ClickedTutorial({ id: t.id, step: 0 }))
            .class(cx('rounded-md px-2.5 py-1.5 text-left transition-colors', tutorial?.id === t.id ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'))
            .children(h.span.class('block text-[13px] font-medium').children(t.name), h.span.class('block text-xs opacity-60').children(t.summary)),
        ),
      ),
    )
  if (tab === 'practice')
    return Group(h, 'Practice', null).children(
      h.div.class('flex flex-col gap-1').children(
        EXERCISES.map((x) =>
          h.button
            .key(x.id)
            .attr('type', 'button')
            .attr('aria-pressed', String(exercise?.id === x.id))
            .on('click', ChordsMessage.ClickedExercise({ id: x.id }))
            .class(cx('rounded-md px-2.5 py-1.5 text-left transition-colors', exercise?.id === x.id ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'))
            .children(h.span.class('block text-[13px] font-medium').children(x.name), h.span.class('block text-xs opacity-60').children(`${x.summary} · ${x.bpm} BPM`)),
        ),
      ),
    )
  if (tab === 'songs')
    // While a song plays, the Songs tab shows the player. "All songs" goes back to the list.
    return song
      ? SongCard(h, d, song)
      : Group(
          h,
          'Songs',
          h.a
            .attr('title', 'Drag this to your bookmarks bar. Then open a Chords page on Ultimate Guitar and click the bookmark.')
            .onMount(SetBookmarklet())
            .class('cursor-grab rounded-full border border-neutral-700 px-2 py-px text-[11px] tracking-normal text-neutral-400 normal-case hover:border-neutral-500')
            .children('Send to chords'),
        ).children(
          h.div.class('flex flex-col gap-1').children(
            [...SONGS, ...d.saved].map((s) =>
              h.div.key(s.id).class('flex items-stretch gap-1').children(
                h.button
                  .attr('type', 'button')
                  .on('click', ChordsMessage.ClickedSong({ id: s.id, pos: 0 }))
                  .class('min-w-0 flex-1 rounded-md bg-neutral-900 px-2.5 py-1.5 text-left text-neutral-300 transition-colors hover:bg-neutral-800')
                  .children(
                    h.span.class('block truncate text-[13px] font-medium').children(s.title),
                    s.artist && h.span.class('block truncate text-xs opacity-60').children(s.artist),
                  ),
                !SONGS.includes(s) &&
                  h.button
                    .attr('type', 'button')
                    .attr('aria-label', `Delete ${s.title}`)
                    .on('click', ChordsMessage.ClickedDeleteSong({ id: s.id }))
                    .class('rounded-md bg-neutral-900 px-2 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300')
                    .children('×'),
              ),
            ),
          ),
        )
  // Play: the chord lookup.
  const inKey =
    d.diatonic.length > 0
      ? Group(
          h,
          'In key',
          h.button
            .attr('type', 'button')
            .attr('aria-pressed', String(search.sevenths))
            .on('click', pick({ sevenths: !search.sevenths }))
            .class(cx('rounded-full border px-2 py-px text-[11px] tracking-normal normal-case', search.sevenths ? 'border-led text-led-ink' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'))
            .children(`7ths ${search.sevenths ? 'on' : 'off'}`),
        ).children(
          h.div.class('grid grid-cols-4 gap-1').children(
            d.diatonic.map((c) =>
              Chip(h, { active: search.root === c.rootPc && search.chord === c.type.id, onClick: pick({ root: c.rootPc, chord: c.type.id }) })
                .key(String(c.degree))
                .children(h.span.class('block text-[10px] leading-tight opacity-55').children(c.numeral), chordSymbol(c.rootPc, c.type.id, c.type.name)),
            ),
          ),
        )
      : h.p.class('text-xs text-neutral-500').children('In-key chords need a seven-note scale.')
  const roots = Group(h, 'Root', null).children(
    h.div.class('grid grid-cols-6 gap-1').children(
      NOTE_NAMES.map((name, i) =>
        Chip(h, {
          active: search.root === i,
          dim: !d.inScale.has(i),
          disabled: !d.playableRoots.has(i),
          title: d.playableRoots.has(i) ? undefined : `No full ${d.type.name} shape from ${name} in this layout`,
          onClick: pick({ root: i }),
        })
          .key(name)
          .children(name),
      ),
    ),
  )
  const chords = h.div.class('flex flex-col gap-1.5').children(
    CHORD_FAMILIES.map((family) =>
      h.div.key(family.name).class('grid grid-cols-[3.25rem_1fr] items-start gap-2').children(
        h.div.class('pt-1.5 font-mono text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase').children(family.name),
        h.div.class('grid grid-cols-5 gap-1').children(
          family.ids.map((id) => Chip(h, { active: search.chord === id, onClick: pick({ chord: id }) }).key(id).children(chordType(id).name)),
        ),
      ),
    ),
  )
  return h.div.class('flex flex-col gap-4').children(inKey, roots, chords)
}

const LayoutControls = (h: H, d: Derived) => [
  Segmented(h, LAYOUTS, d.search.layout, (layout) => pick({ layout })),
  d.search.layout === 'chromatic' &&
    Field(h, 'Bottom-left pad', { inline: true }).children(
      h.select
        .class('rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm text-neutral-200')
        .value(String(d.search.base))
        .on('change', ({ value }) => pick({ base: Number(value) }))
        .children(NOTE_NAMES.map((name, i) => h.option.key(name).attr('value', String(i)).children(name))),
    ),
]

/** The app under the page's masthead: the sidebar and pads fill what's left of the screen. */
export function ChordsView(h: H, model: ChordsModel, d: Derived) {
  // Until Move is connected, the page is the way to connect, or to look up chords without it.
  // Learn, Songs and Practice check what you play on Move, so looking up chords leaves them.
  if (!d.connected && !model.browsing)
    return h.div
      .class('flex min-h-0 flex-1 flex-col')
      .onMount(ShowOnMove({ view: moveView(model, d) }).pipe(Mount.map(absurd)))
      .children(ConnectScreen(h, model.moveStatus))
  const { search, voicing, exercise, tutorial } = d
  const tab = d.connected ? model.tab : 'play'
  const tabs = d.connected ? Segmented(h, TABS, model.tab, (t) => ChordsMessage.SelectedTab({ tab: t })) : OfflineBar(h, model.moveStatus)
  const showAll = search.all

  return h.main
    .class('flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row')
    .onMount(ShowOnMove({ view: moveView(model, d) }).pipe(Mount.map(absurd)))
    .children(
      h.aside
        .style({ '--sidebar': `${model.sidebarWidth}px` })
        .class('flex shrink-0 flex-col gap-3 px-4 pt-4 lg:w-[var(--sidebar,392px)] lg:gap-4 lg:overflow-y-auto lg:px-6 lg:py-5')
        .children(
          // Phone: key and scale sit at the top to save height.
          h.div.class('flex gap-2 lg:hidden').children(KeySelect(h, search.key), ScaleSelect(h, d.scale.id)),
          // Phone: the layout stays at the top. The pickers are in tabs below the pads.
          h.div.class('flex flex-col gap-3 lg:hidden').children(LayoutControls(h, d)),
          h.div.class('hidden flex-col gap-4 lg:flex').children(
            tabs,
            tab === 'play'
              ? [
                  h.div.class('grid grid-cols-3 gap-2').children(
                    Field(h, 'Key').children(KeySelect(h, search.key)),
                    Field(h, 'Scale', { className: 'col-span-2' }).children(ScaleSelect(h, d.scale.id)),
                  ),
                  ...LayoutControls(h, d),
                  TabPanel(h, model, d, tab),
                ]
              : TabPanel(h, model, d, tab),
            pianoCredit(h),
            Footer(h, ''),
          ),
        ),
      // Desktop: drag this edge to resize the sidebar. Arrow keys work too, and a double-click resets it.
      h.div
        .attr('role', 'separator')
        .attr('aria-orientation', 'vertical')
        .attr('aria-label', 'Sidebar width')
        .attr('aria-valuenow', String(model.sidebarWidth))
        .attr('aria-valuemin', String(SIDEBAR_MIN))
        .attr('aria-valuemax', String(SIDEBAR_MAX))
        .attr('tabindex', '0')
        .on('pointerdown', ({ x }) => ChordsMessage.GrabbedSidebar({ x }), { capturePointer: true })
        .on('pointermove', ({ x }) => (model.sidebarGrab === null ? undefined : ChordsMessage.DraggedSidebar({ x })))
        .on('pointerup', ChordsMessage.ReleasedSidebar())
        .on('pointercancel', ChordsMessage.ReleasedSidebar())
        .on('dblclick', ChordsMessage.DoubleClickedSidebar())
        .on('keydown', ({ key }) => (key === 'ArrowLeft' || key === 'ArrowRight' ? ChordsMessage.PressedSidebarKey({ key }) : undefined))
        .class('hidden w-1 shrink-0 cursor-col-resize touch-none bg-neutral-900 transition-colors hover:bg-neutral-600 focus-visible:bg-led focus-visible:outline-none lg:block'),

      h.section.class('flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 lg:gap-4 lg:px-8 lg:py-5').children(
        exercise && PracticeCard(h, model, d),
        tutorial && TutorialCard(h, d, tutorial),
        h.div.class('flex items-end justify-between gap-3').children(
          showAll
            ? h.div.class('min-w-0').children(
                h.div.class('text-xs text-neutral-500').children(`${search.sevenths ? 'Sevenths' : 'Triads'} in key`),
                h.h2.class('text-3xl font-medium tracking-tight text-white lg:text-4xl').children(`${NOTE_NAMES[search.key]} ${d.scale.name}`),
                h.p.class('text-sm text-neutral-400').children('Select a chord to open it.'),
              )
            : h.div.class('min-w-0').children(
                d.current &&
                  d.practiceEvent?.kind !== 'note' &&
                  h.div.class('text-xs text-neutral-500').children(`${d.current.numeral}${search.sevenths ? '7' : ''} in ${NOTE_NAMES[search.key]} ${d.scale.name}`),
                h.h2
                  .class('text-3xl font-medium tracking-tight text-white lg:text-4xl')
                  .children(d.practiceEvent?.kind === 'note' ? noteWithOctave(d.practiceEvent.midi) : chordSymbol(search.root, d.type.id, d.type.name)),
                h.p.class('text-sm text-neutral-400').children(d.practiceEvent?.kind === 'note' ? 'Next note' : d.chordPcs.map((p) => NOTE_NAMES[p]).join(' · ')),
              ),
          h.div.class('flex items-center gap-2').children(
            !showAll && !exercise && h.div.class('hidden items-center gap-2 lg:flex').children(ShapeNav(h, d.options.length, search.v)),
            h.button
              .attr('type', 'button')
              .attr('hidden', exercise ? '' : undefined)
              .attr('aria-pressed', String(showAll))
              .on('click', pick({ all: !showAll }))
              .class(cx('min-h-11 rounded-lg border px-3 text-sm lg:min-h-9', showAll ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'))
              .children('All in key'),
            h.button
              .attr('type', 'button')
              .attr('aria-pressed', String(d.sustain))
              .attr('title', 'Hold Shift on Move to sustain while you hold it.')
              .on('click', ChordsMessage.ToggledSustain())
              .class(cx('min-h-11 rounded-lg border px-3 text-sm lg:min-h-9', d.sustain ? 'border-white bg-white text-neutral-950' : 'border-neutral-700 text-neutral-300 hover:border-neutral-500'))
              .children('Sustain'),
            !showAll &&
              h.button
                .attr('type', 'button')
                .disabled(!voicing)
                .on('click', ChordsMessage.ClickedPlayChord())
                .class('min-h-11 rounded-lg bg-led px-4 font-medium text-on-led disabled:opacity-40 lg:min-h-9')
                .children('Play'),
          ),
        ),
        showAll
          ? d.diatonic.length > 0
            ? // Two full-width columns. Only this area scrolls, so the header and sidebar stay put.
              // The negative margin and padding keep the selected card's ring from being clipped.
              h.div.class('-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-4').children(
                h.div.class('grid grid-cols-2 gap-x-6 gap-y-5').children(
                  d.diatonic.map((c) => {
                    const [best] = voicings(d.grid, c.rootPc, c.type, search.layout)
                    const selected = c.rootPc === search.root && c.type.id === search.chord
                    return h.button
                      .key(String(c.degree))
                      .attr('type', 'button')
                      .on('click', pick({ root: c.rootPc, chord: c.type.id, all: false }))
                      .class('group flex flex-col gap-1.5 text-left [container-type:inline-size]')
                      .children(
                        h.span.class('flex h-5 items-baseline gap-2 text-sm').children(
                          h.span.class('text-xs text-neutral-500').children(c.numeral),
                          h.span.class(selected ? 'font-semibold text-led-ink' : 'font-medium text-white').children(chordSymbol(c.rootPc, c.type.id, c.type.name)),
                          h.span.class('truncate text-xs text-neutral-500').children(c.type.tones.map((t) => NOTE_NAMES[mod(c.rootPc + t.interval, 12)]).join(' · ')),
                        ),
                        PadGrid(h, {
                          compact: true,
                          grid: d.grid,
                          voicing: best,
                          keyPc: search.key,
                          inScale: d.inScale,
                          layout: search.layout,
                          className: cx('w-full rounded-xl p-[1.5%] ring-1 transition-colors', selected ? 'ring-led' : 'ring-neutral-800 group-hover:ring-neutral-600'),
                        }),
                      )
                  }),
                ),
              )
            : h.p.class('text-sm text-neutral-400').children('In-key chords need a seven-note scale. Pick another scale.')
          : [
              // Desktop: the 8×4 grid fits the smaller of the full width and twice the free height,
              // leaving room under it for the legend and any notes.
              h.div.class('flex shrink-0 flex-col items-start gap-4 lg:min-h-0 lg:flex-1 lg:[container-type:size]').children(
                PadGrid(h, {
                  grid: d.grid,
                  voicing,
                  keyPc: search.key,
                  inScale: d.inScale,
                  layout: search.layout,
                  held: d.held,
                  chordPcs: d.chordPcs,
                  clickable: true,
                  className: cx(
                    'w-full rounded-2xl p-[1.6cqmin] ring-1 ring-neutral-800',
                    d.hasNotes ? 'lg:w-[min(100cqw,calc((100cqh-4.5rem)*2))]' : 'lg:w-[min(100cqw,calc((100cqh-2.5rem)*2))]',
                  ),
                }),
                h.div.class('hidden flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500 lg:flex').children(
                  Swatch(h, 'bg-led', 'Chord root'),
                  Swatch(h, 'bg-white', 'Chord tone'),
                  Swatch(h, 'bg-neutral-700/70', 'In scale'),
                  search.layout === 'chromatic' && Swatch(h, 'bg-neutral-950 ring-1 ring-neutral-700', 'Unlit on Move'),
                  voicing?.pads.some((p) => p.optional) && Swatch(h, 'ring-1 ring-white/70 ring-inset', 'Optional'),
                ),
                d.hasNotes &&
                  h.p.class('text-xs text-neutral-500').children(
                    !voicing && h.span.class('text-amber-400').children("This chord doesn't fit on the grid. "),
                    voicing &&
                      voicing.missing.length > 0 &&
                      h.span.class('text-amber-400').children(`Can't play ${voicing.missing.map((i) => NOTE_NAMES[mod(search.root + i, 12)]).join(', ')} in key. `),
                    search.layout === 'chromatic' && voicing && !voicing.fromChart && h.span.children("Not the chart shape: the chart shape doesn't fit from this root. "),
                    search.layout === 'chromatic' && d.outOfKey.length > 0 && h.span.children(`Outside the scale: ${d.outOfKey.map((p) => NOTE_NAMES[p]).join(', ')}.`),
                  ),
              ),
              h.div.class(cx('flex items-center justify-center gap-3 lg:hidden', exercise && 'hidden')).children(ShapeNav(h, d.options.length, search.v)),
              h.div.class('flex min-h-0 flex-1 flex-col gap-3 border-t border-neutral-900 pt-3 lg:hidden').children(
                tabs,
                h.div.class('min-h-0 overflow-y-auto').children(
                  h.div.class('flex flex-col gap-4').children(TabPanel(h, model, d, tab), pianoCredit(h), Footer(h, '')),
                ),
              ),
            ],
      ),
    )
}

const absurd = (n: never): never => n
