export const TRIP_CSV_FILENAME = 'travel-itinerary.csv'

export const downloadTextFile = (
  content: string,
  filename: string = TRIP_CSV_FILENAME,
  mimeType = 'text/csv;charset=utf-8',
): void => {
  const blob = new Blob([`\uFEFF${content}`], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
