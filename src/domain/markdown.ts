import type { ImportResult, NewPlaceInput } from './types'

const LIST_MARKER = /^\s*(?:[-*+]\s+|\d+\.\s+)/

export const parsePlacesMarkdown = (input: string): ImportResult => {
  const result: ImportResult = { places: [], errors: [] }

  input.split(/\r?\n/).forEach((rawLine, index) => {
    if (!rawLine.trim()) return

    const lineNumber = index + 1
    const content = rawLine.replace(LIST_MARKER, '').trim()
    const fields = content.split('|').map((field) => field.trim())
    const [name = '', rawLocation = '', rawDuration = '', notes = ''] = fields
    let message: string | null = null

    if (fields.length > 4) message = '欄位不可超過四個。'
    else if (!name) message = '景點名稱不可空白。'
    else if (name.length > 80) message = '景點名稱不可超過 80 字元。'
    else if (rawLocation.length > 80) message = '地圖搜尋文字不可超過 80 字元。'
    else if (notes.length > 1000) message = '備註不可超過 1,000 字元。'

    const duration = rawDuration ? Number(rawDuration) : 60
    if (
      !message &&
      (!Number.isInteger(duration) || duration < 1 || duration > 1440)
    ) {
      message = '停留分鐘必須是 1 到 1,440 的整數。'
    }

    if (message) {
      result.errors.push({ lineNumber, line: rawLine, message })
      return
    }

    const place: NewPlaceInput = {
      name,
      locationQuery: rawLocation || name,
      defaultDurationMinutes: duration,
      notes,
    }
    result.places.push(place)
  })

  return result
}
