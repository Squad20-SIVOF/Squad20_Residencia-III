import { StatGrid } from '@/components/StatCard'
import type { FleetSummary } from '../../utils/vehicleRules'

export interface VehicleStatsProps {
  summary: FleetSummary
}

export function VehicleStats({ summary }: VehicleStatsProps) {
  return (
    <StatGrid
      label="Resumo da frota"
      cards={[
        {
          label: 'Veículos ativos',
          value: summary.active,
          total: summary.total,
          hint: 'Ativos / Total Cadastrados',
          variant: 'success',
        },
        {
          label: 'Veículos em Manutenção',
          value: summary.maintenance,
          hint: 'Exigem atenção',
          variant: 'warning',
        },
        {
          label: 'Veículos inativos',
          value: summary.inactive,
          hint: 'Fora de serviço',
          variant: 'danger',
        },
      ]}
    />
  )
}
