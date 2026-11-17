import { useId } from 'react'
import { VehicleQrPrintButton } from '../VehicleQrPrintButton'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { formatKm, formatMonthYear } from '@/utils/format'
import type { Vehicle } from '../../types'
import { vehicleDisplayName, vehicleFullModel } from '../../utils/vehicleRules'
import { MercosulPlate } from '../MercosulPlate'
import { VehicleStatusBadge } from '../VehicleStatusBadge'
import styles from './VehicleSummaryCard.module.scss'

export interface VehicleSummaryCardProps {
  vehicle: Vehicle
}

/** Identificação (placa, modelo, disponibilidade) e indicadores principais do veículo. */
export function VehicleSummaryCard({ vehicle }: VehicleSummaryCardProps) {
  const titleId = useId()
  const meta = [
    formatKm(vehicle.mileageKm),
    vehicle.fleet,
    vehicle.fuelType,
    vehicle.maxCapacity ? `${vehicle.maxCapacity} L` : null,
    vehicle.exclusiveSvo ? 'Exclusivo SVO' : null,
  ].filter(Boolean)
  const rows = [
    { label: 'Quilometragem', value: formatKm(vehicle.mileageKm) },
    { label: 'Frota', value: vehicle.fleet },
    {
      label: 'Próxima vistoria',
      value: vehicle.nextInspection ? formatMonthYear(vehicle.nextInspection) : '—',
    },
  ]

  return (
    <div className={styles.column}>
      <section className={styles.card} aria-labelledby={titleId}>
        <div className={styles.identity}>
          <h2 id={titleId} className={styles.title}>
            {vehicleDisplayName(vehicle)} · {vehicleFullModel(vehicle)}
          </h2>
          <MercosulPlate plate={vehicle.plate} size="sm" />
          <p className={styles.meta}>{meta.join(' · ')}</p>
        </div>
        <VehicleStatusBadge
          status={vehicle.status}
          labelSet="availability"
          className={styles.badge}
          iconStart={
            <svg
              className={styles.badgeIcon}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.25" />
              <path d="M5.5 8.2l1.7 1.7 3.3-3.6" />
            </svg>
          }
        />
      </section>
      <section className={styles.card} aria-label="Indicadores do veículo">
        <dl className={styles.list}>
          {rows.map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={styles.label}>{row.label}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
