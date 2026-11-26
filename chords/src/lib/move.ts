import { useEffect, useRef, useState } from 'react'

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
 * Lights to show: note number or CC number → palette color. Anything not listed is off.
 * A note in `fade` fades from its last color to the new one instead of changing at once, at the given speed.
 */
export type Lights = { notes: Map<number, number>; ccs: Map<number, number>; fade?: Map<number, keyof typeof FADE_CHANNEL> }

/*
 * Fades, measured from video in November 2026: a note-on on channels 2–6 fades the light from its last color
 * to the new one. Channel 2 takes about 0.1 s and each channel up is slower: about 0.3 s on channel 4, 0.8 s on channel 6.
 * About 2 s after a channel 2–6 message, the light went off by itself, so `show` sends the color again
 * on channel 1 when the fade is done.
 */
export const FADE_CHANNEL = { quick: 4, slow: 6 } as const
const FADE_MS = 900

export type MoveStatus = 'idle' | 'unsupported' | 'connecting' | 'connected' | 'not-found' | 'denied'

type Handlers = {
  /** `velocity` is 0–1. `time` is when the message arrived, on the performance.now() clock. */
  onPad: (col: number, row: number, velocity: number, time: number) => void
  onPadUp: (col: number, row: number) => void
  onButton: (cc: number) => void
  onButtonUp?: (cc: number) => void
}

/**
 * Connects to Move and reports held pads as "col-row" keys.
 * `show` sets Move's lights. It sends only the lights that changed, so call it after every render.
 */
export function useMove(handlers: Handlers) {
  const [status, setStatus] = useState<MoveStatus>('idle')
  const [held, setHeld] = useState<Set<string>>(() => new Set())
  const output = useRef<MIDIOutput | null>(null)
  const sent = useRef(new Map<string, number>())
  const latest = useRef(handlers)
  latest.current = handlers

  async function connect() {
    if (!navigator.requestMIDIAccess) return setStatus('unsupported')
    setStatus('connecting')
    let access: MIDIAccess
    try {
      access = await navigator.requestMIDIAccess()
    } catch {
      return setStatus('denied')
    }
    const bind = () => {
      // Move also exposes User, External and Standalone ports. The Live port carries Control Live Mode.
      const input = [...access.inputs.values()].find((p) => p.name === 'Ableton Move Live Port')
      output.current = [...access.outputs.values()].find((p) => p.name === 'Ableton Move Live Port') ?? null
      sent.current.clear()
      setHeld(new Set())
      if (!input || !output.current) return setStatus('not-found')
      input.onmidimessage = (e) => e.data && onMessage(e.data, e.timeStamp)
      setStatus('connected')
    }
    access.onstatechange = bind
    bind()
  }

  function onMessage([statusByte, data1, data2]: Uint8Array, time: number) {
    const type = statusByte & 0xf0
    const pad = data1 - PAD_NOTE
    if ((type === 0x90 || type === 0x80) && pad >= 0 && pad < 32) {
      const col = pad % 8
      const row = Math.floor(pad / 8)
      const down = type === 0x90 && data2 > 0
      setHeld((prev) => {
        const next = new Set(prev)
        if (down) next.add(`${col}-${row}`)
        else next.delete(`${col}-${row}`)
        return next
      })
      if (down) latest.current.onPad(col, row, data2 / 127, time)
      else latest.current.onPadUp(col, row)
    } else if (type === 0xb0 && data2 === 127) {
      latest.current.onButton(data1)
    } else if (type === 0xb0 && data2 === 0) {
      latest.current.onButtonUp?.(data1)
    }
  }

  function show(lights: Lights) {
    const out = output.current
    if (!out) return
    const want = new Map<string, number>()
    for (const [note, color] of lights.notes) want.set(`n${note}`, color)
    for (const [cc, color] of lights.ccs) want.set(`c${cc}`, color)
    for (const key of sent.current.keys()) if (!want.has(key)) want.set(key, COLOR.off)
    for (const [key, color] of want) {
      if (sent.current.get(key) === color) continue
      const number = Number(key.slice(1))
      sent.current.set(key, color)
      if (key[0] === 'c') out.send([0xb0, number, color])
      else if (!lights.fade?.has(number)) out.send([0x90, number, color])
      else {
        out.send([0x90 + FADE_CHANNEL[lights.fade.get(number) ?? 'slow'] - 1, number, color])
        setTimeout(() => {
          if (sent.current.get(key) === color) output.current?.send([0x90, number, color])
        }, FADE_MS)
      }
    }
  }

  // Connect on page load when the browser already allows MIDI for this site, so a reload does not need a click.
  // Without that permission, wait for the Connect button: requestMIDIAccess would show a prompt.
  useEffect(() => {
    navigator.permissions
      ?.query({ name: 'midi' })
      .then((p) => {
        if (p.state === 'granted') void connect()
      })
      .catch(() => {
        // This browser cannot check MIDI permission. The Connect button still works.
      })
  }, [])

  // Turn the lights off when the page closes, so Move is not left showing a stale chord.
  useEffect(() => {
    const off = () => {
      for (const key of sent.current.keys()) {
        const number = Number(key.slice(1))
        output.current?.send(key[0] === 'n' ? [0x90, number, 0] : [0xb0, number, 0])
      }
      sent.current.clear()
    }
    window.addEventListener('pagehide', off)
    return () => {
      window.removeEventListener('pagehide', off)
      off()
    }
  }, [])

  return { status, held, connect, show }
}
