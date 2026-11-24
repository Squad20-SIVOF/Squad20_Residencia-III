import { classNames } from '@/utils/classNames'
import { TRIP_STAGES, TRIP_STAGE_LABELS } from '../../types'
import type { TripStage } from '../../types'
import { getStageIndex } from '../../utils/requestRules'
import styles from './TripProgress.module.scss'

export interface TripProgressProps {
  stage: TripStage
  className?: string
}

/** Linha de etapas Confirmada → A caminho → Chegando → Embarque. */
export function TripProgress({ stage, className }: TripProgressProps) {
  const currentIndex = getStageIndex(stage)

  return (
    <ol className={classNames(styles.steps, className)} aria-label="Etapas da viagem">
      {TRIP_STAGES.map((item, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <li
            key={item}
            className={classNames(
              styles.step,
              isDone && styles.stepDone,
              isCurrent && styles.stepCurrent,
            )}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className={styles.marker} aria-hidden="true" />
            <span className={styles.label}>
              {TRIP_STAGE_LABELS[item]}
              {isDone && <span className={styles.hidden}> (concluída)</span>}
              {isCurrent && <span className={styles.hidden}> (etapa atual)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
