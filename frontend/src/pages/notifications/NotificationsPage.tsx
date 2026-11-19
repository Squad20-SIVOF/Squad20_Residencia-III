import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getAlertSummary } from '@/service/alertService'
import type { LicenseAlert, MaintenanceAlert } from '@/service/alertService'
import styles from './NotificationsPage.module.scss'

const loadAlerts = () => getAlertSummary()

function severityLabel(severity: string) {
  if (severity === 'critica') return 'Crítico'
  if (severity === 'alta') return 'Atenção'
  return 'Aviso'
}

function LicenseAlertItem({ alert }: { alert: LicenseAlert }) {
  return (
    <li className={styles.item}>
      <span className={`${styles.severity} ${styles[alert.severity] ?? ''}`}>
        {severityLabel(alert.severity)}
      </span>
      <div>
        <strong>CNH de {alert.nome}</strong>
        <span>
          Validade: {alert.validade_cnh} ·{' '}
          {alert.dias_restantes < 0
            ? `vencida há ${Math.abs(alert.dias_restantes)} dias`
            : `vence em ${alert.dias_restantes} dias`}
        </span>
      </div>
      <Link to={`/motoristas/${encodeURIComponent(alert.id)}`}>Ver motorista</Link>
    </li>
  )
}

function MaintenanceAlertItem({ alert }: { alert: MaintenanceAlert }) {
  return (
    <li className={styles.item}>
      <span className={`${styles.severity} ${styles[alert.severity] ?? ''}`}>
        {severityLabel(alert.severity)}
      </span>
      <div>
        <strong>Manutenção do veículo {alert.placa}</strong>
        <span>
          {alert.km_restantes <= 0
            ? `Revisão ultrapassada em ${Math.abs(alert.km_restantes)} km`
            : `Revisão próxima em ${alert.km_restantes} km`}{' '}
          · Odômetro: {alert.quilometragem} km
        </span>
      </div>
      <Link to="/manutencoes">Ver manutenções</Link>
    </li>
  )
}

export function NotificationsPage() {
  useDocumentTitle('Notificações')
  const result = useAsync(loadAlerts)

  if (result.status === 'loading')
    return <StateMessage variant="loading" title="Carregando notificações…" />
  if (result.status === 'error')
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar as notificações"
        description={
          result.error instanceof Error
            ? result.error.message
            : 'Tente novamente em instantes.'
        }
        action={
          <Button variant="secondary" onClick={result.reload}>
            Tentar novamente
          </Button>
        }
      />
    )

  const { cnh, manutencao } = result.data
  const total = cnh.total + manutencao.total
  return (
    <main className={styles.page}>
      <PageHeader
        title="Notificações"
        subtitle="Alertas operacionais de habilitação e manutenção da frota."
      />
      <div className={styles.summary} aria-live="polite">
        <strong>{total}</strong>
        <span>{total === 1 ? 'alerta ativo' : 'alertas ativos'}</span>
        <span>
          {cnh.total} de CNH · {manutencao.total} de manutenção
        </span>
      </div>
      {total === 0 ? (
        <StateMessage
          title="Tudo em dia"
          description="Não há alertas de CNH ou manutenção no momento."
        />
      ) : (
        <div className={styles.groups}>
          <Card title={`Habilitações (${cnh.total})`}>
            {cnh.itens.length ? (
              <ul className={styles.list}>
                {cnh.itens.map((alert) => (
                  <LicenseAlertItem key={alert.id} alert={alert} />
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Nenhum alerta de habilitação.</p>
            )}
          </Card>
          <Card title={`Manutenção (${manutencao.total})`}>
            {manutencao.itens.length ? (
              <ul className={styles.list}>
                {manutencao.itens.map((alert) => (
                  <MaintenanceAlertItem key={alert.id} alert={alert} />
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>Nenhum alerta de manutenção.</p>
            )}
          </Card>
        </div>
      )}
    </main>
  )
}
