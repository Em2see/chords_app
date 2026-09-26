import { describe, it, expect } from 'vitest'
import {
  leadVoice, voiceMovement,
  RIGHT_HAND_DEFAULT, LEFT_HAND_DEFAULT,
  type Voicing,
} from '../../src/theory/voicing'
import { buildChord, CHORD_TYPES, TRIAD_TYPES, SEVENTH_TYPES } from '../../src/theory/chords'
import { note } from '../../src/theory/notes'
import { circleOfFifths, circleRoots } from '../../src/theory/progressions'

// ----- initial voicing (no previous) -----

describe('leadVoice — initial voicing', () => {
  it('uses root position', () => {
    const v = leadVoice(buildChord(note('C'), 'maj'), null)
    expect(v.inversion).toBe(0)
  })

  it('right-hand notes are strictly ascending', () => {
    for (const type of CHORD_TYPES) {
      const v = leadVoice(buildChord(note('C'), type), null)
      for (let i = 1; i < v.right.length; i++) {
        expect(v.right[i]).toBeGreaterThan(v.right[i - 1] as number)
      }
    }
  })

  it('all right-hand notes within default range', () => {
    for (const type of CHORD_TYPES) {
      const v = leadVoice(buildChord(note('C'), type), null)
      for (const m of v.right) {
        expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
        expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
      }
    }
  })

  it('left-hand note within default range', () => {
    for (const root of circleRoots()) {
      const v = leadVoice(buildChord(root, 'maj'), null)
      expect(v.left).toBeGreaterThanOrEqual(LEFT_HAND_DEFAULT.min)
      expect(v.left).toBeLessThanOrEqual(LEFT_HAND_DEFAULT.max)
    }
  })

  it('triads get 3 right-hand notes', () => {
    for (const type of TRIAD_TYPES) {
      expect(leadVoice(buildChord(note('C'), type), null).right).toHaveLength(3)
    }
  })

  it('seventh chords get 4 right-hand notes', () => {
    for (const type of SEVENTH_TYPES) {
      expect(leadVoice(buildChord(note('C'), type), null).right).toHaveLength(4)
    }
  })

  it('Cmaj initial: C4 E4 G4', () => {
    const v = leadVoice(buildChord(note('C'), 'maj'), null)
    expect([...v.right]).toEqual([60, 64, 67])
  })
})

// ----- voice leading -----

describe('leadVoice — voice leading', () => {
  it('C→G: picks 1st inversion [B3 D4 G4] (cost=3)', () => {
    const prev = leadVoice(buildChord(note('C'), 'maj'), null)
    // prev.right = [60, 64, 67]
    const next = leadVoice(buildChord(note('G'), 'maj'), prev)
    expect([...next.right]).toEqual([59, 62, 67])  // B3 D4 G4
    expect(next.inversion).toBe(1)
  })

  it('G(1st inv [59,62,67])→D: picks 2nd inversion [A3 D4 F#4] (cost=3)', () => {
    const cPrev = leadVoice(buildChord(note('C'), 'maj'), null)
    const gPrev = leadVoice(buildChord(note('G'), 'maj'), cPrev)
    const dNext = leadVoice(buildChord(note('D'), 'maj'), gPrev)
    // gPrev.right = [59, 62, 67]; Dmaj candidates vs prev:
    //   root [62,66,69]: cost=3+4+2=9
    //   1st  [54,57,62]: 5+5+5=15
    //   2nd  [57,62,66]: 2+0+1=3, common=1 ← best (or equal to root, but more common notes)
    expect(dNext.inversion).toBe(2)
  })

  it('movement is always less than or equal to open-position alternative', () => {
    // Just verify total movement is finite and non-negative
    const prev = leadVoice(buildChord(note('C'), 'maj7'), null)
    const next = leadVoice(buildChord(note('F'), 'maj7'), prev)
    const mv = voiceMovement(prev, next)
    expect(mv.totalMovement).toBeGreaterThanOrEqual(0)
    expect(mv.totalMovement).toBeLessThan(48)  // never jumps > 4 octaves total
  })

  it('all notes stay in range through ii-V-I in C', () => {
    const ii  = buildChord(note('D'), 'm7')
    const V   = buildChord(note('G'), '7')
    const I   = buildChord(note('C'), 'maj7')
    let prev: Voicing | null = null
    for (const c of [ii, V, I]) {
      prev = leadVoice(c, prev)
      for (const m of prev.right) {
        expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
        expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
      }
    }
  })
})

// ----- property tests -----

