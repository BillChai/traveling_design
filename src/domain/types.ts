export const TRIP_SCHEMA_VERSION = 1 as const

export type ContainerId = string | null

export interface Place {
  id: string
  name: string
  locationQuery: string
  notes: string
  defaultDurationMinutes: number
}

export interface Placement {
  id: string
  placeId: string
  dayId: ContainerId
  order: number
  startTime: string | null
  durationMinutes: number
}

export interface DayPlan {
  id: string
  date: string | null
  label: string
}

export interface Trip {
  schemaVersion: typeof TRIP_SCHEMA_VERSION
  id: string
  title: string
  startDate: string | null
  places: Place[]
  placements: Placement[]
  days: DayPlan[]
}

export interface NewPlaceInput {
  name: string
  locationQuery: string
  notes: string
  defaultDurationMinutes: number
}

export interface ImportError {
  lineNumber: number
  line: string
  message: string
}

export interface ImportResult {
  places: NewPlaceInput[]
  errors: ImportError[]
}

export interface ScheduledItem {
  id: string
  startTime: string | null
  durationMinutes: number
  order: number
}

export interface ScheduleWarning {
  type: 'overlap' | 'order'
  message: string
}

export interface RoutePlace {
  id: string
  name: string
  locationQuery: string
}

export interface MapLink {
  label: string
  url: string
  placeIds: string[]
}

export interface PlaceBundle {
  place: Place
  placement: Placement
}

export type TripAction =
  | { type: 'REPLACE_TRIP'; trip: Trip }
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_START_DATE'; startDate: string | null }
  | { type: 'ADD_DAY'; day: DayPlan }
  | { type: 'DELETE_DAY'; dayId: string }
  | { type: 'ADD_PLACE'; bundle: PlaceBundle }
  | { type: 'ADD_PLACES'; bundles: PlaceBundle[] }
  | { type: 'UPDATE_PLACE'; placeId: string; changes: Partial<Omit<Place, 'id'>> }
  | { type: 'DELETE_PLACE'; placeId: string }
  | {
      type: 'MOVE_PLACE'
      placementId: string
      targetDayId: ContainerId
      targetIndex: number
      startTime?: string | null
    }
  | {
      type: 'UPDATE_SCHEDULE'
      placementId: string
      startTime: string | null
      durationMinutes: number
    }
