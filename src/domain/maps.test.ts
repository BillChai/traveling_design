import type { RoutePlace } from './types'
import { buildGoogleMapsEmbedUrls, buildGoogleMapsLinks } from './maps'

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

  it('builds one ordered directions link for multiple places', () => {
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

  it('keeps a long route in one ordered directions link', () => {
    const links = buildGoogleMapsLinks(places(12))
    expect(links).toHaveLength(1)
    expect(links[0].placeIds).toEqual(places(12).map((place) => place.id))
  })

  it('does not split a route when location queries are long', () => {
    const longPlaces = places(4).map((place, index) => ({
      ...place,
      locationQuery: `${index}-${'長'.repeat(80)}`,
    }))
    const links = buildGoogleMapsLinks(longPlaces)
    expect(links).toHaveLength(1)
    expect(links[0].placeIds).toEqual(longPlaces.map((place) => place.id))
  })
})

describe('buildGoogleMapsEmbedUrls', () => {
  it('does not build an embed request without an API key or places', () => {
    expect(buildGoogleMapsEmbedUrls(places(2), '')).toEqual([])
    expect(buildGoogleMapsEmbedUrls([], 'test-key')).toEqual([])
  })

  it('builds a place preview for one place', () => {
    const [embed] = buildGoogleMapsEmbedUrls(places(1), 'test-key')
    const url = new URL(embed.url)

    expect(url.pathname).toBe('/maps/embed/v1/place')
    expect(url.searchParams.get('key')).toBe('test-key')
    expect(url.searchParams.get('q')).toBe('東京都 景點 1')
    expect(embed.placeIds).toEqual(['place-1'])
  })

  it('builds one ordered directions preview without a mode', () => {
    const embeds = buildGoogleMapsEmbedUrls(places(7), 'test-key')
    expect(embeds).toHaveLength(1)
    expect(embeds[0].placeIds).toEqual(places(7).map((place) => place.id))

    const url = new URL(embeds[0].url)
    expect(url.pathname).toBe('/maps/embed/v1/directions')
    expect(url.searchParams.get('origin')).toBe('東京都 景點 1')
    expect(url.searchParams.get('destination')).toBe('東京都 景點 7')
    expect(url.searchParams.get('waypoints')).toBe(
      '東京都 景點 2|東京都 景點 3|東京都 景點 4|東京都 景點 5|東京都 景點 6',
    )
    expect(url.searchParams.has('mode')).toBe(false)
  })
})
