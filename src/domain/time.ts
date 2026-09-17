import type { ScheduledItem, ScheduleWarning } from './types'

const toMinutes = (time: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export const calculateEndTime = (
  startTime: string | null,
  durationMinutes: number,
): string | null => {
  if (!startTime) return null
  const start = toMinutes(startTime)
  if (start === null) return null

  const end = start + durationMinutes
  const prefix = end >= 1440 ? '次日 ' : ''
  const clockMinutes = end % 1440
  const hours = Math.floor(clockMinutes / 60).toString().padStart(2, '0')
  const minutes = (clockMinutes % 60).toString().padStart(2, '0')
  return `${prefix}${hours}:${minutes}`
}

export const findScheduleWarnings = (
  items: ScheduledItem[],
): Record<string, ScheduleWarning[]> => {
  const warnings: Record<string, ScheduleWarning[]> = {}
  const timed = items
    .map((item) => ({ ...item, minutes: item.startTime ? toMinutes(item.startTime) : null }))
    .filter((item): item is typeof item & { minutes: number } => item.minutes !== null)

  const addWarning = (id: string, warning: ScheduleWarning) => {
    const list = warnings[id] ?? []
    if (!list.some((existing) => existing.type === warning.type)) list.push(warning)
    warnings[id] = list
  }

  for (let leftIndex = 0; leftIndex < timed.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < timed.length; rightIndex += 1) {
      const left = timed[leftIndex]
      const right = timed[rightIndex]
      const overlaps =
        left.minutes < right.minutes + right.durationMinutes &&
        right.minutes < left.minutes + left.durationMinutes
      if (overlaps) {
        addWarning(left.id, { type: 'overlap', message: '此時段與其他景點重疊。' })
        addWarning(right.id, { type: 'overlap', message: '此時段與其他景點重疊。' })
      }
    }
  }

  const visualOrder = [...timed].sort((a, b) => a.order - b.order)
  const timeOrder = [...timed].sort((a, b) => a.minutes - b.minutes || a.order - b.order)
  if (visualOrder.some((item, index) => item.id !== timeOrder[index]?.id)) {
    for (const item of timed) {
      addWarning(item.id, { type: 'order', message: '排列順序與開始時間不一致。' })
    }
  }

  return warnings
}
