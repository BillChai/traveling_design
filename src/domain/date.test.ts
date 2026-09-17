import { addDays, buildDayDate, isValidDateString } from './date'

describe('date helpers', () => {
  it('validates calendar dates instead of only matching a pattern', () => {
    expect(isValidDateString('2026-02-28')).toBe(true)
    expect(isValidDateString('2026-02-30')).toBe(false)
    expect(isValidDateString('17-09-2026')).toBe(false)
  })

  it('adds days without local timezone rollover', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('returns null when a trip has no start date', () => {
    expect(buildDayDate(null, 3)).toBeNull()
    expect(buildDayDate('2026-10-03', 2)).toBe('2026-10-05')
  })
})
