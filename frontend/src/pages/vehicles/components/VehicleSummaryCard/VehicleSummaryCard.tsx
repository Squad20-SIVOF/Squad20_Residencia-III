import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { formatKm, formatMonthYear } from '@/utils/format'
import type { Vehicle } from '../../types'
import styles from './VehicleSummaryCard.module.scss'

export interface VehicleSummaryCardProps {
  vehicle: Vehicle
  onEdit: () => void
}

export function VehicleSummaryCard({ vehicle, onEdit }: VehicleSummaryCardProps) {
  const rows = [
    { label: 'Marca', value: vehicle.brand || 'Não informada' },
    { label: 'Placa', value: vehicle.plate },
    { label: 'Modelo', value: vehicle.model },
    { label: 'Quilometragem', value: formatKm(vehicle.mileageKm) },
    { label: 'Frota', value: vehicle.fleet },
    { label: 'Exclusivo SVO', value: vehicle.exclusiveSvo ? 'Sim' : 'Não' },
    {
      label: 'Próxima vistoria',
      value: vehicle.nextInspection
        ? formatMonthYear(vehicle.nextInspection)
        : 'Não informada',
    },
  ]

  return (
    <Card title="Resumo Geral" className={styles.card}>
      <dl className={styles.list}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt className={styles.label}>{row.label}</dt>
            <dd className={styles.value}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <Button variant="secondary" isFullWidth onClick={onEdit}>
        Editar veículo
      </Button>
    </Card>
  )
}
