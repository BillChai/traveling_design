import { expect, test, type Page } from '@playwright/test'

const movePlace = async (
  page: Page,
  name: string,
  dayLabel: string,
) => {
  const card = page.getByRole('article', { name })
  await card.getByLabel('移動到').selectOption({ label: dayLabel })
  await card.getByRole('button', { name: '移動' }).click()
}

test('imports, arranges, times, restores, and links a two-day trip', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel(/每行格式/).fill([
    '- 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入',
    '- 東京晴空塔 | 東京スカイツリー | 120',
    '- 上野公園',
    '- 谷中銀座 | 谷中銀座 | 60',
  ].join('\n'))
  await page.getByRole('button', { name: '解析並匯入' }).click()
  await expect(page.getByText('已匯入 4 個有效景點。')).toBeVisible()

  await page.getByRole('button', { name: '新增一天' }).click()
  await movePlace(page, '淺草寺', 'Day 1')
  await movePlace(page, '東京晴空塔', 'Day 1')
  await movePlace(page, '上野公園', 'Day 2')
  await movePlace(page, '谷中銀座', 'Day 2')

  const asakusa = page.getByRole('article', { name: '淺草寺' })
  const skytree = page.getByRole('article', { name: '東京晴空塔' })
  await asakusa.getByLabel('開始時間').fill('09:00')
  await skytree.getByLabel('開始時間').fill('10:00')
  await expect(page.getByText('此時段與其他景點重疊。')).toHaveCount(2)
  await skytree.getByLabel('開始時間').fill('10:30')
  await expect(page.getByText('此時段與其他景點重疊。')).toHaveCount(0)

  const dayOne = page.getByRole('region', { name: 'Day 1' })
  const route = dayOne.getByRole('link', { name: /Google Maps 路線/ })
  const href = await route.getAttribute('href')
  expect(href).toContain('/maps/dir/')
  expect(href).not.toContain('travelmode')
  expect(href).toContain(encodeURIComponent('東京都台東区浅草2-3-1'))
  expect(href).toContain(encodeURIComponent('東京スカイツリー'))

  await page.reload()
  await expect(page.getByRole('article', { name: '淺草寺' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Day 2' }).getByRole('article')).toHaveCount(2)
  await expect(page.getByRole('article', { name: '淺草寺' }).getByLabel('開始時間')).toHaveValue('09:00')
})
