import { expect, test } from 'vitest'
import { ARACAJU_CENTER, DEMO_ROUTE, getPointAlongRoute } from './routeGeometry'

test('nas pontas, o veículo fica exatamente na origem ou no destino', () => {
  const last = DEMO_ROUTE[DEMO_ROUTE.length - 1]
  expect(getPointAlongRoute(DEMO_ROUTE, 0)).toEqual(DEMO_ROUTE[0])
  expect(getPointAlongRoute(DEMO_ROUTE, -1)).toEqual(DEMO_ROUTE[0])
  expect(getPointAlongRoute(DEMO_ROUTE, 1)).toEqual(last)
  expect(getPointAlongRoute(DEMO_ROUTE, 2)).toEqual(last)
})

test('no meio do trajeto, interpola entre os pontos', () => {
  const half = getPointAlongRoute(
    [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
    ],
    0.5,
  )
  expect(half).toEqual({ lat: 0, lng: 5 })
})

test('sem pontos, cai no centro de Aracaju', () => {
  expect(getPointAlongRoute([], 0.5)).toEqual(ARACAJU_CENTER)
})

test('o trajeto demonstrativo fica em Aracaju', () => {
  for (const { lat, lng } of DEMO_ROUTE) {
    expect(lat).toBeGreaterThan(-11.1)
    expect(lat).toBeLessThan(-10.8)
    expect(lng).toBeGreaterThan(-37.2)
    expect(lng).toBeLessThan(-36.9)
  }
})
