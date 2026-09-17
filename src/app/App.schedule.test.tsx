import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

describe('多日視覺編排', () => {
  it('creates backlog and day columns only from Markdown headings', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 京都

## 備案
- A | A | 60

## Day 1 | 2026-10-03
- B | B | 30

## Day 2 | 2026-10-04`,
      },
    })

    const backlog = screen.getByRole('region', { name: '備案' })
    const dayOne = screen.getByRole('region', { name: 'Day 1' })
    const dayTwo = screen.getByRole('region', { name: 'Day 2' })
    expect(within(backlog).getByRole('article', { name: 'A' })).toBeInTheDocument()
    expect(within(dayOne).getByRole('article', { name: 'B' })).toBeInTheDocument()
    expect(within(dayTwo).getAllByRole('group', { name: /^\d{2}:00$/ })).toHaveLength(24)
    expect(within(dayTwo).getByText('拖到這裡可清除時間')).toBeInTheDocument()
  })

  it('renders 24 hourly slots and keeps untimed day items separate', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 時間軸

## 備案

## Day 1 | 2026-10-03
- @09:30 A | A | 60
- B | B | 30`,
      },
    })

    const dayOne = screen.getByRole('region', { name: 'Day 1' })
    const hourlySlots = within(dayOne).getAllByRole('group', { name: /^\d{2}:00$/ })
    expect(hourlySlots).toHaveLength(24)
    expect(within(dayOne).getByRole('group', { name: '09:00' })).toContainElement(
      screen.getByRole('article', { name: 'A' }),
    )
    expect(within(dayOne).getByRole('region', { name: '未設定時間' })).toContainElement(
      screen.getByRole('article', { name: 'B' }),
    )
  })
})
