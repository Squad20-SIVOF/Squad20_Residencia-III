import { classNames } from '@/utils/classNames'
import { formatKm, formatTime } from '@/utils/format'
import type { TripStage } from '../../types'
import { getStageStatus } from '../../utils/requestRules'
import styles from './EtaPanel.module.scss'

export interface EtaPanelProps {
  stage: TripStage
  etaMinutes: number
  /** ISO 8601 do horário previsto de chegada. */
  arrivalAt: string
  remainingKm: number
  secondsSinceUpdate: number
  className?: string
}

/** Status do motorista, tempo estimado e distância restante. */
export function EtaPanel({
  stage,
  etaMinutes,
  arrivalAt,
  remainingKm,
  secondsSinceUpdate,
  className,
}: EtaPanelProps) {
  const hasArrived = stage === 'embarque'

  return (
    <section
      className={classNames(styles.panel, className)}
      aria-label="Previsão de chegada"
    >
      <div className={styles.status}>
        {/* <output> anuncia a mudança de etapa, não cada segundo do relógio. */}
        <output className={styles.title}>
          <span className={styles.dot} aria-hidden="true" />
          {getStageStatus(stage)}
        </output>
        <p className={styles.updated}>Localização atualizada há {secondsSinceUpdate} s</p>
      </div>

      <p className={styles.eta}>
        <span className={styles.etaValue}>
          {hasArrived ? 'Agora' : `${etaMinutes} min`}
        </span>
        <span className={styles.caption}>
          {hasArrived ? 'chegou às' : 'previsão'} {formatTime(arrivalAt)}
        </span>
      </p>

      <p className={styles.distance}>
        <span className={styles.distanceValue}>{formatKm(remainingKm)}</span>
        <span className={styles.caption}>restantes</span>
      </p>
    </section>
  )
}
