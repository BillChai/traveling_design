import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BACKUP_KEY_PREFIX, STORAGE_KEY } from '../persistence/tripStorage'
import App from './App'

describe('本機保存與復原', () => {
  it('restores valid changes after remount', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.type(screen.getByLabelText(/景點名稱/), '上野公園')
    await user.click(screen.getByRole('button', { name: '加入備案' }))
    expect(localStorage.getItem(STORAGE_KEY)).toContain('上野公園')
    first.unmount()

    render(<App />)
    expect(screen.getByRole('article', { name: '上野公園' })).toBeInTheDocument()
  })

  it('backs up corrupted data and renders a safe starter trip', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    render(<App />)
    expect(screen.getByText(/復原為新的旅程/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Day 1' })).toBeInTheDocument()
    expect(Object.keys(localStorage).some((key) => key.startsWith(BACKUP_KEY_PREFIX))).toBe(true)
  })
})
