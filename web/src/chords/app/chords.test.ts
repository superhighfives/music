import { describe, expect, it } from 'vitest'
import { BUTTON } from '../lib/move'
import { EXERCISES } from '../lib/practice'
import { SONGS } from '../lib/songs'
import { TUTORIALS } from '../lib/tutorials'
import { initialModel, reduce } from './Chords'
import { ChordsMessage } from './messages'
import { derive, parseSearch, type ChordsModel } from './state'

/** A page as it starts in the browser: the URL's view, then this browser's storage read. */
const start = (query = '') =>
  send(
    initialModel({ initialSearch: parseSearch(new URLSearchParams(query)), userId: null }),
    ChordsMessage.CompletedReadStorage({ sheets: [], sidebar: 392, imported: null }),
  ).model

/** Sends messages in turn, keeping every Command each one ran. */
function send(model: ChordsModel, ...messages: ChordsMessage[]) {
  const ran: Array<{ name: string; args: unknown }> = []
  for (const m of messages) {
    const next = reduce(model, m)
    model = next.model
    ran.push(...next.run.map((c) => ({ name: c.name, args: c.args })))
  }
  return { model, ran, names: ran.map((r) => r.name) }
}

const connected = (model: ChordsModel) => send(model, ChordsMessage.ChangedMoveStatus({ status: 'connected' })).model

/** Presses on Move every pad of the chord the screen shows, then lets them all go. */
function playShownChord(model: ChordsModel) {
  const pads = derive(model).voicing?.pads ?? []
  const press = pads.map((p) => ChordsMessage.PressedPad({ col: p.col, row: p.row, velocity: 0.8, time: 0 }))
  const release = pads.map((p) => ChordsMessage.ReleasedPad({ col: p.col, row: p.row }))
  return { press, release }
}

describe('Chords on Move', () => {
  it('moves a tutorial on once the chord is played and every pad is let go', () => {
    const tutorial = TUTORIALS[0]
    const step = tutorial.steps.findIndex((s) => s.kind === 'chord')
    let model = send(connected(start()), ChordsMessage.ClickedTutorial({ id: tutorial.id, step })).model
    const { press, release } = playShownChord(model)
    model = send(model, ...press).model
    expect(model.completed).toBe(`t:${tutorial.id}:${step}`)
    // Still held: the chord rings, and the step waits for the release.
    expect(model.search.s).toBe(step)
    model = send(model, ...release).model
    expect(model.search.s).toBe(step + 1)
    expect(model.completed).toBeNull()
  })

  it('plays each pad on the piano and stops it on release', () => {
    const model = connected(start())
    const { names } = send(model, ChordsMessage.PressedPad({ col: 0, row: 0, velocity: 1, time: 0 }), ChordsMessage.ReleasedPad({ col: 0, row: 0 }))
    expect(names).toEqual(['StartNote', 'StopNote'])
  })

  it('moves a song on chord by chord, and the arrows step through it', () => {
    const song = SONGS[0]
    let model = send(connected(start()), ChordsMessage.ClickedSong({ id: song.id, pos: 0 })).model
    const { press, release } = playShownChord(model)
    model = send(model, ...press, ...release).model
    expect(model.search.p).toBe(1)
    model = send(model, ChordsMessage.PressedButton({ cc: BUTTON.right })).model
    expect(model.search.p).toBe(2)
    model = send(model, ChordsMessage.PressedButton({ cc: BUTTON.left })).model
    expect(model.search.p).toBe(1)
  })

  it('keeps pads lit and ringing while Shift is held, and lets them go with it', () => {
    let model = connected(start())
    model = send(model, ChordsMessage.PressedButton({ cc: BUTTON.shift }), ChordsMessage.PressedPad({ col: 1, row: 0, velocity: 1, time: 0 })).model
    const released = send(model, ChordsMessage.ReleasedPad({ col: 1, row: 0 }))
    expect(released.model.ringing).toEqual(['1-0'])
    const up = send(released.model, ChordsMessage.ReleasedButton({ cc: BUTTON.shift }))
    expect(up.model.ringing).toEqual([])
    expect(up.ran).toContainEqual({ name: 'SetSustain', args: { on: false } })
  })
})

