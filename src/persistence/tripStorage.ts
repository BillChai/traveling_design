import { createStarterTrip, normalizeTrip } from '../app/tripReducer'
import { isValidDateString } from '../domain/date'
import { TRIP_SCHEMA_VERSION, type Trip } from '../domain/types'

export const STORAGE_KEY = 'traveling-design.trip.v1'
export const BACKUP_KEY_PREFIX = 'traveling-design.trip.backup.'

export interface LoadTripResult {
  trip: Trip
  message: string | null
}

export type SaveTripResult = { ok: true } | { ok: false; message: string }

const isString = (value: unknown): value is string => typeof value === 'string'
const isNullableString = (value: unknown): value is string | null => value === null || isString(value)
const hasUniqueIds = (items: Array<{ id: string }>) =>
  new Set(items.map((item) => item.id)).size === items.length

const isValidTrip = (value: unknown): value is Trip => {
  if (!value || typeof value !== 'object') return false
  const trip = value as Partial<Trip>
  if (
    trip.schemaVersion !== TRIP_SCHEMA_VERSION ||
    !isString(trip.id) ||
    !isString(trip.title) ||
    trip.title.trim().length < 1 ||
    trip.title.trim().length > 80 ||
    !isNullableString(trip.startDate) ||
    (trip.startDate !== null && !isValidDateString(trip.startDate)) ||
    !Array.isArray(trip.places) ||
    !Array.isArray(trip.placements) ||
    !Array.isArray(trip.days) ||
    trip.days.length === 0
  ) return false

  const shapesAreValid = (
    trip.places.every((place) =>
      place &&
      isString(place.id) &&
      place.id.length > 0 &&
      isString(place.name) &&
      place.name.trim().length >= 1 &&
      place.name.trim().length <= 80 &&
      isString(place.locationQuery) &&
      place.locationQuery.trim().length >= 1 &&
      place.locationQuery.trim().length <= 80 &&
      isString(place.notes) &&
      place.notes.length <= 1000 &&
      Number.isInteger(place.defaultDurationMinutes) &&
      place.defaultDurationMinutes >= 1 &&
      place.defaultDurationMinutes <= 1440,
    ) &&
    trip.days.every((day) =>
      day &&
      isString(day.id) &&
      day.id.length > 0 &&
      isNullableString(day.date) &&
      (day.date === null || isValidDateString(day.date)) &&
      isString(day.label),
    ) &&
    trip.placements.every((item) =>
      item &&
      isString(item.id) &&
      item.id.length > 0 &&
      isString(item.placeId) &&
      isNullableString(item.dayId) &&
      Number.isInteger(item.order) &&
      item.order >= 0 &&
      isNullableString(item.startTime) &&
      (item.startTime === null || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item.startTime)) &&
      Number.isInteger(item.durationMinutes) &&
      item.durationMinutes >= 1 &&
      item.durationMinutes <= 1440,
    )
  )

  if (!shapesAreValid) return false
  const placeIds = new Set(trip.places.map((place) => place.id))
  const dayIds = new Set(trip.days.map((day) => day.id))
  return (
    hasUniqueIds(trip.places) &&
    hasUniqueIds(trip.days) &&
    hasUniqueIds(trip.placements) &&
    trip.placements.every((item) =>
      placeIds.has(item.placeId) && (item.dayId === null || dayIds.has(item.dayId)),
    )
  )
}

const recover = (storage: Storage, raw: string): LoadTripResult => {
  try {
    storage.setItem(`${BACKUP_KEY_PREFIX}${new Date().toISOString()}`, raw)
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Recovery still succeeds in memory when the backing store is read-only.
  }
  return {
    trip: createStarterTrip(),
    message: '已偵測到無法使用的舊資料，並復原為新的旅程。',
  }
}

export const loadTrip = (storage: Storage): LoadTripResult => {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { trip: createStarterTrip(), message: '無法讀取本機儲存空間，將暫時只保留於此頁。' }
  }
  if (raw === null) return { trip: createStarterTrip(), message: null }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidTrip(parsed)) return recover(storage, raw)
    return { trip: normalizeTrip(parsed), message: null }
  } catch {
    return recover(storage, raw)
  }
}

export const saveTrip = (storage: Storage, trip: Trip): SaveTripResult => {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(trip))
    return { ok: true }
  } catch {
    return { ok: false, message: '無法寫入本機儲存空間，本次變更只保留於此頁。' }
  }
}
