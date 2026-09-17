import type { MapLink, RoutePlace } from './types'

const BASE_URL = 'https://www.google.com/maps'
const MAX_PLACES_PER_SEGMENT = 5
const MAX_URL_LENGTH = 2048

const queryFor = (place: RoutePlace) => place.locationQuery.trim() || place.name

const buildSearchLink = (place: RoutePlace): MapLink => {
  const params = new URLSearchParams({ api: '1', query: queryFor(place) })
  return {
    label: `在 Google Maps 搜尋 ${place.name}`,
    url: `${BASE_URL}/search/?${params.toString()}`,
    placeIds: [place.id],
  }
}

const buildDirectionsLink = (places: RoutePlace[], segmentNumber: number): MapLink => {
  const params = new URLSearchParams({
    api: '1',
    origin: queryFor(places[0]),
    destination: queryFor(places.at(-1)!),
  })
  const waypoints = places.slice(1, -1).map(queryFor)
  if (waypoints.length) params.set('waypoints', waypoints.join('|'))

  return {
    label: `開啟 Google Maps 路線${segmentNumber > 1 ? `（第 ${segmentNumber} 段）` : ''}`,
    url: `${BASE_URL}/dir/?${params.toString()}`,
    placeIds: places.map((place) => place.id),
  }
}

export const buildGoogleMapsLinks = (places: RoutePlace[]): MapLink[] => {
  if (places.length === 0) return []
  if (places.length === 1) return [buildSearchLink(places[0])]

  const links: MapLink[] = []
  let startIndex = 0

  while (startIndex < places.length - 1) {
    let endIndex = Math.min(startIndex + MAX_PLACES_PER_SEGMENT - 1, places.length - 1)
    let link = buildDirectionsLink(
      places.slice(startIndex, endIndex + 1),
      links.length + 1,
    )

    while (link.url.length > MAX_URL_LENGTH && endIndex > startIndex + 1) {
      endIndex -= 1
      link = buildDirectionsLink(
        places.slice(startIndex, endIndex + 1),
        links.length + 1,
      )
    }

    links.push(link)
    startIndex = endIndex
  }

  return links
}
