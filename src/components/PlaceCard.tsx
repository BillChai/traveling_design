import { useState, type FormEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { calculateEndTime } from '../domain/time'
import type { DayPlan, Place, Placement, ScheduleWarning } from '../domain/types'

interface PlaceCardProps {
  place: Place
  placement: Placement
  days: DayPlan[]
  index: number
  total: number
  warnings: ScheduleWarning[]
  onMove: (targetDayId: string | null, targetIndex: number) => void
  onUpdatePlace: (changes: Partial<Omit<Place, 'id'>>) => void
  onUpdateSchedule: (startTime: string | null, durationMinutes: number) => void
  onDelete: () => void
}

export function PlaceCard({
  place,
  placement,
  days,
  index,
  total,
  warnings,
  onMove,
  onUpdatePlace,
  onUpdateSchedule,
  onDelete,
}: PlaceCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(place)
  const [destination, setDestination] = useState(placement.dayId ?? '')
  const [editError, setEditError] = useState<string | null>(null)
  const sortable = useSortable({ id: placement.id, data: { dayId: placement.dayId } })
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.55 : 1,
  }

  const saveEdit = (event: FormEvent) => {
    event.preventDefault()
    const name = draft.name.trim()
    const locationQuery = draft.locationQuery.trim() || name
    if (!name || name.length > 80 || locationQuery.length > 80) {
      return setEditError('名稱與地圖搜尋文字必須為 1 到 80 字元。')
    }
    if (!Number.isInteger(draft.defaultDurationMinutes) || draft.defaultDurationMinutes < 1 || draft.defaultDurationMinutes > 1440) {
      return setEditError('停留分鐘必須是 1 到 1,440 的整數。')
    }
    onUpdatePlace({ ...draft, name, locationQuery })
    setEditError(null)
    setEditing(false)
  }

  const endTime = calculateEndTime(placement.startTime, placement.durationMinutes)

  return (
    <article ref={sortable.setNodeRef} style={style} className="placeCard" aria-label={place.name}>
      <div className="cardHeading">
        <button
          type="button"
          className="dragHandle"
          aria-label={`拖曳 ${place.name}`}
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ⠿
        </button>
        <div>
          <h4>{place.name}</h4>
          <p>{place.locationQuery}</p>
        </div>
        <button type="button" className="textButton" onClick={() => { setDraft(place); setEditing(!editing) }}>
          {editing ? '取消' : '編輯'}
        </button>
      </div>

      {place.notes && <p className="notes">{place.notes}</p>}

      {editing && (
        <form className="editForm" onSubmit={saveEdit}>
          <label>名稱<input value={draft.name} maxLength={80} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label>地圖搜尋文字<input value={draft.locationQuery} maxLength={80} onChange={(event) => setDraft({ ...draft, locationQuery: event.target.value })} /></label>
          <label>預設分鐘<input type="number" min={1} max={1440} value={draft.defaultDurationMinutes} onChange={(event) => setDraft({ ...draft, defaultDurationMinutes: Number(event.target.value) })} /></label>
          <label>備註<textarea value={draft.notes} maxLength={1000} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          {editError && <p className="errorText" role="alert">{editError}</p>}
          <button type="submit" className="secondaryButton">儲存景點</button>
        </form>
      )}

      {placement.dayId !== null && (
        <div className="scheduleFields">
          <label>
            開始時間
            <input
              type="time"
              value={placement.startTime ?? ''}
              onChange={(event) => onUpdateSchedule(event.target.value || null, placement.durationMinutes)}
            />
          </label>
          <label>
            停留分鐘
            <input
              type="number"
              min={1}
              max={1440}
              value={placement.durationMinutes}
              onChange={(event) => {
                const duration = Number(event.target.value)
                if (Number.isInteger(duration) && duration >= 1 && duration <= 1440) {
                  onUpdateSchedule(placement.startTime, duration)
                }
              }}
            />
          </label>
          <p className="endTime">{endTime ? `結束 ${endTime}` : '尚未設定開始時間'}</p>
        </div>
      )}

      {warnings.map((warning) => (
        <p className="warningText" role="status" key={warning.type}>⚠ {warning.message}</p>
      ))}

      <div className="cardActions">
        <button type="button" className="iconButton" aria-label={`${place.name} 上移`} disabled={index === 0} onClick={() => onMove(placement.dayId, index - 1)}>↑</button>
        <button type="button" className="iconButton" aria-label={`${place.name} 下移`} disabled={index === total - 1} onClick={() => onMove(placement.dayId, index + 1)}>↓</button>
        <label className="moveSelect">
          移動到
          <select value={destination} onChange={(event) => setDestination(event.target.value)}>
            <option value="">備案區</option>
            {days.map((day) => <option key={day.id} value={day.id}>{day.label}{day.date ? ` · ${day.date}` : ''}</option>)}
          </select>
        </label>
        <button type="button" className="secondaryButton" onClick={() => onMove(destination || null, Number.MAX_SAFE_INTEGER)}>移動</button>
        <button type="button" className="dangerButton" onClick={onDelete}>刪除</button>
      </div>
    </article>
  )
}
