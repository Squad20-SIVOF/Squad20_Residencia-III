import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { classNames } from '@/utils/classNames'
import type { TrackedTrip } from '../../types'
import {
  getTrackedTripStatusLabel,
  getTrackedTripStatusVariant,
} from '../../utils/tripsPanelRules'
import styles from './TrackedTripCard.module.scss'

export interface TrackedTripCardProps {
  trip: TrackedTrip
  to?: string | undefined
  className?: string
}

/** Card de "Viagens em acompanhamento": o card inteiro leva ao acompanhamento da rota. */
export function TrackedTripCard({ trip, to, className }: TrackedTripCardProps) {
  const statusLabel = getTrackedTripStatusLabel(trip)
  const cardClass = classNames(styles.card, className)
  const content = (
    <>
      <span className={styles.header}>
        <span className={styles.title}>Rota #{trip.routeCode}</span>
        <Badge
          className={styles.status}
          variant={getTrackedTripStatusVariant(trip.status)}
        >
          {statusLabel}
        </Badge>
      </span>
      <span className={styles.meta}>
        {trip.plate} · {trip.driverName}
      </span>
      <span className={styles.route}>
        {trip.origin} <span aria-hidden="true">→</span> {trip.destination}
      </span>
    </>
  )

  return to ? (
    <Link
      to={to}
      className={classNames(cardClass, styles.link)}
      aria-label={`Acompanhar Rota #${trip.routeCode}, ${statusLabel}: ${trip.origin} para ${trip.destination}`}
    >
      {content}
    </Link>
  ) : (
    <article className={cardClass}>{content}</article>
  )
}
