import { expect, test, type Locator, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const pointerDrag = async (page: Page, source: Locator, target: Locator) => {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Drag source or target is not visible')
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(sourceBox.x + sourceBox.width / 2 + 12, sourceBox.y + sourceBox.height / 2 + 12, { steps: 3 })
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 2 })
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
  await pointerDrag(page, page.getByRole('article', { name: '淺草寺' }), dayOne.getByRole('group', { name: '09:00' }))

  await expect(dayOne.getByRole('group', { name: '09:00' }).getByRole('article', { name: '淺草寺' })).toBeVisible()
  await expect(editor).toHaveValue(/@09:00 淺草寺/)

  await editor.fill(`# 東京旅行

## 備案

## Day 1 | 2026-10-03
- @09:00 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
- @11:00 東京晴空塔 | 東京スカイツリー | 120

## Day 2 | 2026-10-04`)

  await expect(dayOne.getByRole('article')).toHaveCount(2)
  await expect(editor).toHaveValue(/## Day 1 \| 2026-10-03[\s\S]*@09:00 淺草寺[\s\S]*@11:00 東京晴空塔/)
  await expect(page.getByLabel('CSV 輸出')).toContainText('淺草寺')
  await expect(page.getByLabel('CSV 輸出')).toContainText('09:00')
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

test('downloads a stable CSV with scheduled items before the backlog', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Markdown 行程' }).fill(`# 下載測試

## 備案
- 備案景點 | 備案景點 | 60

## Day 1 | 2026-10-03
- @09:00 早上景點 | 早上景點 | 60

## Day 2 | 2026-10-04
- @10:00 第二天景點 | 第二天景點 | 60`)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下載 CSV 時間表' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('travel-itinerary.csv')

  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('CSV download path is unavailable')
  const content = await readFile(downloadPath, 'utf8')
  expect(content).toContain('\uFEFFsection,date,order,startTime,endTime,name,mapQuery,durationMinutes,note')
  expect(content.indexOf('早上景點')).toBeLessThan(content.indexOf('第二天景點'))
  expect(content.indexOf('第二天景點')).toBeLessThan(content.indexOf('備案景點'))
  expect(content).toContain('"backlog"')

  await page.getByRole('textbox', { name: 'Markdown 行程' }).fill(`# 空行程

## 備案

## Day 1`)
  const emptyDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '下載 CSV 時間表' }).click()
  const emptyDownload = await emptyDownloadPromise
  const emptyPath = await emptyDownload.path()
  if (!emptyPath) throw new Error('Empty CSV download path is unavailable')
  expect(await readFile(emptyPath, 'utf8')).toBe(
    '\uFEFFsection,date,order,startTime,endTime,name,mapQuery,durationMinutes,note',
  )
})
