import { useMemo } from 'react'
import { Navigation } from 'lucide-react'
import { StateMessage } from '@/components/StateMessage'
import { classNames } from '@/utils/classNames'
import type { TrackedTrip } from '../types'
import type { DemoRoute } from '../services/demoRoutes'
import { RouteMap } from './RouteMap'
import styles from './TrackedTripMap.module.scss'

interface TrackedTripPreviewProps {
  trip: TrackedTrip
  route?: DemoRoute | undefined
  className?: string | undefined
}

export function TrackedTripPreview({ trip, route, className }: TrackedTripPreviewProps) {
  const points = useMemo(() => route?.path.map(([lat, lng]) => ({ lat, lng })), [route])
  return (
    <section className={styles.preview} aria-label="Prévia do trajeto">
      {points ? (
        <div className={styles.panel}>
          <RouteMap
            label={`Mapa demonstrativo da rota #${trip.routeCode}`}
            points={points}
            className={classNames(styles.map, className)}
          >
            <output className={styles.mapBadge}>
              Rota #{trip.routeCode} · atualização {route?.updatedLabel}
            </output>
          </RouteMap>
        </div>
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
