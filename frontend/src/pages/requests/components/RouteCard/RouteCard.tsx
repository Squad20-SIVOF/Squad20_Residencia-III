import { useId } from 'react'
import { TextField } from '@/components/TextField'
import { classNames } from '@/utils/classNames'
import { RouteMap } from '../RouteMap'
import styles from './RouteCard.module.scss'

export interface RouteCardProps {
  origin: string
  destination: string
  onOriginChange: (value: string) => void
  onDestinationChange: (value: string) => void
  originError?: string | undefined
  destinationError?: string | undefined
  originId: string
  destinationId: string
  /** id do <form>: os campos ficam fora dele no layout, mas são enviados com ele. */
  formId: string
  isDisabled?: boolean
  className?: string
}

/** Card "Rota da Solicitação" sobre o mapa, com origem e destino. */
export function RouteCard({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  originError,
  destinationError,
  originId,
  destinationId,
  formId,
  isDisabled = false,
  className,
}: RouteCardProps) {
  const titleId = useId()

  return (
    <section className={classNames(styles.route, className)} aria-labelledby={titleId}>
      <RouteMap
        className={styles.map}
        label="Mapa ilustrativo da rota entre a origem e o destino"
      />

      <div className={styles.card}>
        <h2 id={titleId} className={styles.title}>
          Rota da Solicitação
        </h2>
        <div className={styles.stops}>
          <span className={styles.originMarker} aria-hidden="true" />
          <TextField
            id={originId}
            form={formId}
            label="Origem"
            className={styles.field}
            value={origin}
            onChange={onOriginChange}
            autoComplete="off"
            aria-required="true"
            disabled={isDisabled}
            isInvalid={!!originError}
            errorMessage={originError}
          />
          <span className={styles.line} aria-hidden="true" />
          <span className={styles.destinationMarker} aria-hidden="true" />
          <TextField
            id={destinationId}
            form={formId}
            label="Destino"
            placeholder="Digite o destino..."
            className={styles.field}
            value={destination}
            onChange={onDestinationChange}
            autoComplete="off"
            aria-required="true"
            disabled={isDisabled}
            isInvalid={!!destinationError}
            errorMessage={destinationError}
          />
        </div>
      </div>

      <p className={styles.badge}>Visualização do Mapa SVO</p>
    </section>
  )
}
