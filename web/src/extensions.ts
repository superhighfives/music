/**
 * The Ableton Live Extensions, as /ableton lists them. Each download is /ableton/<id>.ablx, which
 * src/server.ts redirects to that extension's newest release, so the ids must match the release tags.
 */
export const EXTENSIONS = [
  {
    id: 'chords',
    about:
      'Every diatonic chord in a key as a grid. Click chords into named sections, then write one onto the Arrangement as a MIDI clip.',
    how: 'Right-click a MIDI track → Map Chords…',
  },
  {
    id: 'progressive',
    about: 'Famous chord progressions, like I–V–vi–IV, ii–V–I and the 12-bar blues, in any key or mode as MIDI clips.',
    how: 'Right-click a MIDI track → Generate Progressions…',
  },
  {
    id: 'ambient',
    about:
      'Ambient soundscapes as looping MIDI clips: phasing pads, evolving chords, shimmer, drums and bass, or a Push-ready rig that ties them together.',
    how: 'Right-click a MIDI track → Generate Ambient…',
  },
  {
    id: 'reverse-midi',
    about: 'Reverses the timing of every note in a MIDI clip, as one undo step.',
    how: 'Right-click a MIDI clip → Reverse Notes',
  },
]
