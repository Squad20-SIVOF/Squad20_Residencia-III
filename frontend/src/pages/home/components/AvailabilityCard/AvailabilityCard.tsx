import { Badge } from '@/components/Badge'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { StateMessage } from '@/components/StateMessage'
import { classNames } from '@/utils/classNames'
import type { FleetAvailability } from '../../types'
import { formatFleetBreakdown, shareOfFleet } from '../../utils/dashboardRules'
import styles from './AvailabilityCard.module.scss'

export interface AvailabilityCardProps {
  fleet: FleetAvailability
  className?: string
}

type Tone = 'available' | 'maintenance' | 'refueling'

export function AvailabilityCard({ fleet, className }: AvailabilityCardProps) {
  if (fleet.active === 0) {
    return (
      <Card title="Disponibilidade da frota" className={className}>
        <StateMessage
          title="Nenhum veículo ativo na frota."
          description="Cadastre ou reative veículos para acompanhar a disponibilidade."
          action={<ButtonLink to="/veiculos">Ir para Veículos</ButtonLink>}
        />
      </Card>
    )
  }

  const rows: { tone: Tone; label: string; value: number | null }[] = [
    { tone: 'available', label: 'Disponível', value: fleet.available },
    { tone: 'maintenance', label: 'Manutenção', value: fleet.maintenance },
    { tone: 'refueling', label: 'Abastecimento', value: fleet.refueling },
  ]

  return (
    <Card
      title="Disponibilidade da frota"
      action={<Badge variant="success">{fleet.availablePercent}% disponível</Badge>}
      className={className}
    >
      <p className={styles.subtitle}>{formatFleetBreakdown(fleet)}</p>

      <ul className={styles.counts}>
        {rows.map((row) => (
          <li key={row.tone}>
            <span className={styles.countLabel}>
              <span
                className={classNames(styles.dot, styles[row.tone])}
                aria-hidden="true"
              />
              {row.label}
            </span>
            <span className={styles.countValue}>{row.value ?? '—'}</span>
            <span className={styles.countShare}>
              {row.value === null
                ? 'sem dados na API'
                : `${shareOfFleet(row.value, fleet.active)}% da frota`}
            </span>
          </li>
        ))}
      </ul>

      <ul className={styles.meters} aria-label="Proporção da frota ativa por situação">
        {rows.map((row) => {
          const share = shareOfFleet(row.value, fleet.active)
          return (
            <li key={row.tone}>
              <span className={styles.meterLabel}>{row.label}</span>
              <svg
                className={styles.track}
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <rect className={styles[row.tone]} width={share} height={10} />
              </svg>
              <span className={styles.meterValue}>{row.value ?? '—'}</span>
              <span className={styles.srOnly}>
                {row.value === null ? 'sem dados' : `${share}% da frota ativa`}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
