import { useEffect, useRef, type ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { buildGoogleMapsLinks } from '../domain/maps'
import type { DayPlan, MapLink, Place, Placement, ScheduleWarning } from '../domain/types'
import { PlaceCard } from './PlaceCard'

const HOURS = Array.from({ length: 24 }, (_, hour) => `${hour.toString().padStart(2, '0')}:00`)

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

interface DropAreaProps {
  id: string
  dayId: string
  startTime: string | null
  children: ReactNode
}

function UnscheduledArea({ id, dayId, startTime, children }: DropAreaProps) {
  const droppable = useDroppable({ id, data: { dayId, startTime } })
  return (
    <section
      ref={droppable.setNodeRef}
      className={`unscheduledArea ${droppable.isOver ? 'isOver' : ''}`}
      aria-label="未設定時間"
    >
      <p>未設定時間</p>
      <div className="unscheduledCards">{children}</div>
    </section>
  )
}

function HourSlot({ id, dayId, startTime, children }: DropAreaProps) {
  const droppable = useDroppable({ id, data: { dayId, startTime } })
  return (
    <div
      ref={droppable.setNodeRef}
      className={`hourSlot ${droppable.isOver ? 'isOver' : ''}`}
      role="group"
      aria-label={startTime ?? undefined}
    >
      <time dateTime={startTime ?? undefined}>{startTime}</time>
      <div className="hourContent">{children}</div>
    </div>
  )
}

export function DayColumn({ day, placements, placesById, warnings, onKeyboardMove }: DayColumnProps) {
  const containerId = `container:${day?.id ?? 'backlog'}`
  const droppable = useDroppable({
    id: containerId,
    data: { dayId: day?.id ?? null, startTime: day ? null : undefined },
  })
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (day && timelineRef.current) timelineRef.current.scrollTop = 7 * 76
  }, [day?.id])

  const routePlaces = placements.flatMap((placement) => {
    const place = placesById.get(placement.placeId)
    return place ? [{ id: place.id, name: place.name, locationQuery: place.locationQuery }] : []
  })
  const links: MapLink[] = day ? buildGoogleMapsLinks(routePlaces) : []
  const untimed = day ? placements.filter((placement) => !placement.startTime) : placements

  const cards = (items: Placement[]) => items.map((placement) => {
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
  })

  return (
    <section
      ref={droppable.setNodeRef}
      className={`dayColumn ${droppable.isOver ? 'isOver' : ''}`}
      aria-labelledby={`${containerId}-heading`}
    >
      <header className="columnHeading">
        <p className="columnKicker">{day ? 'TIMELINE' : 'IDEAS'}</p>
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
        {!day && (
          <div className="cardList">
            {placements.length === 0 && <p className="emptyState">在 Markdown 加入景點。</p>}
            {cards(placements)}
          </div>
        )}

        {day && (
          <>
            <UnscheduledArea id={`unscheduled:${day.id}`} dayId={day.id} startTime={null}>
              {untimed.length === 0 ? <span>拖到這裡可清除時間</span> : cards(untimed)}
            </UnscheduledArea>
            <div ref={timelineRef} className="hourlyTimeline" aria-label={`${day.label} 24 小時時間軸`}>
              {HOURS.map((time) => (
                <HourSlot key={time} id={`hour:${day.id}:${time}`} dayId={day.id} startTime={time}>
                  {cards(placements.filter((placement) => placement.startTime?.startsWith(time.slice(0, 2))))}
                </HourSlot>
              ))}
            </div>
          </>
        )}
      </SortableContext>
    </section>
  )
}
