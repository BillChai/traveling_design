import { parsePlacesMarkdown } from './markdown'

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
