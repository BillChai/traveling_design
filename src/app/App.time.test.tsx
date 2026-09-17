import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('時間與衝突', () => {
  it('derives end times and non-blocking overlap warnings from Markdown', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 時間測試

## 備案

## Day 1
- @09:00 A | A | 90
- @10:00 B | B | 60`,
      },
    })

    expect(screen.getByRole('article', { name: 'A' })).toHaveTextContent('09:00–10:30')
    expect(screen.getByRole('article', { name: 'B' })).toHaveTextContent('10:00–11:00')
    expect(screen.getAllByText(/此時段與其他景點重疊/)).toHaveLength(2)
  })
})
