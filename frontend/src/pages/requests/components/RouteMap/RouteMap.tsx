import { useEffect, useRef, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { classNames } from '@/utils/classNames'
import {
  ARACAJU_CENTER,
  DEMO_ROUTE,
  getPointAlongRoute,
  type GeoPoint,
} from '../../utils/routeGeometry'
import './leafletIcons'
import styles from './RouteMap.module.scss'

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const INITIAL_ZOOM = 13
const MAX_ZOOM = 19
/** Folga, em px, entre a rota e a borda do mapa ao enquadrar o trajeto. */
const FIT_PADDING_PX = 32

const CAR_SVG =
  '<svg viewBox="-8 -8 16 16" aria-hidden="true" focusable="false">' +
  '<path d="M-6 2 L-6 -1 L-4 -5 L4 -5 L6 -1 L6 2 Z" fill="currentColor"/>' +
  '<circle cx="-3.5" cy="3" r="1.5" fill="currentColor"/>' +
  '<circle cx="3.5" cy="3" r="1.5" fill="currentColor"/></svg>'

/** `minimal`: rota em contorno azul e pontas discretas, como no Figma da solicitação. */
export type RouteMapVariant = 'detailed' | 'minimal'

export interface RouteMapProps {
  /** Texto alternativo do mapa. */
  label: string
  variant?: RouteMapVariant
  /** Fração do trajeto já percorrida (0 a 1). Sem ela, o mapa mostra só a rota. */
  progress?: number | undefined
  /** Selos e cards exibidos por cima do mapa. */
  children?: ReactNode
  className?: string
}

function toLatLng({ lat, lng }: GeoPoint): L.LatLngTuple {
  return [lat, lng]
}

/**
 * Marcador desenhado só com CSS (cores dos tokens). A âncora tem tamanho zero no
 * ponto exato e o conteúdo se centraliza nela, então o tamanho fica todo no SCSS.
 */
function cssIcon(html: string): L.DivIcon {
  return L.divIcon({ className: styles.markerAnchor, iconSize: [0, 0], html })
}

function addMarker(map: L.Map, point: GeoPoint, html: string): L.Marker {
  // O texto alternativo do mapa já descreve a rota; os marcadores são decorativos.
  return L.marker(toLatLng(point), {
    icon: cssIcon(html),
    interactive: false,
    keyboard: false,
  }).addTo(map)
}

/** Mapa real (Leaflet + OpenStreetMap); a altura é definida pelo pai via `className`. */
export function RouteMap({
  label,
  variant = 'detailed',
  progress,
  children,
  className,
}: RouteMapProps) {
  const mapElement = useRef<HTMLElement>(null)
  const vehicleMarker = useRef<L.Marker | null>(null)
  const isTracking = progress !== undefined
  const isMinimal = variant === 'minimal'

  useEffect(() => {
    const element = mapElement.current
    if (!element) return

    const map = L.map(element, {
      center: toLatLng(ARACAJU_CENTER),
      zoom: INITIAL_ZOOM,
      zoomControl: false,
      // Roda do mouse e arrasto de um dedo ficam com a página: o mapa não prende o
      // scroll. No celular ele se move com pinça (dois dedos) e pelos botões de zoom.
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
    })
    L.control
      .zoom({
        position: 'bottomright',
        zoomInTitle: 'Aproximar',
        zoomOutTitle: 'Afastar',
      })
      .addTo(map)
    L.tileLayer(OSM_TILE_URL, { maxZoom: MAX_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(
      map,
    )

    const latLngs = DEMO_ROUTE.map(toLatLng)
    const lineOptions = { interactive: false }
    const route = isMinimal
      ? L.polyline(latLngs, { ...lineOptions, className: styles.routeOutline })
      : L.polyline(latLngs, {
          ...lineOptions,
          className: isTracking ? styles.routeTracking : styles.route,
        })
    route.addTo(map)
    if (isMinimal) {
      // Contorno: traço azul largo com o miolo na cor do fundo por cima.
      L.polyline(latLngs, { ...lineOptions, className: styles.routeOutlineInner }).addTo(
        map,
      )
    }

    const origin = DEMO_ROUTE[0] ?? ARACAJU_CENTER
    const destination = DEMO_ROUTE[DEMO_ROUTE.length - 1] ?? origin
    if (isMinimal) {
      addMarker(map, origin, `<span class="${styles.endOutline}"></span>`)
      addMarker(map, destination, `<span class="${styles.endOutline}"></span>`)
    } else {
      addMarker(map, origin, `<span class="${styles.originMarker}"></span>`)
      addMarker(
        map,
        destination,
        isTracking
          ? `<span class="${styles.pin}"><span class="${styles.pinCenter}"></span></span>`
          : `<span class="${styles.destinationMarker}"></span>`,
      )
    }
    vehicleMarker.current = isTracking
      ? addMarker(map, origin, `<span class="${styles.vehicle}">${CAR_SVG}</span>`)
      : null

    map.fitBounds(route.getBounds(), { padding: [FIT_PADDING_PX, FIT_PADDING_PX] })

    // O mapa precisa remedir os blocos quando o container muda de tamanho (giro do
    // celular, menu lateral abrindo, janela redimensionada).
    const handleResize = () => map.invalidateSize()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize)
    if (observer) observer.observe(element)
    else window.addEventListener('resize', handleResize)

    return () => {
      if (observer) observer.disconnect()
      else window.removeEventListener('resize', handleResize)
      vehicleMarker.current = null
      map.remove()
    }
  }, [isMinimal, isTracking])

  // Roda depois do efeito acima (mesma ordem de declaração), então o marcador do
  // veículo já existe; mover o veículo não recria o mapa.
  useEffect(() => {
    if (progress === undefined) return
    vehicleMarker.current?.setLatLng(toLatLng(getPointAlongRoute(DEMO_ROUTE, progress)))
  }, [progress])

  return (
    <div className={classNames(styles.map, isMinimal && styles.minimal, className)}>
      <section ref={mapElement} className={styles.canvas} aria-label={label} />
      {children}
    </div>
  )
}
