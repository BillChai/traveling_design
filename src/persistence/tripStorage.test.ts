import { createStarterTrip } from '../app/tripReducer'
import {
  BACKUP_KEY_PREFIX,
  STORAGE_KEY,
  loadTrip,
  saveTrip,
} from './tripStorage'

describe('tripStorage', () => {
  it('round-trips a valid trip', () => {
    const trip = createStarterTrip(() => crypto.randomUUID())
    expect(saveTrip(localStorage, trip)).toEqual({ ok: true })
    const loaded = loadTrip(localStorage)
    expect(loaded.trip).toEqual(trip)
    expect(loaded.message).toBeNull()
  })

  it('returns a starter trip when storage is empty', () => {
    const loaded = loadTrip(localStorage)
    expect(loaded.trip.days).toHaveLength(1)
    expect(loaded.message).toBeNull()
  })

  it.each(['{broken', JSON.stringify({ schemaVersion: 99 })])(
    'backs up malformed or unsupported content',
    (raw) => {
      localStorage.setItem(STORAGE_KEY, raw)
      const loaded = loadTrip(localStorage)
      const backupKey = Object.keys(localStorage).find((key) =>
        key.startsWith(BACKUP_KEY_PREFIX),
      )
      expect(loaded.message).toMatch(/復原/)
      expect(backupKey).toBeDefined()
      expect(localStorage.getItem(backupKey!)).toBe(raw)
    },
  )

  it('does not throw when storage is unavailable', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    } as unknown as Storage
    const loaded = loadTrip(unavailable)
    const saved = saveTrip(unavailable, loaded.trip)
    expect(loaded.message).toMatch(/無法讀取/)
    expect(saved.ok).toBe(false)
  })
})
