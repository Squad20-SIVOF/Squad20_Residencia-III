import { classNames } from '@/utils/classNames'
import styles from './StatCard.module.scss'

export interface StatCardProps {
  label: string
  value: number | string
  total?: number
  hint?: string
  variant?: 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function StatCard({
  label,
  value,
  total,
  hint,
  variant = 'info',
  className,
}: StatCardProps) {
  return (
    <article className={classNames(styles.card, styles[variant], className)}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>
        {value}
        {total !== undefined && <span className={styles.total}> / {total}</span>}
      </p>
      {hint && <span className={styles.hint}>{hint}</span>}
    </article>
  )
}

interface StatGridProps {
  label: string
  cards: StatCardProps[]
  columns?: 3 | 4
  className?: string
}

export function StatGrid({ label, cards, columns = 3, className }: StatGridProps) {
  return (
    <div className={classNames(styles.gridFrame, className)}>
      <ul
        className={classNames(styles.grid, columns === 4 && styles.fourColumns)}
        aria-label={label}
      >
        {cards.map((card) => (
          <li key={card.label}>
            <StatCard {...card} />
          </li>
        ))}
      </ul>
    </div>
  )
}
