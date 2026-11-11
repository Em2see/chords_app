import { test, expect } from '@playwright/test'
import { gotoClean } from './helpers'

test.setTimeout(120_000)

test('builds and runs a practice session', async ({ page }) => {
  await gotoClean(page)
  await page.getByRole('tab', { name: 'План' }).click()
  await page.locator('#practice-goal').selectOption('technique')
  await page.getByLabel('60 минут').check()
  await expect(page.locator('.practice-preview li')).toHaveCount(3)
  await expect(page.locator('.practice-preview li').first()).toContainText('Ганон')
  await page.locator('#practice-add-name').fill('Арпеджио')
  await page.getByRole('button', { name: 'Добавить' }).click()
  await expect(page.locator('.practice-preview li')).toHaveCount(4)
  await page.locator('#practice-start').click()
  await expect(page.locator('.practice-clock')).toHaveText(/^1[45]:\d\d$/)
  await page.getByRole('button', { name: 'Пауза' }).click()
  await page.getByRole('button', { name: 'Следующее' }).click()
  await expect(page.locator('.practice-now h2')).toHaveText('Гаммы')
  const nextPage = await page.context().newPage()
  await nextPage.goto('/')
  await nextPage.getByRole('tab', { name: 'План' }).click()
  await expect(nextPage.locator('#practice-goal')).toHaveValue('technique')
  await expect(nextPage.locator('.practice-preview li')).toHaveCount(4)
})

test('keeps a named custom goal', async ({ page }) => {
  await gotoClean(page)
  await page.getByRole('tab', { name: 'План' }).click()
  await page.locator('#practice-goal').selectOption('custom')
  await page.getByLabel('Название своей цели').fill('Выучить блюз в F')
  await page.locator('#practice-start').click()
  await expect(page.locator('#practice-session .practice-intro')).toContainText('Выучить блюз в F')
})
