import { describe, it, expect } from 'vitest'
import {
  circleRoots, circleOfFifths, circleOfFourths,
  iiVIAllKeys, diatonicMajor,
  chromaticUp, chromaticDown, randomProgression,
} from '../../src/theory/progressions'
import { note, notePitchClass, noteDisplay } from '../../src/theory/notes'

// ----- circleRoots -----

describe('circleRoots', () => {
  it('returns 12 roots', () => {
    expect(circleRoots()).toHaveLength(12)
  })

  it('all 12 pitch classes are unique', () => {
    const pitches = circleRoots().map(notePitchClass)
    expect(new Set(pitches).size).toBe(12)
  })

  it('adjacent roots are a perfect 5th apart (7 semitones)', () => {
    const roots = circleRoots()
    for (let i = 0; i < 11; i++) {
      const interval = (notePitchClass(roots[i + 1]) - notePitchClass(roots[i]) + 12) % 12
      expect(interval).toBe(7)
    }
  })

  it('sharp seam uses F#', () => {
    expect(noteDisplay(circleRoots('sharp')[6])).toBe('F#')
  })

  it('flat seam uses Gb', () => {
    expect(noteDisplay(circleRoots('flat')[6])).toBe('Gb')
  })

  it('property: cycling 100+ times always yields valid pitch classes', () => {
    const roots = circleRoots()
    for (let i = 0; i < 120; i++) {
      const p = notePitchClass(roots[i % 12])
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThan(12)
    }
  })
})

// ----- circleOfFifths -----

describe('circleOfFifths', () => {
  it('has 12 entries', () => {
    expect(circleOfFifths('maj')).toHaveLength(12)
  })

  it('starts at C by default', () => {
    expect(noteDisplay(circleOfFifths('maj')[0].root)).toBe('C')
  })

  it('applies the requested chord type to every entry', () => {
    expect(circleOfFifths('dim7').every(s => s.type === 'dim7')).toBe(true)
  })

  it('rotates to a given start root', () => {
    const seq = circleOfFifths('maj', { startRoot: note('G') })
    expect(noteDisplay(seq[0].root)).toBe('G')
    expect(seq).toHaveLength(12)
    // still all unique pitch classes
    expect(new Set(seq.map(s => notePitchClass(s.root))).size).toBe(12)
  })

  it('order: C G D A E B F# Db Ab Eb Bb F', () => {
    const names = circleOfFifths('maj').map(s => noteDisplay(s.root))
    expect(names).toEqual(['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'])
  })
})

// ----- circleOfFourths -----

describe('circleOfFourths', () => {
  it('has 12 entries with all unique pitch classes', () => {
    const seq = circleOfFourths('maj')
    expect(seq).toHaveLength(12)
    expect(new Set(seq.map(s => notePitchClass(s.root))).size).toBe(12)
  })

  it('adjacent entries are a perfect 4th apart (5 semitones)', () => {
    const seq = circleOfFourths('maj')
    for (let i = 0; i < 11; i++) {
      const interval = (notePitchClass(seq[i + 1].root) - notePitchClass(seq[i].root) + 12) % 12
      expect(interval).toBe(5)
    }
  })

  it('starts at C by default', () => {
    expect(noteDisplay(circleOfFourths('min')[0].root)).toBe('C')
  })
})

// ----- iiVIAllKeys -----

describe('iiVIAllKeys', () => {
  it('returns 36 chords (12 keys × 3)', () => {
    expect(iiVIAllKeys()).toHaveLength(36)
  })

  it('chord types cycle as m7 / 7 / maj7', () => {
    const seq = iiVIAllKeys()
    for (let i = 0; i < 12; i++) {
      expect(seq[i * 3 + 0].type).toBe('m7')
      expect(seq[i * 3 + 1].type).toBe('7')
      expect(seq[i * 3 + 2].type).toBe('maj7')
    }
  })

  it('C major → Dm7 G7 Cmaj7', () => {
    const seq = iiVIAllKeys({ startRoot: note('C') })
    const names = seq.slice(0, 3).map(s => noteDisplay(s.root) + s.type)
    expect(names).toEqual(['Dm7', 'G7', 'Cmaj7'])
  })

  it('F major → Gm7 C7 Fmaj7', () => {
    const seq = iiVIAllKeys({ startRoot: note('F') })
    const names = seq.slice(0, 3).map(s => noteDisplay(s.root) + s.type)
    expect(names).toEqual(['Gm7', 'C7', 'Fmaj7'])
  })

  it('Db major → Ebm7 Ab7 Dbmaj7', () => {
    const seq = iiVIAllKeys({ startRoot: note('D', -1) })
    const names = seq.slice(0, 3).map(s => noteDisplay(s.root) + s.type)
    expect(names).toEqual(['Ebm7', 'Ab7', 'Dbmaj7'])
  })

  it('B major → C#m7 F#7 Bmaj7', () => {
    const seq = iiVIAllKeys({ startRoot: note('B') })
    const names = seq.slice(0, 3).map(s => noteDisplay(s.root) + s.type)
    expect(names).toEqual(['C#m7', 'F#7', 'Bmaj7'])
  })

  it('F# major → G#m7 C#7 F#maj7', () => {
    const seq = iiVIAllKeys({ startRoot: note('F', 1) })
    const names = seq.slice(0, 3).map(s => noteDisplay(s.root) + s.type)
    expect(names).toEqual(['G#m7', 'C#7', 'F#maj7'])
  })
})