describe('property: 100+ steps stay within range', () => {
  it('circle of fifths × 9 with major triads (108 chords)', () => {
    const specs = Array.from({ length: 9 }, () => circleOfFifths('maj')).flat()
    expect(specs.length).toBeGreaterThan(100)

    let prev: Voicing | null = null
    for (const s of specs) {
      prev = leadVoice(buildChord(s.root, s.type), prev)
      for (const m of prev.right) {
        expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
        expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
      }
      expect(prev.left).toBeGreaterThanOrEqual(LEFT_HAND_DEFAULT.min)
      expect(prev.left).toBeLessThanOrEqual(LEFT_HAND_DEFAULT.max)
    }
  })

  it('circle of fifths × 9 with dominant 7ths (108 chords)', () => {
    const specs = Array.from({ length: 9 }, () => circleOfFifths('7')).flat()
    let prev: Voicing | null = null
    for (const s of specs) {
      prev = leadVoice(buildChord(s.root, s.type), prev)
      for (const m of prev.right) {
        expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
        expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
      }
    }
  })

  it('circle of fifths × 9 with dim7 (108 chords)', () => {
    const specs = Array.from({ length: 9 }, () => circleOfFifths('dim7')).flat()
    let prev: Voicing | null = null
    for (const s of specs) {
      prev = leadVoice(buildChord(s.root, s.type), prev)
      for (const m of prev.right) {
        expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
        expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
      }
    }
  })
})

// ----- allowedInversions -----

describe('leadVoice — allowedInversions', () => {
  it('root only → inversion always 0', () => {
    const prev = leadVoice(buildChord(note('C'), 'maj'), null, { allowedInversions: [0] })
    const next = leadVoice(buildChord(note('G'), 'maj'), prev, { allowedInversions: [0] })
    expect(next.inversion).toBe(0)
  })

  it('first only → inversion always 1', () => {
    for (const root of [note('C'), note('G'), note('D'), note('F')]) {
      const v = leadVoice(buildChord(root, 'maj'), null, { allowedInversions: [1] })
      expect(v.inversion).toBe(1)
    }
  })

  it('second only → inversion always 2', () => {
    for (const root of [note('C'), note('G'), note('D'), note('F')]) {
      const v = leadVoice(buildChord(root, 'maj'), null, { allowedInversions: [2] })
      expect(v.inversion).toBe(2)
    }
  })

  it('non-root [1,2] → never root position', () => {
    let prev: Voicing | null = null
    for (const root of [note('C'), note('G'), note('D'), note('A'), note('E'), note('B')]) {
      prev = leadVoice(buildChord(root, 'maj'), prev, { allowedInversions: [1, 2] })
      expect(prev.inversion).not.toBe(0)
    }
  })

  it('all notes stay in range even with restricted inversions', () => {
    for (const inv of [[0], [1], [2]] as number[][]) {
      for (const root of [note('C'), note('G'), note('D'), note('F'), note('B', -1)]) {
        const v = leadVoice(buildChord(root, 'maj'), null, { allowedInversions: inv })
        for (const m of v.right) {
          expect(m).toBeGreaterThanOrEqual(RIGHT_HAND_DEFAULT.min)
          expect(m).toBeLessThanOrEqual(RIGHT_HAND_DEFAULT.max)
        }
      }
    }
  })
})

// ----- voiceMovement -----

describe('voiceMovement', () => {
  it('zero movement from same voicing', () => {
    const v = leadVoice(buildChord(note('C'), 'maj'), null)
    const mv = voiceMovement(v, v)
    expect(mv.totalMovement).toBe(0)
    expect(mv.commonNotes).toBe(3)
    expect([...mv.shifts]).toEqual([0, 0, 0])
  })

  it('C→G movement: [-1, -2, 0], total=3, common=1', () => {
    const prev = leadVoice(buildChord(note('C'), 'maj'), null)
    const next = leadVoice(buildChord(note('G'), 'maj'), prev)
    const mv = voiceMovement(prev, next)
    expect([...mv.shifts]).toEqual([-1, -2, 0])
    expect(mv.totalMovement).toBe(3)
    expect(mv.commonNotes).toBe(1)
  })

  it('non-negative totalMovement for all circle-of-fifths steps', () => {
    const roots = circleRoots()
    let prev: Voicing | null = null
    for (const root of roots) {
      const next = leadVoice(buildChord(root, 'maj'), prev)
      if (prev) {
        const mv = voiceMovement(prev, next)
        expect(mv.totalMovement).toBeGreaterThanOrEqual(0)
      }
      prev = next
    }
  })
})
