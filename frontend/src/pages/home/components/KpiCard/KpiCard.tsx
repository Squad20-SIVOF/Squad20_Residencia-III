import { Link } from 'react-router-dom'
import { StatCard } from '@/components/StatCard'
import type { StatCardProps } from '@/components/StatCard'
import styles from './KpiCard.module.scss'

export interface KpiCardProps extends StatCardProps {
  /** Com `to`, o card inteiro vira um link para o módulo. */
  to?: string
}

export function KpiCard({ to, className, ...statProps }: KpiCardProps) {
  if (!to) return <StatCard className={className} {...statProps} />
  return (
    <Link to={to} className={styles.link}>
      <StatCard className={className} {...statProps} />
    </Link>
  )
}
