# AI in Ableton: starter guide

What you own, what to add, and how the AI tools fit together for making ambient
soundscapes and vignettes in Live. The step-by-step learning side lives in
[sounds](https://music.charliegleason.com/sounds); this guide is about tools.

First written 15 November 2026 as a claude.ai doc; moved here and updated
26 November 2026.

## What you already own

| What | Where it fits |
| --- | --- |
| Live 12 Suite, plus the Live 13 Suite upgrade (pre-ordered) | Everything here: MIDI Tools, stem separation, Max for Live |
| Synplant 2 with the free PhenoType add-on | Genopatch turns a sample into a patch; PhenoType makes one from a text prompt |
| Soundtoys 5.5 | All 23 plugins. Crystallizer, EchoBoy, SuperPlate and SpaceBlender give raw AI texture character |
| FabFilter Saturn 2, Timeless 3, Twin 3, Volcano 3 | Upgraded from the 2013 Creative bundle in Nov 2026. Saturn for warmth and multiband drive, Timeless for delay textures, Volcano for moving filters, Twin for synth layers |
| iZotope Ozone 12 Elements | Mastering: Master Assistant builds an editable chain to start from. Bought Nov 2026 |
| Chord-O-Mat 3 (Max for Live) | Quick chord beds for pads |
| ClyphX Pro | Macro scripting in Live |
| Ableton Move and EP-133 K.O. II | Sketching ideas away from the Mini |
| Your own Live Extensions: ambient, chords, progressive, reverse-midi | In [`ableton/`](../ableton/); ambient's Template tab builds a starting set |

The Sonic Charge Authenticator lists only Synplant 2 and Synplant v1, so
Bitspeek, Echobode, Permut8 and Microtonic aren't owned.

## Recommended setup

Everything runs on the Mac Mini. Start with what you own and pay only for
Replicate runs; buy a mastering tool once you have a track worth finishing.

1. **Live 12's own tools first:** MIDI Tools for generative notes, stem
   separation, and Splice's Search with Sound in the browser. All free with
   Suite, and they carry over to Live 13.
2. **Claude driving Live:** ableton-mcp with Claude Code on the Mini, which you
   chat with from your laptop or phone (see [`README.md`](README.md)).
3. **Stable Audio 2.5 on Replicate for raw texture:** commercially safe, up to
   190 s a clip. [`gen_textures.py`](../ableton/textures/) generates clips in a
   key and tempo and checks the key. Run results through Soundtoys or Saturn and
   Timeless for character.
4. **One instrument that turns sound into playable pads:** Synplant 2. Genopatch
   turns a field recording into a pad; PhenoType makes a patch from a prompt.
5. **Finishing:** Ozone 12 Elements, which you own, for mastering. Start from
   its Master Assistant and tame the limiter for ambient material.

Splice is optional at the start: the free Splice Create beta and the browser
integration let you try it before subscribing.

## Generating soundscapes and vignettes

The best mix is Live's own generative tools for the notes, Stable Audio for raw
texture, and Synplant or Magenta RealTime to turn sounds into playable
instruments. Live 13 adds texture tools (Looplet, Step Sequencer) but
[no AI features](https://cdm.link/ableton-live-13-hands-on-whats-new/); it's in
limited public beta, with full release in early 2027.

### Inside Ableton (free with what you own)

| Tool | What it gives you |
| --- | --- |
| [MIDI Tools](https://www.ableton.com/en/live-manual/12/midi-tools/) (Live 12) | Generators (Seed, Shape, Stacks, Euclidean) and 12 Transformations; write your own in Max for Live |
| [Stem separation](https://www.ableton.com/en/stem-separation-in-ableton-live/) (Live 12.3+, Suite) | Splits audio into vocals, bass, drums and other, locally |
| [Splice in the browser](https://www.ableton.com/en/release-notes/live-12/) (Live 12.3+) | Search with Sound suggests samples matching your track's harmony or rhythm |
| [Looplet](https://www.synthtopia.com/content/2026/11/11/ableton-announces-live-13-adding-step-sequencing-ara-2-support-new-sound-design-tools/) (Live 13 Suite) | Four-playhead granular and tape sampler for evolving textures |

### AI generators and instruments

| Tool | What it gives you | Cost (USD) | Commercial use |
| --- | --- | --- | --- |
| [Stable Audio 2.5](https://replicate.com/stability-ai/stable-audio-2.5) on Replicate | Text-to-audio up to 190 s, plus audio-to-audio | Pay per run | Yes, trained on licensed data |
| [Stable Audio 3](https://stability.ai/news-updates/meet-stable-audio-3-the-model-family-built-for-artistic-experimentation-with-open-weight-models) | Open weights, up to 6:20, continuation, inpainting, LoRA fine-tuning | Free locally; [community build](https://replicate.com/jimothyjohn/stable-audio-3-medium) about $0.04 a run | Yes, under $1M a year in revenue |
| [Magenta RealTime 2](https://officechai.com/ai/google-releases-magenta-realtime-2-for-on-device-live-music-synthesis/) | Free AU plugin that plays AI-generated sound live on a MIDI track | Free | Check the licence before release |
| [Synplant 2](https://soniccharge.com/synplant) | Genopatch patches from samples; PhenoType patches from text | Owned | Yes, it's a synth |
| [Splice](https://www.thefader.com/2026/11/06/splice-launches-its-own-daw-splice-create) | Samples, Stacks, and the free Splice Create beta | From [$12.99 a month](https://pricingsaas.com/companies/splice) | Yes, [royalty-free](https://intercom.help/splice-b7a2d5b83f2e/en/articles/8652642-splice-sounds-licensing-faq) |
| [ElevenLabs Sound Effects](https://elevenlabs.io/blog/sfx-v3-for-developers) | Ambience and foley from text; seamless loops | Paid plan for the API | Cleared for most commercial use |

Skip [MusicGen](https://www.replicate.com/meta/musicgen) for anything you'll
release: its weights are non-commercial. Suno and Udio are poor fits now that
their downloads are limited.

On the Mini, Magenta RealTime 2's 2.4B model needs an M3 Pro, M2 Max or better,
so a base Mini gets the 230M model. Generate outside Live where you can: a model
and a session together need a lot of memory.

## AI mixing and mastering

You own [Ozone 12 Elements](https://www.izotope.com/collections/ozone): its
Master Assistant gives a solid starting master, and you learn by adjusting it. Ableton has no AI
mastering of its own, in Live 12 or 13.

| Tool | What the AI does | Cost (USD) | Verdict |
| --- | --- | --- | --- |
| [iZotope Ozone 12](https://www.izotope.com/collections/ozone) | Master Assistant builds an editable chain | Elements $55, Standard $219, Advanced $499 | Best overall; fast on a decent mix, can't rescue a bad one ([Sound on Sound](https://www.soundonsound.com/reviews/izotope-ozone-12-advanced)) |
| [sonible smart:essentials](https://www.pluginboutique.com/manufacturers/190-sonible) | smart:EQ 4, smart:comp 3, smart:limit | Regular $249, often on sale | Lighter and more transparent; smart:EQ suits stacked pads |
| [Soundtheory Gullfoss](https://www.kvraudio.com/news/soundtheory-black-friday-savings-50-off-gullfoss-and-kraftur-65281) | Hearing-model automatic EQ | About $199, often 50% off | Great for muddy drones; easy to overdo |
| [iZotope Neutron 5](https://www.sweetwater.com/store/detail/Neutron5) | Mix Assistant sets levels and chains | $249 | Helps busy mixes; less needed for sparse textures |
| [LANDR](https://www.landr.com/online-audio-mastering) | Online mastering with styles and references | $10 a track, or from $11.99 a month | Quick reference masters, little control |
| BandLab Mastering | Simple online mastering | Free | A free second opinion |

Assistants, reference matching and resonance taming are the useful parts.
Don't trust their default loudness: ambient wants dynamic range, so set the
limiter gently, keep a −1 dBTP ceiling, and compare against ambient references
at matched loudness. A reference tool like
[Mastering The Mix's REFERENCE](https://www.masteringthemix.com/) teaches more
than any one-click master.

## Claude and scripting

| Option | Good for | Watch out for |
| --- | --- | --- |
| [ableton-mcp](https://github.com/ahujasid/ableton-mcp) (installed) | Claude builds tracks, writes MIDI, loads devices, drops in audio clips | No rendering or export; third-party plugins sometimes won't load by name ([guide](https://mcp.directory/blog/ableton-mcp-complete-guide-2026)) |
| [ableton-mcp-extended](https://github.com/uisato/ableton-mcp-extended) | More device parameter control, ElevenLabs sound effects | Smaller project; automation is buggy |
| [AbletonOSC](https://www.github.com/ideoforms/AbletonOSC) | Your own scripts talking to Live over OSC | No audio import or browser loading |
| [Live Extensions SDK](https://ableton.github.io/extensions-sdk) (in use) | Right-click tools inside Live; see [`ableton/`](../ableton/) | Only Live's own devices, no third-party plugins or Max for Live devices |
| [Max for Live v8 JS](https://adammurray.link/max-for-live/v8-in-live/) and [Node for Max](https://docs.cycling74.com/max8/vignettes/00_N4M_index) | A device inside Live that calls Replicate | More work; v8 runs on Max's low-priority thread |

### How a Claude session goes

Work one section at a time and describe what you hear, because Claude can't hear
the mix.

- **You:** "Set 70 BPM. Make an audio track called Fog and drop in the four
  newest files from AI Textures."
- **Claude:** makes the track and clips, then lists what it placed.
- **You:** "Fog is too bright. Put an Auto Filter on it and pull the cutoff down."
- **Claude:** loads the filter and sets the cutoff.

Limits: Claude can't hear and can't render or export, so you listen and bounce
by hand. Big multi-step asks can time out, so save the set first.

**Voice:** at the Mini, Claude Code's `/voice` dictation (hold Space; not over
SSH). From a laptop or phone, use the device's own dictation in the Remote
Control chat.

## First project: a 2-minute fog vignette

One finished 2 to 3 minute piece from AI texture, one real recording and a
generated chord bed. The steps now live in sounds as the
[vignette lesson](https://music.charliegleason.com/sounds/themes/songs/vignette).
Done means one bounced WAV you'd play for someone.
