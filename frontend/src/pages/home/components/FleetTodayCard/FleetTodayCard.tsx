import { Link } from 'react-router-dom'
import type { FleetAvailability } from '../../types'
import { formatFleetBreakdown, plural } from '../../utils/dashboardRules'
import styles from './FleetTodayCard.module.scss'

export interface FleetTodayCardProps {
  fleet: FleetAvailability
}

export function FleetTodayCard({ fleet }: FleetTodayCardProps) {
  return (
    <Link to="/veiculos" className={styles.card}>
      <span className={styles.label}>Frota ativa hoje</span>
      <span className={styles.value}>{plural(fleet.active, 'veículo', 'veículos')}</span>
      <span className={styles.breakdown}>{formatFleetBreakdown(fleet)}</span>
    </Link>
  )
}
