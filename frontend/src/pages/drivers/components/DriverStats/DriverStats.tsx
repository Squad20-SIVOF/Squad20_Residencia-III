import { StatGrid } from '@/components/StatCard'
import type { DriverSummary } from '../../types'

export interface DriverStatsProps {
  summary: DriverSummary
}

export function DriverStats({ summary }: DriverStatsProps) {
  return (
    <StatGrid
      label="Resumo dos motoristas"
      cards={[
        {
          label: 'Motoristas ativos',
          value: summary.active,
          total: summary.total,
          hint: 'Ativos / Total Cadastrados',
          variant: 'success',
        },
        {
          label: 'CNHs próximas do vencimento',
          value: summary.expiring,
          hint: 'Exigem atenção em 30 dias',
          variant: 'warning',
        },
        {
          label: 'Bloqueios operacionais',
          value: summary.blocked,
          hint: `${summary.expired} CNH vencida${summary.expired === 1 ? '' : 's'}`,
          variant: 'danger',
        },
      ]}
    />
  )
}
