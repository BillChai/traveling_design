import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

const source = `# 東京旅行

## 備案

- 上野公園 | 上野公園 | 60 | 賞櫻

## Day 1 | 2026-10-03

- @09:00 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入`

describe('Markdown-first 編輯', () => {
  it('renders one valid document and updates all derived outputs', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), { target: { value: source } })

    expect(screen.getByRole('heading', { name: '東京旅行', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '上野公園' })).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '淺草寺' })).toHaveTextContent('09:00–10:30')
    expect(screen.getByLabelText('標準 Markdown 輸出')).toHaveTextContent('## Day 1 | 2026-10-03')
    expect(screen.getByLabelText('CSV 輸出')).toHaveTextContent('上野公園')
    expect(screen.getByLabelText('JSON 輸出')).toHaveTextContent('"startTime": "09:00"')
    expect(screen.getByRole('button', { name: '下載 CSV 時間表' })).toBeInTheDocument()
  })

  it('keeps the last valid board when the draft becomes invalid', () => {
    render(<App />)
    const editor = screen.getByLabelText('Markdown 行程')
    fireEvent.change(editor, { target: { value: source } })
    fireEvent.change(editor, { target: { value: `${source}\n- 壞資料 | 壞資料 | 0` } })

    expect(editor).toHaveValue(`${source}\n- 壞資料 | 壞資料 | 0`)
    expect(screen.getByText(/停留分鐘必須是 1 到 1,440/)).toBeInTheDocument()
    expect(screen.getByRole('article', { name: '淺草寺' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: '壞資料' })).not.toBeInTheDocument()
  })
})
