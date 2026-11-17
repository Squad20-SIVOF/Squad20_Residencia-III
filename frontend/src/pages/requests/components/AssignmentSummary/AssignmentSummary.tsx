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
      <div className={styles.main}>
        <h2 id={titleId} className={styles.title}>
          Solicitação #{request.code} · {request.sector ?? EMPTY}
        </h2>
        <p className={styles.route}>
          <span className={styles.hidden}>Trajeto: </span>
          {formatRoute(request)}
        </p>
      </div>
      <div className={styles.extra}>
        <p className={styles.cargo}>
          <span className={styles.hidden}>Carga / categoria: </span>
          {request.cargo ?? EMPTY}
        </p>
        <p className={styles.stops}>
          <span>Paradas: </span>
          {request.stops?.length ? request.stops.join(', ') : EMPTY}
        </p>
      </div>
    </section>
  )
}
