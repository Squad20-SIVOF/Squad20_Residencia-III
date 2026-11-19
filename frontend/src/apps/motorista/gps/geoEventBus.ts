export type Coordinate = [latitude: number, longitude: number]

export interface GeoEventMap {
  'gps:position': {
    lat: number
    lng: number
    heading: number
    speedKmh: number
    accuracyMeters: number
    timestamp: number
  }
  'route:progress': {
    fraction: number
    remainingKm: number
    remainingMinutes: number
    currentStreet: string
    traveledCoords: Coordinate[]
    remainingCoords: Coordinate[]
  }
  'route:off-track': { deviationMeters: number; detectedAt: Coordinate }
  'route:updated': {
    originName: string
    coordinates: Coordinate[]
    distanceKm: number
    isDeviation: boolean
  }
  'geofence:arrived': { destination: string; distanceMeters: number }
}

type EventListener<T> = (payload: T) => void

export class GeoEventBus {
  private readonly target = new EventTarget()

  emit<K extends keyof GeoEventMap>(type: K, detail: GeoEventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(type, { detail }))
  }

  on<K extends keyof GeoEventMap>(
    type: K,
    listener: EventListener<GeoEventMap[K]>,
  ): () => void {
    const handler = (event: Event) => {
      listener((event as CustomEvent<GeoEventMap[K]>).detail)
    }
    this.target.addEventListener(type, handler)
    return () => this.target.removeEventListener(type, handler)
  }
}

export const geoBus = new GeoEventBus()
