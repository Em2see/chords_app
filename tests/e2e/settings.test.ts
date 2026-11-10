import { test, expect } from '@playwright/test'
import { gotoClean, SEL } from './helpers'

test.describe('settings panel', () => {
  test('panel is hidden on load', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.panel)).toBeHidden()
  })

  test('opens on ⚙ button', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.panel)).toBeVisible()
  })

  test('closes on ✕ button', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.click(SEL.btnClose)
    await expect(page.locator(SEL.panel)).toBeHidden()
  })

  test('closes on Done button', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.click(SEL.btnDone)
    await expect(page.locator(SEL.panel)).toBeHidden()
  })

  test('closes when clicking backdrop', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    // click the overlay (outside the inner panel)
    await page.locator(SEL.panel).click({ position: { x: 5, y: 5 } })
    await expect(page.locator(SEL.panel)).toBeHidden()
  })

  test('mode selector present with all 7 options', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await expect(page.locator(`${SEL.selMode} option`)).toHaveCount(7)
  })

  test('chord-type selector hidden for diatonic mode', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'diatonic')
    await expect(page.locator(SEL.selType)).toBeHidden()
  })

  test('chord-type selector hidden for ii-V-I mode', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'ii-V-I')
    await expect(page.locator(SEL.selType)).toBeHidden()
  })

  test('key selector appears for diatonic mode', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'diatonic')
    await expect(page.locator('#sel-key')).toBeVisible()
  })

  test('seam selector appears for fifths mode', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'fifths')
    await expect(page.locator('#sel-seam')).toBeVisible()
  })

  test('seam selector hidden for chromatic mode', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'chromatic-up')
    await expect(page.locator('#sel-seam')).toBeHidden()
  })

  test('delay input appears only for hint level 2', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    // level 1 by default — no delay input
    await expect(page.locator('#inp-delay')).toBeHidden()
    await page.selectOption(SEL.selHint, '2')
    await expect(page.locator('#inp-delay')).toBeVisible()
    await page.selectOption(SEL.selHint, '3')
    await expect(page.locator('#inp-delay')).toBeHidden()
  })

  test('changing chord type updates chord display', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(SEL.chord).textContent()
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selType, 'min')
    await page.click(SEL.btnDone)
    const after = await page.locator(SEL.chord).textContent()
    expect(after).not.toBe(before)
  })

  test('chain hidden when showChain=false', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    const chk = page.locator(SEL.chkChain)
    if (await chk.isChecked()) await chk.uncheck()
    await page.click(SEL.btnDone)
    await expect(page.locator(SEL.chain)).toBeEmpty()
  })

  test('beatsPerChord selector has options 1, 2, 4', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnSet)
    const opts = await page.locator(`${SEL.selBpc} option`).allTextContents()
    expect(opts).toEqual(['1 уд.', '2 уд.', '4 уд.'])
  })

  test('reset button restores defaults', async ({ page }) => {
    await gotoClean(page)
    // Change something
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'random')
    await page.click(SEL.btnDone)

    // Reset
    await page.click(SEL.btnSet)
    await page.click(SEL.btnReset)
    await expect(page.locator(SEL.selMode)).toHaveValue('fifths')
  })
})
