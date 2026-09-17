import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { buildGoogleMapsLinks } from '../domain/maps'
import type { DayPlan, MapLink, Place, Placement, ScheduleWarning } from '../domain/types'
import { PlaceCard } from './PlaceCard'

interface DayColumnProps {
  day: DayPlan | null
  placements: Placement[]
  placesById: Map<string, Place>
  warnings: Record<string, ScheduleWarning[]>
  onKeyboardMove: (
    placement: Placement,
    direction: 'left' | 'right' | 'up' | 'down',
  ) => void
}

export function DayColumn({ day, placements, placesById, warnings, onKeyboardMove }: DayColumnProps) {
  const containerId = `container:${day?.id ?? 'backlog'}`
  const droppable = useDroppable({ id: containerId, data: { dayId: day?.id ?? null } })
  const routePlaces = placements.flatMap((placement) => {
    const place = placesById.get(placement.placeId)
    return place ? [{ id: place.id, name: place.name, locationQuery: place.locationQuery }] : []
  })
  const links: MapLink[] = day ? buildGoogleMapsLinks(routePlaces) : []

  return (
    <section
      ref={droppable.setNodeRef}
      className={`dayColumn ${droppable.isOver ? 'isOver' : ''}`}
      aria-labelledby={`${containerId}-heading`}
    >
      <header className="columnHeading">
        <p className="columnKicker">{day ? 'ITINERARY' : 'IDEAS'}</p>
        <h2 id={`${containerId}-heading`}>{day?.label ?? '備案'}</h2>
        <p>{day?.date ?? (day ? '未指定日期' : '尚未安排')}</p>
      </header>

      {day && links.length > 0 && (
        <div className="routeLinks">
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
          ))}
        </div>
      )}

      <SortableContext items={placements.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="cardList">
          {placements.length === 0 && (
            <p className="emptyState">{day ? '把備案拖到這一天。' : '在 Markdown 加入景點。'}</p>
          )}
          {placements.map((placement) => {
            const place = placesById.get(placement.placeId)
            if (!place) return null
            return (
              <PlaceCard
                key={placement.id}
                place={place}
                placement={placement}
                warnings={warnings[placement.id] ?? []}
                onKeyboardMove={(direction) => onKeyboardMove(placement, direction)}
              />
            )
          })}
        </div>
      </SortableContext>
    </section>
  )
}
