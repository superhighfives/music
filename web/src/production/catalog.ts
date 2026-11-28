/*
 * The course's outline: themes in order, each with its lessons and the titles still to write, and the
 * recipes. A lesson's text is its MDX file, lessons/<theme>/<lesson>.mdx; a recipe's is recipes/<id>.mdx.
 *
 * To add a lesson: write its MDX file, add it to its theme's `lessons`, and remove it from `planned`.
 */

export interface Lesson {
  id: string
  title: string
}

export interface Theme {
  id: string
  name: string
  blurb: string
  lessons: Lesson[]
  /** Lessons outlined but not written yet. */
  planned: string[]
  /** A theme with no lessons yet shows the in-this-key panel. */
  keyBox: boolean
}

export interface Recipe {
  id: string
  title: string
  artist: string
  track: string
  album: string
  summary: string
}

export const THEMES: Theme[] = [
  {
    "id": "midi",
    "name": "MIDI & audio",
    "blurb": "How music gets into the computer: what MIDI messages are made of, channels and MIDI 2.0, how sound becomes numbers, file formats, and why there’s a delay.",
    "lessons": [
      {
        "id": "what",
        "title": "What MIDI is"
      },
      {
        "id": "messages",
        "title": "Inside a MIDI message"
      },
      {
        "id": "channels",
        "title": "Channels, ports, MPE and MIDI 2.0"
      },
      {
        "id": "digital",
        "title": "How digital audio works"
      },
      {
        "id": "formats",
        "title": "Bit rate and file formats"
      },
      {
        "id": "latency",
        "title": "Buffers and latency"
      }
    ],
    "planned": [],
    "keyBox": false
  },
  {
    "id": "sound",
    "name": "Sound quality",
    "blurb": "Gain, listening, EQ, compression, saturation, space and loudness: the habits behind audio that sounds expensive.",
    "planned": [],
    "lessons": [
      {
        "id": "gain",
        "title": "Gain staging"
      },
      {
        "id": "listen",
        "title": "Listening and references"
      },
      {
        "id": "eq",
        "title": "EQ that clears space"
      },
      {
        "id": "comp",
        "title": "Compression"
      },
      {
        "id": "saturation",
        "title": "Saturation and harmonics"
      },
      {
        "id": "space",
        "title": "Space: reverb and delay"
      },
      {
        "id": "loudness",
        "title": "Loudness and the bounce"
      }
    ],
    "keyBox": false
  },
  {
    "id": "recording",
    "name": "Recording",
    "blurb": "Getting the best sound in: the Scarlett, the Tascam and the mics, gain at the source, the room, vocals, and Melodyne.",
    "lessons": [],
    "planned": [
      "Your signal chain: mic, Scarlett, Live, and the Tascam away from the desk",
      "Gain at the source: headroom before anything in Live",
      "The AT2020: phantom power, pattern and placement",
      "The Golden Age mic",
      "The room: reflections, a treated corner and noise",
      "Recording vocals: distance, pop filter, takes and comping",
      "Tuning and timing in Melodyne"
    ],
    "keyBox": false
  },
  {
    "id": "songs",
    "name": "Songwriting & arrangement",
    "blurb": "Pop structure, contrast between sections, and keeping energy moving over time.",
    "planned": [
      "Pop song structure: verse, pre, chorus, bridge",
      "Contrast: what changes between sections",
      "Builds and drops without drums",
      "Writing toplines over loops",
      "Finishing: from loop to song",
      "Voice leading for pads and vocoders",
      "Pop hooks: rhythm first, then pitch"
    ],
    "lessons": [
      {
        "id": "vignette",
        "title": "A 2½-minute vignette"
      }
    ],
    "keyBox": false
  },
  {
    "id": "scapes",
    "name": "Soundscapes",
    "blurb": "Textures, generated audio, playable pads, and the five-layer map behind slow, wide music.",
    "planned": [],
    "lessons": [
      {
        "id": "map",
        "title": "The five-layer map"
      },
      {
        "id": "textures",
        "title": "Textures as instruments"
      },
      {
        "id": "bass",
        "title": "Low end"
      },
      {
        "id": "live",
        "title": "Playing it live"
      }
    ],
    "keyBox": false
  },
  {
    "id": "drums",
    "name": "Drums & groove",
    "blurb": "A kit that sits inside the mix: tuned kicks, grainy snares, hats from noise, and swing.",
    "planned": [
      "Pop drums: programming a chorus that lifts",
      "Generative drums with MIDI Tools: Euclidean, Seed, Recombine"
    ],
    "lessons": [
      {
        "id": "rack",
        "title": "The rack"
      },
      {
        "id": "kick",
        "title": "A kick in the key"
      },
      {
        "id": "grain",
        "title": "Snares and hats from noise"
      },
      {
        "id": "glue",
        "title": "Glue the kit"
      }
    ],
    "keyBox": false
  },
  {
    "id": "mix",
    "name": "Mixing & mastering",
    "blurb": "Balance, the vocal chain, bus processing and a gentle master, checked against references.",
    "planned": [
      "A static mix: faders and panning only",
      "The vocal chain, start to finish",
      "Bus processing: drums, music, vocals",
      "Width and depth without phase problems",
      "Mastering with Ozone Elements or by hand",
      "Recipes for Saturn 2 and Timeless 3"
    ],
    "lessons": [],
    "keyBox": false
  }
]

export const RECIPES: Recipe[] = [
  {
    "id": "the-peace",
    "title": "Vocoder chords, like “The Peace”",
    "artist": "underscores",
    "track": "The Peace",
    "album": "U (2026)",
    "summary": "A drumless pop ballad carried by a vocoder chord progression, with reverb and harmonies building around it."
  }
]

export const findTheme = (id: string) => THEMES.find((t) => t.id === id)
export const findRecipe = (id: string) => RECIPES.find((r) => r.id === id)
export const lessonKey = (theme: Theme, lesson: Lesson) => `${theme.id}.${lesson.id}`
