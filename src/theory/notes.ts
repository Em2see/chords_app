export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Alteration = -2 | -1 | 0 | 1 | 2

export interface Note {
  readonly letter: NoteLetter
  readonly alt: Alteration
}

const LETTERS: readonly NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

export const LETTER_PITCH: Readonly<Record<NoteLetter, number>> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
}

export function note(letter: NoteLetter, alt: Alteration = 0): Note {
  return { letter, alt }
}

export function notePitchClass(n: Note): number {
  return ((LETTER_PITCH[n.letter] + n.alt) % 12 + 12) % 12
}

export function noteToMidi(n: Note, octave: number): number {
  return (octave + 1) * 12 + LETTER_PITCH[n.letter] + n.alt
}

const ALT_SYMBOLS = ['bb', 'b', '', '#', '##'] as const

export function noteDisplay(n: Note): string {
  return n.letter + ALT_SYMBOLS[n.alt + 2]
}

// Compute the note that lies intervalLetters letter-steps and semitones above root.
// Spelling follows diatonic logic — the letter is fixed, alteration is derived.
export function noteAbove(root: Note, letterSteps: number, semitones: number): Note {
  const rootIdx = LETTERS.indexOf(root.letter)
  const newLetter = LETTERS[(rootIdx + letterSteps) % 7]
  const newPitch = (notePitchClass(root) + semitones) % 12
  const naturalPitch = LETTER_PITCH[newLetter]
  let alt = newPitch - naturalPitch
  // Resolve pitch-class wrap (e.g. Cb: C natural=0, pitch=11 → diff=11 → -1)
  if (alt > 6) alt -= 12
  else if (alt < -6) alt += 12
  if (alt < -2 || alt > 2) {
    throw new RangeError(
      `Alteration overflow: ${noteDisplay(root)} +${letterSteps}L +${semitones}st → ${newLetter} alt=${alt}`,
    )
  }
  return { letter: newLetter, alt: alt as Alteration }
}

export function noteEquals(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.alt === b.alt
}

export function enharmonic(a: Note, b: Note): boolean {
  return notePitchClass(a) === notePitchClass(b)
}
