// SVG piano keyboard renderer

const WW = 36   // white key width (SVG units)
const WH = 130  // white key height
const BW = 22   // black key width
const BH = 80   // black key height

// pitch class → is black key
const IS_BLACK = [false,true,false,true,false,false,true,false,true,false,true,false]

// white key index within octave (0–6) for white pitch classes
const WHITE_IDX: Readonly<Record<number, number>> = { 0:0, 2:1, 4:2, 5:3, 7:4, 9:5, 11:6 }

// black key position as fraction of white key units within the octave
const BLACK_FRAC: Readonly<Record<number, number>> = { 1:0.63, 3:1.63, 6:3.63, 8:4.63, 10:5.63 }

export type HandSide = 'right' | 'left'

export interface KeyHighlight {
  midi: number
  hand: HandSide
  label?: string    // e.g. '↑2', '↓1'
  matched?: boolean // mic confirmed this note → green
}

export function renderKeyboard(
  highlights: readonly KeyHighlight[],
  startOctave = 2,
  numOctaves = 4,
): string {
  const totalWhite = numOctaves * 7
  const vw = totalWhite * WW

  const hlMap = new Map<number, KeyHighlight>()
  for (const h of highlights) hlMap.set(h.midi, h)

  const whites: string[] = []
  const blacks: string[] = []

  for (let oi = 0; oi < numOctaves; oi++) {
    const oct = startOctave + oi
    for (let pc = 0; pc < 12; pc++) {
      const midi = (oct + 1) * 12 + pc
      const hl = hlMap.get(midi)

      if (!IS_BLACK[pc]) {
        const wi = WHITE_IDX[pc]!
        const x = (oi * 7 + wi) * WW
        const fill = hl
          ? hl.matched ? 'var(--accent-matched)' : `var(--accent-${hl.hand})`
          : 'var(--key-white)'
        const txtFill = hl ? '#fff' : 'var(--key-label)'

        whites.push(
          `<rect x="${x}" y="0" width="${WW - 1}" height="${WH}" fill="${fill}" stroke="var(--key-border)" stroke-width="1" rx="2"/>`,
        )
        // Octave label on C keys
        if (pc === 0) {
          whites.push(
            `<text x="${x + WW / 2}" y="${WH - 7}" text-anchor="middle" font-size="10" fill="${txtFill}" font-family="system-ui,sans-serif">C${oct}</text>`,
          )
        }
        // Voice-movement arrow
        if (hl?.label) {
          whites.push(
            `<text x="${x + WW / 2}" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff" font-family="system-ui,sans-serif">${hl.label}</text>`,
          )
        }
      } else {
        const frac = BLACK_FRAC[pc]!
        const x = (oi * 7 + frac) * WW - BW / 2
        const fill = hl
          ? hl.matched ? 'var(--accent-matched)' : `var(--accent-${hl.hand})`
          : 'var(--key-black)'

        blacks.push(
          `<rect x="${x.toFixed(1)}" y="0" width="${BW}" height="${BH}" fill="${fill}" rx="2"/>`,
        )
        if (hl?.label) {
          blacks.push(
            `<text x="${(x + BW / 2).toFixed(1)}" y="20" text-anchor="middle" font-size="11" font-weight="bold" fill="#fff" font-family="system-ui,sans-serif">${hl.label}</text>`,
          )
        }
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${WH}" width="100%" role="img" aria-label="Клавиатура пианино">`,
    ...whites,
    ...blacks,
    `</svg>`,
  ].join('')
}
