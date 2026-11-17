import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { formatCurrency, formatDate, formatKm } from '@/utils/format'
import type { Fueling } from '../../types'
import { toLocalIsoDate, type MonthlyFuelSummary } from '../../utils/vehicleRules'
import styles from './FuelHistoryCard.module.scss'

const RECENT_LIMIT = 2

const litersFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatLiters(liters: number): string {
  return `${litersFormatter.format(liters)} L`
}

export interface FuelHistoryCardProps {
  fuelings: Fueling[]
  monthSummary: MonthlyFuelSummary
  error?: string | undefined
  onRetry?: () => void
  className?: string
}

export function FuelHistoryCard({
  fuelings,
  monthSummary,
  error,
  onRetry,
  className,
}: FuelHistoryCardProps) {
  return (
    <Card title="Abastecimentos recentes" className={className}>
      {error ? (
        <Alert
          variant="danger"
          action={
            onRetry ? (
              <Button variant="secondary" onClick={onRetry}>
                Tentar novamente
              </Button>
            ) : undefined
          }
        >
          {error}
        </Alert>
      ) : fuelings.length === 0 ? (
        <p className={styles.empty}>Nenhum abastecimento registrado para este veículo.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {fuelings.slice(0, RECENT_LIMIT).map((fueling) => (
              <li key={fueling.id} className={styles.item}>
                <span className={styles.title}>
                  {fueling.fuel ?? 'Combustível não informado'} ·{' '}
                  {formatLiters(fueling.liters)}
                </span>
                <span className={styles.meta}>
                  <time dateTime={fueling.date}>
                    {formatDate(toLocalIsoDate(fueling.date))}
                  </time>{' '}
                  · {formatKm(fueling.mileageKm)}
                  {fueling.driverName ? ` · ${fueling.driverName}` : ''}
                </span>
                <span className={styles.total}>
                  {formatCurrency(fueling.total)}
                  {fueling.station ? ` · ${fueling.station}` : ''}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.summary}>
            {monthSummary.count}{' '}
            {monthSummary.count === 1 ? 'registro no mês' : 'registros no mês'} ·{' '}
            {formatLiters(monthSummary.liters)} · {formatCurrency(monthSummary.spent)}
          </p>
        </>
      )}
    </Card>
  )
}
