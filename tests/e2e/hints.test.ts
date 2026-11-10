import { test, expect } from '@playwright/test'
import { gotoWith, SEL } from './helpers'

test.describe('hint levels', () => {
  test('level 1: hint button absent, keyboard highlighted', async ({ page }) => {
    await gotoWith(page, { hintLevel: 1 })
    // Hint button should not be visible (hidden attribute)
    await expect(page.locator(SEL.btnHint)).toBeHidden()
    // Keyboard SVG should have colored rects (highlighted keys)
    const filledRects = page.locator(`${SEL.kbd} svg rect[fill*="accent"]`)
    await expect(filledRects).not.toHaveCount(0)
  })

  test('level 3: hint button visible after advance', async ({ page }) => {
    await gotoWith(page, { hintLevel: 3 })
    // On first chord pos=0 hintRevealed is false for level 3
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
  })

  test('level 3: pressing H hides hint button', async ({ page }) => {
    await gotoWith(page, { hintLevel: 3 })
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
    await page.keyboard.press('h')
    await expect(page.locator(SEL.btnHint)).toBeHidden()
  })

  test('level 3: clicking hint button reveals it', async ({ page }) => {
    await gotoWith(page, { hintLevel: 3 })
    await page.click(SEL.btnHint)
    await expect(page.locator(SEL.btnHint)).toBeHidden()
  })

  test('level 3: hint resets after advance', async ({ page }) => {
    await gotoWith(page, { hintLevel: 3 })
    // Reveal hint
    await page.keyboard.press('h')
    await expect(page.locator(SEL.btnHint)).toBeHidden()
    // Advance to next chord → hint resets
    await page.click(SEL.btnNext)
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
  })

  test('level 2: hint button visible initially, hidden after delay', async ({ page }) => {
    await gotoWith(page, { hintLevel: 2, hintDelay: 1 })
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
    // After 1.5s the timer fires and hint is revealed → button hides
    await expect(page.locator(SEL.btnHint)).toBeHidden({ timeout: 2500 })
  })

  test('level 2: H button immediately reveals before timer', async ({ page }) => {
    await gotoWith(page, { hintLevel: 2, hintDelay: 60 }) // long delay
    await expect(page.locator(SEL.btnHint)).not.toBeHidden()
    await page.keyboard.press('h')
    await expect(page.locator(SEL.btnHint)).toBeHidden()
  })
})
