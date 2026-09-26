import { type Note, notePitchClass, noteToMidi } from './notes'
import { type Chord } from './chords'

export const RIGHT_HAND_DEFAULT = { min: 53, max: 79 } as const  // F3–G5
export const LEFT_HAND_DEFAULT  = { min: 36, max: 59 } as const  // C2–B3

export interface Voicing {
  readonly right: readonly number[]  // MIDI pitches for right hand, ascending
  readonly left: number              // MIDI pitch for left hand (root/bass)
  readonly inversion: number         // index of the bottom right-hand note in chord.notes
}

export interface VoiceMovement {
  readonly shifts: readonly number[]  // per-voice semitone shift (negative = down)
  readonly commonNotes: number        // voices that didn't move
  readonly totalMovement: number      // sum of |shifts|
}

// Nearest pitch strictly above prevMidi with the given pitch class
function nextPitchAbove(prevMidi: number, pitchClass: number): number {
  const diff = (pitchClass - prevMidi % 12 + 12) % 12 || 12
  return prevMidi + diff
}

function buildClosePosition(chord: Chord, inv: number, bottomMidi: number): number[] {
  const notes = chord.notes
  const N = notes.length
  const midi: number[] = [bottomMidi]
  let prev = bottomMidi
  for (let k = 1; k < N; k++) {
    prev = nextPitchAbove(prev, notePitchClass(notes[(inv + k) % N]))
    midi.push(prev)
  }
  return midi
}

// All close-position voicings that fit within [rangeMin, rangeMax]
function candidateVoicings(
  chord: Chord,
  rangeMin: number,
  rangeMax: number,
): Array<{ midi: number[]; inversion: number }> {
  const N = chord.notes.length
  const results: Array<{ midi: number[]; inversion: number }> = []

  for (let inv = 0; inv < N; inv++) {
    for (let octave = 0; octave <= 8; octave++) {
      const bottomMidi = noteToMidi(chord.notes[inv], octave)
      if (bottomMidi < rangeMin) continue
      if (bottomMidi > rangeMax) break

      const midi = buildClosePosition(chord, inv, bottomMidi)
      // If top note exceeds range, higher octaves will only be worse
      if (midi[midi.length - 1] > rangeMax) break

      results.push({ midi, inversion: inv })
    }
  }

  return results
}

// Lowest valid MIDI pitch for a note within the given range
function computeBassNote(n: Note, rangeMin: number, rangeMax: number): number {
  for (let octave = 0; octave <= 8; octave++) {
    const midi = noteToMidi(n, octave)
    if (midi >= rangeMin && midi <= rangeMax) return midi
  }
  return rangeMin
}

export function leadVoice(
  chord: Chord,
  prev: Voicing | null,
  opts: {
    right?: { min: number; max: number }
    left?:  { min: number; max: number }
    bass?:  Note              // override left-hand note (for slash chords)
    allowedInversions?: readonly number[]  // if set, restrict to these inversion indices
  } = {},
): Voicing {
  const rightRange = opts.right ?? RIGHT_HAND_DEFAULT
  const leftRange  = opts.left  ?? LEFT_HAND_DEFAULT

  let candidates = candidateVoicings(chord, rightRange.min, rightRange.max)
  if (opts.allowedInversions && opts.allowedInversions.length > 0) {
    const allowed = new Set(opts.allowedInversions)
    const filtered = candidates.filter(c => allowed.has(c.inversion))
    if (filtered.length > 0) candidates = filtered
    // else: fallback to all candidates (requested inversion not reachable in range)
  }

  let bestMidi: number[] = []
  let bestInversion = 0

  if (prev === null) {
    // Initial chord: root position
    const rootPos = candidates.find(c => c.inversion === 0) ?? candidates[0]
    if (rootPos) { bestMidi = rootPos.midi; bestInversion = rootPos.inversion }
  } else {
    let bestCost = Infinity
    let bestCommon = -1

    for (const { midi, inversion } of candidates) {
      if (midi.length !== prev.right.length) continue

      let cost = 0
      let common = 0
      for (let i = 0; i < midi.length; i++) {
        const d = Math.abs(midi[i] - (prev.right[i] as number))
        cost += d
        if (d === 0) common++
      }

      if (cost < bestCost || (cost === bestCost && common > bestCommon)) {
        bestCost = cost
        bestCommon = common
        bestMidi = midi
        bestInversion = inversion
      }
    }

    // Chord size changed or no candidate matched — fall back to root position
    if (bestMidi.length === 0) {
      const rootPos = candidates.find(c => c.inversion === 0) ?? candidates[0]
      if (rootPos) { bestMidi = rootPos.midi; bestInversion = rootPos.inversion }
    }
  }

  return {
    right: bestMidi,
    left: computeBassNote(opts.bass ?? chord.root, leftRange.min, leftRange.max),
    inversion: bestInversion,
  }
}

export function voiceMovement(prev: Voicing, next: Voicing): VoiceMovement {
  const len = Math.min(prev.right.length, next.right.length)
  const shifts = Array.from(
    { length: len },
    (_, i) => (next.right[i] as number) - (prev.right[i] as number),
  )
  return {
    shifts,
    commonNotes: shifts.filter(s => s === 0).length,
    totalMovement: shifts.reduce((s, d) => s + Math.abs(d), 0),
  }
}
