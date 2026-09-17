import { useState, type FormEvent } from 'react'
import { parsePlacesMarkdown } from '../domain/markdown'
import type { NewPlaceInput } from '../domain/types'

interface MarkdownImportProps {
  onImport: (places: NewPlaceInput[]) => void
}

export function MarkdownImport({ onImport }: MarkdownImportProps) {
  const [value, setValue] = useState('')
  const [errors, setErrors] = useState<ReturnType<typeof parsePlacesMarkdown>['errors']>([])
  const [importedCount, setImportedCount] = useState(0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const result = parsePlacesMarkdown(value)
    if (result.places.length) onImport(result.places)
    setErrors(result.errors)
    setImportedCount(result.places.length)
    if (result.errors.length === 0 && result.places.length > 0) setValue('')
  }

  return (
    <form onSubmit={submit} aria-labelledby="markdown-heading">
      <h3 id="markdown-heading">Markdown 批次匯入</h3>
      <label>
        每行格式：名稱 | 地圖搜尋文字 | 分鐘 | 備註
        <textarea
          value={value}
          rows={6}
          placeholder={'- 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 雷門\n- 上野公園'}
          onChange={(event) => setValue(event.target.value)}
        />
      </label>
      <button type="submit" className="secondaryButton">解析並匯入</button>
      {importedCount > 0 && (
        <p className="successText" role="status">已匯入 {importedCount} 個有效景點。</p>
      )}
      {errors.length > 0 && (
        <div className="errorBox" role="alert">
          <strong>請修正以下內容：</strong>
          <ul>
            {errors.map((error) => (
              <li key={`${error.lineNumber}-${error.line}`}>
                第 {error.lineNumber} 行：{error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
