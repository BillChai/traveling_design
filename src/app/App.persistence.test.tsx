import { fireEvent, render, screen } from '@testing-library/react'
import { BACKUP_KEY_PREFIX, STORAGE_KEY } from '../persistence/tripStorage'
import App from './App'

const source = `# 保存測試

## 備案
- 上野公園 | 上野公園 | 60

## Day 1`

describe('本機保存與復原', () => {
  it('restores the last valid Markdown content after remount', () => {
    const first = render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), { target: { value: source } })
    expect(localStorage.getItem(STORAGE_KEY)).toContain('上野公園')
    first.unmount()

    render(<App />)
    expect((screen.getByLabelText('Markdown 行程') as HTMLTextAreaElement).value).toContain('上野公園 | 上野公園 | 60')
    expect(screen.getByRole('article', { name: '上野公園' })).toBeInTheDocument()
  })

  it('backs up corrupted data and renders a safe starter document', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    render(<App />)
    expect(screen.getByText(/復原為新的旅程/)).toBeInTheDocument()
    expect((screen.getByLabelText('Markdown 行程') as HTMLTextAreaElement).value).toContain('## 備案')
    expect(Object.keys(localStorage).some((key) => key.startsWith(BACKUP_KEY_PREFIX))).toBe(true)
  })
})
