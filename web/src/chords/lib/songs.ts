import { mod, scaleById } from './music'

/** A chord name read as one of our chord types. `bass` is the note after a slash, as in "G/B". */
export type SongChord = { name: string; root: number; chord: string; bass?: number | undefined }

/** One lyric line. Each chord sits above the lyric character at index `at`. `parsed` is null for a name we cannot read. */
export type SongLine = { lyric: string; chords: { at: number; name: string; parsed: SongChord | null }[] }

export type Song = { id: string; title: string; artist?: string | undefined; lines: SongLine[] }

/** One chord to play, in song order. */
export type SongEvent = { line: number; index: number; chord: SongChord }

const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/** Chord name suffixes, as written in chord sheets, mapped to chord type ids. */
const SUFFIXES: Record<string, string> = {
  '': 'maj',
  M: 'maj',
  maj: 'maj',
  m: 'min',
  min: 'min',
  '-': 'min',
  '7': '7',
  dom7: '7',
  m7: 'm7',
  min7: 'm7',
  '-7': 'm7',
  maj7: 'M7',
  M7: 'M7',
  ma7: 'M7',
  'Δ': 'M7',
  'Δ7': 'M7',
  mM7: 'mM7',
  mmaj7: 'mM7',
  'm(maj7)': 'mM7',
  'm(M7)': 'mM7',
  '6': '6',
  m6: 'm6',
  '6/9': '6add9',
  '69': '6add9',
  '6add9': '6add9',
  '9': '9',
  m9: 'm9',
  maj9: 'maj9',
  M9: 'maj9',
  add2: 'add2',
  add9: 'add9',
  '2': 'sus2',
  sus2: 'sus2',
  sus: 'sus4',
  sus4: 'sus4',
  dim: 'dim',
  '°': 'dim',
  o: 'dim',
  dim7: 'dim7',
  '°7': 'dim7',
  o7: 'dim7',
  m7b5: 'm7b5',
  min7b5: 'm7b5',
  '-7b5': 'm7b5',
  'ø': 'm7b5',
  'ø7': 'm7b5',
  aug: 'aug',
  '+': 'aug',
  aug7: 'aug7',
  '+7': 'aug7',
  '7#5': 'aug7',
  '7+5': 'aug7',
  '7b5': '7b5',
  augM7: 'augM7',
  'maj7#5': 'augM7',
  'M7#5': 'augM7',
  '11': '11',
  m11: 'm11',
}

const notePc = (letter: string, accidental: string) => mod(LETTERS[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0), 12)

/** Reads a chord name such as "F#m7", "Bb/D" or "C6/9". Returns null for a name it does not know. */
export function parseChordName(name: string): SongChord | null {
  const m = /^([A-G])([#b]?)(.*?)(?:\/([A-G])([#b]?))?$/.exec(name.trim().replace(/♯/g, '#').replace(/♭/g, 'b'))
  if (!m) return null
  const chord = SUFFIXES[m[3]]
  if (!chord) return null
  return { name: name.trim(), root: notePc(m[1], m[2]), chord, bass: m[4] ? notePc(m[4], m[5]) : undefined }
}

/**
 * Reads a chord sheet in one of two formats:
 * - ChordPro: chords in brackets in the lyric, as in "[G]Amazing [C]grace", with {title: …} and {artist: …}.
 * - Chords above lyrics: a line of only chord names, then the lyric line it belongs to.
 * - Ultimate Guitar: chords above lyrics, with [ch]G[/ch] around chords and [tab]…[/tab] around line pairs.
 * A line that starts with a bracketed label, such as "[Chorus]" or "[Intro] x2", is a section name and is skipped.
 * Guitar tab lines, such as "e|---0---|", are skipped too.
 */
export function parseSheet(text: string, fallbackTitle = 'Untitled song'): Omit<Song, 'id'> {
  let title = fallbackTitle
  let artist: string | undefined
  const lines: SongLine[] = []
  // Ultimate Guitar's spacing already leaves out its markup, so removing the tags keeps the chord columns.
  const rows = text
    .replace(/\[\/?(ch|tab)\]/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].replace(/\t/g, '    ').trimEnd()
    const directive = /^\{\s*(\w+)\s*:\s*(.*?)\s*\}$/.exec(row.trim())
    if (directive) {
      const [, name, value] = directive
      if (name === 'title' || name === 't') title = value
      if (name === 'artist' || name === 'subtitle' || name === 'st') artist = value
      continue
    }
    if (!row.trim() || /^\{.*\}$/.test(row.trim())) continue
    const label = /^\[([^\]]*)\]/.exec(row.trim())
    if (label && !looksLikeChord(label[1])) continue
    if (isTabLine(row)) continue

    if (row.includes('[')) {
      // ChordPro: take the chords out of the lyric and keep where each one was.
      const chords: SongLine['chords'] = []
      let lyric = ''
      for (const part of row.split(/(\[[^\]]*\])/)) {
        if (part.startsWith('[') && part.endsWith(']')) {
          const name = part.slice(1, -1)
          chords.push({ at: lyric.length, name, parsed: parseChordName(name) })
        } else lyric += part
      }
      lines.push({ lyric: lyric.trim() ? lyric : '', chords })
      continue
    }

    if (isChordRow(row)) {
      const chords = [...row.matchAll(/\S+/g)]
        .filter((m) => !isChordRowNote(m[0]))
        .map((m) => ({ at: m.index, name: m[0], parsed: parseChordName(m[0]) }))
      const next = rows[i + 1]?.replace(/\t/g, '    ').trimEnd()
      const hasLyric =
        next !== undefined && next.trim() !== '' && !isChordRow(next) && !next.includes('[') && !isTabLine(next)
      if (hasLyric) i++
      lines.push({ lyric: hasLyric ? next : '', chords })
      continue
    }

    lines.push({ lyric: row, chords: [] })
  }
  return { title, artist, lines }
}

