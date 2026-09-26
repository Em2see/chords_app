import { describe, it, expect } from 'vitest'
import {
  buildChord, chordDisplay, CHORD_TYPES, TRIAD_TYPES, SEVENTH_TYPES, CHORD_SEMITONES,
} from '../../src/theory/chords'
import { note, notePitchClass, noteDisplay, type Note } from '../../src/theory/notes'

// All 12 chromatic roots (circle of fifths ordering)
const ALL_12_ROOTS: Note[] = [
  note('C'),
  note('G'),       note('D'),       note('A'),
  note('E'),       note('B'),       note('F', 1),   // F#
  note('D', -1),   note('A', -1),   note('E', -1),
  note('B', -1),   note('F'),
]

describe('chord size', () => {
  it('triads have 3 notes', () => {
    for (const type of TRIAD_TYPES) {
      expect(buildChord(note('C'), type).notes).toHaveLength(3)
    }
  })
  it('seventh chords have 4 notes', () => {
    for (const type of SEVENTH_TYPES) {
      expect(buildChord(note('C'), type).notes).toHaveLength(4)
    }
  })
})

describe('pitch-class correctness — all chord types × 12 roots', () => {
  for (const type of CHORD_TYPES) {
    it(`${type}`, () => {
      const expected = CHORD_SEMITONES[type]
      for (const root of ALL_12_ROOTS) {
        const chord = buildChord(root, type)
        const rootPitch = notePitchClass(root)
        const actual = chord.notes.map(n => (notePitchClass(n) - rootPitch + 12) % 12)
        expect(actual).toEqual(expected)
      }
    })
  }
})

describe('theoretically correct spelling', () => {
  it('Cdim7 = C Eb Gb Bbb', () => {
    expect(buildChord(note('C'), 'dim7').notes.map(noteDisplay))
      .toEqual(['C', 'Eb', 'Gb', 'Bbb'])
  })
  it('Caug = C E G#', () => {
    expect(buildChord(note('C'), 'aug').notes.map(noteDisplay))
      .toEqual(['C', 'E', 'G#'])
  })
  it('C7 = C E G Bb', () => {
    expect(buildChord(note('C'), '7').notes.map(noteDisplay))
      .toEqual(['C', 'E', 'G', 'Bb'])
  })
  it('Cmaj7 = C E G B', () => {
    expect(buildChord(note('C'), 'maj7').notes.map(noteDisplay))
      .toEqual(['C', 'E', 'G', 'B'])
  })
  it('Cm7b5 = C Eb Gb Bb', () => {
    expect(buildChord(note('C'), 'm7b5').notes.map(noteDisplay))
      .toEqual(['C', 'Eb', 'Gb', 'Bb'])
  })
  it('F#maj = F# A# C#', () => {
    expect(buildChord(note('F', 1), 'maj').notes.map(noteDisplay))
      .toEqual(['F#', 'A#', 'C#'])
  })
  it('Gbmaj = Gb Bb Db', () => {
    expect(buildChord(note('G', -1), 'maj').notes.map(noteDisplay))
      .toEqual(['Gb', 'Bb', 'Db'])
  })
  it('Bbmin = Bb Db F', () => {
    expect(buildChord(note('B', -1), 'min').notes.map(noteDisplay))
      .toEqual(['Bb', 'Db', 'F'])
  })
  it('Abdim7 = Ab Cb Ebb Gbb', () => {
    expect(buildChord(note('A', -1), 'dim7').notes.map(noteDisplay))
      .toEqual(['Ab', 'Cb', 'Ebb', 'Gbb'])
  })
  it('Dm7b5 = D F Ab C', () => {
    expect(buildChord(note('D'), 'm7b5').notes.map(noteDisplay))
      .toEqual(['D', 'F', 'Ab', 'C'])
  })
  it('F#dim7 = F# A C Eb', () => {
    expect(buildChord(note('F', 1), 'dim7').notes.map(noteDisplay))
      .toEqual(['F#', 'A', 'C', 'Eb'])
  })
  it('Gbdim = Gb Bbb Dbb', () => {
    expect(buildChord(note('G', -1), 'dim').notes.map(noteDisplay))
      .toEqual(['Gb', 'Bbb', 'Dbb'])
  })
  it('Bsus4 = B E F#', () => {
    expect(buildChord(note('B'), 'sus4').notes.map(noteDisplay))
      .toEqual(['B', 'E', 'F#'])
  })
  it('Gbsus2 = Gb Ab Db', () => {
    expect(buildChord(note('G', -1), 'sus2').notes.map(noteDisplay))
      .toEqual(['Gb', 'Ab', 'Db'])
  })
})

describe('chordDisplay', () => {
  it('major chord shows root only', () => {
    expect(chordDisplay(buildChord(note('C'), 'maj'))).toBe('C')
    expect(chordDisplay(buildChord(note('F', 1), 'maj'))).toBe('F#')
  })
  it('uses correct suffixes', () => {
    expect(chordDisplay(buildChord(note('C'), 'min'))).toBe('Cm')
    expect(chordDisplay(buildChord(note('C'), 'dim'))).toBe('C°')
    expect(chordDisplay(buildChord(note('C'), 'aug'))).toBe('C+')
    expect(chordDisplay(buildChord(note('C'), 'dim7'))).toBe('C°7')
    expect(chordDisplay(buildChord(note('C'), 'maj7'))).toBe('CΔ7')
    expect(chordDisplay(buildChord(note('C'), '7'))).toBe('C7')
    expect(chordDisplay(buildChord(note('G', -1), 'm7'))).toBe('Gbm7')
    expect(chordDisplay(buildChord(note('F',  1), 'maj7'))).toBe('F#Δ7')
  })
})
