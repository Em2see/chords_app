import { type Note, note } from '../theory/notes'
import { type ChordType } from '../theory/chords'
import { type EnharmonicSeam } from '../theory/progressions'

export type ProgressionMode =
  | 'fifths' | 'fourths' | 'ii-V-I'
  | 'diatonic' | 'chromatic-up' | 'chromatic-down' | 'random'

export type HintLevel = 1 | 2 | 3

// Which inversions to use in voice leading
export type InversionMode = 'all' | 'root' | 'first' | 'second' | 'non-root'

// Filter progression roots by accidentals present in their name
export type AccidentalFilter = 'both' | 'no-flats' | 'no-sharps' | 'naturals'

export interface Settings {
  chordType: ChordType
  progressionMode: ProgressionMode
  keyRootPc: number       // 0–11, index into KEY_ROOTS
  seam: EnharmonicSeam
  showChain: boolean
  hintLevel: HintLevel
  hintDelay: number       // seconds, for hint level 2
  inversionMode: InversionMode
  accidentalFilter: AccidentalFilter
  // audio
  bpm: number             // 40–200
  beatsPerChord: number   // 1 | 2 | 4
  autoAdvance: boolean    // advance chord on metronome downbeat
  playSound: boolean      // play chord sounds
}

// 12 roots in chromatic order, flat convention for altered notes
export const KEY_ROOTS: readonly Note[] = [
  note('C'),      note('D', -1), note('D'),      note('E', -1), note('E'),
  note('F'),      note('G', -1), note('G'),      note('A', -1), note('A'),
  note('B', -1),  note('B'),
]

export function keyRootNote(s: Settings): Note {
  return KEY_ROOTS[s.keyRootPc] ?? KEY_ROOTS[0]!
}

export const DEFAULT: Settings = {
  chordType: 'maj',
  progressionMode: 'fifths',
  keyRootPc: 0,
  seam: 'sharp',
  showChain: true,
  hintLevel: 1,
  hintDelay: 3,
  inversionMode: 'all',
  accidentalFilter: 'both',
  bpm: 80,
  beatsPerChord: 4,
  autoAdvance: false,
  playSound: true,
}

const STORAGE_KEY = 'chord-trainer-v1'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {}
}
