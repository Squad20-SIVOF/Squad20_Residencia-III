import { classNames } from '@/utils/classNames'
import styles from './StatCard.module.scss'

export interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function StatCard({
  label,
  value,
  hint,
  variant = 'info',
  className,
}: StatCardProps) {
  return (
    <article className={classNames(styles.card, styles[variant], className)}>
      <p className={styles.label}>{label}</p>
      <p className={styles.row}>
        <span className={styles.value}>{value}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </p>
    </article>
  )
}
