import { Badge } from '@/components/Badge'
import type { BadgeVariant } from '@/components/Badge'
import { classNames } from '@/utils/classNames'
import type { FleetSummary } from '../../utils/vehicleRules'
import styles from './VehicleStats.module.scss'

export interface VehicleStatsProps {
  summary: FleetSummary
}

export function VehicleStats({ summary }: VehicleStatsProps) {
  const cards: {
    label: string
    value: string
    badge: string
    variant: Extract<BadgeVariant, 'success' | 'warning' | 'danger'>
  }[] = [
    {
      label: 'Veículos ativos',
      value: `${summary.active} / ${summary.total}`,
      badge: 'Ativos / Total Cadastrados',
      variant: 'success',
    },
    {
      label: 'Veículos em Manutenção',
      value: String(summary.maintenance),
      badge: 'Exigem atenção',
      variant: 'warning',
    },
    {
      label: 'Veículos inativos',
      value: String(summary.inactive),
      badge: 'Fora de serviço',
      variant: 'danger',
    },
  ]

  return (
    <ul className={styles.stats} aria-label="Resumo da frota">
      {cards.map((card) => (
        <li key={card.label} className={classNames(styles.card, styles[card.variant])}>
          <p className={styles.label}>{card.label}</p>
          <p className={styles.value}>{card.value}</p>
          <Badge variant={card.variant} className={styles.badge}>
            {card.badge}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
