import { useState, type FormEvent } from 'react'
import type { NewPlaceInput } from '../domain/types'

interface PlaceFormProps {
  onAdd: (place: NewPlaceInput) => void
}

const EMPTY_FORM = {
  name: '',
  locationQuery: '',
  duration: '60',
  notes: '',
}

export function PlaceForm({ onAdd }: PlaceFormProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const name = form.name.trim()
    const duration = Number(form.duration)
    if (!name) return setError('請輸入景點名稱。')
    if (name.length > 80 || form.locationQuery.trim().length > 80) {
      return setError('景點名稱與地圖搜尋文字各自不可超過 80 字元。')
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
      return setError('停留分鐘必須是 1 到 1,440 的整數。')
    }
    if (form.notes.length > 1000) return setError('備註不可超過 1,000 字元。')

    onAdd({
      name,
      locationQuery: form.locationQuery.trim(),
      defaultDurationMinutes: duration,
      notes: form.notes.trim(),
    })
    setForm(EMPTY_FORM)
    setError(null)
  }

  return (
    <form onSubmit={submit} aria-labelledby="single-place-heading" noValidate>
      <h3 id="single-place-heading">逐筆新增</h3>
      <div className="formGrid">
        <label>
          景點名稱 <span aria-hidden="true">*</span>
          <input
            value={form.name}
            maxLength={80}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          地圖搜尋文字
          <input
            value={form.locationQuery}
            maxLength={80}
            placeholder="省略時使用景點名稱"
            onChange={(event) => setForm({ ...form, locationQuery: event.target.value })}
          />
        </label>
        <label>
          停留分鐘
          <input
            type="number"
            min={1}
            max={1440}
            value={form.duration}
            onChange={(event) => setForm({ ...form, duration: event.target.value })}
          />
        </label>
        <label className="wideField">
          備註
          <textarea
            value={form.notes}
            maxLength={1000}
            rows={2}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
      </div>
      {error && <p className="errorText" role="alert">{error}</p>}
      <button type="submit" className="primaryButton">加入備案</button>
    </form>
  )
}
