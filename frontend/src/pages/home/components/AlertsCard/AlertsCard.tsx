import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { classNames } from '@/utils/classNames'
import type { FleetAlert } from '../../types'
import { plural } from '../../utils/dashboardRules'
import styles from './AlertsCard.module.scss'

export interface AlertsCardProps {
  alerts: FleetAlert[]
  className?: string
}

function WarningIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3 2 21h20L12 3Z" fill="none" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v5M12 18v.01" fill="none" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A lista acompanha a quantidade de alertas: sem alertas, fica só a faixa de status. */
export function AlertsCard({ alerts, className }: AlertsCardProps) {
  const hasCritical = alerts.some((alert) => alert.isCritical)

  return (
    <Card
      title="Alertas da frota"
      action={
        alerts.length > 0 && (
          <Badge variant={hasCritical ? 'danger' : 'warning'}>
            {plural(alerts.length, 'aberto', 'abertos')}
          </Badge>
        )
      }
      className={className}
    >
      {alerts.length > 0 && (
        <ul className={styles.list}>
          {alerts.map((alert) => (
            <li key={alert.id} className={styles.item}>
              <WarningIcon
                className={classNames(
                  styles.icon,
                  alert.isCritical ? styles.iconCritical : styles.iconWarning,
                )}
              />
              <div className={styles.text}>
                <Link to={alert.to} className={styles.title}>
                  {alert.title}
                </Link>
                <span className={styles.detail}>{alert.detail}</span>
              </div>
              <div className={styles.actions}>
                <Badge variant={alert.badgeVariant}>{alert.badgeLabel}</Badge>
                <ButtonLink
                  to="/relatorios"
                  variant="secondary"
                  iconStart={<ReportIcon />}
                  className={styles.report}
                >
                  Relatório
                  <span className={styles.srOnly}>
                    {' '}
                    de {alert.title}: {alert.detail}
                  </span>
                </ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.status}>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m5 12 4 4 10-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Status do sistema: OK
      </p>
    </Card>
  )
}