/**
 * True for a word written like a chord name, even one we cannot play, such as "G7sus4".
 * After the root, only chord words (maj, sus, add …), digits and symbols can follow, so "Day" or "Be" is a lyric.
 */
const looksLikeChord = (word: string) =>
  /^[A-G][#b♯♭]?(maj|min|dim|aug|sus|add|m|M|[0-9#b♯♭°ø+Δ()\-])*(\/[A-G][#b♯♭]?)?$/.test(word)

/** A guitar tab line, such as "e|---0---|". */
const isTabLine = (row: string) => /^\s*[A-Ga-g][#b]?\s*\|.*-{3}/.test(row)

/** A row of only chord names, such as "G   C   G". */
const isChordRow = (row: string) => {
  const tokens = row
    .trim()
    .split(/\s+/)
    .filter((t) => !isChordRowNote(t))
  return tokens.length > 0 && tokens.every(looksLikeChord)
}

/** Words between chords that are not chords: bar lines, repeats such as "x2", and notes such as "(hold)". */
const isChordRowNote = (word: string) => /^[|/\-%]+$/.test(word) || /^x\d+$/i.test(word) || /^\(.*\)$/.test(word)

export function songEvents(song: Pick<Song, 'lines'>): SongEvent[] {
  return song.lines.flatMap((line, l) =>
    line.chords.flatMap((c, index) => (c.parsed ? [{ line: l, index, chord: c.parsed }] : [])),
  )
}

/** Chord names in the sheet that we cannot read, so the player can see what was skipped. */
export const unknownChords = (song: Pick<Song, 'lines'>) => [
  ...new Set(song.lines.flatMap((line) => line.chords.filter((c) => !c.parsed).map((c) => c.name))),
]

const MINOR_CHORDS = ['min', 'm7', 'm6', 'm9', 'm11', 'mM7']

/**
 * The major or minor key that holds the most of the song's chord tones.
 * A tie goes to the key whose tonic is the first chord's root.
 */
export function songKey(events: SongEvent[], tonesOf: (c: SongChord) => number[]): { key: number; scale: string } {
  let best = { key: events[0]?.chord.root ?? 0, scale: 'major', score: -1 }
  for (const scale of ['major', 'minor']) {
    const intervals = scaleById(scale).intervals
    for (let key = 0; key < 12; key++) {
      const inScale = new Set(intervals.map((i) => mod(key + i, 12)))
      let score = 0
      for (const e of events) for (const pc of tonesOf(e.chord)) if (inScale.has(pc)) score++
      const first = events[0]?.chord
      const tonic = first && first.root === key && (scale === 'minor') === MINOR_CHORDS.includes(first.chord)
      if (score > best.score || (score === best.score && tonic)) best = { key, scale, score }
    }
  }
  return { key: best.key, scale: best.scale }
}

export const chordLabel = (c: SongChord) => c.name.replace(/#/g, '♯').replace(/b(?=\d|$|\/|m)/g, '♭')

/*
 * Built-in songs. All are public domain: traditional songs, or published before 1929 with authors long dead.
 * Do not add songs whose lyrics are under copyright.
 */
export const SONGS: Song[] = [
  {
    id: 'amazing-grace',
    ...parseSheet(
      `{title: Amazing Grace}
{artist: John Newton, 1779}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That saved a wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see`,
    ),
  },
  {
    id: 'oh-susanna',
    ...parseSheet(
      `{title: Oh! Susanna}
{artist: Stephen Foster, 1848}
I [C]come from Alabama with my banjo on my [G]knee
I'm [C]going to Louisiana, my true love [G]for to [C]see
Oh, [F]Susanna, oh don't you cry for [C]me
For I [C]come from Alabama with my banjo on my [G]knee [C]`,
    ),
  },
  {
    id: 'scarborough-fair',
    ...parseSheet(
      `{title: Scarborough Fair}
{artist: Traditional}
[Am]Are you going to [G]Scarborough [Am]Fair?
[C]Parsley, [Am]sage, rose[D]mary and [Am]thyme
Re[Am]member [C]me to one who [G]lives there
[Am]She once [G]was a true love of [Am]mine`,
    ),
  },
  {
    id: 'auld-lang-syne',
    ...parseSheet(
      `{title: Auld Lang Syne}
{artist: Robert Burns, 1788}
Should [C]auld acquaintance [G7]be forgot
And [C]never brought to [F]mind?
Should [C]auld acquaintance [G7]be forgot
And [F]days of [G7]auld lang [C]syne?`,
    ),
  },
]

export const songById = (id: string | undefined, saved: Song[]) =>
  id === undefined ? undefined : (SONGS.find((s) => s.id === id) ?? saved.find((s) => s.id === id))