// ----- diatonicMajor -----

describe('diatonicMajor', () => {
  it('returns 7 chords', () => {
    expect(diatonicMajor(note('C'))).toHaveLength(7)
  })

  it('C major: correct roots and types', () => {
    const chords = diatonicMajor(note('C'))
    expect(chords.map(s => noteDisplay(s.root))).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    expect(chords.map(s => s.type)).toEqual(['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'])
  })

  it('Db major: correct roots and types', () => {
    const chords = diatonicMajor(note('D', -1))
    expect(chords.map(s => noteDisplay(s.root))).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
    expect(chords.map(s => s.type)).toEqual(['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'])
  })

  it('F# major: correct roots (incl. E#)', () => {
    const chords = diatonicMajor(note('F', 1))
    expect(chords.map(s => noteDisplay(s.root))).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
    expect(chords.map(s => s.type)).toEqual(['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'])
  })

  it('G major: correct roots', () => {
    const chords = diatonicMajor(note('G'))
    expect(chords.map(s => noteDisplay(s.root))).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#'])
  })
})

// ----- chromaticUp / chromaticDown -----

describe('chromaticUp', () => {
  it('has 12 entries ascending by 1 semitone', () => {
    const seq = chromaticUp('maj')
    expect(seq).toHaveLength(12)
    for (let i = 0; i < 11; i++) {
      const step = (notePitchClass(seq[i + 1].root) - notePitchClass(seq[i].root) + 12) % 12
      expect(step).toBe(1)
    }
  })

  it('uses sharp spellings', () => {
    expect(chromaticUp('maj').map(s => noteDisplay(s.root))).toEqual([
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    ])
  })

  it('can start from a different root', () => {
    const seq = chromaticUp('maj', note('F', 1))
    expect(noteDisplay(seq[0].root)).toBe('F#')
    expect(seq).toHaveLength(12)
  })
})

describe('chromaticDown', () => {
  it('has 12 entries descending by 1 semitone', () => {
    const seq = chromaticDown('maj')
    expect(seq).toHaveLength(12)
    for (let i = 0; i < 11; i++) {
      const step = (notePitchClass(seq[i].root) - notePitchClass(seq[i + 1].root) + 12) % 12
      expect(step).toBe(1)
    }
  })

  it('uses flat spellings', () => {
    expect(chromaticDown('maj').map(s => noteDisplay(s.root))).toEqual([
      'C', 'B', 'Bb', 'A', 'Ab', 'G', 'Gb', 'F', 'E', 'Eb', 'D', 'Db',
    ])
  })
})

// ----- randomProgression -----

describe('randomProgression', () => {
  it('returns 12 entries with all unique pitch classes', () => {
    const seq = randomProgression('maj', 42)
    expect(seq).toHaveLength(12)
    expect(new Set(seq.map(s => notePitchClass(s.root))).size).toBe(12)
  })

  it('is deterministic with the same seed', () => {
    const a = randomProgression('min', 7).map(s => noteDisplay(s.root))
    const b = randomProgression('min', 7).map(s => noteDisplay(s.root))
    expect(a).toEqual(b)
  })

  it('different seeds produce different orderings', () => {
    const a = randomProgression('maj', 1).map(s => noteDisplay(s.root)).join()
    const b = randomProgression('maj', 2).map(s => noteDisplay(s.root)).join()
    expect(a).not.toBe(b)
  })

  it('applies the chord type to all entries', () => {
    expect(randomProgression('dim7', 0).every(s => s.type === 'dim7')).toBe(true)
  })
})
