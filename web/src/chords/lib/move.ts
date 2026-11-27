/*
 * Ableton Move in Control Live Mode, over USB-C with Web MIDI.
 * Measured on one Move in November 2026. Ableton does not document this protocol,
 * so a firmware update can change it.
 * All messages use MIDI channel 1. Lights use the same numbers as the controls:
 * a note-on lights a pad or step button, a CC lights a button. The velocity or
 * CC value picks one of 128 palette colors, and 0 turns the light off.
 */

/** Note of the bottom-left pad. Pads count up in rows of 8 to 99 at the top right. */
const PAD_NOTE = 68
/** Note of step button 1. Steps 1–16 are notes 16–31. */
export const STEP_NOTE = 16

/** Buttons send a CC: 127 on press, 0 on release. */
export const BUTTON = { left: 62, right: 63, play: 85, record: 86, loop: 58, shift: 49 } as const

/** Palette indexes. Read from photos of the pads, so the hues are approximate. */
export const COLOR = { off: 0, cyan: 15, white: 120, dim: 124, green: 126, red: 127 } as const

/** White-only button LEDs (arrows, Loop, Copy) use the value as brightness. 2 looked dim in one photo. */
export const BUTTON_DIM = 2

export const padNote = (col: number, row: number) => PAD_NOTE + row * 8 + col

/**
 * Lights to show, as [note or CC number, palette color] pairs. Anything not listed is off.
 * A note in `fade` fades from its last color to the new one instead of changing at once, at the given speed.
 * Plain arrays, so the view can pass them to the mount that sends them.
 */
export type Lights = {
  readonly notes: ReadonlyArray<readonly [number, number]>
  readonly ccs: ReadonlyArray<readonly [number, number]>
  readonly fade: ReadonlyArray<readonly [number, keyof typeof FADE_CHANNEL]>
}

/*
 * Fades, measured from video in November 2026: a note-on on channels 2–6 fades the light from its last color
 * to the new one. Channel 2 takes about 0.1 s and each channel up is slower: about 0.3 s on channel 4, 0.8 s on channel 6.
 * About 2 s after a channel 2–6 message, the light went off by itself, so `show` sends the color again
 * on channel 1 when the fade is done.
 */
export const FADE_CHANNEL = { quick: 4, slow: 6 } as const
const FADE_MS = 900

export type MoveStatus = 'idle' | 'unsupported' | 'connecting' | 'connected' | 'not-found' | 'denied'

/** What Move reports. `time` is when a pad message arrived, on the performance.now() clock. */
export type MoveEvent =
  | { readonly _tag: 'Status'; readonly status: MoveStatus }
  | { readonly _tag: 'Pad'; readonly col: number; readonly row: number; readonly down: boolean; readonly velocity: number; readonly time: number }
  | { readonly _tag: 'Button'; readonly cc: number; readonly down: boolean }

/**
 * One connection to Move for the page. `listen` reports pad, button and status events.
 * `show` sets Move's lights and sends only the lights that changed, so call it whenever they might have.
 */
export function createMove() {
  let output: MIDIOutput | null = null
  const sent = new Map<string, number>()
  const listeners = new Set<(event: MoveEvent) => void>()
  const report = (event: MoveEvent) => listeners.forEach((l) => l(event))

  async function connect() {
    if (!navigator.requestMIDIAccess) return report({ _tag: 'Status', status: 'unsupported' })
    report({ _tag: 'Status', status: 'connecting' })
    let access: MIDIAccess
    try {
      access = await navigator.requestMIDIAccess()
    } catch {
      return report({ _tag: 'Status', status: 'denied' })
    }
    const bind = () => {
      // Move also exposes User, External and Standalone ports. The Live port carries Control Live Mode.
      const input = [...access.inputs.values()].find((p) => p.name === 'Ableton Move Live Port')
      output = [...access.outputs.values()].find((p) => p.name === 'Ableton Move Live Port') ?? null
      sent.clear()
      if (!input || !output) return report({ _tag: 'Status', status: 'not-found' })
      input.onmidimessage = (e) => e.data && onMessage(e.data, e.timeStamp)
      report({ _tag: 'Status', status: 'connected' })
    }
    access.onstatechange = bind
    bind()
  }

  /** Connects on page load when the browser already allows MIDI for this site. Otherwise the Connect button asks. */
  function connectIfAllowed() {
    navigator.permissions
      ?.query({ name: 'midi' })
      .then((p) => {
        if (p.state === 'granted') void connect()
      })
      .catch(() => {
        // This browser cannot check MIDI permission. The Connect button still works.
      })
  }

  function onMessage([statusByte, data1, data2]: Uint8Array, time: number) {
    const type = statusByte & 0xf0
    const pad = data1 - PAD_NOTE
    if ((type === 0x90 || type === 0x80) && pad >= 0 && pad < 32) {
      const down = type === 0x90 && data2 > 0
      report({ _tag: 'Pad', col: pad % 8, row: Math.floor(pad / 8), down, velocity: data2 / 127, time })
    } else if (type === 0xb0 && (data2 === 127 || data2 === 0)) {
      report({ _tag: 'Button', cc: data1, down: data2 === 127 })
    }
  }

  function show(lights: Lights) {
    const out = output
    if (!out) return
    const fade = new Map(lights.fade)
    const want = new Map<string, number>()
    for (const [note, color] of lights.notes) want.set(`n${note}`, color)
    for (const [cc, color] of lights.ccs) want.set(`c${cc}`, color)
    for (const key of sent.keys()) if (!want.has(key)) want.set(key, COLOR.off)
    for (const [key, color] of want) {
      if (sent.get(key) === color) continue
      const number = Number(key.slice(1))
      sent.set(key, color)
      if (key[0] === 'c') out.send([0xb0, number, color])
      else if (!fade.has(number)) out.send([0x90, number, color])
      else {
        out.send([0x90 + FADE_CHANNEL[fade.get(number) ?? 'slow'] - 1, number, color])
        setTimeout(() => {
          if (sent.get(key) === color) output?.send([0x90, number, color])
        }, FADE_MS)
      }
    }
  }

  /** Turns every light off, so Move is not left showing a stale chord when the page closes. */
  function off() {
    for (const key of sent.keys()) {
      const number = Number(key.slice(1))
      output?.send(key[0] === 'n' ? [0x90, number, 0] : [0xb0, number, 0])
    }
    sent.clear()
  }

  function listen(listener: (event: MoveEvent) => void) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  }

  return { connect, connectIfAllowed, show, off, listen }
}

export type Move = ReturnType<typeof createMove>
