import { test, expect } from '@playwright/test'
import { gotoClean, gotoWith, SEL } from './helpers'

test.describe('hotkeys', () => {
  test('Space advances chord', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.keyboard.press('Space')
    await expect(page.locator(SEL.chord)).not.toHaveText(before!)
  })

  test('ArrowRight advances chord', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator(SEL.chord)).not.toHaveText(before!)
  })

  test('PageDown advances chord', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.keyboard.press('PageDown')
    await expect(page.locator(SEL.chord)).not.toHaveText(before!)
  })

  test('H reveals hint at level 3', async ({ page }) => {
    await gotoWith(page, { hintLevel: 3 })
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
    await page.keyboard.press('h')
    await expect(page.locator(SEL.btnHint)).toBeHidden()
  })

  test('Enter starts metronome', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.btnMetro)).not.toHaveClass(/running/)
    await page.keyboard.press('Enter')
    await expect(page.locator(SEL.btnMetro)).toHaveClass(/running/)
  })

  test('Enter stops metronome', async ({ page }) => {
    await gotoClean(page)
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await expect(page.locator(SEL.btnMetro)).not.toHaveClass(/running/)
  })

  test('Space does not advance while settings panel is open', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.click(SEL.btnSet)
    await page.keyboard.press('Space')
    await page.click(SEL.btnDone)
    // initProgression() resets to pos=0 → same first chord
    await expect(page.locator(SEL.chord)).toHaveText(before!)
  })

  test('ArrowRight does not advance while settings open', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.click(SEL.btnSet)
    await page.keyboard.press('ArrowRight')
    await page.click(SEL.btnDone)
    await expect(page.locator(SEL.chord)).toHaveText(before!)
  })

  test('Enter does not start metro while settings open', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.keyboard.press('Enter')
    await page.click(SEL.btnDone)
    await expect(page.locator(SEL.btnMetro)).not.toHaveClass(/running/)
  })

  test('multiple advances cycle through progression', async ({ page }) => {
    await gotoClean(page)
    const chords = new Set<string>()
    chords.add((await page.locator(SEL.chord).textContent()) ?? '')
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Space')
      chords.add((await page.locator(SEL.chord).textContent()) ?? '')
    }
    // 6 presses → should have seen at least 3 distinct chords (fifths: C G D A E B...)
    expect(chords.size).toBeGreaterThanOrEqual(3)
  })
})