describe('Chords practice', () => {
  const exercise = EXERCISES[0]
  const msPerBeat = 60000 / exercise.bpm

  function running(mode: 'play' | 'wait') {
    let model = send(connected(start()), ChordsMessage.ClickedExercise({ id: exercise.id }), ChordsMessage.PickedPracticeMode({ mode })).model
    model = send(model, ChordsMessage.CompletedReadPracticeClock({ now: 0, audioNow: 0, latency: 0 })).model
    // Beat 0 comes after the lead-in and a one-bar count-in.
    return { model, zero: model.practice.zero }
  }

  it('schedules the count-in clicks, accenting the first beat of the bar', () => {
    const { model } = running('play')
    const { ran } = send(model, ChordsMessage.TickedPractice({ now: 0, audioNow: 0.1 }))
    const clicks = ran.find((r) => r.name === 'ScheduleClicks')?.args as { clicks: Array<{ at: number; accent: boolean }> }
    expect(clicks.clicks[0]).toEqual({ at: expect.closeTo(0.15, 5), accent: true })
  })

  it('ends a run at the last beat and keeps its results', () => {
    const { model, zero } = running('play')
    const end = send(model, ChordsMessage.TickedPractice({ now: zero + exercise.beats * msPerBeat, audioNow: 100 })).model
    expect(end.practice.running).toBe(false)
    expect(end.practice.lastRun?.missed).toBe(exercise.events.length)
  })

  it('holds the playhead on a note in wait mode until it is played', () => {
    const { model, zero } = running('wait')
    const first = exercise.events[0]
    // A second of frames from the note's beat, with nothing played.
    const at = zero + first.beat * msPerBeat
    const frames = Array.from({ length: 60 }, (_, i) => ChordsMessage.TickedPractice({ now: at + i * 16, audioNow: 0 }))
    const held = send(model, ...frames).model
    expect(held.practice.beat).toBe(first.beat)
    // A press while held is recorded against the run.
    const played = send(held, ChordsMessage.PressedPad({ col: 0, row: 0, velocity: 1, time: at + 60 * 16 }))
    expect(played.model.practice.presses.length).toBe(1)
  })
})

describe('Chords URL and account', () => {
  it('writes each change of view to the URL', () => {
    const { ran } = send(start(), ChordsMessage.PickedView({ patch: { key: 2, root: 2 } }))
    const url = ran.find((r) => r.name === 'ReplaceUrl')?.args as { query: string }
    expect(new URLSearchParams(url.query).get('key')).toBe('2')
  })

  it('waits for this browser\'s songs before merging with the account', () => {
    const fresh = initialModel({ initialSearch: parseSearch(new URLSearchParams()), userId: null })
    const early = send(fresh, ChordsMessage.ChangedUser({ userId: 'u1' }))
    expect(early.names).not.toContain('JoinAccount')
    const local = { id: 'my-0', title: 'Local', text: '[G]la' }
    const loaded = send(early.model, ChordsMessage.CompletedReadStorage({ sheets: [local], sidebar: 392, imported: null }))
    expect(loaded.ran).toContainEqual({ name: 'JoinAccount', args: { userId: 'u1', local: [local] } })
  })

  it('opens a sheet the bookmarklet sent, once storage is read', () => {
    const imported = { id: 'my-9', title: 'Sent', text: '[C]la [G]la' }
    const fresh = initialModel({ initialSearch: parseSearch(new URLSearchParams()), userId: null })
    const { model, names } = send(fresh, ChordsMessage.CompletedReadStorage({ sheets: [], sidebar: 392, imported }))
    expect(model.sheets).toEqual([imported])
    expect(model.search.song).toBe('my-9')
    expect(names).toContain('StoreSheets')
  })

  it('merges with the account on sign-in, saves the result, and forgets the account on sign-out', () => {
    const sheet = { id: 'my-1', title: 'Mine', text: '[C]la' }
    const signedIn = send(start(), ChordsMessage.ChangedUser({ userId: 'u1' }))
    expect(signedIn.names).toContain('JoinAccount')
    const joined = send(signedIn.model, ChordsMessage.SucceededJoinAccount({ userId: 'u1', merged: [sheet] }))
    expect(joined.model.sheets).toEqual([sheet])
    expect(joined.names).toEqual(expect.arrayContaining(['StoreSheets', 'SaveToAccount']))
    const out = send(joined.model, ChordsMessage.ChangedUser({ userId: null }))
    expect(out.model.account.joinedFor).toBeNull()
    expect(out.model.sheets).toEqual([sheet])
  })
})
