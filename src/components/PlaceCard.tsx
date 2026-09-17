import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { calculateEndTime } from '../domain/time'
import type { Place, Placement, ScheduleWarning } from '../domain/types'

interface PlaceCardProps {
  place: Place
  placement: Placement
  warnings: ScheduleWarning[]
  onKeyboardMove: (direction: 'left' | 'right' | 'up' | 'down') => void
}

export function PlaceCard({ place, placement, warnings, onKeyboardMove }: PlaceCardProps) {
  const sortable = useSortable({ id: placement.id, data: { dayId: placement.dayId } })
  const endTime = calculateEndTime(placement.startTime, placement.durationMinutes)
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.55 : 1,
  }

  return (
    <article
      ref={sortable.setNodeRef}
      style={style}
      className="placeCard"
      aria-label={place.name}
      {...sortable.attributes}
      {...sortable.listeners}
      role="article"
      onKeyDown={(event) => {
        if (!event.altKey) return
        const direction = {
          ArrowLeft: 'left',
          ArrowRight: 'right',
          ArrowUp: 'up',
          ArrowDown: 'down',
        }[event.key] as 'left' | 'right' | 'up' | 'down' | undefined
        if (!direction) return
        event.preventDefault()
        onKeyboardMove(direction)
      }}
    >
      <div className="cardHeading">
        <span className="dragGlyph" aria-hidden="true">⠿</span>
        <div>
          <h3>{place.name}</h3>
          <p>{place.locationQuery}</p>
        </div>
      </div>

      <div className="timeSummary">
        {placement.startTime && endTime
          ? <strong>{placement.startTime}–{endTime}</strong>
          : <span>未設定時間</span>}
        <span>{placement.durationMinutes} 分鐘</span>
      </div>

      {place.notes && <p className="notes">{place.notes}</p>}
      {warnings.map((warning) => (
        <p className="warningText" role="status" key={warning.type}>⚠ {warning.message}</p>
      ))}
    </article>
  )
}
