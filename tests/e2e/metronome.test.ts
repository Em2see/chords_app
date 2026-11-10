import { test, expect } from '@playwright/test'
import { gotoClean, gotoWith, SEL } from './helpers'

test.describe('metronome', () => {
  test('starts stopped', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.btnMetro)).not.toHaveClass(/running/)
  })

  test('click metro button starts it', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnMetro)
    await expect(page.locator(SEL.btnMetro)).toHaveClass(/running/)
  })

  test('click again stops it', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnMetro)
    await page.click(SEL.btnMetro)
    await expect(page.locator(SEL.btnMetro)).not.toHaveClass(/running/)
  })

  test('BPM display starts at 80', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.bpmVal)).toHaveText('80')
  })

  test('BPM + increases by 5', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnBpmInc)
    await expect(page.locator(SEL.bpmVal)).toHaveText('85')
  })

  test('BPM - decreases by 5', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnBpmDec)
    await expect(page.locator(SEL.bpmVal)).toHaveText('75')
  })

  test('BPM clamped at minimum 40', async ({ page }) => {
    await gotoWith(page, { bpm: 40 })
    await page.click(SEL.btnBpmDec)
    await expect(page.locator(SEL.bpmVal)).toHaveText('40')
  })

  test('BPM clamped at maximum 200', async ({ page }) => {
    await gotoWith(page, { bpm: 200 })
    await page.click(SEL.btnBpmInc)
    await expect(page.locator(SEL.bpmVal)).toHaveText('200')
  })

  test('4 beat dots visible with default beatsPerChord=4', async ({ page }) => {
    await gotoClean(page)
    // All 4 dots present and not hidden
    const dots = page.locator(SEL.beatDots)
    await expect(dots).toHaveCount(4)
    for (let i = 0; i < 4; i++) {
      await expect(dots.nth(i)).not.toBeHidden()
    }
  })

  test('2 beat dots visible with beatsPerChord=2', async ({ page }) => {
    await gotoWith(page, { beatsPerChord: 2 })
    const dots = page.locator(SEL.beatDots)
    await expect(dots.nth(0)).not.toBeHidden()
    await expect(dots.nth(1)).not.toBeHidden()
    await expect(dots.nth(2)).toBeHidden()
    await expect(dots.nth(3)).toBeHidden()
  })

  test('1 beat dot visible with beatsPerChord=1', async ({ page }) => {
    await gotoWith(page, { beatsPerChord: 1 })
    const dots = page.locator(SEL.beatDots)
    await expect(dots.nth(0)).not.toBeHidden()
    await expect(dots.nth(1)).toBeHidden()
  })

  test('a beat dot becomes active while running (60 BPM = 1s/beat)', async ({ page }) => {
    await gotoWith(page, { bpm: 120 })  // 0.5s per beat — faster test
    await page.click(SEL.btnMetro)
    // Within 2 beat lengths one dot should activate
    await expect(page.locator(`${SEL.beatDots}.active`)).toBeVisible({ timeout: 1500 })
    await page.click(SEL.btnMetro)
  })

  test('Auto button starts inactive', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.btnAuto)).not.toHaveClass(/active/)
  })

  test('Auto button toggles class on click', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnAuto)
    await expect(page.locator(SEL.btnAuto)).toHaveClass(/active/)
    await page.click(SEL.btnAuto)
    await expect(page.locator(SEL.btnAuto)).not.toHaveClass(/active/)
  })

  test('auto-advance changes chord at beatsPerChord=1 120BPM', async ({ page }) => {
    await gotoWith(page, { autoAdvance: true, beatsPerChord: 1, bpm: 120 })
    const first = await page.locator(SEL.chord).textContent()
    await page.click(SEL.btnMetro)
    // After 1 beat (0.5s) chord should advance; give 2s headroom
    await expect(page.locator(SEL.chord)).not.toHaveText(first!, { timeout: 2000 })
    await page.click(SEL.btnMetro)
  })
})
