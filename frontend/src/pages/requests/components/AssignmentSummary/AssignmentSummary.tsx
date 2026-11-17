import { useId } from 'react'
import type { AssignmentRequestSummary } from '../../types'
import styles from './AssignmentSummary.module.scss'

export interface AssignmentSummaryProps {
  request: AssignmentRequestSummary
}

const EMPTY = '—'

function formatRoute({ origin, destination }: AssignmentRequestSummary): string {
  if (!origin && !destination) return EMPTY
  return `${origin ?? EMPTY} → ${destination ?? EMPTY}`
}

/** Resumo da solicitação que receberá o veículo e o motorista. */
export function AssignmentSummary({ request }: AssignmentSummaryProps) {
  const titleId = useId()

  return (
    <section className={styles.summary} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Solicitação #{request.code} · {request.sector ?? EMPTY}
      </h2>
      <dl className={styles.details}>
        <div className={styles.item}>
          <dt>Trajeto</dt>
          <dd>{formatRoute(request)}</dd>
        </div>
        <div className={styles.item}>
          <dt>Carga / categoria</dt>
          <dd>{request.cargo ?? EMPTY}</dd>
        </div>
        <div className={styles.item}>
          <dt>Paradas</dt>
          <dd>{request.stops?.length ? request.stops.join(' · ') : EMPTY}</dd>
        </div>
      </dl>
    </section>
  )
}
