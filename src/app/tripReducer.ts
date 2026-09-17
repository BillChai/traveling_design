import { buildDayDate, isValidDateString } from '../domain/date'
import {
  TRIP_SCHEMA_VERSION,
  type ContainerId,
  type DayPlan,
  type NewPlaceInput,
  type PlaceBundle,
  type Placement,
  type Trip,
  type TripAction,
} from '../domain/types'

export type IdFactory = () => string

const defaultIdFactory: IdFactory = () => crypto.randomUUID()

const relabelDays = (days: DayPlan[], startDate: string | null): DayPlan[] =>
  days.map((day, index) => ({
    ...day,
    label: `Day ${index + 1}`,
    date: buildDayDate(startDate, index),
  }))

const normalizeOrders = (placements: Placement[], days: DayPlan[]): Placement[] => {
  const containerIds: ContainerId[] = [null, ...days.map((day) => day.id)]
  const updates = new Map<string, Placement>()
  for (const containerId of containerIds) {
    placements
      .filter((item) => item.dayId === containerId)
      .sort((a, b) => a.order - b.order)
      .forEach((item, order) => {
        updates.set(item.id, {
          ...item,
          order,
          startTime: containerId === null ? null : item.startTime,
        })
      })
  }
  return placements.map((item) => updates.get(item.id) ?? item)
}

export const createStarterTrip = (idFactory: IdFactory = defaultIdFactory): Trip => {
  const tripId = idFactory()
  const dayId = idFactory()
  return {
    schemaVersion: TRIP_SCHEMA_VERSION,
    id: tripId,
    title: '我的旅程',
    startDate: null,
    places: [],
    placements: [],
    days: [{ id: dayId, date: null, label: 'Day 1' }],
  }
}

export const createPlaceBundle = (
  input: NewPlaceInput,
  idFactory: IdFactory = defaultIdFactory,
): PlaceBundle => {
  const placeId = idFactory()
  const placementId = idFactory()
  const name = input.name.trim()
  return {
    place: {
      id: placeId,
      name,
      locationQuery: input.locationQuery.trim() || name,
      notes: input.notes.trim(),
      defaultDurationMinutes: input.defaultDurationMinutes,
    },
    placement: {
      id: placementId,
      placeId,
      dayId: null,
      order: 0,
      startTime: null,
      durationMinutes: input.defaultDurationMinutes,
    },
  }
}

export const normalizeTrip = (
  trip: Trip,
  idFactory: IdFactory = defaultIdFactory,
): Trip => {
  const validDayIds = new Set(trip.days.map((day) => day.id))
  const firstPlacementByPlace = new Map<string, Placement>()
  for (const placement of trip.placements) {
    if (
      trip.places.some((place) => place.id === placement.placeId) &&
      !firstPlacementByPlace.has(placement.placeId)
    ) {
      firstPlacementByPlace.set(placement.placeId, placement)
    }
  }

  let nextBacklogOrder =
    Math.max(
      -1,
      ...Array.from(firstPlacementByPlace.values())
        .filter((item) => item.dayId === null || !validDayIds.has(item.dayId))
        .map((item) => item.order),
    ) + 1

  const placements = trip.places.map((place) => {
    const existing = firstPlacementByPlace.get(place.id)
    if (!existing) {
      return {
        id: idFactory(),
        placeId: place.id,
        dayId: null,
        order: nextBacklogOrder++,
        startTime: null,
        durationMinutes: place.defaultDurationMinutes,
      } satisfies Placement
    }
    const dayId = existing.dayId && validDayIds.has(existing.dayId) ? existing.dayId : null
    return { ...existing, dayId, startTime: dayId ? existing.startTime : null }
  })

  const days = relabelDays(trip.days.length ? trip.days : [{ id: idFactory(), date: null, label: '' }], trip.startDate)
  return { ...trip, days, placements: normalizeOrders(placements, days) }
}

