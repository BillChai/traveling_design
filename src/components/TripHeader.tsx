import { useEffect, useState } from 'react'
import type { TripAction } from '../domain/types'

interface TripHeaderProps {
  title: string
  startDate: string | null
  dayCount: number
  dispatch: React.Dispatch<TripAction>
  onAddDay: () => void
}

export function TripHeader({ title, startDate, dayCount, dispatch, onAddDay }: TripHeaderProps) {
  const [titleDraft, setTitleDraft] = useState(title)
  useEffect(() => setTitleDraft(title), [title])

  const commitTitle = () => {
    const nextTitle = titleDraft.trim()
    if (!nextTitle) {
      setTitleDraft(title)
      return
    }
    dispatch({ type: 'SET_TITLE', title: nextTitle })
  }

  return (
    <header className="tripHeader">
      <div>
        <p className="eyebrow">LOCAL ITINERARY LAB</p>
        <h1>把想去的地方，排成真的行程。</h1>
        <p className="lede">先收集，再按自己的節奏安排。資料只保存在這台瀏覽器。</p>
      </div>
      <div className="tripControls" aria-label="旅程設定">
        <label>
          旅程名稱
          <input
            value={titleDraft}
            maxLength={80}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        </label>
        <label>
          開始日期
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(event) =>
              dispatch({ type: 'SET_START_DATE', startDate: event.target.value || null })
            }
          />
        </label>
        <button type="button" className="primaryButton" onClick={onAddDay} disabled={dayCount >= 14}>
          新增一天
        </button>
      </div>
    </header>
  )
}
