import { type Note, note, enharmonic, noteAbove } from './notes'
import { type ChordType } from './chords'

export interface ChordSpec {
  root: Note
  type: ChordType
}

export type EnharmonicSeam = 'sharp' | 'flat'

// 12 roots in circle-of-fifths order: C G D A E B F#/Gb Db Ab Eb Bb F
export function circleRoots(seam: EnharmonicSeam = 'sharp'): Note[] {
  return [
    note('C'),
    note('G'), note('D'), note('A'), note('E'), note('B'),
    seam === 'sharp' ? note('F', 1) : note('G', -1),
    note('D', -1), note('A', -1), note('E', -1), note('B', -1), note('F'),
  ]
}

function rotateToRoot(roots: Note[], startRoot: Note): Note[] {
  const idx = roots.findIndex(r => enharmonic(r, startRoot))
  if (idx <= 0) return roots
  return [...roots.slice(idx), ...roots.slice(0, idx)]
}

export function circleOfFifths(
  chordType: ChordType,
  opts: { seam?: EnharmonicSeam; startRoot?: Note } = {},
): ChordSpec[] {
  let roots = circleRoots(opts.seam)
  if (opts.startRoot) roots = rotateToRoot(roots, opts.startRoot)
  return roots.map(root => ({ root, type: chordType }))
}

// Circle of fourths = fifths in reverse direction (defaults to start from C)
export function circleOfFourths(
  chordType: ChordType,
  opts: { seam?: EnharmonicSeam; startRoot?: Note } = {},
): ChordSpec[] {
  const roots = circleRoots(opts.seam).slice().reverse()
  const start = opts.startRoot ?? note('C')
  return rotateToRoot(roots, start).map(root => ({ root, type: chordType }))
}

// ii-V-I in all 12 major keys (36 chords total)
export function iiVIAllKeys(
  opts: { seam?: EnharmonicSeam; startRoot?: Note } = {},
): ChordSpec[] {
  let roots = circleRoots(opts.seam ?? 'sharp')
  if (opts.startRoot) roots = rotateToRoot(roots, opts.startRoot)
  return roots.flatMap(keyRoot => [
    { root: noteAbove(keyRoot, 1, 2), type: 'm7' as ChordType },   // ii
    { root: noteAbove(keyRoot, 4, 7), type: '7' as ChordType },    // V
    { root: keyRoot,                  type: 'maj7' as ChordType },  // I
  ])
}

// 7 diatonic seventh chords for a major key (I ii iii IV V vi vii°)
const DIATONIC_MAJOR_DEGREES = [
  { letters: 0, semitones: 0,  type: 'maj7'  as ChordType }, // I
  { letters: 1, semitones: 2,  type: 'm7'    as ChordType }, // ii
  { letters: 2, semitones: 4,  type: 'm7'    as ChordType }, // iii
  { letters: 3, semitones: 5,  type: 'maj7'  as ChordType }, // IV
  { letters: 4, semitones: 7,  type: '7'     as ChordType }, // V
  { letters: 5, semitones: 9,  type: 'm7'    as ChordType }, // vi
  { letters: 6, semitones: 11, type: 'm7b5'  as ChordType }, // vii°
] as const

export function diatonicMajor(root: Note): ChordSpec[] {
  return DIATONIC_MAJOR_DEGREES.map(({ letters, semitones, type }) => ({
    root: letters === 0 ? root : noteAbove(root, letters, semitones),
    type,
  }))
}

// Chromatic sequences (sharps ascending, flats descending — conventional spelling)
const CHROMATIC_UP_ROOTS: Note[] = [
  note('C'), note('C', 1), note('D'), note('D', 1), note('E'),
  note('F'), note('F', 1), note('G'), note('G', 1), note('A'), note('A', 1), note('B'),
]

const CHROMATIC_DOWN_ROOTS: Note[] = [
  note('C'), note('B'), note('B', -1), note('A'), note('A', -1),
  note('G'), note('G', -1), note('F'), note('E'), note('E', -1), note('D'), note('D', -1),
]

export function chromaticUp(chordType: ChordType, startRoot?: Note): ChordSpec[] {
  const roots = startRoot
    ? rotateToRoot(CHROMATIC_UP_ROOTS.slice(), startRoot)
    : CHROMATIC_UP_ROOTS
  return roots.map(root => ({ root, type: chordType }))
}

export function chromaticDown(chordType: ChordType, startRoot?: Note): ChordSpec[] {
  const roots = startRoot
    ? rotateToRoot(CHROMATIC_DOWN_ROOTS.slice(), startRoot)
    : CHROMATIC_DOWN_ROOTS
  return roots.map(root => ({ root, type: chordType }))
}

// Minimal seeded LCG for reproducible tests; falls back to Math.random
function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = ((Math.imul(s, 1664525) + 1013904223) >>> 0)
    return s / 4294967296
  }
}

function fisherYates<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// All 12 unique roots shuffled — no repeats until all 12 have been visited
export function randomProgression(chordType: ChordType, seed?: number): ChordSpec[] {
  const roots = circleRoots('sharp')
  const rng = seed !== undefined ? seededRng(seed) : Math.random
  return fisherYates(roots, rng).map(root => ({ root, type: chordType }))
}
