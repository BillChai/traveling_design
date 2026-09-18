import { isValidDateString } from './date'
import { calculateEndTime } from './time'
import {
  TRIP_SCHEMA_VERSION,
  type ImportError,
  type ImportResult,
  type NewPlaceInput,
  type Place,
  type Placement,
  type Trip,
} from './types'

const LIST_MARKER = /^\s*(?:[-*+]\s+|\d+\.\s+)/
const TIME_PREFIX = /^@((?:[01]\d|2[0-3]):[0-5]\d)\s+/

export type MarkdownIdFactory = () => string

export interface TripMarkdownResult {
  trip: Trip | null
  errors: ImportError[]
}

interface ParsedPlaceLine {
  place: NewPlaceInput | null
  startTime: string | null
  message: string | null
}

const defaultIdFactory: MarkdownIdFactory = () => crypto.randomUUID()

const parsePlaceLine = (rawLine: string): ParsedPlaceLine => {
  let content = rawLine.replace(LIST_MARKER, '').trim()
  let startTime: string | null = null

  if (content.startsWith('@')) {
    const match = content.match(TIME_PREFIX)
    if (!match) {
      return { place: null, startTime: null, message: '開始時間必須使用 @HH:MM 格式。' }
    }
    startTime = match[1]
    content = content.slice(match[0].length)
  }

  const fields = content.split('|').map((field) => field.trim())
  const [name = '', rawLocation = '', rawDuration = '', notes = ''] = fields
  let message: string | null = null

  if (fields.length > 4) message = '欄位不可超過四個。'
  else if (!name) message = '景點名稱不可空白。'
  else if (name.length > 80) message = '景點名稱不可超過 80 字元。'
  else if (rawLocation.length > 80) message = '地圖搜尋文字不可超過 80 字元。'
  else if (notes.length > 1000) message = '備註不可超過 1,000 字元。'

  const duration = rawDuration ? Number(rawDuration) : 60
  if (!message && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
    message = '停留分鐘必須是 1 到 1,440 的整數。'
  }

  return {
    startTime,
    message,
    place: message
      ? null
      : {
          name,
          locationQuery: rawLocation || name,
          defaultDurationMinutes: duration,
          notes,
        },
  }
}

export const parsePlacesMarkdown = (input: string): ImportResult => {
  const result: ImportResult = { places: [], errors: [] }

  input.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) return
    const parsed = parsePlaceLine(rawLine)
    if (parsed.message || !parsed.place) {
      result.errors.push({
        lineNumber: index + 1,
        line: rawLine,
        message: parsed.message ?? '無法解析景點。',
      })
      return
    }
    result.places.push(parsed.place)
  })

  return result
}

export const parseTripMarkdown = (
  input: string,
  idFactory: MarkdownIdFactory = defaultIdFactory,
): TripMarkdownResult => {
  const errors: ImportError[] = []
  const tripId = idFactory()
  let title = '我的旅程'
  let sawTitle = false
  let sawBacklog = false
  let sawDayHeading = false
  let currentDayId: string | null | undefined
  const days: Trip['days'] = []
  const places: Place[] = []
  const placements: Placement[] = []
  const orderByContainer = new Map<string | null, number>()

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1
    const trimmed = rawLine.trim()
    if (!trimmed) return

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      if (sawTitle) {
        errors.push({ lineNumber, line: rawLine, message: '旅程名稱只能出現一次。' })
        return
      }
      title = trimmed.slice(2).trim()
      sawTitle = true
      if (!title || title.length > 80) {
        errors.push({ lineNumber, line: rawLine, message: '旅程名稱必須為 1 到 80 字元。' })
      }
      return
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim()
      if (heading === '備案') {
        if (sawBacklog) {
          errors.push({ lineNumber, line: rawLine, message: '只能有一個備案 section。' })
        }
        sawBacklog = true
        currentDayId = null
        orderByContainer.set(null, 0)
        return
      }

      sawDayHeading = true
      const fields = heading.split('|').map((field) => field.trim())
      const [label = '', dateText = ''] = fields
      if (!label || fields.length > 2) {
        errors.push({ lineNumber, line: rawLine, message: '日期 heading 格式為 ## Day N | YYYY-MM-DD。' })
        currentDayId = undefined
        return
      }
      if (dateText && !isValidDateString(dateText)) {
        errors.push({ lineNumber, line: rawLine, message: '日期必須使用 YYYY-MM-DD 格式。' })
        currentDayId = undefined
        return
      }
      const dayId = idFactory()
      days.push({ id: dayId, label, date: dateText || null })
      currentDayId = dayId
      orderByContainer.set(dayId, 0)
      return
    }

    if (!LIST_MARKER.test(rawLine)) {
      errors.push({ lineNumber, line: rawLine, message: '內容必須是 heading 或 Markdown list item。' })
      return
    }
    if (currentDayId === undefined) {
      errors.push({ lineNumber, line: rawLine, message: '景點必須放在備案或日期 section 中。' })
      return
    }

    const parsed = parsePlaceLine(rawLine)
    if (parsed.message || !parsed.place) {
      errors.push({
        lineNumber,
        line: rawLine,
        message: parsed.message ?? '無法解析景點。',
      })
      return
    }
    if (currentDayId === null && parsed.startTime) {
      errors.push({ lineNumber, line: rawLine, message: '備案景點不可設定開始時間。' })
      return
    }

    const placeId = idFactory()
    const placementId = idFactory()
    const order = orderByContainer.get(currentDayId) ?? 0
    orderByContainer.set(currentDayId, order + 1)
    places.push({ id: placeId, ...parsed.place })
    placements.push({
      id: placementId,
      placeId,
      dayId: currentDayId,
      order,
      startTime: parsed.startTime,
      durationMinutes: parsed.place.defaultDurationMinutes,
    })
  })

  if (!sawBacklog) {
    errors.push({ lineNumber: 1, line: '', message: '文件必須包含 ## 備案。' })
  }
  if (!sawDayHeading) {
    errors.push({ lineNumber: 1, line: '', message: '文件至少需要一個日期 section。' })
  }
  if (errors.length > 0) return { trip: null, errors }

  return {
    errors: [],
    trip: {
      schemaVersion: TRIP_SCHEMA_VERSION,
      id: tripId,
      title,
      startDate: days[0]?.date ?? null,
      places,
      placements,
      days,
    },
  }
}

