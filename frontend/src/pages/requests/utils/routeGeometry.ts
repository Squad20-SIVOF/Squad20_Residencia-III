export interface GeoPoint {
  lat: number
  lng: number
}

/** Centro de Aracaju/SE: vista inicial do mapa antes de enquadrar a rota. */
export const ARACAJU_CENTER: GeoPoint = { lat: -10.9472, lng: -37.0731 }

/**
 * DEMONSTRATIVO: trajeto fixo em Aracaju (Centro → Shopping Jardins) só para o mapa
 * ter o que desenhar. A API ainda não envia coordenadas; quando enviar, as telas
 * passam a usar os pontos reais e esta constante sai.
 */
export const DEMO_ROUTE: GeoPoint[] = [
  { lat: -10.9132965, lng: -37.0486965 },
  { lat: -10.9186, lng: -37.0512 },
  { lat: -10.9248, lng: -37.0531 },
  { lat: -10.9311, lng: -37.0549 },
  { lat: -10.9367, lng: -37.0566 },
  { lat: -10.9412, lng: -37.0583 },
  { lat: -10.9432674, lng: -37.059823 },
]

/**
 * Distância aproximada entre dois pontos, na mesma unidade para todos os trechos.
 * Corrige a longitude pelo cosseno da latitude; numa cidade isso basta para
 * repartir o trajeto, sem precisar da fórmula de haversine.
 */
function segmentLength(start: GeoPoint, end: GeoPoint): number {
  const meanLat = ((start.lat + end.lat) / 2) * (Math.PI / 180)
  return Math.hypot(end.lat - start.lat, (end.lng - start.lng) * Math.cos(meanLat))
}

/** Ponto a uma fração `progress` (0 a 1) do comprimento total do trajeto. */
export function getPointAlongRoute(points: GeoPoint[], progress: number): GeoPoint {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return ARACAJU_CENTER
  // Nas pontas devolve o ponto exato, sem o erro de arredondamento da soma.
  if (progress <= 0) return first
  if (progress >= 1) return last

  const segments = points.slice(1).map((end, index) => {
    const start = points[index] ?? first
    return { start, end, length: segmentLength(start, end) }
  })
  const total = segments.reduce((sum, segment) => sum + segment.length, 0)
  let remaining = progress * total

  for (const { start, end, length } of segments) {
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length
      return {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
      }
    }
    remaining -= length
  }

  return last
}
