import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ROUTE_PRESETS } from '../../gps/aracajuRoutes'
import { geoBus, type GeoEventMap } from '../../gps/geoEventBus'
import { RouteSimulator } from '../../gps/routeSimulator'
import styles from './GpsEventSimulatorPage.module.scss'

type EventName = keyof GeoEventMap
interface EventLogEntry {
  id: number
  type: EventName
  summary: string
  at: string
}

const EVENT_TYPES: EventName[] = [
  'gps:position',
  'route:progress',
  'route:off-track',
  'route:updated',
  'geofence:arrived',
]

export function GpsEventSimulatorPage() {
  useDocumentTitle('Simulador GPS por eventos')
  const mapElement = useRef<HTMLDivElement>(null)
  const carMarker = useRef<L.CircleMarker | null>(null)
  const traveledLine = useRef<L.Polyline | null>(null)
  const remainingLine = useRef<L.Polyline | null>(null)
  const simulator = useRef<RouteSimulator | null>(null)
  const following = useRef(true)
  const lastGpsUiUpdateAt = useRef(0)
  const lastProgressUiUpdateAt = useRef(0)
  const lastProgressLoggedPercent = useRef(-1)
  const [routeId, setRouteId] = useState(ROUTE_PRESETS[0]!.id)
  const [speed, setSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const [filter, setFilter] = useState<EventName | 'all'>('all')
  const [events, setEvents] = useState<EventLogEntry[]>([])
  const [telemetry, setTelemetry] = useState({
    fraction: 0,
    remainingKm: 0,
    remainingMinutes: 0,
    speedKmh: 0,
    arrived: false,
    deviation: false,
    heading: 0,
  })
  const selectedRoute =
    ROUTE_PRESETS.find((route) => route.id === routeId) ?? ROUTE_PRESETS[0]!

  useEffect(() => {
    const element = mapElement.current
    if (!element) return

    const map = L.map(element, { zoomControl: true }).setView(
      selectedRoute.coordinates[0]!,
      13,
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    L.circleMarker(selectedRoute.coordinates[0]!, {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#16a34a',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip('Partida')
    L.circleMarker(selectedRoute.coordinates[selectedRoute.coordinates.length - 1]!, {
      radius: 8,
      color: '#ffffff',
      weight: 2,
      fillColor: '#dc2626',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip('Shopping Jardins')
    carMarker.current = L.circleMarker(selectedRoute.coordinates[0]!, {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#2563eb',
      fillOpacity: 1,
    })
      .addTo(map)
      .bindTooltip('Veículo simulado')
    const appendEvent = (type: EventName, summary: string) => {
      setEvents((current) =>
        [
          {
            id: Date.now() + Math.random(),
            type,
            summary,
            at: new Date().toLocaleTimeString('pt-BR'),
          },
          ...current,
        ].slice(0, 100),
      )
    }
    const stopRouteUpdated = geoBus.on('route:updated', (event) => {
      traveledLine.current?.remove()
      remainingLine.current?.remove()
      traveledLine.current = L.polyline([event.coordinates[0]!], {
        color: '#64748b',
        weight: 5,
        dashArray: '6 8',
      }).addTo(map)
      remainingLine.current = L.polyline(event.coordinates, {
        color: event.isDeviation ? '#d97706' : '#2563eb',
        weight: 6,
      }).addTo(map)
      map.fitBounds(remainingLine.current.getBounds(), { padding: [32, 32] })
      setTelemetry((current) => ({
        ...current,
        deviation: event.isDeviation,
        arrived: false,
      }))
      appendEvent(
        'route:updated',
        `${event.originName} · ${event.distanceKm} km${event.isDeviation ? ' · rota recalculada' : ''}`,
      )
    })
    const stopGps = geoBus.on('gps:position', (position) => {
      carMarker.current?.setLatLng([position.lat, position.lng])
      if (following.current) map.panTo([position.lat, position.lng], { animate: false })
      const now = Date.now()
      if (now - lastGpsUiUpdateAt.current >= 1000) {
        lastGpsUiUpdateAt.current = now
        setTelemetry((current) => ({
          ...current,
          speedKmh: position.speedKmh,
          heading: position.heading,
        }))
        appendEvent(
          'gps:position',
          `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} · ±${position.accuracyMeters} m`,
        )
      }
    })
    const stopProgress = geoBus.on('route:progress', (progress) => {
      traveledLine.current?.setLatLngs(progress.traveledCoords)
      remainingLine.current?.setLatLngs(progress.remainingCoords)
      const now = Date.now()
      const percent = Math.floor(progress.fraction * 100)
      if (now - lastProgressUiUpdateAt.current >= 250 || progress.fraction >= 1) {
        lastProgressUiUpdateAt.current = now
        setTelemetry((current) => ({
          ...current,
          fraction: progress.fraction,
          remainingKm: progress.remainingKm,
          remainingMinutes: progress.remainingMinutes,
        }))
      }
      if (
        percent !== lastProgressLoggedPercent.current &&
        (percent === 100 || percent % 10 === 0)
      ) {
        lastProgressLoggedPercent.current = percent
        appendEvent(
          'route:progress',
          `${percent}% · ${progress.remainingKm} km restantes`,
        )
      }
    })
    const stopOffTrack = geoBus.on('route:off-track', (event) => {
      appendEvent('route:off-track', `Desvio de ${event.deviationMeters} m detectado`)
    })
    const stopArrived = geoBus.on('geofence:arrived', (event) => {
      setTelemetry((current) => ({ ...current, arrived: true, speedKmh: 0, fraction: 1 }))
      setIsPlaying(false)
      appendEvent('geofence:arrived', `Chegada: ${event.destination}`)
    })

    const instance = new RouteSimulator(selectedRoute)
    simulator.current = instance
    instance.setRoute(selectedRoute)

    return () => {
      stopRouteUpdated()
      stopGps()
      stopProgress()
      stopOffTrack()
      stopArrived()
      instance.pause()
      map.remove()
      simulator.current = null
    }
    // The map and its event subscriptions are created once per mounted page.
    // Route changes are passed to the simulator in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    simulator.current?.setRoute(selectedRoute)
    setIsPlaying(false)
  }, [selectedRoute])

  useEffect(() => {
    simulator.current?.setSpeed(speed)
  }, [speed])

  function reset() {
    simulator.current?.reset()
    setIsPlaying(false)
  }

  function togglePlayback() {
    if (isPlaying) {
      simulator.current?.pause()
      setIsPlaying(false)
    } else {
      if (telemetry.arrived) simulator.current?.reset()
      simulator.current?.start()
      setIsPlaying(true)
    }
  }

  function toggleFollow() {
    const next = !isFollowing
    following.current = next
    setIsFollowing(next)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Ferramenta de desenvolvimento · simulada</p>
          <h1>GPS orientado a eventos</h1>
          <p>Rota de teste em Aracaju até o Shopping Jardins</p>
        </div>
        <a href="/dev/feature-flags">Configurar flags</a>
      </header>

      <section className={styles.toolbar} aria-label="Controles da simulação">
        <label>
          Ponto de partida
          <select value={routeId} onChange={(event) => setRouteId(event.target.value)}>
            {ROUTE_PRESETS.map((route) => (
              <option key={route.id} value={route.id}>
                {route.originName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Velocidade
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            {[1, 2, 5, 10].map((value) => (
              <option key={value} value={value}>
                {value}x
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" onClick={toggleFollow}>
          {isFollowing ? 'Pausar acompanhamento do mapa' : 'Acompanhar veículo'}
        </Button>
      </section>

      <div className={styles.columns}>
        <section className={styles.mapPanel} aria-label="Mapa da rota simulada">
          <div ref={mapElement} className={styles.map} />
          <div className={styles.telemetry} aria-live="polite">
            <div>
              <span>Distância restante</span>
              <strong>{telemetry.remainingKm.toFixed(2)} km</strong>
            </div>
            <div>
              <span>ETA estimado</span>
              <strong>{telemetry.remainingMinutes} min</strong>
            </div>
            <div>
              <span>Velocidade</span>
              <strong>{telemetry.speedKmh} km/h</strong>
            </div>
            <div>
              <span>Rumo</span>
              <strong>{Math.round(telemetry.heading)}°</strong>
            </div>
          </div>
          {telemetry.arrived && (
            <output className={styles.arrived}>
              Chegada ao Shopping Jardins simulada.
            </output>
          )}
        </section>

        <aside className={styles.eventsPanel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Eventos de geolocalização</h2>
              <p>EventTarget + CustomEvent tipado</p>
            </div>
            <Button variant="secondary" onClick={() => setEvents([])}>
              Limpar
            </Button>
          </div>
          <label className={styles.filter}>
            Filtrar eventos
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as EventName | 'all')}
            >
              <option value="all">Todos os eventos</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <ol className={styles.eventList} aria-live="polite">
            {events
              .filter((event) => filter === 'all' || event.type === filter)
              .map((event) => (
                <li key={event.id}>
                  <time>{event.at}</time>
                  <strong>{event.type}</strong>
                  <span>{event.summary}</span>
                </li>
              ))}
            {!events.length && (
              <li className={styles.empty}>
                Use os controles para iniciar a emissão de eventos.
              </li>
            )}
          </ol>
        </aside>
      </div>

      <section className={styles.playback} aria-label="Reprodução da rota">
        <Button onClick={togglePlayback}>
          {isPlaying ? 'Pausar simulação' : 'Iniciar simulação'}
        </Button>
        <Button variant="secondary" onClick={reset}>
          Reiniciar
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            simulator.current?.simulateDeviation()
            setIsPlaying(false)
          }}
        >
          Simular desvio de rota
        </Button>
        <label className={styles.progress}>
          Progresso
          <input
            type="range"
            min="0"
            max="1000"
            value={Math.round(telemetry.fraction * 1000)}
            onChange={(event) => {
              simulator.current?.seek(Number(event.target.value) / 1000)
              setIsPlaying(false)
            }}
          />
          <span>{Math.round(telemetry.fraction * 100)}%</span>
        </label>
      </section>

      <p className={styles.disclaimer}>
        Este simulador usa coordenadas predefinidas para demonstração. Não usa o GPS do
        aparelho, não acompanha uma viagem real e não grava dados no sistema.
      </p>
    </main>
  )
}
