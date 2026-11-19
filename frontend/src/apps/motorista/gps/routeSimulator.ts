import { geoBus, type Coordinate } from './geoEventBus'
import { buildRouteSegments, sliceRouteAtFraction } from './geoMath'
import type { RoutePreset } from './aracajuRoutes'

export class RouteSimulator {
  private route: RoutePreset
  private fraction = 0
  private frameId: number | null = null
  private lastFrameAt: number | null = null
  private speedMultiplier = 1
  private deviationActive = false

  constructor(route: RoutePreset) {
    this.route = route
  }

  setSpeed(multiplier: number) {
    this.speedMultiplier = Math.min(10, Math.max(1, multiplier))
  }

  setRoute(route: RoutePreset) {
    this.pause()
    this.route = route
    this.fraction = 0
    this.deviationActive = false
    this.emitRouteUpdated(route.coordinates, false)
    this.emitProgress()
  }

  start() {
    if (this.frameId !== null || this.fraction >= 1) return
    this.lastFrameAt = null
    this.frameId = requestAnimationFrame(this.tick)
  }

  pause() {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
    this.lastFrameAt = null
  }

  reset() {
    this.pause()
    this.fraction = 0
    this.deviationActive = false
    this.emitRouteUpdated(this.route.coordinates, false)
    this.emitProgress()
    this.emitPosition(0)
  }

  seek(fraction: number) {
    this.pause()
    this.fraction = Math.min(1, Math.max(0, fraction))
    this.emitPosition(0)
    this.emitProgress()
    if (this.fraction >= 1) {
      geoBus.emit('geofence:arrived', {
        destination: 'Shopping Jardins (Aracaju)',
        distanceMeters: 0,
      })
    }
  }

  simulateDeviation() {
    const base = this.route.coordinates[Math.min(3, this.route.coordinates.length - 1)]!
    const detectedAt: Coordinate = [base[0] + 0.0012, base[1] + 0.0012]
    geoBus.emit('route:off-track', { deviationMeters: 142, detectedAt })
    this.pause()
    this.fraction = 0
    this.deviationActive = true
    this.emitRouteUpdated(this.route.deviationCoordinates, true)
    this.emitPosition(0)
    this.emitProgress()
  }

  private getCoordinates(): Coordinate[] {
    return this.deviationActive ? this.route.deviationCoordinates : this.route.coordinates
  }

  private emitRouteUpdated(coordinates: Coordinate[], isDeviation: boolean) {
    const { totalMeters } = buildRouteSegments(coordinates)
    geoBus.emit('route:updated', {
      originName: this.route.originName,
      coordinates,
      distanceKm: Number((totalMeters / 1000).toFixed(2)),
      isDeviation,
    })
  }

  private emitPosition(speedKmh: number) {
    const coordinates = this.getCoordinates()
    const { segments, totalMeters } = buildRouteSegments(coordinates)
    const position = sliceRouteAtFraction(
      coordinates,
      segments,
      totalMeters,
      this.fraction,
    )
    geoBus.emit('gps:position', {
      lat: position.lat,
      lng: position.lng,
      heading: position.bearing,
      speedKmh,
      accuracyMeters: 4,
      timestamp: Date.now(),
    })
  }

  private emitProgress() {
    const coordinates = this.getCoordinates()
    const { segments, totalMeters } = buildRouteSegments(coordinates)
    const sliced = sliceRouteAtFraction(coordinates, segments, totalMeters, this.fraction)
    const remainingKm = ((1 - this.fraction) * totalMeters) / 1000
    geoBus.emit('route:progress', {
      fraction: this.fraction,
      remainingKm: Number(remainingKm.toFixed(2)),
      remainingMinutes: Math.ceil((remainingKm / 35) * 60),
      currentStreet: 'Aracaju · rota simulada para o Shopping Jardins',
      traveledCoords: sliced.traveledCoords,
      remainingCoords: sliced.remainingCoords,
    })
  }

  private readonly tick = (timestamp: number) => {
    if (this.lastFrameAt === null) this.lastFrameAt = timestamp
    const elapsedSeconds = Math.min(0.25, (timestamp - this.lastFrameAt) / 1000)
    this.lastFrameAt = timestamp

    const coordinates = this.getCoordinates()
    const { totalMeters } = buildRouteSegments(coordinates)
    const speedMetersPerSecond = 14.5 * this.speedMultiplier
    this.fraction = Math.min(
      1,
      this.fraction + (speedMetersPerSecond * elapsedSeconds) / totalMeters,
    )

    this.emitPosition(Math.round(speedMetersPerSecond * 3.6))
    this.emitProgress()

    if (this.fraction >= 1) {
      this.frameId = null
      this.lastFrameAt = null
      geoBus.emit('geofence:arrived', {
        destination: 'Shopping Jardins (Aracaju)',
        distanceMeters: 0,
      })
      return
    }
    this.frameId = requestAnimationFrame(this.tick)
  }
}
