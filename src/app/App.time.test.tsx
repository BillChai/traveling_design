import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('時間與衝突', () => {
  it('shows text warnings without changing the visual order', async () => {
    const user = userEvent.setup()
    render(<App />)
    const markdown = screen.getByLabelText(/每行格式/)
    await user.type(markdown, 'A | A | 90\nB | B | 60')
    await user.click(screen.getByRole('button', { name: '解析並匯入' }))

    for (const name of ['A', 'B']) {
      const card = screen.getByRole('article', { name })
      const select = within(card).getByLabelText('移動到')
      await user.selectOptions(select, within(select).getByRole('option', { name: 'Day 1' }))
      await user.click(within(card).getByRole('button', { name: '移動' }))
    }

    const cardA = screen.getByRole('article', { name: 'A' })
    const cardB = screen.getByRole('article', { name: 'B' })
    await user.type(within(cardA).getByLabelText('開始時間'), '09:00')
    await user.type(within(cardB).getByLabelText('開始時間'), '10:00')
    expect(screen.getAllByText(/此時段與其他景點重疊/)).toHaveLength(2)
    expect(within(cardA).getByText('結束 10:30')).toBeInTheDocument()

    const day = screen.getByRole('heading', { name: 'Day 1' }).closest('section')!
    expect(within(day).getAllByRole('article').map((node) => node.getAttribute('aria-label'))).toEqual(['A', 'B'])
  })
})
