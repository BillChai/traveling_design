import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { buildGoogleMapsLinks } from '../domain/maps'
import type { DayPlan, MapLink, Place, Placement, ScheduleWarning } from '../domain/types'
import { PlaceCard } from './PlaceCard'

interface DayColumnProps {
  day: DayPlan | null
  placements: Placement[]
  placesById: Map<string, Place>
  days: DayPlan[]
  warnings: Record<string, ScheduleWarning[]>
  onMove: (placementId: string, targetDayId: string | null, targetIndex: number) => void
  onUpdatePlace: (placeId: string, changes: Partial<Omit<Place, 'id'>>) => void
  onUpdateSchedule: (placementId: string, startTime: string | null, durationMinutes: number) => void
  onDeletePlace: (placeId: string, isScheduled: boolean) => void
  onDeleteDay?: () => void
  canDeleteDay?: boolean
}

export function DayColumn({
  day,
  placements,
  placesById,
  days,
  warnings,
  onMove,
  onUpdatePlace,
  onUpdateSchedule,
  onDeletePlace,
  onDeleteDay,
  canDeleteDay,
}: DayColumnProps) {
  const containerId = `container:${day?.id ?? 'backlog'}`
  const droppable = useDroppable({ id: containerId, data: { dayId: day?.id ?? null } })
  const routePlaces = placements.flatMap((placement) => {
    const place = placesById.get(placement.placeId)
    return place ? [{ id: place.id, name: place.name, locationQuery: place.locationQuery }] : []
  })
  const links: MapLink[] = day ? buildGoogleMapsLinks(routePlaces) : []

  return (
    <section ref={droppable.setNodeRef} className={`dayColumn ${droppable.isOver ? 'isOver' : ''}`} aria-labelledby={`${containerId}-heading`}>
      <div className="columnHeading">
        <div>
          <p className="columnKicker">{day ? 'ITINERARY' : 'IDEAS'}</p>
          <h2 id={`${containerId}-heading`}>{day?.label ?? '備案區'}</h2>
          <p>{day?.date ?? (day ? '尚未設定日期' : '還沒決定哪一天也沒關係')}</p>
        </div>
        {day && (
          <button type="button" className="textButton dangerText" disabled={!canDeleteDay} onClick={onDeleteDay}>
            刪除這天
          </button>
        )}
      </div>

      {day && (
        <div className="routeLinks">
          {links.length === 0 && <p>加入景點後即可產生 Google Maps 連結。</p>}
          {links.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>
          ))}
        </div>
      )}

      <SortableContext items={placements.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="cardList">
          {placements.length === 0 && (
            <p className="emptyState">{day ? '從備案區移入景點，開始安排這一天。' : '先從上方新增或匯入想去的景點。'}</p>
          )}
          {placements.map((placement, index) => {
            const place = placesById.get(placement.placeId)
            if (!place) return null
            return (
              <PlaceCard
                key={placement.id}
                place={place}
                placement={placement}
                days={days}
                index={index}
                total={placements.length}
                warnings={warnings[placement.id] ?? []}
                onMove={(targetDayId, targetIndex) => onMove(placement.id, targetDayId, targetIndex)}
                onUpdatePlace={(changes) => onUpdatePlace(place.id, changes)}
                onUpdateSchedule={(startTime, durationMinutes) => onUpdateSchedule(placement.id, startTime, durationMinutes)}
                onDelete={() => onDeletePlace(place.id, placement.dayId !== null)}
              />
            )
          })}
        </div>
      </SortableContext>
    </section>
  )
}
