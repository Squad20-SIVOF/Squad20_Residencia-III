import { describe, expect, it } from 'vitest'
import { buildRouteSegments, haversineMeters, sliceRouteAtFraction } from './geoMath'

describe('cálculos de rota GPS', () => {
  it('calcula distância zero para pontos iguais', () => {
    expect(haversineMeters([-10, -37], [-10, -37])).toBe(0)
  })

  it('divide a rota no ponto intermediário', () => {
    const coordinates: [number, number][] = [
      [-10, -37],
      [-10, -36.99],
      [-10, -36.98],
    ]
    const route = buildRouteSegments(coordinates)
    const halfway = sliceRouteAtFraction(
      coordinates,
      route.segments,
      route.totalMeters,
      0.5,
    )

    expect(halfway.lng).toBeCloseTo(-36.99, 4)
    expect(halfway.traveledCoords.length).toBeGreaterThan(1)
    expect(halfway.remainingCoords.length).toBeGreaterThan(1)
  })

  it('limita o progresso ao intervalo de 0 a 1', () => {
    const coordinates: [number, number][] = [
      [-10, -37],
      [-10, -36.99],
    ]
    const route = buildRouteSegments(coordinates)

    expect(
      sliceRouteAtFraction(coordinates, route.segments, route.totalMeters, -1).lng,
    ).toBeCloseTo(-37)
    expect(
      sliceRouteAtFraction(coordinates, route.segments, route.totalMeters, 2).lng,
    ).toBeCloseTo(-36.99)
  })
})
