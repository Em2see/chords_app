import { test, expect } from '@playwright/test'
import { gotoClean, SEL } from './helpers'

test.describe('app — base rendering', () => {
  test('renders chord name on load', async ({ page }) => {
    await gotoClean(page)
    const chord = await page.locator(SEL.chord).textContent()
    expect(chord).toBeTruthy()
    expect(chord).not.toBe('…')
  })

  test('shows inversion label', async ({ page }) => {
    await gotoClean(page)
    const inv = await page.locator(SEL.inv).textContent()
    expect(['осн. вид', '1-е обращение', '2-е обращение', '3-е обращение']).toContain(inv?.trim())
  })

  test('shows next chord preview', async ({ page }) => {
    await gotoClean(page)
    const nxt = await page.locator(SEL.next).textContent()
    expect(nxt).toMatch(/^→/)
  })

  test('SVG keyboard is rendered', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(`${SEL.kbd} svg`)).toBeVisible()
  })

  test('chain shows 12 items for circle-of-fifths', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(`${SEL.chain} .ci`)).toHaveCount(12)
  })

  test('chain marks exactly one active and one next item', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(`${SEL.chain} .ci.active`)).toHaveCount(1)
    await expect(page.locator(`${SEL.chain} .ci.next`)).toHaveCount(1)
  })

  test('session counter starts empty', async ({ page }) => {
    await gotoClean(page)
    await expect(page.locator(SEL.sessionCnt)).toHaveText('')
  })

  test('session counter increments after advance', async ({ page }) => {
    await gotoClean(page)
    await page.click(SEL.btnNext)
    await expect(page.locator(SEL.sessionCnt)).toHaveText('1 аккордов')
    await page.click(SEL.btnNext)
    await expect(page.locator(SEL.sessionCnt)).toHaveText('2 аккордов')
  })

  test('Next button changes displayed chord', async ({ page }) => {
    await gotoClean(page)
    const first = await page.locator(SEL.chord).textContent()
    await page.click(SEL.btnNext)
    const second = await page.locator(SEL.chord).textContent()
    expect(second).not.toBe(first)
  })

  test('chain active item updates after advance', async ({ page }) => {
    await gotoClean(page)
    const before = await page.locator(`${SEL.chain} .ci.active`).textContent()
    await page.click(SEL.btnNext)
    const after = await page.locator(`${SEL.chain} .ci.active`).textContent()
    expect(after).not.toBe(before)
  })

  test('title is present', async ({ page }) => {
    await gotoClean(page)
    const title = await page.title()
    expect(title).toBeTruthy()
  })
})
