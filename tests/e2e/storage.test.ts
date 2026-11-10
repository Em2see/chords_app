import { test, expect } from '@playwright/test'
import { SEL } from './helpers'

// All tests start with clean localStorage
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
})

test.describe('localStorage persistence', () => {
  test('mode change saved and restored after reload', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'random')
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selMode)).toHaveValue('random')
  })

  test('chord type change persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selType, 'm7')
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selType)).toHaveValue('m7')
  })

  test('hint level persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selHint, '3')
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selHint)).toHaveValue('3')
  })

  test('BPM change persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnBpmInc)
    await page.click(SEL.btnBpmInc)
    await expect(page.locator(SEL.bpmVal)).toHaveText('90')

    await page.reload()

    await expect(page.locator(SEL.bpmVal)).toHaveText('90')
  })

  test('autoAdvance toggle persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnAuto)
    await expect(page.locator(SEL.btnAuto)).toHaveClass(/active/)

    await page.reload()

    await expect(page.locator(SEL.btnAuto)).toHaveClass(/active/)
  })

  test('showChain=false persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    const chk = page.locator(SEL.chkChain)
    if (await chk.isChecked()) await chk.uncheck()
    await page.click(SEL.btnDone)
    await expect(page.locator(SEL.chain)).toBeEmpty()

    await page.reload()

    await expect(page.locator(SEL.chain)).toBeEmpty()
  })

  test('inversion mode persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selInv, 'root')
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selInv)).toHaveValue('root')
  })

  test('accidental filter persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selAcc, 'naturals')
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selAcc)).toHaveValue('naturals')
  })

  test('theme cycles and persists', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnTheme) // auto → light
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.reload()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

    await page.click(SEL.btnTheme) // light → dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.click(SEL.btnTheme) // dark → auto
    await expect(page.locator('html')).not.toHaveAttribute('data-theme')
  })
})

test.describe('localStorage reset', () => {
  test('reset restores defaults', async ({ page }) => {
    // Set non-default values
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'random')
    await page.selectOption(SEL.selType, 'dim7')
    await page.click(SEL.btnDone)

    // Reset
    await page.click(SEL.btnSet)
    await page.click(SEL.btnReset)

    await expect(page.locator(SEL.selMode)).toHaveValue('fifths')
    await expect(page.locator(SEL.selType)).toHaveValue('maj')
    await expect(page.locator(SEL.bpmVal)).toHaveText('80')
  })

  test('after reset, defaults persist after reload', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.btnSet)
    await page.selectOption(SEL.selMode, 'random')
    await page.click(SEL.btnDone)
    await page.click(SEL.btnSet)
    await page.click(SEL.btnReset)
    await page.click(SEL.btnDone)

    await page.reload()

    await page.click(SEL.btnSet)
    await expect(page.locator(SEL.selMode)).toHaveValue('fifths')
  })
})
