import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { DayColumn } from '../components/DayColumn'
import {
  parseTripMarkdown,
  serializeTripCsv,
  serializeTripJson,
  serializeTripMarkdown,
} from '../domain/markdown'
import { downloadTextFile, TRIP_CSV_FILENAME } from '../domain/download'
import { findScheduleWarnings } from '../domain/time'
import type { ImportError, Placement } from '../domain/types'
import { loadTrip, saveTrip, type LoadTripResult } from '../persistence/tripStorage'
import { tripReducer } from './tripReducer'
import styles from './App.module.css'

const sortedFor = (placements: Placement[], dayId: string | null) =>
  placements.filter((item) => item.dayId === dayId).sort((a, b) => a.order - b.order)

export default function App() {
  const mapsEmbedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim() ?? ''
  const initialLoad = useRef<LoadTripResult | null>(null)
  if (!initialLoad.current) initialLoad.current = loadTrip(window.localStorage)
  const [trip, dispatch] = useReducer(tripReducer, initialLoad.current.trip)
  const [markdown, setMarkdown] = useState(() => serializeTripMarkdown(initialLoad.current!.trip))
  const [errors, setErrors] = useState<ImportError[]>([])
  const [notice, setNotice] = useState(initialLoad.current.message)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
  const canonicalMarkdown = useMemo(() => serializeTripMarkdown(trip), [trip])
  const csv = useMemo(() => serializeTripCsv(trip), [trip])
  const json = useMemo(() => serializeTripJson(trip), [trip])

  const handleDownloadCsv = () => downloadTextFile(csv, TRIP_CSV_FILENAME)

  const updateMarkdown = (value: string) => {
    setMarkdown(value)
    const result = parseTripMarkdown(value)
    setErrors(result.errors)
    if (result.trip) dispatch({ type: 'REPLACE_TRIP', trip: result.trip })
  }

  const move = (
    placementId: string,
    targetDayId: string | null,
    targetIndex: number,
    startTime?: string | null,
  ) => {
    const nextTrip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId,
      targetDayId,
      targetIndex,
      startTime,
    })
    if (nextTrip === trip) return
    dispatch({ type: 'REPLACE_TRIP', trip: nextTrip })
    setMarkdown(serializeTripMarkdown(nextTrip))
    setErrors([])
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
    const targetStartTime = overPlacement
      ? overPlacement.startTime
      : (over.data.current?.startTime as string | null | undefined)
    const targetItems = sortedFor(trip.placements, targetDayId)
      .filter((item) => item.id !== activePlacement.id)
    let targetIndex = targetItems.length
    if (overPlacement) {
      targetIndex = targetItems.findIndex((item) => item.id === overPlacement.id)
      if (targetIndex < 0) targetIndex = targetItems.length
    } else if (targetStartTime) {
      const nextTimedIndex = targetItems.findIndex(
        (item) => item.startTime === null || item.startTime > targetStartTime,
      )
      if (nextTimedIndex >= 0) targetIndex = nextTimedIndex
    }
    move(activePlacement.id, targetDayId, targetIndex, targetStartTime)
  }

  const moveWithKeyboard = (
    placement: Placement,
    direction: 'left' | 'right' | 'up' | 'down',
  ) => {
    if (direction === 'up' || direction === 'down') {
      const items = sortedFor(trip.placements, placement.dayId)
      const currentIndex = items.findIndex((item) => item.id === placement.id)
      const targetIndex = currentIndex + (direction === 'up' ? -1 : 1)
      if (targetIndex < 0 || targetIndex >= items.length) return
      move(placement.id, placement.dayId, targetIndex)
      return
    }

    const containers = [null, ...trip.days.map((day) => day.id)]
    const currentContainer = containers.indexOf(placement.dayId)
    const targetContainer = currentContainer + (direction === 'left' ? -1 : 1)
    if (targetContainer < 0 || targetContainer >= containers.length) return
    move(placement.id, containers[targetContainer], Number.MAX_SAFE_INTEGER)
  }

  return (
    <main className={styles.appShell}>
      <header className={styles.hero}>
        <p className="eyebrow">MARKDOWN-FIRST TRIP PLANNER</p>
        <h1>{trip.title}</h1>
        <p>寫 Markdown，拖曳排序，輸出永遠跟著你的行程。</p>
      </header>

      {notice && <div className={styles.notice} role="status">{notice}</div>}

      <section className={styles.workspace} aria-label="Markdown 行程工作區">
        <div className={styles.editorPanel}>
          <label htmlFor="trip-markdown">Markdown 行程</label>
          <p className={styles.exampleCaption}>格式範例</p>
          <pre className={styles.markdownExample} aria-label="Markdown 格式範例">{`# 東京旅行

## 備案
- 淺草寺 | 淺草寺 | 90

## Day 1 | 2026-10-03
- @09:00 東京晴空塔 | 東京晴空塔 | 120`}</pre>
          <textarea
            id="trip-markdown"
            value={markdown}
            onChange={(event) => updateMarkdown(event.target.value)}
            spellCheck={false}
            aria-describedby="markdown-help markdown-errors"
          />
          <p id="markdown-help" className={styles.help}>
            使用 <code>## 備案</code>、<code>## Day 1 | 2026-10-03</code> 與
            <code>- @09:00 名稱 | 地圖搜尋文字 | 分鐘 | 備註</code>。
          </p>
          <div id="markdown-errors" aria-live="polite">
            {errors.map((error, index) => (
              <p className="errorText" key={`${error.lineNumber}-${index}`}>
                第 {error.lineNumber} 行：{error.message}
              </p>
            ))}
          </div>
        </div>

        <div className={styles.plannerPanel}>
          <p className={styles.dragHint}>
            拖到小時格會寫入 @HH:00；鍵盤用 Alt + ←/→ 跨欄、Alt + ↑/↓ 排序。
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className={styles.board}>
              <DayColumn
                day={null}
                placements={sortedFor(trip.placements, null)}
                placesById={placesById}
                warnings={{}}
                onKeyboardMove={moveWithKeyboard}
              />
              {trip.days.map((day) => (
                <DayColumn
                  key={day.id}
                  day={day}
                  placements={sortedFor(trip.placements, day.id)}
                  placesById={placesById}
                  warnings={warningsByDay}
                  mapsEmbedApiKey={mapsEmbedApiKey}
                  onKeyboardMove={moveWithKeyboard}
                />
              ))}
            </div>
          </DndContext>
        </div>
      </section>

      <section className={styles.outputs} aria-labelledby="outputs-heading">
        <div>
          <p className="eyebrow">DERIVED OUTPUT</p>
          <h2 id="outputs-heading">同一份行程，三種格式</h2>
          <button type="button" className="secondaryButton" onClick={handleDownloadCsv}>
            下載 CSV 時間表
          </button>
        </div>
        <div className={styles.outputGrid}>
          <article>
            <h3>Markdown</h3>
            <pre aria-label="標準 Markdown 輸出">{canonicalMarkdown}</pre>
          </article>
          <article>
            <h3>CSV</h3>
            <pre aria-label="CSV 輸出">{csv}</pre>
          </article>
          <article>
            <h3>JSON</h3>
            <pre aria-label="JSON 輸出">{json}</pre>
          </article>
        </div>
      </section>
    </main>
  )
}
