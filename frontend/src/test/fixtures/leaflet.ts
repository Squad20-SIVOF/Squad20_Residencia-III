import { vi } from 'vitest'

// O jsdom não tem layout nem canvas, então o Leaflet de verdade não desenha nada.
// Este dublê guarda as chamadas para os testes conferirem o que o mapa recebeu.

type LatLng = [number, number]

interface FakeLayer {
  addTo: (map: unknown) => FakeLayer
  remove: () => FakeLayer
}

function createLayer<T extends object>(extra: T): T & FakeLayer {
  const layer: T & FakeLayer = {
    ...extra,
    addTo: vi.fn<(map: unknown) => FakeLayer>(() => layer),
    remove: vi.fn<() => FakeLayer>(() => layer),
  }
  return layer
}

function createMap() {
  return {
    fitBounds: vi.fn<(bounds: unknown, options?: object) => void>(),
    invalidateSize: vi.fn<() => void>(),
    remove: vi.fn<() => void>(),
  }
}

const map = vi.fn<
  (element: HTMLElement, options?: object) => ReturnType<typeof createMap>
>(() => createMap())
const tileLayer = vi.fn<(url: string, options?: object) => object>(() => createLayer({}))
const polyline = vi.fn<(latLngs: LatLng[], options?: object) => object>((latLngs) =>
  createLayer({ getBounds: vi.fn<() => LatLng[]>(() => latLngs) }),
)
const marker = vi.fn<(latLng: LatLng, options?: object) => object>(() =>
  createLayer({ setLatLng: vi.fn<(latLng: LatLng) => void>() }),
)
const divIcon = vi.fn<(options: object) => object>((options) => ({ options }))
const zoom = vi.fn<(options?: object) => object>(() => createLayer({}))

const L = {
  map,
  tileLayer,
  polyline,
  marker,
  divIcon,
  control: { zoom },
  Browser: { mobile: false },
  Icon: {
    Default: {
      imagePath: undefined as string | undefined,
      mergeOptions: vi.fn<(options: object) => void>(),
    },
  },
}

export default L
