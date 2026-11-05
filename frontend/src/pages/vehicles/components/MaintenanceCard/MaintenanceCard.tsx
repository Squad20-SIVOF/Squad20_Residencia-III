import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { formatCurrency, formatDate, formatKm } from '@/utils/format'
import type { Maintenance, MaintenanceType } from '../../types'
import styles from './MaintenanceCard.module.scss'

const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  preventiva: 'Preventiva',
  preditiva: 'Preditiva',
  corretiva: 'Corretiva',
  impeditiva: 'Impeditiva',
}

export interface MaintenanceCardProps {
  maintenances: Maintenance[]
}

export function MaintenanceCard({ maintenances }: MaintenanceCardProps) {
  return (
    <Card title="Manutenções Realizadas">
      {maintenances.length === 0 ? (
        <p className={styles.empty}>Nenhuma manutenção registrada para este veículo.</p>
      ) : (
        <ul className={styles.list}>
          {maintenances.map((maintenance) => (
            <li key={maintenance.id} className={styles.item}>
              <Badge
                variant={maintenance.type === 'preventiva' ? 'info' : 'warning'}
                className={styles.type}
              >
                {MAINTENANCE_TYPE_LABEL[maintenance.type]}
              </Badge>
              <span className={styles.description}>{maintenance.description}</span>
              <span className={styles.meta}>
                <time dateTime={maintenance.date}>{formatDate(maintenance.date)}</time> ·{' '}
                {maintenance.mileageKm == null
                  ? 'Quilometragem não informada'
                  : formatKm(maintenance.mileageKm)}
              </span>
              <span className={styles.cost}>{formatCurrency(maintenance.cost)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
