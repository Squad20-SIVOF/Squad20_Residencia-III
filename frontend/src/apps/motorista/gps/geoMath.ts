import type { Coordinate } from './geoEventBus'

export interface RouteSegment {
  start: Coordinate
  end: Coordinate
  lengthMeters: number
  cumStartMeters: number
  cumEndMeters: number
  bearing: number
}

export function haversineMeters(a: Coordinate, b: Coordinate): number {
  const earthRadiusMeters = 6_371_000
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latitudeDelta = toRadians(b[0] - a[0])
  const longitudeDelta = toRadians(b[1] - a[1])
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(a[0])) *
      Math.cos(toRadians(b[0])) *
      Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

export function calculateBearing(a: Coordinate, b: Coordinate): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const toDegrees = (radians: number) => (radians * 180) / Math.PI
  const longitudeDelta = toRadians(b[1] - a[1])
  const y = Math.sin(longitudeDelta) * Math.cos(toRadians(b[0]))
  const x =
    Math.cos(toRadians(a[0])) * Math.sin(toRadians(b[0])) -
    Math.sin(toRadians(a[0])) * Math.cos(toRadians(b[0])) * Math.cos(longitudeDelta)
  return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

export function buildRouteSegments(coordinates: Coordinate[]) {
  const segments: RouteSegment[] = []
  let totalMeters = 0
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index]!
    const end = coordinates[index + 1]!
    const lengthMeters = haversineMeters(start, end)
    segments.push({
      start,
      end,
      lengthMeters,
      cumStartMeters: totalMeters,
      cumEndMeters: totalMeters + lengthMeters,
      bearing: calculateBearing(start, end),
    })
    totalMeters += lengthMeters
  }
  return { segments, totalMeters }
}

export function sliceRouteAtFraction(
  coordinates: Coordinate[],
  segments: RouteSegment[],
  totalMeters: number,
  fraction: number,
) {
  if (coordinates.length === 0) throw new Error('A rota precisa de coordenadas.')
  if (segments.length === 0 || totalMeters <= 0) {
    return {
      lat: coordinates[0]![0],
      lng: coordinates[0]![1],
      bearing: 0,
      traveledCoords: [coordinates[0]!],
      remainingCoords: coordinates,
    }
  }

  const clamped = Math.max(0, Math.min(1, fraction))
  const targetMeters = clamped * totalMeters
  const segmentIndex = segments.findIndex(
    (segment) => targetMeters <= segment.cumEndMeters,
  )
  const activeIndex = segmentIndex < 0 ? segments.length - 1 : segmentIndex
  const segment = segments[activeIndex]!
  const ratio =
    segment.lengthMeters > 0
      ? Math.min(
          1,
          Math.max(0, (targetMeters - segment.cumStartMeters) / segment.lengthMeters),
        )
      : 0
  const lat = segment.start[0] + (segment.end[0] - segment.start[0]) * ratio
  const lng = segment.start[1] + (segment.end[1] - segment.start[1]) * ratio
  const current: Coordinate = [lat, lng]

  return {
    lat,
    lng,
    bearing: segment.bearing,
    traveledCoords: [...coordinates.slice(0, activeIndex + 1), current],
    remainingCoords: [current, ...coordinates.slice(activeIndex + 1)],
  }
}
