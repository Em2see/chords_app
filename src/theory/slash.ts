import { type Note, type NoteLetter, type Alteration, note, notePitchClass, noteAbove } from './notes'
import { type ChordType, type Chord, buildChord } from './chords'

export type SlashKind = 'inversion' | 'seventh' | 'foreign'

export interface SlashChord {
  readonly chord: Chord
  readonly bass: Note
}

export interface SlashAnalysis {
  readonly kind: SlashKind
  readonly inversionIndex?: number  // only for 'inversion': 0-indexed chord note that matches bass
}

// ---- parser ----

const VALID_LETTERS = 'CDEFGAB'

function parseNoteStr(s: string): Note | null {
  if (!s) return null
  const letter = s[0].toUpperCase() as NoteLetter
  if (!VALID_LETTERS.includes(letter)) return null
  let alt: Alteration = 0
  let pos = 1
  if (s.startsWith('##', pos))      { alt =  2; pos += 2 }
  else if (s.startsWith('#', pos))  { alt =  1; pos += 1 }
  else if (s.startsWith('bb', pos)) { alt = -2; pos += 2 }
  else if (s.startsWith('b', pos))  { alt = -1; pos += 1 }
  if (pos !== s.length) return null
  return note(letter, alt)
}

// Longest-match first to avoid prefix collisions (e.g. 'm7' before 'm', 'dim7' before 'dim')
const SUFFIX_TABLE: Array<[string, ChordType]> = [
  ['maj7', 'maj7'], ['m7b5', 'm7b5'], ['dim7', 'dim7'],
  ['sus2', 'sus2'], ['sus4', 'sus4'],
  ['Δ7', 'maj7'], ['ø7', 'm7b5'], ['°7', 'dim7'],
  ['m7', 'm7'],
  ['min', 'min'], ['maj', 'maj'], ['dim', 'dim'], ['aug', 'aug'],
  ['°', 'dim'], ['m', 'min'], ['+', 'aug'], ['7', '7'],
  ['', 'maj'],
]

function parseSuffix(s: string): ChordType | null {
  for (const [suffix, type] of SUFFIX_TABLE) {
    if (s === suffix) return type
  }
  return null
}

function parseChordName(s: string): { root: Note; type: ChordType } | null {
  if (!s) return null
  const letter = s[0].toUpperCase() as NoteLetter
  if (!VALID_LETTERS.includes(letter)) return null
  let alt: Alteration = 0
  let pos = 1
  if (s.startsWith('##', pos))      { alt =  2; pos += 2 }
  else if (s.startsWith('#', pos))  { alt =  1; pos += 1 }
  else if (s.startsWith('bb', pos)) { alt = -2; pos += 2 }
  else if (s.startsWith('b', pos))  { alt = -1; pos += 1 }
  const suffix = s.slice(pos)
  const type = parseSuffix(suffix)
  if (type === null) return null
  return { root: note(letter, alt), type }
}

export function parseSlashChord(input: string): SlashChord | null {
  const slash = input.indexOf('/')
  if (slash <= 0) return null
  const chordResult = parseChordName(input.slice(0, slash).trim())
  if (!chordResult) return null
  const bass = parseNoteStr(input.slice(slash + 1).trim())
  if (!bass) return null
  return { chord: buildChord(chordResult.root, chordResult.type), bass }
}

// ---- classifier ----

export function analyzeSlash(slash: SlashChord): SlashAnalysis {
  const { chord, bass } = slash
  const bassPc = notePitchClass(bass)
  const rootPc = notePitchClass(chord.root)

  // Type 1: bass matches a chord tone → inversion
  for (let i = 0; i < chord.notes.length; i++) {
    if (notePitchClass(chord.notes[i]!) === bassPc) {
      return { kind: 'inversion', inversionIndex: i }
    }
  }

  // Type 2: bass adds a 7th (minor 7th = 10 st, major 7th = 11 st above root)
  const interval = (bassPc - rootPc + 12) % 12
  if (interval === 10 || interval === 11) return { kind: 'seventh' }

  // Type 3: bass is foreign
  return { kind: 'foreign' }
}

// ---- exercises ----

// Classic descending-bass progression for a major key:
// I – I/maj7 – vi – vi/min7 – IV – IV/maj7 – ii – V – I
// Bass line: root → maj7 → 6th → 5th → 4th → maj3 → 2nd → 5th → root
export function descendingBassLine(keyRoot: Note): SlashChord[] {
  const deg2  = noteAbove(keyRoot, 1, 2)   // major 2nd  (ii root, also bass for IV)
  const deg3  = noteAbove(keyRoot, 2, 4)   // major 3rd  (bass for IV step)
  const deg4  = noteAbove(keyRoot, 3, 5)   // perfect 4th (IV root)
  const deg5  = noteAbove(keyRoot, 4, 7)   // perfect 5th (V root, also bass for vi step)
  const deg6  = noteAbove(keyRoot, 5, 9)   // major 6th  (vi root)
  const deg7  = noteAbove(keyRoot, 6, 11)  // major 7th  (bass for I step)

  const chI  = buildChord(keyRoot, 'maj')
  const chVI = buildChord(deg6,    'min')
  const chIV = buildChord(deg4,    'maj')
  const chII = buildChord(deg2,    'min')
  const chV  = buildChord(deg5,    'maj')

  return [
    { chord: chI,  bass: keyRoot },  // I
    { chord: chI,  bass: deg7   },  // I/maj7
    { chord: chVI, bass: deg6   },  // vi
    { chord: chVI, bass: deg5   },  // vi/min7
    { chord: chIV, bass: deg4   },  // IV
    { chord: chIV, bass: deg3   },  // IV/maj7
    { chord: chII, bass: deg2   },  // ii
    { chord: chV,  bass: deg5   },  // V
    { chord: chI,  bass: keyRoot },  // I (return)
  ]
}
