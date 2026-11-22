import { useId } from 'react'
import { Badge } from '@/components/Badge'
import { Card } from '@/components/Card'
import { classNames } from '@/utils/classNames'
import { formatDecimal } from '@/utils/format'
import type { FleetUtilization } from '../../types'
import { describeUtilization, formatVariation, plural } from '../../utils/dashboardRules'
import styles from './UtilizationCard.module.scss'

export interface UtilizationCardProps {
  utilization: FleetUtilization
  className?: string
}

// Coordenadas do SVG: cada dia ocupa uma faixa de SLOT_WIDTH; a altura vai de 0 a 100.
const SLOT_WIDTH = 100
const BAR_WIDTH = 56
const PLOT_HEIGHT = 100

export function UtilizationCard({ utilization, className }: UtilizationCardProps) {
  const captionId = useId()
  const { bars, scaleMax, ticks, dailyAverage, dailyGoal, variationPercent } = utilization
  const average = `${formatDecimal(dailyAverage)} viagens`
  const toY = (value: number) => PLOT_HEIGHT - (value / scaleMax) * PLOT_HEIGHT

  return (
    <Card
      title="Utilização da frota · últimos 7 dias"
      action={<Badge variant="info">Viagens realizadas</Badge>}
      className={className}
    >
      <p className={styles.subtitle}>
        Meta diária: {plural(dailyGoal, 'viagem', 'viagens')} · média: {average}
      </p>

      <dl className={styles.summary}>
        <div>
          <dt>Média semanal</dt>
          <dd className={styles.summaryValue}>{average}</dd>
        </div>
        <div className={styles.variation}>
          <dt>Variação</dt>
          <dd
            className={classNames(
              styles.summaryValue,
              variationPercent >= 0 ? styles.positive : styles.negative,
            )}
          >
            {formatVariation(variationPercent)}
          </dd>
        </div>
      </dl>

      <figure className={styles.chart} aria-labelledby={captionId}>
        <figcaption id={captionId} className={styles.srOnly}>
          {describeUtilization(utilization)}
        </figcaption>
        <span className={styles.axisTitle} aria-hidden="true">
          Viagens
        </span>
        <div className={styles.plot} aria-hidden="true">
          <ol className={styles.yAxis}>
            {[...ticks].reverse().map((tick) => (
              <li key={tick}>{tick}</li>
            ))}
          </ol>
          <svg
            className={styles.bars}
            viewBox={`0 0 ${bars.length * SLOT_WIDTH} ${PLOT_HEIGHT}`}
            preserveAspectRatio="none"
            focusable="false"
          >
            {ticks.map((tick) => (
              <line
                key={tick}
                className={styles.gridLine}
                x1={0}
                x2={bars.length * SLOT_WIDTH}
                y1={toY(tick)}
                y2={toY(tick)}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {bars.map((bar, index) => (
              <rect
                key={bar.date}
                className={bar.isToday ? styles.barToday : styles.bar}
                x={index * SLOT_WIDTH + (SLOT_WIDTH - BAR_WIDTH) / 2}
                y={toY(bar.trips)}
                width={BAR_WIDTH}
                height={PLOT_HEIGHT - toY(bar.trips)}
              />
            ))}
          </svg>
          <ol className={styles.xAxis}>
            {bars.map((bar) => (
              <li key={bar.date} className={bar.isToday ? styles.today : undefined}>
                {bar.dayLabel}
              </li>
            ))}
          </ol>
        </div>
      </figure>

      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span
            className={classNames(styles.swatch, styles.swatchToday)}
            aria-hidden="true"
          />
          Hoje
        </li>
        <li>
          <span className={styles.swatch} aria-hidden="true" />
          Dias anteriores
        </li>
      </ul>
      <p className={styles.note}>
        Dados demonstrativos: o histórico diário de viagens ainda não vem da API.
      </p>
    </Card>
  )
}
