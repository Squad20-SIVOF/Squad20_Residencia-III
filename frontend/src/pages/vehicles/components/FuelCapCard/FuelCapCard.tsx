import { useId, type ReactNode } from 'react'
import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import type { BadgeVariant } from '@/components/Badge'
import { Button } from '@/components/Button'
import { classNames } from '@/utils/classNames'
import { formatCurrency } from '@/utils/format'
import { fuelCapUsage, type FuelCapLevel } from '../../utils/vehicleRules'
import styles from './FuelCapCard.module.scss'

const LEVEL_BADGE: Record<FuelCapLevel, { label: string; variant: BadgeVariant }> = {
  ok: { label: 'Dentro do teto', variant: 'success' },
  attention: { label: 'Atenção', variant: 'warning' },
  exceeded: { label: 'Teto excedido', variant: 'danger' },
}

export interface FuelCapCardProps {
  /** Teto mensal cadastrado; null quando o veículo não tem teto. */
  cap: number | null
  /** Gasto do mês; null quando os abastecimentos não estão disponíveis. */
  spent: number | null
  monthLabel: string
  error?: string | undefined
  onRetry?: () => void
  /** Botões de registro exibidos à direita. */
  actions?: ReactNode
}

export function FuelCapCard({
  cap,
  spent,
  monthLabel,
  error,
  onRetry,
  actions,
}: FuelCapCardProps) {
  const titleId = useId()
  const usage = cap != null && spent != null ? fuelCapUsage(spent, cap) : null

  function renderBody() {
    if (error) {
      return (
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
      )
    }
    if (spent == null) {
      return (
        <p className={styles.hint}>
          Seu usuário não tem acesso aos abastecimentos deste veículo.
        </p>
      )
    }
    return (
      <>
        <div className={styles.values}>
          <p className={styles.spent}>{formatCurrency(spent)}</p>
          {usage && <p className={styles.percent}>{usage.percent}% do teto</p>}
        </div>
        {usage && cap != null && (
          <progress
            className={classNames(styles.bar, styles[usage.level])}
            max={100}
            value={Math.min(usage.percent, 100)}
            aria-label={`Gasto de ${usage.percent}% do teto mensal`}
          />
        )}
        <p className={styles.hint}>
          {cap != null ? `de ${formatCurrency(cap)}` : 'Teto mensal não definido'} ·{' '}
          {monthLabel}
        </p>
      </>
    )
  }

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Teto mensal de abastecimento
          </h2>
          {usage && !error && (
            <Badge variant={LEVEL_BADGE[usage.level].variant}>
              {LEVEL_BADGE[usage.level].label}
            </Badge>
          )}
        </div>
        {renderBody()}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </section>
  )
}
