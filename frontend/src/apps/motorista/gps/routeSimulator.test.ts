import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROUTE_PRESETS } from './aracajuRoutes'
import { geoBus, type GeoEventMap } from './geoEventBus'
import { RouteSimulator } from './routeSimulator'

describe('RouteSimulator', () => {
  afterEach(() => vi.restoreAllMocks())

  it('emite progresso quando a posição é ajustada', () => {
    const simulator = new RouteSimulator(ROUTE_PRESETS[0]!)
    const onProgress = vi.fn<(progress: GeoEventMap['route:progress']) => void>()
    const unsubscribe = geoBus.on('route:progress', onProgress)

    simulator.seek(0.5)

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ fraction: 0.5 }))
    unsubscribe()
  })

  it('emite desvio e atualização quando a rota muda', () => {
    const simulator = new RouteSimulator(ROUTE_PRESETS[0]!)
    const onOffTrack = vi.fn<(event: GeoEventMap['route:off-track']) => void>()
    const onRouteUpdated = vi.fn<(event: GeoEventMap['route:updated']) => void>()
    const unsubscribeOffTrack = geoBus.on('route:off-track', onOffTrack)
    const unsubscribeRouteUpdated = geoBus.on('route:updated', onRouteUpdated)

    simulator.simulateDeviation()

    expect(onOffTrack).toHaveBeenCalledWith(
      expect.objectContaining({ deviationMeters: 142 }),
    )
    expect(onRouteUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ isDeviation: true }),
    )
    unsubscribeOffTrack()
    unsubscribeRouteUpdated()
  })
})
