import {
  parsePlacesMarkdown,
  parseTripMarkdown,
  serializeTripCsv,
  serializeTripJson,
  serializeTripMarkdown,
} from './markdown'

const ids = (...values: string[]) => {
  const queue = [...values]
  return () => queue.shift() ?? `generated-${queue.length}`
}

describe('parsePlacesMarkdown', () => {
  it('parses list markers, fields, and defaults', () => {
    const result = parsePlacesMarkdown(`
- 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 雷門
* 上野公園
1. 東京晴空塔 |  | 120
`)
    expect(result.errors).toEqual([])
    expect(result.places).toEqual([
      {
        name: '淺草寺',
        locationQuery: '東京都台東区浅草2-3-1',
        defaultDurationMinutes: 90,
        notes: '雷門',
      },
      {
        name: '上野公園',
        locationQuery: '上野公園',
        defaultDurationMinutes: 60,
        notes: '',
      },
      {
        name: '東京晴空塔',
        locationQuery: '東京晴空塔',
        defaultDurationMinutes: 120,
        notes: '',
      },
    ])
  })

  it('keeps duplicate names as separate inputs', () => {
    expect(parsePlacesMarkdown('A\nA').places).toHaveLength(2)
  })

  it('returns line errors while preserving valid siblings', () => {
    const result = parsePlacesMarkdown('A | A | 0\nB | B | 30\n | C | 60')
    expect(result.places.map((place) => place.name)).toEqual(['B'])
    expect(result.errors.map((error) => error.lineNumber)).toEqual([1, 3])
  })

  it('rejects overlong names and search text', () => {
    const long = 'a'.repeat(81)
    expect(parsePlacesMarkdown(`${long}\nA | ${long}`).errors).toHaveLength(2)
  })
})

describe('Markdown-first trip document', () => {
  const source = `# 東京旅行

## 備案

- 上野公園 | 上野公園 | 60 | 賞櫻

## Day 1 | 2026-10-03

- @09:00 淺草寺 | 東京都台東区浅草2-3-1 | 90 | 從雷門進入
- 東京晴空塔 | 東京スカイツリー | 120

## Day 2 | 2026-10-04
`

  it('parses title, sections, time, and item order as one transaction', () => {
    const result = parseTripMarkdown(
      source,
      ids('trip', 'place-ueno', 'placement-ueno', 'day-1', 'place-asakusa', 'placement-asakusa', 'place-skytree', 'placement-skytree', 'day-2'),
    )

    expect(result.errors).toEqual([])
    expect(result.trip?.title).toBe('東京旅行')
    expect(result.trip?.days.map((day) => [day.label, day.date])).toEqual([
      ['Day 1', '2026-10-03'],
      ['Day 2', '2026-10-04'],
    ])
    expect(result.trip?.placements.map((item) => [item.dayId, item.order, item.startTime])).toEqual([
      [null, 0, null],
      ['day-1', 0, '09:00'],
      ['day-1', 1, null],
    ])
  })

  it('rejects the full update when any line or section is invalid', () => {
    const result = parseTripMarkdown(`# 壞掉的旅程

## 備案
- @09:00 A | A | 60

## Day 1 | not-a-date
- B | B | 0`)

    expect(result.trip).toBeNull()
    expect(result.errors.map((error) => error.lineNumber)).toEqual([4, 6, 7])
  })

  it('serializes canonical Markdown in container and visual order', () => {
    const result = parseTripMarkdown(source)
    expect(serializeTripMarkdown(result.trip!)).toBe(source.trim())
  })

  it('produces ordered CSV and JSON including backlog and derived end time', () => {
    const trip = parseTripMarkdown(source).trip!
    trip.places[0].notes = '賞櫻, "早點到"'

    const csv = serializeTripCsv(trip)
    expect(csv).toContain('"備案","","0","","","上野公園"')
    expect(csv).toContain('"賞櫻, ""早點到"""')
    expect(csv.indexOf('淺草寺')).toBeLessThan(csv.indexOf('東京晴空塔'))

    const json = JSON.parse(serializeTripJson(trip))
    expect(json.backlog[0].name).toBe('上野公園')
    expect(json.days[0].items[0]).toMatchObject({
      order: 0,
      startTime: '09:00',
      endTime: '10:30',
      name: '淺草寺',
    })
  })
})
