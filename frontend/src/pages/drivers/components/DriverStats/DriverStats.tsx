import type { DriverSummary } from '../../types'
import styles from './DriverStats.module.scss'

export interface DriverStatsProps {
  summary: DriverSummary
}

export function DriverStats({ summary }: DriverStatsProps) {
  return (
    <section className={styles.grid} aria-label="Resumo dos motoristas">
      <div className={`${styles.card} ${styles.borderGreen}`}>
        <p className={styles.label}>Motoristas ativos</p>
        <h2 className={styles.value}>
          {summary.active} <span className={styles.subValue}>/ {summary.total}</span>
        </h2>
        <span className={`${styles.badge} ${styles.bgGreen}`}>
          Ativos / Total Cadastrados
        </span>
      </div>

      <div className={`${styles.card} ${styles.borderYellow}`}>
        <p className={styles.label}>CNHs próximas do vencimento</p>
        <h2 className={styles.value}>{summary.expiring}</h2>
        <span className={`${styles.badge} ${styles.bgYellow}`}>
          Exigem atenção em 30 dias
        </span>
      </div>

      <div className={`${styles.card} ${styles.borderRed}`}>
        <p className={styles.label}>Bloqueios operacionais</p>
        <h2 className={styles.value}>{summary.blocked}</h2>
        <span className={`${styles.badge} ${styles.bgRed}`}>
          {summary.expired} CNH vencida{summary.expired === 1 ? '' : 's'}
        </span>
      </div>
    </section>
  )
}
