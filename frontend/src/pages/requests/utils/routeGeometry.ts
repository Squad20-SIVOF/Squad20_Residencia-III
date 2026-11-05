export interface MapPoint {
  x: number
  y: number
}

/** Trajeto desenhado no mapa ilustrativo (coordenadas do viewBox 400 × 300). */
export const ROUTE_POINTS: MapPoint[] = [
  { x: 110, y: 240 },
  { x: 150, y: 222 },
  { x: 190, y: 200 },
  { x: 225, y: 190 },
  { x: 255, y: 160 },
  { x: 275, y: 120 },
  { x: 288, y: 72 },
]

/** Atributo `points` de <polyline>. */
export function toPolylinePoints(points: MapPoint[]): string {
  return points.map(({ x, y }) => `${x},${y}`).join(' ')
}

/**
 * Ponto a uma fração `progress` (0 a 1) do comprimento total do trajeto.
 * Feito à mão porque getPointAtLength não existe no jsdom dos testes.
 */
export function getPointAlongRoute(points: MapPoint[], progress: number): MapPoint {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return { x: 0, y: 0 }
  // Nas pontas devolve o ponto exato, sem o erro de arredondamento da soma.
  if (progress <= 0) return first
  if (progress >= 1) return last

  const segments = points.slice(1).map((end, index) => {
    const start = points[index] ?? first
    return { start, end, length: Math.hypot(end.x - start.x, end.y - start.y) }
  })
  const total = segments.reduce((sum, segment) => sum + segment.length, 0)
  let remaining = progress * total

  for (const { start, end, length } of segments) {
    if (remaining <= length) {
      const ratio = length === 0 ? 0 : remaining / length
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      }
    }
    remaining -= length
  }

  return last
}
