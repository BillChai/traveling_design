import type { DayPlan, PlaceBundle } from '../domain/types'
import {
  createPlaceBundle,
  createStarterTrip,
  normalizeTrip,
  tripReducer,
} from './tripReducer'

const ids = (...values: string[]) => {
  const queue = [...values]
  return () => queue.shift() ?? `id-${queue.length}`
}

const makeBundle = (name: string, id: string): PlaceBundle => ({
  place: {
    id,
    name,
    locationQuery: name,
    notes: '',
    defaultDurationMinutes: 60,
  },
  placement: {
    id: `placement-${id}`,
    placeId: id,
    dayId: null,
    order: 0,
    startTime: null,
    durationMinutes: 60,
  },
})

describe('tripReducer', () => {
  it('creates a starter trip with one day', () => {
    const trip = createStarterTrip(ids('trip', 'day'))
    expect(trip.days).toHaveLength(1)
    expect(trip.days[0].label).toBe('Day 1')
  })

  it('creates one placement for a new place', () => {
    const bundle = createPlaceBundle(
      { name: '淺草寺', locationQuery: '', notes: '', defaultDurationMinutes: 90 },
      ids('place', 'placement'),
    )
    expect(bundle.place.locationQuery).toBe('淺草寺')
    expect(bundle.placement.placeId).toBe(bundle.place.id)
  })

  it('normalizes missing, duplicate, and discontinuous placements', () => {
    const trip = createStarterTrip(ids('trip', 'day'))
    trip.places = [makeBundle('A', 'a').place, makeBundle('B', 'b').place]
    trip.placements = [
      { ...makeBundle('A', 'a').placement, order: 9 },
      { ...makeBundle('A duplicate', 'a').placement, id: 'duplicate', order: 10 },
    ]

    const normalized = normalizeTrip(trip, ids('generated'))
    expect(normalized.placements.map((item) => item.placeId)).toEqual(['a', 'b'])
    expect(normalized.placements.map((item) => item.order)).toEqual([0, 1])
  })

  it('moves and reorders places across containers', () => {
    let trip = createStarterTrip(ids('trip', 'day-1'))
    trip = tripReducer(trip, {
      type: 'ADD_PLACES',
      bundles: [makeBundle('A', 'a'), makeBundle('B', 'b'), makeBundle('C', 'c')],
    })
    const day2: DayPlan = { id: 'day-2', date: null, label: 'Day 2' }
    trip = tripReducer(trip, { type: 'ADD_DAY', day: day2 })
    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-a',
      targetDayId: 'day-1',
      targetIndex: 0,
    })
    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-b',
      targetDayId: 'day-1',
      targetIndex: 0,
    })

    const scheduled = trip.placements
      .filter((item) => item.dayId === 'day-1')
      .sort((a, b) => a.order - b.order)
    expect(scheduled.map((item) => item.placeId)).toEqual(['b', 'a'])
    expect(trip.placements.find((item) => item.placeId === 'c')?.order).toBe(0)
  })

  it('clears time when returning a place to the backlog', () => {
    let trip = createStarterTrip(ids('trip', 'day-1'))
    trip = tripReducer(trip, { type: 'ADD_PLACE', bundle: makeBundle('A', 'a') })
    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-a',
      targetDayId: 'day-1',
      targetIndex: 0,
    })
    trip = tripReducer(trip, {
      type: 'UPDATE_SCHEDULE',
      placementId: 'placement-a',
      startTime: '09:00',
      durationMinutes: 90,
    })
    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-a',
      targetDayId: null,
      targetIndex: 0,
    })
    expect(trip.placements[0].startTime).toBeNull()
  })

  it('assigns an explicit whole-hour start time when moving into an hourly slot', () => {
    let trip = createStarterTrip(ids('trip', 'day-1'))
    trip = tripReducer(trip, { type: 'ADD_PLACE', bundle: makeBundle('A', 'a') })
    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-a',
      targetDayId: 'day-1',
      targetIndex: 0,
      startTime: '09:00',
    })
    expect(trip.placements[0]).toMatchObject({ dayId: 'day-1', startTime: '09:00' })

    trip = tripReducer(trip, {
      type: 'MOVE_PLACE',
      placementId: 'placement-a',
      targetDayId: 'day-1',
      targetIndex: 0,
      startTime: null,
    })
    expect(trip.placements[0].startTime).toBeNull()
  })

  it('updates the backlog duration when editing a place default', () => {
    let trip = createStarterTrip(ids('trip', 'day-1'))
    trip = tripReducer(trip, { type: 'ADD_PLACE', bundle: makeBundle('A', 'a') })
    trip = tripReducer(trip, {
      type: 'UPDATE_PLACE',
      placeId: 'a',
      changes: { defaultDurationMinutes: 120 },
    })
    expect(trip.placements[0].durationMinutes).toBe(120)
  })

  it('returns places in original order when deleting a populated day', () => {
    let trip = createStarterTrip(ids('trip', 'day-1'))
    trip = tripReducer(trip, {
      type: 'ADD_PLACES',
      bundles: [makeBundle('A', 'a'), makeBundle('B', 'b')],
    })
    for (const id of ['placement-a', 'placement-b']) {
      trip = tripReducer(trip, {
        type: 'MOVE_PLACE',
        placementId: id,
        targetDayId: 'day-1',
        targetIndex: 99,
      })
    }
    trip = tripReducer(trip, {
      type: 'ADD_DAY',
      day: { id: 'day-2', date: null, label: 'Day 2' },
    })
    trip = tripReducer(trip, { type: 'DELETE_DAY', dayId: 'day-1' })

    const backlog = trip.placements.sort((a, b) => a.order - b.order)
    expect(backlog.map((item) => item.placeId)).toEqual(['a', 'b'])
    expect(trip.days.map((day) => day.label)).toEqual(['Day 1'])
  })

  it('keeps one day when asked to delete the last day', () => {
    const trip = createStarterTrip(ids('trip', 'day'))
    expect(tripReducer(trip, { type: 'DELETE_DAY', dayId: 'day' })).toEqual(trip)
  })
})
