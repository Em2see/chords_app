import { type Page } from '@playwright/test'

// Default settings object matching Settings interface defaults
export const DEFAULT_SETTINGS = {
  chordType: 'maj',
  progressionMode: 'fifths',
  keyRootPc: 0,
  seam: 'sharp',
  showChain: true,
  hintLevel: 1,
  hintDelay: 3,
  inversionMode: 'all',
  accidentalFilter: 'both',
  bpm: 80,
  beatsPerChord: 4,
  autoAdvance: false,
  playSound: true,
}

// Load a page with clean localStorage (default settings)
export async function gotoClean(page: Page, path = '/'): Promise<void> {
  await page.addInitScript(() => localStorage.clear())
  await page.goto(path)
  // Wait for app to render first chord
  await page.waitForSelector('#chord-current')
}

// Load page with specific settings pre-set
export async function gotoWith(
  page: Page,
  overrides: Partial<typeof DEFAULT_SETTINGS>,
  path = '/',
): Promise<void> {
  const settings = { ...DEFAULT_SETTINGS, ...overrides }
  await page.addInitScript((s) => {
    localStorage.setItem('chord-trainer-v1', JSON.stringify(s))
  }, settings)
  await page.goto(path)
  await page.waitForSelector('#chord-current')
}

export const SEL = {
  chord:     '#chord-current',
  inv:       '#chord-inv',
  next:      '#chord-next',
  chain:     '#chain',
  kbd:       '#kbd',
  btnNext:   '#btn-next',
  btnHint:   '#btn-hint',
  btnSet:    '#btn-set',
  btnClose:  '#btn-set-close',
  btnDone:   '#btn-set-done',
  btnReset:  '#btn-reset',
  btnMetro:  '#btn-metro',
  btnBpmDec: '#btn-bpm-dec',
  btnBpmInc: '#btn-bpm-inc',
  bpmVal:    '#bpm-val',
  btnAuto:   '#btn-auto',
  btnMic:    '#btn-mic',
  btnTheme:  '#btn-theme',
  btnFs:     '#btn-fs',
  btnKbd:    '#btn-kbd-toggle',
  panel:     '#set-panel',
  selMode:   '#sel-mode',
  selType:   '#sel-type',
  selHint:   '#sel-hint',
  selBpc:    '#sel-bpc',
  selInv:    '#sel-inv',
  selAcc:    '#sel-acc',
  chkAuto:   '#chk-auto',
  chkSound:  '#chk-sound',
  chkChain:  '#chk-chain',
  sessionCnt:'#session-count',
  micLegend: '#mic-legend',
  beatDots:  '.beat-dot',
}
