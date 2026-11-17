import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { classNames } from '@/utils/classNames'
import { formatKm, formatShortDateTime } from '@/utils/format'
import type { Trip } from '../../types'
import styles from './TripHistoryCard.module.scss'

const RECENT_LIMIT = 3

export interface TripHistoryCardProps {
  trips: Trip[]
  onViewAll?: () => void
  error?: string | undefined
  onRetry?: () => void
  className?: string
}

/** Com `onViewAll`, mostra as 3 últimas viagens lado a lado; sem ele, a lista completa. */
export function TripHistoryCard({
  trips,
  onViewAll,
  error,
  onRetry,
  className,
}: TripHistoryCardProps) {
  const isSummary = Boolean(onViewAll)

  return (
    <Card title="Histórico de viagens" className={className}>
      {error ? (
        <Alert
          variant="danger"
          action={
            onRetry ? (
              <Button variant="secondary" onClick={onRetry}>
                Tentar novamente
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      ) : trips.length === 0 ? (
        <p className={styles.empty}>Nenhuma viagem registrada para este veículo.</p>
      ) : (
        <ul className={classNames(styles.list, isSummary && styles.listSummary)}>
          {(isSummary ? trips.slice(0, RECENT_LIMIT) : trips).map((trip) => (
            <li key={trip.id} className={styles.item}>
              <span className={styles.code}>Viagem #{trip.code}</span>
              {trip.origin && trip.destination && (
                <span className={styles.detail}>
                  {trip.origin} → {trip.destination}
                </span>
              )}
              {trip.status && <span className={styles.detail}>{trip.status}</span>}
              {trip.startedAt ? (
                <time className={styles.detail} dateTime={trip.startedAt}>
                  {formatShortDateTime(trip.startedAt)}
                </time>
              ) : (
                <span className={styles.detail}>Data de início não informada</span>
              )}
              {trip.mileageStart != null && (
                <span className={styles.detail}>
                  {formatKm(trip.mileageStart)}
                  {trip.mileageEnd != null ? ` → ${formatKm(trip.mileageEnd)}` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {onViewAll && !error && (
        <Button variant="secondary" className={styles.viewAll} onClick={onViewAll}>
          Ver histórico completo
        </Button>
      )}
    </Card>
  )
}