const sortedPlacements = (trip: Trip, dayId: string | null) =>
  trip.placements
    .filter((placement) => placement.dayId === dayId)
    .sort((a, b) => a.order - b.order)

const serializeItem = (trip: Trip, placement: Placement): string => {
  const place = trip.places.find((candidate) => candidate.id === placement.placeId)
  if (!place) return ''
  const time = placement.startTime ? `@${placement.startTime} ` : ''
  const notes = place.notes ? ` | ${place.notes}` : ''
  return `- ${time}${place.name} | ${place.locationQuery} | ${placement.durationMinutes}${notes}`
}

export const serializeTripMarkdown = (trip: Trip): string => {
  const section = (heading: string, items: string[]) =>
    items.length > 0 ? `${heading}\n\n${items.join('\n')}` : heading
  const sections = [
    `# ${trip.title}`,
    section('## 備案', sortedPlacements(trip, null).map((item) => serializeItem(trip, item)).filter(Boolean)),
    ...trip.days.map((day) => {
      const heading = `## ${day.label}${day.date ? ` | ${day.date}` : ''}`
      return section(heading, sortedPlacements(trip, day.id).map((item) => serializeItem(trip, item)).filter(Boolean))
    }),
  ]
  return sections.join('\n\n')
}

interface ExportItem {
  section: string
  date: string | null
  order: number
  startTime: string | null
  endTime: string | null
  name: string
  mapQuery: string
  durationMinutes: number
  note: string
}

const exportItemsFor = (trip: Trip, section: string, date: string | null, dayId: string | null): ExportItem[] =>
  sortedPlacements(trip, dayId).flatMap((placement) => {
    const place = trip.places.find((candidate) => candidate.id === placement.placeId)
    if (!place) return []
    return [{
      section,
      date,
      order: placement.order,
      startTime: placement.startTime,
      endTime: calculateEndTime(placement.startTime, placement.durationMinutes),
      name: place.name,
      mapQuery: place.locationQuery,
      durationMinutes: placement.durationMinutes,
      note: place.notes,
    }]
  })

const compareNullableText = (left: string | null, right: string | null): number => {
  if (left === right) return 0
  if (left === null) return 1
  if (right === null) return -1
  return left.localeCompare(right)
}

const csvExportItems = (trip: Trip): ExportItem[] => {
  const scheduled = trip.days.flatMap((day, dayIndex) =>
    exportItemsFor(trip, day.label, day.date, day.id).map((item) => ({ item, dayIndex })),
  )

  scheduled.sort((left, right) =>
    compareNullableText(left.item.date, right.item.date)
    || compareNullableText(left.item.startTime, right.item.startTime)
    || left.item.order - right.item.order
    || left.dayIndex - right.dayIndex,
  )

  const backlog = exportItemsFor(trip, 'backlog', null, null)
  return [...scheduled.map(({ item }) => item), ...backlog]
}

const csvField = (value: string | number | null) =>
  `"${String(value ?? '').replaceAll('"', '""')}"`

export const serializeTripCsv = (trip: Trip): string => {
  const header = 'section,date,order,startTime,endTime,name,mapQuery,durationMinutes,note'
  const rows = csvExportItems(trip).map((item) => [
    item.section,
    item.date,
    item.order,
    item.startTime,
    item.endTime,
    item.name,
    item.mapQuery,
    item.durationMinutes,
    item.note,
  ].map(csvField).join(','))
  return [header, ...rows].join('\n')
}

export const serializeTripJson = (trip: Trip): string => {
  const backlog = exportItemsFor(trip, '備案', null, null).map(({ section: _section, date: _date, ...item }) => item)
  const days = trip.days.map((day) => ({
    label: day.label,
    date: day.date,
    items: exportItemsFor(trip, day.label, day.date, day.id).map(({ section: _section, date: _date, ...item }) => item),
  }))
  return JSON.stringify({ title: trip.title, backlog, days }, null, 2)
}
