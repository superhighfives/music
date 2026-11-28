import { RECIPES, THEMES } from '~/production/catalog'

/**
 * The whole studio, as /tools lists it. `learn` holds short exercises for one tool. `lessons` links to
 * Production: `theme.lesson` for a lesson or `recipe.<id>` for a recipe. tools.test.ts fails on a key
 * that doesn't resolve, so a renamed lesson can't leave a dead link here.
 */
export interface Tool {
  name: string
  what: string
  learn: string[]
  lessons: string[]
  /** Links outside Production, such as another section of music. */
  links?: { label: string; href: string }[]
}

export interface ToolGroup {
  name: string
  about: string
  tools: Tool[]
}

export const TOOL_GROUPS: ToolGroup[] = [
  {
    name: 'Studio',
    about: 'Where everything runs and where ideas start.',
    tools: [
      {
        name: 'Ableton Live 12 Suite',
        what: 'The DAW for everything here: MIDI Tools, stem separation and Max for Live.',
        learn: [
          'Set the format once: 48 kHz in Settings → Audio, 24-bit in Settings → Record, Warp & Launch.',
          'Put Utility first on every track and gain-stage a whole set before you mix.',
          'Split a reference track into stems, then solo its drums and bass to hear how they share the low end.',
        ],
        lessons: ['sound.gain', 'sound.listen', 'scapes.map', 'songs.vignette'],
      },
      {
        name: 'Ableton Move',
        what: 'A standalone sketchpad for chords and beats away from the Mac.',
        learn: [
          'Learn three chord shapes in your key on the pad grid, then play a progression without looking.',
          'Sketch a 4-bar idea on Move, then finish it in Live.',
        ],
        lessons: [],
        links: [{ label: 'Chords', href: '/chords' }],
      },
      {
        name: 'Mac Mini',
        what: 'The studio computer. Claude drives Live on it through AbletonMCP.',
        learn: ['Ask Claude to build a set: a MIDI track, an instrument and a 4-bar chord clip in your key.'],
        lessons: [],
      },
    ],
  },
  {
    name: 'Recording',
    about: 'Sound from outside the computer.',
    tools: [
      {
        name: 'Tascam DR-40XP',
        what: 'A 32-bit float field recorder with X/Y or A/B mics, two XLR inputs and a USB-C interface. For acoustic guitar, conversations, ambience and demos.',
        learn: [
          'Record acoustic guitar in X/Y, 30–45 cm away, aimed where the neck meets the body.',
          'Record five minutes of ambience in A/B with a windscreen. Then record the same place in X/Y and compare the width.',
          'Start every take with 10 seconds of silence. It gives RX a noise profile to learn.',
          'Slice a city or rain recording into hats and snares.',
        ],
        lessons: ['drums.grain', 'drums.rack', 'scapes.textures', 'midi.digital'],
      },
      {
        name: 'Focusrite Scarlett 2i2 (2nd Gen)',
        what: 'The audio interface: two combo inputs for mics, line or instrument, up to 24-bit/192 kHz, one 48 V phantom power switch shared by both inputs, and Direct Monitor for hearing yourself with no delay.',
        learn: [
          'Set each input’s gain so its halo stays green on your loudest take and never turns red. Red means 0 dBFS: clipping.',
          'Turn on Direct Monitor and set the track’s Monitor to Off. Sing a line and hear it with no delay.',
          'Remember that 48 V reaches both XLR inputs at once. Check what’s plugged into the other input before switching it on.',
          'Plug a guitar into an input with LINE/INST set to INST, and a synth into the other set to LINE. Hear the difference in level.',
        ],
        lessons: ['midi.latency', 'midi.digital', 'sound.gain'],
      },
    ],
  },
  {
    name: 'Editing and repair',
    about: 'Fix the performance and the recording before you mix.',
    tools: [
      {
        name: 'Melodyne 5 Editor',
        what: 'Note-by-note pitch and timing editing, including single notes inside chords.',
        learn: [
          'Correct the pitch of one vocal phrase, but leave the vibrato and slides alone. Compare it with the original.',
          'Load a guitar chord and move one note inside it to change the chord’s quality.',
          'Fix the timing of a played part note by note, then compare it with quantizing in Live.',
          'Turn a field recording with a clear pitch, such as a bell or a hum, into a melody.',
        ],
        lessons: ['recipe.the-peace', 'scapes.textures'],
      },
      {
        name: 'AutoTune Advanced',
        what: 'Real-time pitch correction for singing live. Live mode keeps plugin latency under 1 ms, and it corrects notes without flattening vibrato.',
        learn: [
          'Put it first on the vocal track in Live mode, set the key, and sing through it at your stage buffer size.',
          'Correct a sustained note with vibrato here, then fix the same note in Melodyne. Compare the two.',
          'Map MIDI Perform to a controller and change the tuning or vibrato while you sing.',
        ],
        lessons: ['scapes.live'],
      },
      {
        name: 'Harmony Engine',
        what: 'Real-time vocal harmonies: up to four voices from one vocal, set by key and scale or played from MIDI.',
        learn: [
          'Put it after AutoTune Advanced on the vocal, and check CPU and latency at your stage buffer size.',
          'Play chords on a MIDI keyboard and let them set the harmonies while you sing.',
          'Write the harmony chords as a MIDI clip, so each section of a song gets its own harmonies on stage.',
        ],
        lessons: ['scapes.live'],
        links: [{ label: 'Chords', href: '/chords' }],
      },
      {
        name: 'iZotope RX 12 Standard',
        what: 'Audio repair: noise, hum, clicks, clipping and room sound, plus a spectral editor for single sounds.',
        learn: [
          'Learn a noise profile from the silence at the start of a take, then remove the hiss. Stop before the voice sounds watery.',
          'Find a cough or chair creak in the spectral editor and paint it out.',
          'Remove the hum from a recording made near a fridge or a laptop charger.',
          'Clean a vocal before it goes into a vocoder, so only the voice shapes the chords.',
        ],
        lessons: ['sound.listen', 'recipe.the-peace'],
      },
    ],
  },
  {
    name: 'Effects and instruments',
    about: 'Character, space and new sounds.',
    tools: [
      {
        name: 'Soundtoys 5.5',
        what: 'All 23 plugins. Decapitator and Radiator for drive, EchoBoy and SuperPlate for space, Crystallizer and SpaceBlender for texture.',
        learn: [
          'Make a sub bass audible on a phone with Decapitator, without making it louder on the meter.',
          'Build a plate return with SuperPlate and an echo return with EchoBoy at a dotted eighth.',
          'Resample a drum group through Crystallizer and chop the best bars back into the rack.',
        ],
        lessons: ['sound.saturation', 'sound.space', 'drums.kick', 'drums.glue'],
      },
      {
        name: 'FabFilter Saturn 2, Timeless 3, Twin 3, Volcano 3',
        what: 'Saturn for multiband warmth, Timeless for delay textures, Volcano for moving filters and Twin for synth layers.',
        learn: [
          'Saturate only below 500 Hz on a pad with Saturn 2, for warmth without fizz.',
          'Use Timeless 3 as the echo return instead of EchoBoy, and compare the two.',
          'Draw a slow filter movement in Volcano 3 across 8 bars of a bed loop.',
        ],
        lessons: ['sound.saturation', 'sound.space'],
      },
      {
        name: 'Goodhertz LA-210',
        what: 'A free color plugin: opto compression, soft clipping and a cassette tape model in one. Still in beta.',
        learn: [
          'Put it on a vocal and use only the opto compression. Aim for 3–6 dB of reduction, then match the level and A/B it.',
          'Push the soft clipping on a drum bus until the peaks round off, then back off a little.',
          'Use the tape model on a pad to make it sound older, then compare it with Saturn 2.',
        ],
        lessons: ['sound.comp', 'sound.saturation', 'drums.glue'],
      },
      {
        name: 'Synplant 2 and PhenoType',
        what: 'Genopatch turns a sample into a playable patch. PhenoType makes one from a text prompt.',
        learn: [
          'Genopatch a field recording into a pad and play a progression on it.',
          'Describe a sound in PhenoType, then grow variations until one fits the track.',
        ],
        lessons: ['scapes.textures'],
      },
      {
        name: 'Magenta RealTime 2',
        what: 'A generative model to jam with in real time, as an Audio Unit or a standalone app.',
        learn: ['Jam over a pad for two minutes, record the output and keep the best 8 bars as a bed.'],
        lessons: ['scapes.map'],
      },
      {
        name: 'Stable Audio 2.5',
        what: 'Generated textures in a key and tempo, from the gen_textures.py script.',
        learn: ['Generate a pad in your key, load it into Simpler and play intervals on it.'],
        lessons: ['scapes.textures', 'scapes.map'],
      },
    ],
  },
  {
    name: 'Mastering',
    about: 'The last step before a file goes out.',
    tools: [
      {
        name: 'iZotope Ozone 12 Elements',
        what: 'Mastering with Master Assistant, which builds an editable chain to start from, and a loudness meter.',
        learn: [
          'Run Master Assistant on a finished mix. Then match its level with bypass and decide whether it actually sounds better.',
          'Measure integrated loudness and true peak, and compare them with the targets for pop and ambient.',
        ],
        lessons: ['sound.loudness', 'sound.listen'],
      },
    ],
  },
  {
    name: 'Inside Live',
    about: 'Scripts and devices that speed up writing.',
    tools: [
      {
        name: 'Extensions: ambient, chords, progressive, reverse-midi',
        what: 'My own Live Extensions. The ambient Template tab builds a starting set with the drum rack and scenes in place.',
        learn: [
          'Generate the ambient Template and arrange it into a 2½-minute vignette.',
          'Write a progression with progressive, then reverse it with reverse-midi for a B section.',
        ],
        lessons: ['songs.vignette', 'drums.rack', 'scapes.live'],
        links: [{ label: 'Extensions', href: '/ableton' }],
      },
      {
        name: 'Chord-O-Mat 3 and Circle of Fifth',
        what: 'Max for Live chord tools from Soundmanufacture, for quick chord beds in a key.',
        learn: ['Sketch a pad progression with Chord-O-Mat, then write the same chords out by hand to learn them.'],
        lessons: ['scapes.map'],
        links: [{ label: 'Chords', href: '/chords' }],
      },
      {
        name: 'ClyphX Pro',
        what: 'Macro scripting for Live: one action that does many things.',
        learn: ['Write one action that arms a track, sets the tempo and fires a scene.'],
        lessons: ['scapes.live'],
      },
    ],
  },
]

/** A Production lesson or recipe, from its `lessons` key. Null when the key doesn't match one. */
export function lessonLink(key: string): { title: string; href: string } | null {
  const [kind, id] = key.split('.')
  if (kind === 'recipe') {
    const recipe = RECIPES.find((r) => r.id === id)
    return recipe ? { title: recipe.title, href: `/production/recipes/${recipe.id}` } : null
  }
  const theme = THEMES.find((t) => t.id === kind)
  const lesson = theme?.lessons.find((l) => l.id === id)
  return theme && lesson ? { title: lesson.title, href: `/production/themes/${theme.id}/${lesson.id}` } : null
}
