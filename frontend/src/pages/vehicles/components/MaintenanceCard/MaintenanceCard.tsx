import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import type { BadgeVariant } from '@/components/Badge'
import { Card } from '@/components/Card'
import { formatCurrency, formatDate, formatKm } from '@/utils/format'
import type { Maintenance, MaintenanceType } from '../../types'
import styles from './MaintenanceCard.module.scss'

const RECENT_LIMIT = 3

const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  preventiva: 'Preventiva',
  preditiva: 'Preditiva',
  corretiva: 'Corretiva',
  impeditiva: 'Impeditiva',
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  Agendada: 'info',
  'Em Andamento': 'warning',
  Concluída: 'success',
  Cancelada: 'neutral',
}

export interface MaintenanceCardProps {
  maintenances: Maintenance[]
  className?: string
}

export function MaintenanceCard({ maintenances, className }: MaintenanceCardProps) {
  const hiddenCount = maintenances.length - RECENT_LIMIT
  const recent = maintenances.slice(0, RECENT_LIMIT)

  return (
    <Card title="Manutenções" className={className}>
      {maintenances.length === 0 ? (
        <p className={styles.empty}>Nenhuma manutenção registrada para este veículo.</p>
      ) : (
        <ul className={styles.list}>
          {recent.map((maintenance) => (
            <li key={maintenance.id} className={styles.item}>
              <div className={styles.heading}>
                <span className={styles.description}>
                  {maintenance.description || MAINTENANCE_TYPE_LABEL[maintenance.type]}
                </span>
                <Badge
                  variant={
                    maintenance.status
                      ? (STATUS_VARIANT[maintenance.status] ?? 'neutral')
                      : 'neutral'
                  }
                >
                  {maintenance.status ?? MAINTENANCE_TYPE_LABEL[maintenance.type]}
                </Badge>
              </div>
              <span className={styles.meta}>
                <time dateTime={maintenance.date}>{formatDate(maintenance.date)}</time> ·{' '}
                {maintenance.mileageKm == null
                  ? 'Quilometragem não informada'
                  : formatKm(maintenance.mileageKm)}{' '}
                · {maintenance.workshop ?? MAINTENANCE_TYPE_LABEL[maintenance.type]}
              </span>
              <span className={styles.cost}>
                {formatCurrency(maintenance.cost)}
                {maintenance.status === 'Agendada' && (
                  <span className={styles.estimate}> · estimado</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {recent.some(({ status }) => status === 'Agendada') && (
        <p className={styles.note}>Agendamento sem bloqueio imediato de viagens.</p>
      )}
      {hiddenCount > 0 && (
        <Link to="/manutencoes" className={styles.more}>
          Ver todas as manutenções (+{hiddenCount})
        </Link>
      )}
    </Card>
  )
}
