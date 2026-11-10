import { test, expect } from '@playwright/test'

// Fixed settings for deterministic screenshots
const FIXED = JSON.stringify({
  chordType: 'maj', progressionMode: 'fifths', keyRootPc: 0, seam: 'sharp',
  showChain: true, hintLevel: 1, hintDelay: 3, inversionMode: 'all',
  accidentalFilter: 'both', bpm: 80, beatsPerChord: 4, autoAdvance: false, playSound: true,
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('chord-trainer-v1', s)
  }, FIXED)
})

test('main screen', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('#chord-current')
  // Let SVG keyboard render
  await page.waitForSelector('#kbd svg')
  await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' })
})

test('settings panel open', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('#kbd svg')
  await page.click('#btn-set')
  await page.waitForSelector('#sel-mode')
  await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' })
})

test('hint level 3 — no keyboard highlights', async ({ page }) => {
  await page.addInitScript((s) => {
    localStorage.setItem('chord-trainer-v1', JSON.stringify({ ...JSON.parse(s), hintLevel: 3 }))
  }, FIXED)
  await page.goto('/')
  await page.waitForSelector('#btn-hint:not([hidden])')
  await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' })
})

test('dark theme forced', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('chord-trainer-theme', 'dark')
  })
  await page.goto('/')
  await page.waitForSelector('#kbd svg')
  await expect(page).toHaveScreenshot({ fullPage: true, animations: 'disabled' })
})
