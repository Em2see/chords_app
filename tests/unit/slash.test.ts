import { describe, it, expect } from 'vitest'
import { parseSlashChord, analyzeSlash, descendingBassLine } from '../../src/theory/slash'
import { note, noteDisplay, notePitchClass } from '../../src/theory/notes'
import { buildChord } from '../../src/theory/chords'
import { leadVoice, LEFT_HAND_DEFAULT } from '../../src/theory/voicing'

// ---- parseSlashChord ----

describe('parseSlashChord — valid inputs', () => {
  it('C/E → C major, E bass', () => {
    const s = parseSlashChord('C/E')!
    expect(noteDisplay(s.chord.root)).toBe('C')
    expect(s.chord.type).toBe('maj')
    expect(noteDisplay(s.bass)).toBe('E')
  })

  it('C/G → C major, G bass', () => {
    const s = parseSlashChord('C/G')!
    expect(s.chord.type).toBe('maj')
    expect(noteDisplay(s.bass)).toBe('G')
  })

  it('Am/G → A minor, G bass', () => {
    const s = parseSlashChord('Am/G')!
    expect(noteDisplay(s.chord.root)).toBe('A')
    expect(s.chord.type).toBe('min')
    expect(noteDisplay(s.bass)).toBe('G')
  })

  it('Gbm/Db → Gb minor, Db bass', () => {
    const s = parseSlashChord('Gbm/Db')!
    expect(noteDisplay(s.chord.root)).toBe('Gb')
    expect(s.chord.type).toBe('min')
    expect(noteDisplay(s.bass)).toBe('Db')
  })

  it('F#m7b5/A → F# half-dim, A bass', () => {
    const s = parseSlashChord('F#m7b5/A')!
    expect(noteDisplay(s.chord.root)).toBe('F#')
    expect(s.chord.type).toBe('m7b5')
    expect(noteDisplay(s.bass)).toBe('A')
  })

  it('Bbmaj7/F → Bb major 7, F bass', () => {
    const s = parseSlashChord('Bbmaj7/F')!
    expect(noteDisplay(s.chord.root)).toBe('Bb')
    expect(s.chord.type).toBe('maj7')
    expect(noteDisplay(s.bass)).toBe('F')
  })

  it('Cdim7/A → C dim7, A bass', () => {
    const s = parseSlashChord('Cdim7/A')!
    expect(s.chord.type).toBe('dim7')
    expect(noteDisplay(s.bass)).toBe('A')
  })

  it('D#/C## → D# major, C## bass', () => {
    const s = parseSlashChord('D#/C##')!
    expect(noteDisplay(s.chord.root)).toBe('D#')
    expect(noteDisplay(s.bass)).toBe('C##')
  })

  it('Bbm/Dbb → Bb minor, Dbb bass', () => {
    const s = parseSlashChord('Bbm/Dbb')!
    expect(noteDisplay(s.chord.root)).toBe('Bb')
    expect(s.chord.type).toBe('min')
    expect(noteDisplay(s.bass)).toBe('Dbb')
  })

  it('chord notes are correctly built', () => {
    const s = parseSlashChord('C/E')!
    const pcs = s.chord.notes.map(n => notePitchClass(n))
    expect(pcs).toEqual([0, 4, 7])  // C E G
  })
})

describe('parseSlashChord — invalid inputs', () => {
  it('empty string → null', () => expect(parseSlashChord('')).toBeNull())
  it('no slash → null', () => expect(parseSlashChord('C')).toBeNull())
  it('leading slash → null', () => expect(parseSlashChord('/C')).toBeNull())
  it('invalid chord letter → null', () => expect(parseSlashChord('X/C')).toBeNull())
  it('invalid bass letter → null', () => expect(parseSlashChord('C/X')).toBeNull())
  it('unknown suffix → null', () => expect(parseSlashChord('Cmaj9/E')).toBeNull())
})

// ---- analyzeSlash — inversions ----

describe('analyzeSlash — inversions', () => {
  it('C/C → root position inversion (index 0)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('C') })
    expect(a.kind).toBe('inversion')
    expect(a.inversionIndex).toBe(0)
  })

  it('C/E → 1st inversion (index 1)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('E') })
    expect(a.kind).toBe('inversion')
    expect(a.inversionIndex).toBe(1)
  })

  it('C/G → 2nd inversion (index 2)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('G') })
    expect(a.kind).toBe('inversion')
    expect(a.inversionIndex).toBe(2)
  })

  it('Gbm/Db → Db is in Gbm (index 2)', () => {
    // Gbm = Gb Bbb Db — Db pitch class 1 matches
    const a = analyzeSlash({ chord: buildChord(note('G', -1), 'min'), bass: note('D', -1) })
    expect(a.kind).toBe('inversion')
    expect(a.inversionIndex).toBe(2)
  })

  it('Cmaj7/B → B is in the chord (7th, index 3)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj7'), bass: note('B') })
    expect(a.kind).toBe('inversion')
    expect(a.inversionIndex).toBe(3)
  })
})

// ---- analyzeSlash — seventh ----

describe('analyzeSlash — seventh (adds 7th to form 7-chord)', () => {
  it('C/B → major 7th in bass (11 semitones above C)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('B') })
    expect(a.kind).toBe('seventh')
  })

  it('C/Bb → minor 7th in bass (10 semitones above C)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('B', -1) })
    expect(a.kind).toBe('seventh')
  })

  it('Am/G → G is 10 semitones above A (forms Am7)', () => {
    const a = analyzeSlash({ chord: buildChord(note('A'), 'min'), bass: note('G') })
    expect(a.kind).toBe('seventh')
  })

  it('F/E → E is 11 semitones above F (forms Fmaj7)', () => {
    const a = analyzeSlash({ chord: buildChord(note('F'), 'maj'), bass: note('E') })
    expect(a.kind).toBe('seventh')
  })

  it('Db/C → C is 11 semitones above Db (forms Dbmaj7)', () => {
    const a = analyzeSlash({ chord: buildChord(note('D', -1), 'maj'), bass: note('C') })
    expect(a.kind).toBe('seventh')
  })
})

