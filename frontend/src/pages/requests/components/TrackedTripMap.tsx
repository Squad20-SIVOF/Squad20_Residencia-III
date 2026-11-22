import { useEffect } from 'react'
import { Navigation } from 'lucide-react'
import { Icon } from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { StateMessage } from '@/components/StateMessage'
import { classNames } from '@/utils/classNames'
import type { TrackedTrip } from '../types'
import type { DemoRoute } from '../services/demoRoutes'
import styles from './TrackedTripMap.module.scss'

const stopIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function FitRoute({ path }: { path: DemoRoute['path'] }) {
  const map = useMap()

  useEffect(() => {
    map.fitBounds(path, { padding: [32, 32], maxZoom: 15, animate: false })
  }, [map, path])

  return null
}

interface TrackedTripPreviewProps {
  trip: TrackedTrip
  route?: DemoRoute | undefined
  className?: string
}

export function TrackedTripPreview({ trip, route, className }: TrackedTripPreviewProps) {
  return (
    <section className={styles.preview} aria-label="Prévia do trajeto">
      {route ? (
        <TrackedTripMap trip={trip} route={route} className={className} />
      ) : (
        <StateMessage title="Trajeto indisponível" />
      )}
      <dl className={styles.summary}>
        <div>
          <dt>Origem</dt>
          <dd>{trip.origin}</dd>
        </div>
        <div>
          <dt>Destino</dt>
          <dd>{trip.destination}</dd>
        </div>
        {route && (
          <div className={styles.distance}>
            <dt className={styles.visuallyHidden}>Distância restante</dt>
            <dd>
              <Navigation size={14} aria-hidden="true" />
              {route.remainingDistance} restantes
            </dd>
          </div>
        )}
      </dl>
    </section>
  )
}

function TrackedTripMap({
  trip,
  route,
  className,
}: {
  trip: TrackedTrip
  route: DemoRoute
  className?: string | undefined
}) {
  const [origin] = route.path
  const destination = route.path[route.path.length - 1] ?? origin

  return (
    <section
      className={styles.panel}
      aria-label={`Mapa demonstrativo da rota #${trip.routeCode}`}
    >
      <MapContainer
        center={origin}
        zoom={13}
        zoomAnimation={false}
        scrollWheelZoom={false}
        className={classNames(styles.map, className)}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        />
        <FitRoute path={route.path} />
        <Polyline
          positions={route.path}
          pathOptions={{ className: styles.path, weight: 5 }}
        />
        <Marker
          key={`${trip.id}-origin`}
          position={origin}
          icon={stopIcon}
          alt={`Origem: ${trip.origin}`}
        >
          <Popup>{trip.origin}</Popup>
        </Marker>
        <Marker
          key={`${trip.id}-destination`}
          position={destination}
          icon={stopIcon}
          alt={`Destino: ${trip.destination}`}
        >
          <Popup>{trip.destination}</Popup>
        </Marker>
      </MapContainer>
      <output className={styles.mapBadge}>
        Rota #{trip.routeCode} · atualização {route.updatedLabel}
      </output>
    </section>
  )
}
