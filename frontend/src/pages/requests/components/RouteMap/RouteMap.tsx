import type { ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import {
  ROUTE_POINTS,
  getPointAlongRoute,
  toPolylinePoints,
} from '../../utils/routeGeometry'
import styles from './RouteMap.module.scss'

// Ruas e quadras passam bem além do viewBox: com "meet" o trajeto aparece inteiro
// e centralizado, e o resto do espaço (mapa alto ou largo) continua preenchido.
const STREETS = [
  'M-1000 268 L1400 -132',
  'M-1000 870 L180 150 L1400 530',
  'M-80 -1000 L460 1800',
  'M420 -1000 L180 1800',
  'M-1000 420 L1400 380',
  'M-1000 -120 L1400 -60',
]

const BLOCKS = [
  { x: 20, y: 20, width: 70, height: 50 },
  { x: 230, y: 20, width: 60, height: 35 },
  { x: 320, y: 120, width: 70, height: 50 },
  { x: 20, y: 160, width: 50, height: 40 },
  { x: 290, y: 240, width: 90, height: 45 },
  { x: 140, y: 240, width: 60, height: 40 },
  { x: 40, y: -200, width: 90, height: 60 },
  { x: 260, y: -180, width: 70, height: 50 },
  { x: 60, y: 440, width: 80, height: 55 },
  { x: 280, y: 460, width: 90, height: 50 },
  { x: -180, y: 60, width: 90, height: 60 },
  { x: 480, y: 160, width: 80, height: 50 },
]

export interface RouteMapProps {
  /** Texto alternativo do mapa. */
  label: string
  /** Fração do trajeto já percorrida (0 a 1). Sem ela, o mapa mostra só a rota. */
  progress?: number | undefined
  /** Selos e cards exibidos por cima do mapa. */
  children?: ReactNode
  className?: string
}

/** Mapa ilustrativo em SVG; a altura é definida pelo pai via `className`. */
export function RouteMap({ label, progress, children, className }: RouteMapProps) {
  const isTracking = progress !== undefined
  const start = ROUTE_POINTS[0] ?? { x: 0, y: 0 }
  const end = ROUTE_POINTS[ROUTE_POINTS.length - 1] ?? start
  const car = getPointAlongRoute(ROUTE_POINTS, progress ?? 0)

  return (
    <div className={classNames(styles.map, className)}>
      <svg
        className={styles.svg}
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {BLOCKS.map((block) => (
          <rect
            key={`${block.x}-${block.y}`}
            className={styles.block}
            rx="6"
            {...block}
          />
        ))}
        {STREETS.map((street) => (
          <path key={street} className={styles.street} d={street} />
        ))}
        <polyline
          className={isTracking ? styles.routeTracking : styles.route}
          points={toPolylinePoints(ROUTE_POINTS)}
        />

        {isTracking ? (
          <>
            <g transform={`translate(${end.x} ${end.y})`}>
              <circle className={styles.pinHalo} r="18" />
              <circle className={styles.pin} r="11" />
              <circle className={styles.pinCenter} r="4" />
            </g>
            <g className={styles.car} transform={`translate(${car.x} ${car.y})`}>
              <circle className={styles.carHalo} r="20" />
              <circle className={styles.carBody} r="13" />
              <path
                className={styles.carGlyph}
                d="M-6 2 L-6 -1 L-4 -5 L4 -5 L6 -1 L6 2 Z"
              />
              <circle className={styles.carWheel} cx="-3.5" cy="3" r="1.5" />
              <circle className={styles.carWheel} cx="3.5" cy="3" r="1.5" />
            </g>
          </>
        ) : (
          <>
            <circle className={styles.originMarker} cx={start.x} cy={start.y} r="7" />
            <rect
              className={styles.destinationMarker}
              x={end.x - 7}
              y={end.y - 7}
              width="14"
              height="14"
            />
          </>
        )}
      </svg>
      <p className={styles.label}>{label}</p>
      {children}
    </div>
  )
}
