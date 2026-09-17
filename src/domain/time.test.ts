import { calculateEndTime, findScheduleWarnings } from './time'

describe('schedule time helpers', () => {
  it('calculates same-day and next-day end labels', () => {
    expect(calculateEndTime(null, 60)).toBeNull()
    expect(calculateEndTime('09:30', 90)).toBe('11:00')
    expect(calculateEndTime('23:30', 90)).toBe('次日 01:00')
  })

  it('uses half-open intervals for overlap detection', () => {
    const noOverlap = findScheduleWarnings([
      { id: 'a', startTime: '09:00', durationMinutes: 60, order: 0 },
      { id: 'b', startTime: '10:00', durationMinutes: 60, order: 1 },
    ])
    expect(noOverlap.a ?? []).toHaveLength(0)

    const overlap = findScheduleWarnings([
      { id: 'a', startTime: '09:00', durationMinutes: 90, order: 0 },
      { id: 'b', startTime: '10:00', durationMinutes: 60, order: 1 },
    ])
    expect(overlap.a?.some((warning) => warning.type === 'overlap')).toBe(true)
    expect(overlap.b?.some((warning) => warning.type === 'overlap')).toBe(true)
  })

  it('warns when visual order disagrees with time order', () => {
    const warnings = findScheduleWarnings([
      { id: 'a', startTime: '11:00', durationMinutes: 30, order: 0 },
      { id: 'b', startTime: '09:00', durationMinutes: 30, order: 1 },
    ])
    expect(warnings.a?.some((warning) => warning.type === 'order')).toBe(true)
    expect(warnings.b?.some((warning) => warning.type === 'order')).toBe(true)
  })
})
