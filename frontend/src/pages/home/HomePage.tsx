import { useState } from 'react'
import { Button } from '@/components/Button'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatLongDate } from '@/utils/format'
import { AlertsCard } from './components/AlertsCard'
import { AvailabilityCard } from './components/AvailabilityCard'
import { FleetTodayCard } from './components/FleetTodayCard'
import { KpiCard } from './components/KpiCard'
import { OperationalDetailsCard } from './components/OperationalDetailsCard'
import type { OperationalDetail } from './components/OperationalDetailsCard'
import { SectionErrorCard } from './components/SectionErrorCard'
import { UtilizationCard } from './components/UtilizationCard'
import { useDashboard } from './hooks/useDashboard'
import type { DashboardData } from './types'
import {
  buildFleetAlerts,
  buildNextActions,
  buildUtilization,
  countOpenAlerts,
  formatSignedNumber,
  plural,
  summarizeFleet,
  summarizeScheduledMaintenances,
  summarizeTrips,
} from './utils/dashboardRules'
import styles from './HomePage.module.scss'

const UNAVAILABLE = '—'

interface DashboardContentProps {
  data: DashboardData
  today: Date
  onRetry: () => void
}

function DashboardContent({ data, today, onRetry }: DashboardContentProps) {
  const { vehicles, alerts, maintenances } = data
  const fleet = vehicles.status === 'ok' ? summarizeFleet(vehicles.data) : null
  const trips = summarizeTrips(data.trips)
  const openAlerts = alerts.status === 'ok' ? countOpenAlerts(alerts.data) : null
  const scheduled =
    maintenances.status === 'ok'
      ? summarizeScheduledMaintenances(maintenances.data, today)
      : null
  const utilization = buildUtilization(data.weeklyTrips, today)
  const nextActions = buildNextActions(
    alerts.status === 'ok' ? alerts.data : null,
    data.trips,
  )

  const details: OperationalDetail[] = []
  if (vehicles.status !== 'forbidden') {
    details.push(
      {
        label: 'Frota ativa',
        value: fleet ? plural(fleet.active, 'veículo', 'veículos') : UNAVAILABLE,
      },
      { label: 'Disponíveis', value: fleet?.available ?? UNAVAILABLE, tone: 'success' },
      {
        label: 'Em manutenção',
        value: fleet?.maintenance ?? UNAVAILABLE,
        tone: 'warning',
      },
      { label: 'Em abastecimento', value: fleet?.refueling ?? UNAVAILABLE, tone: 'info' },
    )
  }
  details.push(
    { label: 'Viagens concluídas · 7 dias', value: utilization.weeklyTotal },
    { label: 'Viagens em andamento', value: trips.inProgress, tone: 'info' },
  )
  if (alerts.status !== 'forbidden') {
    details.push({
      label: 'Alertas operacionais',
      value: openAlerts?.total ?? UNAVAILABLE,
      tone: 'danger',
    })
  }
  if (maintenances.status !== 'forbidden') {
    details.push({
      label: 'Manutenções agendadas',
      value: scheduled?.scheduled ?? UNAVAILABLE,
      tone: 'warning',
    })
  }

  return (
    <>
      <section className={styles.kpis} aria-label="Indicadores principais">
        {vehicles.status !== 'forbidden' && (
          <KpiCard
            to="/veiculos"
            variant="success"
            label="Veículos disponíveis"
            value={fleet ? `${fleet.available} / ${fleet.active}` : UNAVAILABLE}
            {...(fleet
              ? {
                  hint: formatSignedNumber(data.availableVsYesterday),
                  detail: 'vs. ontem',
                }
              : { detail: 'Não foi possível carregar' })}
          />
        )}
        <KpiCard
          to="/viagens"
          variant="info"
          label="Viagens em andamento"
          value={trips.inProgress}
          hint={plural(trips.delayed, 'atrasada', 'atrasadas')}
          detail={`${trips.onTime} dentro do prazo`}
        />
        {alerts.status !== 'forbidden' && (
          <KpiCard
            variant="danger"
            label="Alertas operacionais"
            value={openAlerts?.total ?? UNAVAILABLE}
            {...(openAlerts
              ? {
                  hint: plural(openAlerts.critical, 'crítico', 'críticos'),
                  detail: `${openAlerts.total - openAlerts.critical} em análise`,
                }
              : { detail: 'Não foi possível carregar' })}
          />
        )}
        {maintenances.status !== 'forbidden' && (
          <KpiCard
            to="/manutencoes"
            variant="warning"
            label="Manutenções agendadas"
            value={scheduled?.scheduled ?? UNAVAILABLE}
            {...(scheduled
              ? {
                  hint: `${scheduled.today} hoje`,
                  detail: `${scheduled.untilFriday} até sexta`,
                }
              : { detail: 'Não foi possível carregar' })}
          />
        )}
      </section>

      <div className={styles.panels}>
        <UtilizationCard utilization={utilization} className={styles.utilization} />

        {fleet && <AvailabilityCard fleet={fleet} className={styles.availability} />}
        {vehicles.status === 'error' && (
          <SectionErrorCard
            title="Disponibilidade da frota"
            message="Não foi possível carregar os veículos."
            onRetry={onRetry}
            className={styles.availability}
          />
        )}

        {alerts.status === 'ok' && (
          <AlertsCard alerts={buildFleetAlerts(alerts.data)} className={styles.alerts} />
        )}
        {alerts.status === 'error' && (
          <SectionErrorCard
            title="Alertas da frota"
            message="Não foi possível carregar os alertas."
            onRetry={onRetry}
            className={styles.alerts}
          />
        )}

        <OperationalDetailsCard
          details={details}
          actions={nextActions}
          className={styles.details}
        />
      </div>

      <p className={styles.note}>
        Viagens, histórico de 7 dias e variação “vs. ontem” usam dados demonstrativos até
        a API disponibilizar essas informações.
      </p>
    </>
  )
}

export function HomePage() {
  useDocumentTitle('Início')
  const request = useDashboard()
  // A data de referência é fixada ao abrir a tela, para todos os blocos usarem o mesmo "hoje".
  const [today] = useState(() => new Date())
  const vehicles = request.status === 'success' ? request.data.vehicles : null

  function renderContent() {
    if (request.status === 'loading') {
      return <LoadingState label="Carregando dashboard" />
    }
    if (request.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar o dashboard."
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="secondary" onClick={request.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }
    return <DashboardContent data={request.data} today={today} onRetry={request.reload} />
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <PageHeader
          title="Dashboard Principal"
          subtitle={`Visão gerencial completa da operação em ${formatLongDate(today)}`}
        />
        {vehicles?.status === 'ok' && (
          <FleetTodayCard fleet={summarizeFleet(vehicles.data)} />
        )}
      </div>
      {renderContent()}
    </div>
  )
}
