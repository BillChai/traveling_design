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
    expect(within(dayTwo).getByText('把備案拖到這一天。')).toBeInTheDocument()
  })
})