const movePlacement = (
  state: Trip,
  placementId: string,
  targetDayId: ContainerId,
  targetIndex: number,
): Trip => {
  const moving = state.placements.find((item) => item.id === placementId)
  if (!moving) return state
  if (targetDayId !== null && !state.days.some((day) => day.id === targetDayId)) return state

  const others = state.placements.filter((item) => item.id !== placementId)
  const target = others
    .filter((item) => item.dayId === targetDayId)
    .sort((a, b) => a.order - b.order)
  const index = Math.max(0, Math.min(targetIndex, target.length))
  target.splice(index, 0, {
    ...moving,
    dayId: targetDayId,
    startTime: targetDayId === null ? null : moving.startTime,
  })
  const targetUpdates = new Map(target.map((item, order) => [item.id, { ...item, order }]))
  const placements = [...others, moving].map((item) => targetUpdates.get(item.id) ?? item)
  return { ...state, placements: normalizeOrders(placements, state.days) }
}

export const tripReducer = (state: Trip, action: TripAction): Trip => {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.title }
    case 'SET_START_DATE': {
      const startDate = action.startDate && isValidDateString(action.startDate) ? action.startDate : null
      return { ...state, startDate, days: relabelDays(state.days, startDate) }
    }
    case 'ADD_DAY': {
      if (state.days.some((day) => day.id === action.day.id)) return state
      const days = relabelDays([...state.days, action.day], state.startDate)
      return { ...state, days }
    }
    case 'DELETE_DAY': {
      if (state.days.length === 1 || !state.days.some((day) => day.id === action.dayId)) return state
      const backlog = state.placements
        .filter((item) => item.dayId === null)
        .sort((a, b) => a.order - b.order)
      const returning = state.placements
        .filter((item) => item.dayId === action.dayId)
        .sort((a, b) => a.order - b.order)
      const backlogUpdates = new Map(
        [...backlog, ...returning].map((item, order) => [
          item.id,
          { ...item, dayId: null, startTime: null, order } satisfies Placement,
        ]),
      )
      const days = relabelDays(
        state.days.filter((day) => day.id !== action.dayId),
        state.startDate,
      )
      const placements = state.placements.map((item) => backlogUpdates.get(item.id) ?? item)
      return { ...state, days, placements: normalizeOrders(placements, days) }
    }
    case 'ADD_PLACE':
      return normalizeTrip({
        ...state,
        places: [...state.places, action.bundle.place],
        placements: [...state.placements, { ...action.bundle.placement, order: state.placements.filter((item) => item.dayId === null).length }],
      })
    case 'ADD_PLACES':
      return normalizeTrip({
        ...state,
        places: [...state.places, ...action.bundles.map((bundle) => bundle.place)],
        placements: [...state.placements, ...action.bundles.map((bundle, index) => ({
          ...bundle.placement,
          order: state.placements.filter((item) => item.dayId === null).length + index,
        }))],
      })
    case 'UPDATE_PLACE':
      return {
        ...state,
        places: state.places.map((place) =>
          place.id === action.placeId ? { ...place, ...action.changes } : place,
        ),
        placements: state.placements.map((item) =>
          item.placeId === action.placeId &&
          item.dayId === null &&
          action.changes.defaultDurationMinutes !== undefined
            ? { ...item, durationMinutes: action.changes.defaultDurationMinutes }
            : item,
        ),
      }
    case 'DELETE_PLACE':
      return normalizeTrip({
        ...state,
        places: state.places.filter((place) => place.id !== action.placeId),
        placements: state.placements.filter((item) => item.placeId !== action.placeId),
      })
    case 'MOVE_PLACE':
      return movePlacement(state, action.placementId, action.targetDayId, action.targetIndex)
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        placements: state.placements.map((item) =>
          item.id === action.placementId && item.dayId !== null
            ? {
                ...item,
                startTime: action.startTime,
                durationMinutes: action.durationMinutes,
              }
            : item,
        ),
      }
  }
}
