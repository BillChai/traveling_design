import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { DayColumn } from '../components/DayColumn'
import { MarkdownImport } from '../components/MarkdownImport'
import { PlaceForm } from '../components/PlaceForm'
import { TripHeader } from '../components/TripHeader'
import { findScheduleWarnings } from '../domain/time'
import type { NewPlaceInput, Placement } from '../domain/types'
import { loadTrip, saveTrip, type LoadTripResult } from '../persistence/tripStorage'
import { createPlaceBundle, tripReducer } from './tripReducer'
import styles from './App.module.css'

const sortedFor = (placements: Placement[], dayId: string | null) =>
  placements.filter((item) => item.dayId === dayId).sort((a, b) => a.order - b.order)

export default function App() {
  const initialLoad = useRef<LoadTripResult | null>(null)
  if (!initialLoad.current) initialLoad.current = loadTrip(window.localStorage)
  const [trip, dispatch] = useReducer(tripReducer, initialLoad.current.trip)
  const [notice, setNotice] = useState(initialLoad.current.message)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    const result = saveTrip(window.localStorage, trip)
    if (!result.ok) setNotice(result.message)
  }, [trip])

  const placesById = useMemo(
    () => new Map(trip.places.map((place) => [place.id, place])),
    [trip.places],
  )
  const warningsByDay = useMemo(() => {
    const all: Record<string, ReturnType<typeof findScheduleWarnings>[string]> = {}
    for (const day of trip.days) {
      Object.assign(all, findScheduleWarnings(sortedFor(trip.placements, day.id)))
    }
    return all
  }, [trip.days, trip.placements])

  const addPlaces = (inputs: NewPlaceInput[]) => {
    const bundles = inputs.map((input) => createPlaceBundle(input))
    dispatch({ type: 'ADD_PLACES', bundles })
  }

  const move = (placementId: string, targetDayId: string | null, targetIndex: number) => {
    dispatch({ type: 'MOVE_PLACE', placementId, targetDayId, targetIndex })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const activePlacement = trip.placements.find((item) => item.id === active.id)
    if (!activePlacement) return
    const overPlacement = trip.placements.find((item) => item.id === over.id)
    const targetDayId = overPlacement
      ? overPlacement.dayId
      : (over.data.current?.dayId as string | null | undefined)
    if (targetDayId === undefined) return
    const targetItems = sortedFor(trip.placements, targetDayId)
    const targetIndex = overPlacement
      ? targetItems.findIndex((item) => item.id === overPlacement.id)
      : targetItems.length
    move(activePlacement.id, targetDayId, targetIndex)
  }

  const deletePlace = (placeId: string, isScheduled: boolean) => {
    if (isScheduled && !window.confirm('這個景點已排入行程，確定要刪除嗎？')) return
    dispatch({ type: 'DELETE_PLACE', placeId })
  }

  return (
    <main className={styles.appShell}>
      <TripHeader
        title={trip.title}
        startDate={trip.startDate}
        dayCount={trip.days.length}
        dispatch={dispatch}
        onAddDay={() => dispatch({
          type: 'ADD_DAY',
          day: { id: crypto.randomUUID(), date: null, label: '' },
        })}
      />

      {notice && (
        <div className={styles.notice} role="status">
          <span>{notice}</span>
          <button type="button" className="textButton" onClick={() => setNotice(null)}>關閉</button>
        </div>
      )}

      <section className={styles.inputPanel} aria-labelledby="places-heading">
        <div className={styles.sectionIntro}>
          <p className="eyebrow">STEP 1 · COLLECT</p>
          <h2 id="places-heading">先把想去的地方都放進來</h2>
          <p>逐筆輸入，或直接貼上旅行筆記。格式不完整的行不會影響其他景點。</p>
        </div>
        <div className={styles.inputGrid}>
          <PlaceForm onAdd={(place) => addPlaces([place])} />
          <MarkdownImport onImport={addPlaces} />
        </div>
      </section>

      <section className={styles.plannerSection} aria-labelledby="planner-heading">
        <div className={styles.sectionIntro}>
          <p className="eyebrow">STEP 2 · ARRANGE</p>
          <h2 id="planner-heading">拖曳，或用按鈕安排每天順序</h2>
          <p>路線永遠跟著畫面順序，不會依時間或距離偷偷重排。</p>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className={styles.board}>
            <DayColumn
              day={null}
              placements={sortedFor(trip.placements, null)}
              placesById={placesById}
              days={trip.days}
              warnings={{}}
              onMove={move}
              onUpdatePlace={(placeId, changes) => dispatch({ type: 'UPDATE_PLACE', placeId, changes })}
              onUpdateSchedule={() => undefined}
              onDeletePlace={deletePlace}
            />
            {trip.days.map((day) => (
              <DayColumn
                key={day.id}
                day={day}
                placements={sortedFor(trip.placements, day.id)}
                placesById={placesById}
                days={trip.days}
                warnings={warningsByDay}
                canDeleteDay={trip.days.length > 1}
                onDeleteDay={() => {
                  const hasPlaces = trip.placements.some((item) => item.dayId === day.id)
                  if (hasPlaces && !window.confirm('這一天的景點會回到備案區，確定刪除嗎？')) return
                  dispatch({ type: 'DELETE_DAY', dayId: day.id })
                }}
                onMove={move}
                onUpdatePlace={(placeId, changes) => dispatch({ type: 'UPDATE_PLACE', placeId, changes })}
                onUpdateSchedule={(placementId, startTime, durationMinutes) => dispatch({
                  type: 'UPDATE_SCHEDULE', placementId, startTime, durationMinutes,
                })}
                onDeletePlace={deletePlace}
              />
            ))}
          </div>
        </DndContext>
      </section>
      <footer className={styles.footer}>No account. No API key. Your route, your order.</footer>
    </main>
  )
}
