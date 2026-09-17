import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('景點備案', () => {
  it('validates single entry, then edits and deletes a place', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '加入備案' }))
    expect(screen.getByRole('alert')).toHaveTextContent('請輸入景點名稱')

    await user.type(screen.getByLabelText(/景點名稱/), '淺草寺')
    await user.click(screen.getByRole('button', { name: '加入備案' }))
    const card = screen.getByRole('article', { name: '淺草寺' })
    expect(card).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: '編輯' }))
    const name = within(card).getByLabelText('名稱')
    await user.clear(name)
    await user.type(name, '雷門')
    await user.click(within(card).getByRole('button', { name: '儲存景點' }))
    expect(screen.getByRole('article', { name: '雷門' })).toBeInTheDocument()

    await user.click(within(screen.getByRole('article', { name: '雷門' })).getByRole('button', { name: '刪除' }))
    expect(screen.queryByRole('article', { name: '雷門' })).not.toBeInTheDocument()
  })

  it('imports valid Markdown lines and reports invalid siblings', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText(/每行格式/)
    await user.type(input, '- A | A | 0\n- B | B | 30')
    await user.click(screen.getByRole('button', { name: '解析並匯入' }))

    expect(screen.getByRole('article', { name: 'B' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('第 1 行')
    expect(input).toHaveValue('- A | A | 0\n- B | B | 30')
  })
})
