import { classNames } from '@/utils/classNames'
import styles from './StatCard.module.scss'

export interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  /** Texto complementar ao lado do hint (ex.: "vs. ontem"). */
  detail?: string
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  detail,
  variant = 'info',
  className,
}: StatCardProps) {
  const hintBadge = hint && <span className={styles.hint}>{hint}</span>

  return (
    <article className={classNames(styles.card, styles[variant], className)}>
      <p className={styles.label}>{label}</p>
      <p className={styles.row}>
        <span className={styles.value}>{value}</span>
        {detail ? (
          <span className={styles.meta}>
            {hintBadge}
            <span className={styles.detail}>{detail}</span>
          </span>
        ) : (
          hintBadge
        )}
      </p>
    </article>
  )
}