// ---- analyzeSlash — foreign ----

describe('analyzeSlash — foreign bass', () => {
  it('C/D → D is foreign (major 2nd above C)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('D') })
    expect(a.kind).toBe('foreign')
  })

  it('C/F → F is foreign (perfect 4th above C)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('F') })
    expect(a.kind).toBe('foreign')
  })

  it('C/Ab → Ab is foreign (minor 6th above C)', () => {
    const a = analyzeSlash({ chord: buildChord(note('C'), 'maj'), bass: note('A', -1) })
    expect(a.kind).toBe('foreign')
  })

  it('Dm/F# → F# is foreign to D minor (tritone)', () => {
    const a = analyzeSlash({ chord: buildChord(note('D'), 'min'), bass: note('F', 1) })
    expect(a.kind).toBe('foreign')
  })
})

// ---- descendingBassLine ----

describe('descendingBassLine — C major', () => {
  const line = descendingBassLine(note('C'))

  it('returns 9 chords', () => {
    expect(line).toHaveLength(9)
  })

  it('first and last chord are the same (I → I)', () => {
    expect(notePitchClass(line[0]!.chord.root)).toBe(notePitchClass(line[8]!.chord.root))
    expect(notePitchClass(line[0]!.bass)).toBe(notePitchClass(line[8]!.bass))
  })

  it('entry [0] = C/C (root position)', () => {
    const { kind, inversionIndex } = analyzeSlash(line[0]!)
    expect(kind).toBe('inversion')
    expect(inversionIndex).toBe(0)
  })

  it('entry [1] = C/B (adds major 7th)', () => {
    expect(analyzeSlash(line[1]!).kind).toBe('seventh')
    expect(noteDisplay(line[1]!.bass)).toBe('B')
  })

  it('entry [2] = Am (vi, root position)', () => {
    expect(analyzeSlash(line[2]!).kind).toBe('inversion')
    expect(noteDisplay(line[2]!.chord.root)).toBe('A')
    expect(line[2]!.chord.type).toBe('min')
  })

  it('entry [3] = Am/G (adds minor 7th)', () => {
    expect(analyzeSlash(line[3]!).kind).toBe('seventh')
    expect(noteDisplay(line[3]!.bass)).toBe('G')
  })

  it('entry [5] = F/E (adds major 7th)', () => {
    expect(analyzeSlash(line[5]!).kind).toBe('seventh')
    expect(noteDisplay(line[5]!.bass)).toBe('E')
  })

  it('entry [7] = G (V, root position)', () => {
    const { kind } = analyzeSlash(line[7]!)
    expect(kind).toBe('inversion')
    expect(noteDisplay(line[7]!.chord.root)).toBe('G')
  })

  it('entries [1,3,5] are seventh; [0,2,4,6,7,8] are inversions', () => {
    const kinds = line.map(s => analyzeSlash(s).kind)
    expect(kinds).toEqual([
      'inversion', 'seventh', 'inversion', 'seventh',
      'inversion', 'seventh', 'inversion', 'inversion', 'inversion',
    ])
  })
})

describe('descendingBassLine — all 12 major keys', () => {
  const keys = [
    note('C'), note('G'), note('D'), note('A'), note('E'), note('B'),
    note('F', 1), note('D', -1), note('A', -1), note('E', -1), note('B', -1), note('F'),
  ]

  it('always returns 9 chords', () => {
    for (const k of keys) {
      expect(descendingBassLine(k)).toHaveLength(9)
    }
  })

  it('all upper-structure chords are major or minor triads', () => {
    for (const k of keys) {
      for (const s of descendingBassLine(k)) {
        expect(['maj', 'min']).toContain(s.chord.type)
      }
    }
  })

  it('entries [1,3,5] are always seventh type', () => {
    for (const k of keys) {
      const line = descendingBassLine(k)
      for (const idx of [1, 3, 5]) {
        expect(analyzeSlash(line[idx]!).kind).toBe('seventh')
      }
    }
  })
})

// ---- leadVoice with bass override ----

describe('leadVoice bass override for slash chords', () => {
  it('C/E: left hand plays E (not C)', () => {
    const chord = buildChord(note('C'), 'maj')
    const v = leadVoice(chord, null, { bass: note('E') })
    const pc = v.left % 12
    expect(pc).toBe(4)  // E pitch class
  })

  it('C/B: left hand plays B in C2–B3 range', () => {
    const chord = buildChord(note('C'), 'maj')
    const v = leadVoice(chord, null, { bass: note('B') })
    expect(v.left).toBeGreaterThanOrEqual(LEFT_HAND_DEFAULT.min)
    expect(v.left).toBeLessThanOrEqual(LEFT_HAND_DEFAULT.max)
    expect(v.left % 12).toBe(11)  // B pitch class
  })

  it('all descending-bass-line left-hand notes stay within range', () => {
    for (const s of descendingBassLine(note('C'))) {
      const v = leadVoice(s.chord, null, { bass: s.bass })
      expect(v.left).toBeGreaterThanOrEqual(LEFT_HAND_DEFAULT.min)
      expect(v.left).toBeLessThanOrEqual(LEFT_HAND_DEFAULT.max)
    }
  })
})
