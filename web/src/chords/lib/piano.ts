
/*
 * A sampled piano with reverb, made with Web Audio.
 * Samples: Salamander Grand Piano V2 by Alexander Holm, CC BY 3.0. See public/piano/CREDITS.txt.
 * There is one sample every 3 semitones from A2 to C8. A note plays the nearest sample at a changed speed.
 */

const SAMPLE_NAMES = 'A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6 Ds6 Fs6 A6 C7 Ds7 Fs7 A7 C8'.split(' ')
const PITCH: Record<string, number> = { C: 0, Ds: 3, Fs: 6, A: 9 }
/** Damper time constant in seconds: how fast a note stops when you let go. */
const RELEASE = 0.08
const REVERB_SECONDS = 2.6
const REVERB_LEVEL = 0.22

type Sample = { midi: number; buffer: AudioBuffer }
type Voice = { gain: GainNode; source: AudioBufferSourceNode }

type Engine = {
  ac: AudioContext
  input: GainNode
  voices: Map<string, Voice>
  /** Voices whose key is up but which ring on because sustain is on. */
  sustained: Set<string>
}

let samples: Promise<Sample[]> | undefined

/**
 * Downloads and decodes the samples once per page (1.1 MB).
 * An OfflineAudioContext decodes without a click, and an AudioBuffer plays in any context.
 */
function loadSamples() {
  samples ??= (async () => {
    const decoder = new OfflineAudioContext(1, 1, 44100)
    return Promise.all(
      SAMPLE_NAMES.map(async (name) => {
        const [, pitch, octave] = /^([A-Z]s?)(\d)$/.exec(name) ?? []
        const data = await (await fetch(`/chords/piano/${name}.mp3`)).arrayBuffer()
        return { midi: 12 * (Number(octave) + 1) + PITCH[pitch], buffer: await decoder.decodeAudioData(data) }
      }),
    )
  })()
  return samples
}

function createEngine(): Engine {
  const ac = new AudioContext()
  const input = ac.createGain()
  input.gain.value = 0.8
  // A soft limit, so a big chord with sustain does not clip.
  const limiter = ac.createDynamicsCompressor()
  limiter.threshold.value = -10
  limiter.ratio.value = 8
  input.connect(limiter).connect(ac.destination)

  const reverb = ac.createConvolver()
  reverb.buffer = roomImpulse(ac)
  const send = ac.createGain()
  send.gain.value = REVERB_LEVEL
  input.connect(send).connect(reverb).connect(limiter)

  return { ac, input, voices: new Map(), sustained: new Set() }
}

/** Stereo noise that fades out, a common stand-in for a recorded room. Darker at the end, as in a real room. */
function roomImpulse(ac: AudioContext) {
  const length = Math.floor(ac.sampleRate * REVERB_SECONDS)
  const buffer = ac.createBuffer(2, length, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    let last = 0
    for (let i = 0; i < length; i++) {
      const t = i / length
      // A one-pole lowpass that closes over time.
      const smooth = 0.2 + 0.75 * t
      last = last * smooth + (Math.random() * 2 - 1) * (1 - smooth)
      data[i] = last * (1 - t) ** 3
    }
  }
  return buffer
}

function startVoice(e: Engine, all: Sample[], midi: number, velocity: number): Voice {
  const { ac } = e
  const sample = all.reduce((best, s) => (Math.abs(s.midi - midi) < Math.abs(best.midi - midi) ? s : best))
  const source = ac.createBufferSource()
  source.buffer = sample.buffer
  source.playbackRate.value = 2 ** ((midi - sample.midi) / 12)
  // The samples have one loudness, so soft notes are also made darker, as on a real piano.
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 1200 + 14000 * velocity ** 2
  const gain = ac.createGain()
  gain.gain.value = 0.1 + 0.9 * velocity ** 1.6
  source.connect(tone).connect(gain).connect(e.input)
  source.start()
  return { gain, source }
}

function releaseVoice(e: Engine, voice: Voice) {
  const now = e.ac.currentTime
  voice.gain.gain.setTargetAtTime(0, now, RELEASE)
  voice.source.stop(now + RELEASE * 8)
}

/**
 * Piano voices keyed by an id, such as a pad. `noteOff` stops the note unless sustain is on.
 * The AudioContext starts on the first note, because browsers allow audio only after a user action.
 * Chords and Theory each keep one for the page.
 */
export function createPiano() {
  let engine: Engine | null = null
  let sustain = false
  let loaded: Sample[] | null = null

  /** Starts loading the samples. Before they load, which takes a moment after the page opens, notes are silent. */
  function load() {
    void loadSamples().then((s) => (loaded = s))
  }

  function noteOn(id: string, midi: number, velocity = 0.7) {
    if (!loaded) return
    const e = (engine ??= createEngine())
    // A context made from a MIDI message, not a click, can start suspended.
    if (e.ac.state === 'suspended') void e.ac.resume()
    const old = e.voices.get(id)
    if (old) releaseVoice(e, old)
    e.sustained.delete(id)
    const voice = startVoice(e, loaded, midi, velocity)
    e.voices.set(id, voice)
    // Forget the voice when it stops.
    voice.source.onended = () => {
      voice.gain.disconnect()
      if (e.voices.get(id) !== voice) return
      e.voices.delete(id)
      e.sustained.delete(id)
    }
  }

  function noteOff(id: string) {
    const e = engine
    const voice = e?.voices.get(id)
    if (!e || !voice) return
    if (sustain) return void e.sustained.add(id)
    releaseVoice(e, voice)
    e.voices.delete(id)
  }

  /** Keeps the setting even before the first note, when there is no engine yet. */
  function setSustain(on: boolean) {
    sustain = on
    const e = engine
    if (on || !e) return
    for (const id of e.sustained) {
      const voice = e.voices.get(id)
      if (voice) releaseVoice(e, voice)
      e.voices.delete(id)
    }
    e.sustained.clear()
  }

  /** Plays notes for a fixed time, for the Play button and screen pads. `strum` spreads the notes out. */
  function play(notes: readonly number[], strum = false) {
    const sorted = [...notes].sort((a, b) => a - b)
    sorted.forEach((midi, i) => {
      const id = `play-${midi}`
      setTimeout(() => noteOn(id, midi, 0.65), strum ? i * 35 : 0)
      setTimeout(() => noteOff(id), (strum ? i * 35 : 0) + 1400)
    })
  }

  /**
   * The audio clock in seconds, for scheduling clicks. `latency` is the time from the clock to the speaker.
   * Call it from a click or key press the first time, because browsers start audio only after a user action.
   */
  function clock() {
    const e = (engine ??= createEngine())
    if (e.ac.state === 'suspended') void e.ac.resume()
    return { now: e.ac.currentTime, latency: e.ac.outputLatency || e.ac.baseLatency || 0 }
  }

  /** A metronome click at `at` on the audio clock. It skips the reverb, so the beat stays sharp. */
  function click(at: number, accent: boolean) {
    const e = engine
    if (!e) return
    const osc = e.ac.createOscillator()
    osc.frequency.value = accent ? 1760 : 1320
    const gain = e.ac.createGain()
    gain.gain.setValueAtTime(accent ? 0.35 : 0.2, at)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.04)
    osc.connect(gain).connect(e.ac.destination)
    osc.start(at)
    osc.stop(at + 0.05)
    osc.onended = () => gain.disconnect()
  }

  return { load, noteOn, noteOff, setSustain, play, clock, click }
}

export type Piano = ReturnType<typeof createPiano>
