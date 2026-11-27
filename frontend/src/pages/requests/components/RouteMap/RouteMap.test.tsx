import { render, screen } from '@testing-library/react'
import L from 'leaflet'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { DEMO_ROUTE, getPointAlongRoute } from '../../utils/routeGeometry'
import { RouteMap } from './RouteMap'

// O Leaflet é trocado pelo dublê de src/test/fixtures/leaflet.ts (ver setup.ts).
const ROUTE_LAT_LNGS = DEMO_ROUTE.map(({ lat, lng }) => [lat, lng])
const ORIGIN = ROUTE_LAT_LNGS[0]
const DESTINATION = ROUTE_LAT_LNGS[ROUTE_LAT_LNGS.length - 1]

function lastMap() {
  const { results } = vi.mocked(L.map).mock
  const result = results[results.length - 1]
  if (!result) throw new Error('o mapa não foi criado')
  return result.value as unknown as {
    fitBounds: ReturnType<typeof vi.fn>
    invalidateSize: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }
}

function markerPositions() {
  return vi.mocked(L.marker).mock.calls.map(([latLng]) => latLng)
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('cria o mapa com o texto alternativo, a camada do OpenStreetMap e a rota', () => {
  render(<RouteMap label="Mapa da rota do Centro ao Shopping Jardins" />)

  const region = screen.getByRole('region', {
    name: 'Mapa da rota do Centro ao Shopping Jardins',
  })
  expect(L.map).toHaveBeenCalledTimes(1)
  expect(vi.mocked(L.map).mock.calls[0]?.[0]).toBe(region)
  expect(vi.mocked(L.map).mock.calls[0]?.[1]).toMatchObject({
    scrollWheelZoom: false,
    zoomControl: false,
  })

  const [url, tileOptions] = vi.mocked(L.tileLayer).mock.calls[0] ?? []
  expect(url).toContain('tile.openstreetmap.org')
  expect(tileOptions).toMatchObject({
    attribution: expect.stringContaining('OpenStreetMap') as unknown,
  })
  expect(L.control.zoom).toHaveBeenCalledWith(
    expect.objectContaining({ position: 'bottomright' }),
  )

  expect(L.polyline).toHaveBeenCalledWith(ROUTE_LAT_LNGS, expect.any(Object))
  expect(lastMap().fitBounds).toHaveBeenCalledTimes(1)
})

test('usa os pontos específicos da rota selecionada e atualiza o mapa ao trocar a rota', () => {
  const points = [
    { lat: -10.9, lng: -37.1 },
    { lat: -10.8, lng: -37.2 },
  ]
  const { rerender } = render(<RouteMap label="Rota selecionada" points={points} />)
  expect(L.polyline).toHaveBeenLastCalledWith(
    [
      [-10.9, -37.1],
      [-10.8, -37.2],
    ],
    expect.any(Object),
  )
  const previousMap = lastMap()
  rerender(
    <RouteMap
      label="Outra rota"
      points={[
        { lat: -10.7, lng: -37.3 },
        { lat: -10.6, lng: -37.4 },
      ]}
    />,
  )
  expect(previousMap.remove).toHaveBeenCalledOnce()
  expect(L.polyline).toHaveBeenLastCalledWith(
    [
      [-10.7, -37.3],
      [-10.6, -37.4],
    ],
    expect.any(Object),
  )
})

test('mostra marcadores de origem e destino', () => {
  render(<RouteMap label="Mapa da rota" />)

  expect(markerPositions()).toEqual([ORIGIN, DESTINATION])
})

test('com progresso, coloca o veículo no ponto correspondente do trajeto', () => {
  const { rerender } = render(<RouteMap label="Mapa do veículo" progress={0.5} />)

  expect(markerPositions()).toEqual([ORIGIN, DESTINATION, ORIGIN])
  const vehicle = vi.mocked(L.marker).mock.results[2]?.value as unknown as {
    setLatLng: ReturnType<typeof vi.fn>
  }
  const half = getPointAlongRoute(DEMO_ROUTE, 0.5)
  expect(vehicle.setLatLng).toHaveBeenLastCalledWith([half.lat, half.lng])

  rerender(<RouteMap label="Mapa do veículo" progress={1} />)
  expect(vehicle.setLatLng).toHaveBeenLastCalledWith(DESTINATION)
  // Andar com o veículo não recria o mapa.
  expect(L.map).toHaveBeenCalledTimes(1)
})

test('a variante minimal desenha a rota em contorno', () => {
  render(<RouteMap label="Mapa da solicitação" variant="minimal" />)

  expect(L.polyline).toHaveBeenCalledTimes(2)
  expect(markerPositions()).toEqual([ORIGIN, DESTINATION])
})

test('mantém os selos passados como children', () => {
  render(
    <RouteMap label="Mapa" progress={0.2}>
      <span>Motorista a caminho</span>
    </RouteMap>,
  )

  expect(screen.getByText('Motorista a caminho')).toBeInTheDocument()
})

test('reajusta o tamanho do mapa quando o container muda', () => {
  let notifyResize = () => {}
  const disconnect = vi.fn<() => void>()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        notifyResize = callback
      }
      observe = vi.fn<(element: Element) => void>()
      disconnect = disconnect
    },
  )

  const { unmount } = render(<RouteMap label="Mapa" />)
  notifyResize()
  expect(lastMap().invalidateSize).toHaveBeenCalledTimes(1)

  unmount()
  expect(disconnect).toHaveBeenCalledTimes(1)
})

test('destrói o mapa ao sair da tela', () => {
  const { unmount } = render(<RouteMap label="Mapa" />)
  const map = lastMap()
  expect(map.remove).not.toHaveBeenCalled()

  unmount()
  expect(map.remove).toHaveBeenCalledTimes(1)
})
