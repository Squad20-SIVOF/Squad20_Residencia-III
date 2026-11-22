import { Button } from '@/components/Button'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { ButtonLink } from '@/components/ButtonLink'
import { PageHeader } from '@/components/PageHeader'
import { StatGrid } from '@/components/StatCard'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useDrivers } from '@/pages/drivers/hooks/useDrivers'
import { summarizeDrivers } from '@/pages/drivers/utils/driverRules'
import { useVehicles } from '@/pages/vehicles/hooks/useVehicles'
import styles from './HomePage.module.scss'

export function HomePage() {
  useDocumentTitle('Início')
  const vehiclesRequest = useVehicles()
  const driversRequest = useDrivers()

  if (vehiclesRequest.status === 'loading' || driversRequest.status === 'loading')
    return <LoadingState label="Carregando resumo da frota..." />

  const renderSummary = () => {
    if (vehiclesRequest.status === 'error' || driversRequest.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar o resumo da frota."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                vehiclesRequest.reload()
                driversRequest.reload()
              }}
            >
              Tentar novamente
            </Button>
          }
        />
      )
    }

    const vehicles = vehiclesRequest.data
    const drivers = summarizeDrivers(driversRequest.data)
    const exclusiveSvo = vehicles.filter((vehicle) => vehicle.exclusiveSvo).length
    const linkedDrivers = driversRequest.data.filter(
      (driver) => driver.vehicles.length > 0,
    ).length
    const availableVehicles = vehicles.filter(
      (vehicle) => vehicle.status === 'ativo',
    ).length

    return (
      <StatGrid
        label="Resumo da frota"
        columns={4}
        cards={[
          {
            variant: 'info',
            label: 'Veículos na frota',
            value: vehicles.length,
            hint: `${availableVehicles} disponíveis`,
          },
          {
            variant: 'success',
            label: 'Motoristas ativos',
            value: drivers.active,
            total: drivers.total,
            hint: 'Ativos / Total Cadastrados',
          },
          {
            variant: 'warning',
            label: 'CNHs próximas do vencimento',
            value: drivers.expiring,
            hint: 'Exigem atenção em 30 dias',
          },
          {
            variant: 'danger',
            label: 'Bloqueios operacionais',
            value: drivers.blocked,
            hint: `${drivers.expired} CNH vencida${drivers.expired === 1 ? '' : 's'}`,
          },
          {
            variant: 'info',
            label: 'Veículos SVO',
            value: vehicles.filter((vehicle) => vehicle.fleet === 'SVO').length,
            hint: `${exclusiveSvo} exclusivos SVO`,
          },
          {
            variant: 'info',
            label: 'Motoristas SVO',
            value: driversRequest.data.filter((driver) => driver.fleet === 'SVO').length,
            hint: `${driversRequest.data.filter((driver) => driver.isWildcard).length} motoristas coringas (todas as frotas)`,
          },
          {
            variant: 'success',
            label: 'Motoristas com veículos vinculados',
            value: linkedDrivers,
            hint: 'Vínculos registrados no cadastro',
          },
          {
            variant: 'warning',
            label: 'Veículos sem frota definida',
            value: vehicles.filter((vehicle) => vehicle.fleet === 'Não informada').length,
            hint: 'Revise os cadastros existentes',
          },
        ]}
      />
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Bem-vindo ao FrotaManager" subtitle="Gestão de Frota · FSPH" />
      {renderSummary()}
      <div className={styles.shortcuts}>
        <ButtonLink to="/veiculos">Ir para Veículos</ButtonLink>
        <ButtonLink to="/motoristas" variant="secondary">
          Ir para Motoristas
        </ButtonLink>
      </div>
    </div>
  )
}
