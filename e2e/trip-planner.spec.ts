import { expect, test, type Locator, type Page } from '@playwright/test'

const pointerDrag = async (page: Page, source: Locator, target: Locator) => {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Drag source or target is not visible')
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 12, sourceBox.y + sourceBox.height / 2 + 12, { steps: 3 })
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + Math.min(180, targetBox.height / 2), { steps: 12 })
  await page.mouse.up()
}

test('edits Markdown, drags a place, synchronizes outputs, routes, and restores', async ({ page }) => {
  await page.goto('/')
  const editor = page.getByRole('textbox', { name: 'Markdown 行程' })
  await editor.fill(`# 東京旅行

## 備案
- 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
- 東京晴空塔 | 東京スカイツリー | 120

## Day 1 | 2026-10-03

## Day 2 | 2026-10-04`)

  const dayOne = page.getByRole('region', { name: 'Day 1' })
  await pointerDrag(page, page.getByRole('article', { name: '淺草寺' }), dayOne)
  await pointerDrag(page, page.getByRole('article', { name: '東京晴空塔' }), dayOne)

  await expect(dayOne.getByRole('article')).toHaveCount(2)
  await expect(editor).toHaveValue(/## Day 1 \| 2026-10-03[\s\S]*淺草寺[\s\S]*東京晴空塔/)
  await expect(page.getByLabel('CSV 輸出')).toContainText('淺草寺')
  await expect(page.getByLabel('JSON 輸出')).toContainText('東京晴空塔')

  const route = dayOne.getByRole('link', { name: /Google Maps 路線/ })
  const href = await route.getAttribute('href')
  expect(href).toContain('/maps/dir/')
  expect(href).not.toContain('travelmode')
  expect(href).toContain(encodeURIComponent('東京都台東区浅草2-3-1'))
  expect(href).toContain(encodeURIComponent('東京スカイツリー'))

  await page.reload()
  await expect(page.getByRole('region', { name: 'Day 1' }).getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('textbox', { name: 'Markdown 行程' })).toHaveValue(/淺草寺[\s\S]*東京晴空塔/)
})

test('moves a card with the keyboard alternative', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown 行程' }).fill(`# 鍵盤測試

## 備案
- A | A | 60

## Day 1`)

  const card = page.getByRole('article', { name: 'A' })
  await card.focus()
  await page.keyboard.press('Alt+ArrowRight')

  await expect(page.getByRole('region', { name: 'Day 1' }).getByRole('article', { name: 'A' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Markdown 行程' })).toHaveValue(/## Day 1[\s\S]*- A \| A \| 60/)
})
