import type { PlaceBundle, Trip } from '../domain/types'
import { createPlaceBundle, createStarterTrip, tripReducer } from './tripReducer'

const deterministicIds = () => {
  let count = 0
  return () => `id-${count++}`
}

describe('reducer performance baseline', () => {
  it('updates a 50-place, 14-day trip within 200 ms', () => {
    const id = deterministicIds()
    let trip: Trip = createStarterTrip(id)
    const bundles: PlaceBundle[] = Array.from({ length: 50 }, (_, index) =>
      createPlaceBundle({
        name: `景點 ${index}`,
        locationQuery: `東京 ${index}`,
        notes: '',
        defaultDurationMinutes: 60,
      }, id),
    )
    trip = tripReducer(trip, { type: 'ADD_PLACES', bundles })
    for (let index = 1; index < 14; index += 1) {
      trip = tripReducer(trip, {
        type: 'ADD_DAY',
        day: { id: id(), date: null, label: '' },
      })
    }

    const startedAt = performance.now()
    for (let index = 0; index < trip.placements.length; index += 1) {
      trip = tripReducer(trip, {
        type: 'MOVE_PLACE',
        placementId: trip.placements[index].id,
        targetDayId: trip.days[index % trip.days.length].id,
        targetIndex: Number.MAX_SAFE_INTEGER,
      })
    }
    const elapsed = performance.now() - startedAt

    expect(elapsed).toBeLessThan(200)
    expect(trip.placements).toHaveLength(50)
  })
})
