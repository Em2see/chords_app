import { describe, it, expect } from 'vitest'
import {
  note, notePitchClass, noteToMidi, noteDisplay, noteAbove, noteEquals, enharmonic,
} from '../../src/theory/notes'

describe('notePitchClass', () => {
  it('natural notes map to correct semitones', () => {
    expect(notePitchClass(note('C'))).toBe(0)
    expect(notePitchClass(note('D'))).toBe(2)
    expect(notePitchClass(note('E'))).toBe(4)
    expect(notePitchClass(note('F'))).toBe(5)
    expect(notePitchClass(note('G'))).toBe(7)
    expect(notePitchClass(note('A'))).toBe(9)
    expect(notePitchClass(note('B'))).toBe(11)
  })

  it('accidentals shift pitch correctly', () => {
    expect(notePitchClass(note('C',  1))).toBe(1)   // C#
    expect(notePitchClass(note('D', -1))).toBe(1)   // Db — enharmonic to C#
    expect(notePitchClass(note('B', -1))).toBe(10)  // Bb
    expect(notePitchClass(note('C', -1))).toBe(11)  // Cb — enharmonic to B
    expect(notePitchClass(note('B',  1))).toBe(0)   // B# — enharmonic to C
    expect(notePitchClass(note('F', -1))).toBe(4)   // Fb — enharmonic to E
    expect(notePitchClass(note('C', -2))).toBe(10)  // Cbb
    expect(notePitchClass(note('B',  2))).toBe(1)   // B##
  })
})

describe('noteToMidi', () => {
  it('middle C is MIDI 60', () => {
    expect(noteToMidi(note('C'), 4)).toBe(60)
  })
  it('A4 is MIDI 69', () => {
    expect(noteToMidi(note('A'), 4)).toBe(69)
  })
  it('C5 is MIDI 72', () => {
    expect(noteToMidi(note('C'), 5)).toBe(72)
  })
  it('accidentals shift MIDI value', () => {
    expect(noteToMidi(note('C',  1), 4)).toBe(61)  // C#4
    expect(noteToMidi(note('B', -1), 4)).toBe(70)  // Bb4
    expect(noteToMidi(note('E', -1), 4)).toBe(63)  // Eb4
  })
})

describe('noteDisplay', () => {
  it('formats all accidental levels', () => {
    expect(noteDisplay(note('C',  0))).toBe('C')
    expect(noteDisplay(note('C',  1))).toBe('C#')
    expect(noteDisplay(note('C', -1))).toBe('Cb')
    expect(noteDisplay(note('C',  2))).toBe('C##')
    expect(noteDisplay(note('C', -2))).toBe('Cbb')
  })
  it('works for common accidentals', () => {
    expect(noteDisplay(note('B', -1))).toBe('Bb')
    expect(noteDisplay(note('F',  1))).toBe('F#')
    expect(noteDisplay(note('E', -1))).toBe('Eb')
    expect(noteDisplay(note('A', -1))).toBe('Ab')
  })
})

describe('noteAbove', () => {
  it('major 3rd — 2 letter steps, 4 semitones', () => {
    expect(noteDisplay(noteAbove(note('C'),       2, 4))).toBe('E')
    expect(noteDisplay(noteAbove(note('F'),       2, 4))).toBe('A')
    expect(noteDisplay(noteAbove(note('G'),       2, 4))).toBe('B')
    expect(noteDisplay(noteAbove(note('F', 1),    2, 4))).toBe('A#')  // F# → A#
    expect(noteDisplay(noteAbove(note('B', -1),   2, 4))).toBe('D')   // Bb → D
    expect(noteDisplay(noteAbove(note('G', -1),   2, 4))).toBe('Bb')  // Gb → Bb
    expect(noteDisplay(noteAbove(note('A', -1),   2, 4))).toBe('C')   // Ab → C
  })

  it('minor 3rd — 2 letter steps, 3 semitones', () => {
    expect(noteDisplay(noteAbove(note('D'),       2, 3))).toBe('F')
    expect(noteDisplay(noteAbove(note('G', -1),   2, 3))).toBe('Bbb') // Gb → Bbb
    expect(noteDisplay(noteAbove(note('A', -1),   2, 3))).toBe('Cb')  // Ab → Cb
    expect(noteDisplay(noteAbove(note('B'),        2, 3))).toBe('D')   // B  → D
  })

  it('perfect 5th — 4 letter steps, 7 semitones', () => {
    expect(noteDisplay(noteAbove(note('C'),       4, 7))).toBe('G')
    expect(noteDisplay(noteAbove(note('F',  1),   4, 7))).toBe('C#')  // F# → C#
    expect(noteDisplay(noteAbove(note('G', -1),   4, 7))).toBe('Db')  // Gb → Db
    expect(noteDisplay(noteAbove(note('B', -1),   4, 7))).toBe('F')   // Bb → F
  })

  it('augmented 5th — 4 letter steps, 8 semitones', () => {
    expect(noteDisplay(noteAbove(note('C'),       4, 8))).toBe('G#')
    expect(noteDisplay(noteAbove(note('A', -1),   4, 8))).toBe('E')   // Ab → E
  })

  it('minor 7th — 6 letter steps, 10 semitones', () => {
    expect(noteDisplay(noteAbove(note('C'),       6, 10))).toBe('Bb')
    expect(noteDisplay(noteAbove(note('G'),       6, 10))).toBe('F')
    expect(noteDisplay(noteAbove(note('F',  1),   6, 10))).toBe('E')  // F# → E
  })

  it('diminished 7th — 6 letter steps, 9 semitones', () => {
    expect(noteDisplay(noteAbove(note('C'),       6, 9))).toBe('Bbb')
    expect(noteDisplay(noteAbove(note('B'),        6, 9))).toBe('Ab')
    expect(noteDisplay(noteAbove(note('F',  1),   6, 9))).toBe('Eb')
    expect(noteDisplay(noteAbove(note('A', -1),   6, 9))).toBe('Gbb')
  })
})

describe('noteEquals', () => {
  it('same letter and alteration', () => {
    expect(noteEquals(note('C'), note('C'))).toBe(true)
    expect(noteEquals(note('C', 1), note('C', 1))).toBe(true)
    expect(noteEquals(note('C', 1), note('C', -1))).toBe(false)
    expect(noteEquals(note('C'), note('D'))).toBe(false)
  })
})

describe('enharmonic', () => {
  it('enharmonic pairs', () => {
    expect(enharmonic(note('F', 1),  note('G', -1))).toBe(true)  // F# = Gb
    expect(enharmonic(note('B'),      note('C', -1))).toBe(true)  // B  = Cb
    expect(enharmonic(note('C',  1),  note('D', -1))).toBe(true)  // C# = Db
    expect(enharmonic(note('E'),      note('F', -1))).toBe(true)  // E  = Fb
    expect(enharmonic(note('B',  1),  note('C'))).toBe(true)      // B# = C
  })
  it('non-enharmonic notes', () => {
    expect(enharmonic(note('C'), note('D'))).toBe(false)
    expect(enharmonic(note('F', 1), note('F'))).toBe(false)
  })
})
