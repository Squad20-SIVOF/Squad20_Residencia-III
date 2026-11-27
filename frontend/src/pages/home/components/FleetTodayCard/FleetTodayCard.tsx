import { StatCard } from '@/components/StatCard'
import type { FleetAvailability } from '../../types'
import { formatFleetBreakdown, plural } from '../../utils/dashboardRules'
import styles from './FleetTodayCard.module.scss'

export interface FleetTodayCardProps {
  fleet: FleetAvailability
}

export function FleetTodayCard({ fleet }: FleetTodayCardProps) {
  return (
    <StatCard
      to="/veiculos"
      className={styles.card}
      label="Frota ativa hoje"
      value={plural(fleet.active, 'veículo', 'veículos')}
      detail={formatFleetBreakdown(fleet)}
      variant="neutral"
    />
  )
}
