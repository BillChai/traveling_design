const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export const isValidDateString = (value: string): boolean => {
  const match = DATE_PATTERN.exec(value)
  if (!match) return false

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  )
}

export const addDays = (dateString: string, amount: number): string => {
  if (!isValidDateString(dateString)) {
    throw new Error(`Invalid calendar date: ${dateString}`)
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + amount))
  return date.toISOString().slice(0, 10)
}

export const buildDayDate = (
  startDate: string | null,
  zeroBasedDayIndex: number,
): string | null => (startDate ? addDays(startDate, zeroBasedDayIndex) : null)
