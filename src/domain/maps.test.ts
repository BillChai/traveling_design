import type { RoutePlace } from './types'
import { buildGoogleMapsLinks } from './maps'

const places = (count: number): RoutePlace[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `place-${index + 1}`,
    name: `景點 ${index + 1}`,
    locationQuery: `東京都 景點 ${index + 1}`,
  }))

describe('buildGoogleMapsLinks', () => {
  it('returns no link for zero places and a search link for one place', () => {
    expect(buildGoogleMapsLinks([])).toEqual([])
    const [link] = buildGoogleMapsLinks(places(1))
    expect(link.url).toContain('/maps/search/')
    expect(new URL(link.url).searchParams.get('query')).toBe('東京都 景點 1')
  })

  it('builds one ordered directions link for up to five places', () => {
    const [link] = buildGoogleMapsLinks(places(5))
    const url = new URL(link.url)
    expect(url.pathname).toContain('/maps/dir/')
    expect(url.searchParams.get('origin')).toBe('東京都 景點 1')
    expect(url.searchParams.get('destination')).toBe('東京都 景點 5')
    expect(url.searchParams.get('waypoints')).toBe(
      '東京都 景點 2|東京都 景點 3|東京都 景點 4',
    )
    expect(url.searchParams.has('travelmode')).toBe(false)
  })

  it('chunks longer routes with shared boundary places', () => {
    const links = buildGoogleMapsLinks(places(12))
    expect(links).toHaveLength(3)
    expect(links.map((link) => link.placeIds)).toEqual([
      ['place-1', 'place-2', 'place-3', 'place-4', 'place-5'],
      ['place-5', 'place-6', 'place-7', 'place-8', 'place-9'],
      ['place-9', 'place-10', 'place-11', 'place-12'],
    ])
    expect(links.every((link) => link.url.length <= 2048)).toBe(true)
  })

  it('starts a new segment before an encoded URL exceeds 2048 characters', () => {
    const longPlaces = places(4).map((place, index) => ({
      ...place,
      locationQuery: `${index}-${'長'.repeat(80)}`,
    }))
    const links = buildGoogleMapsLinks(longPlaces)
    expect(links.length).toBeGreaterThan(1)
    expect(links.every((link) => link.url.length <= 2048)).toBe(true)
  })
})
