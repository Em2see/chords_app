import { type Note, noteAbove, noteDisplay } from './notes'

export type ChordType =
  | 'maj' | 'min' | 'dim' | 'aug'
  | 'sus2' | 'sus4'
  | 'maj7' | '7' | 'm7' | 'm7b5' | 'dim7'

interface IntervalSpec {
  letters: number
  semitones: number
}

// Diatonic intervals for each chord degree above root.
// letters = letter steps (determines the note name), semitones = target pitch distance.
const CHORD_INTERVALS: Readonly<Record<ChordType, readonly IntervalSpec[]>> = {
  maj:  [{ letters: 2, semitones: 4  }, { letters: 4, semitones: 7  }],
  min:  [{ letters: 2, semitones: 3  }, { letters: 4, semitones: 7  }],
  dim:  [{ letters: 2, semitones: 3  }, { letters: 4, semitones: 6  }],
  aug:  [{ letters: 2, semitones: 4  }, { letters: 4, semitones: 8  }],
  sus2: [{ letters: 1, semitones: 2  }, { letters: 4, semitones: 7  }],
  sus4: [{ letters: 3, semitones: 5  }, { letters: 4, semitones: 7  }],
  maj7: [{ letters: 2, semitones: 4  }, { letters: 4, semitones: 7  }, { letters: 6, semitones: 11 }],
  '7':  [{ letters: 2, semitones: 4  }, { letters: 4, semitones: 7  }, { letters: 6, semitones: 10 }],
  m7:   [{ letters: 2, semitones: 3  }, { letters: 4, semitones: 7  }, { letters: 6, semitones: 10 }],
  m7b5: [{ letters: 2, semitones: 3  }, { letters: 4, semitones: 6  }, { letters: 6, semitones: 10 }],
  dim7: [{ letters: 2, semitones: 3  }, { letters: 4, semitones: 6  }, { letters: 6, semitones: 9  }],
}

// Semitone intervals above root for each chord type (for verification / UI).
export const CHORD_SEMITONES: Readonly<Record<ChordType, readonly number[]>> = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  dim:  [0, 3, 6],
  aug:  [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  '7':  [0, 4, 7, 10],
  m7:   [0, 3, 7, 10],
  m7b5: [0, 3, 6, 10],
  dim7: [0, 3, 6, 9],
}

export interface Chord {
  readonly root: Note
  readonly type: ChordType
  readonly notes: readonly Note[]
}

export function buildChord(root: Note, type: ChordType): Chord {
  const notes: Note[] = [
    root,
    ...CHORD_INTERVALS[type].map(i => noteAbove(root, i.letters, i.semitones)),
  ]
  return { root, type, notes }
}

const CHORD_SUFFIX: Readonly<Record<ChordType, string>> = {
  maj: '', min: 'm', dim: '°', aug: '+',
  sus2: 'sus2', sus4: 'sus4',
  maj7: 'Δ7', '7': '7', m7: 'm7', m7b5: 'ø7', dim7: '°7',
}

export function chordDisplay(chord: Chord): string {
  return noteDisplay(chord.root) + CHORD_SUFFIX[chord.type]
}

export const CHORD_TYPES: readonly ChordType[] = [
  'maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', '7', 'm7', 'm7b5', 'dim7',
]

export const TRIAD_TYPES: readonly ChordType[] = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']
export const SEVENTH_TYPES: readonly ChordType[] = ['maj7', '7', 'm7', 'm7b5', 'dim7']
