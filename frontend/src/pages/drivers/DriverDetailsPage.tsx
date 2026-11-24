import { useParams } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ButtonLink } from '@/components/ButtonLink'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { CnhExpiry } from './components/CnhExpiry'
import { DriverStatusBadge } from './components/DriverStatusBadge'
import { useDriver } from './hooks/useDriver'
import type { Driver } from './types'
import { canTakeNewTrips, getEffectiveStatus } from './utils/driverRules'
import styles from './DriverDetailsPage.module.scss'

function buildRows(driver: Driver) {
  return [
    { label: 'CPF', value: driver.cpf || '—' },
    { label: 'Telefone', value: driver.phone || '—' },
    { label: 'E-mail', value: driver.email || '—' },
    { label: 'CNH', value: `${driver.cnh} · Categoria ${driver.cnhCategory}` },
    {
      label: 'Validade da CNH',
      value: <CnhExpiry expiry={driver.cnhExpiry} format="date" />,
    },
    {
      label: 'Frota',
      value: driver.isWildcard ? 'Coringa — todas as frotas' : driver.fleet || '—',
    },
    { label: 'Veículos', value: driver.vehicles.join(', ') || '—' },
    {
      label: 'Novas viagens',
      value: canTakeNewTrips(driver) ? 'Liberado' : 'Indisponível',
    },
  ]
}

export function DriverDetailsPage() {
  const { id } = useParams()
  const driverRequest = useDriver(id)
  const driver = driverRequest.status === 'success' ? driverRequest.data : undefined
  useDocumentTitle(driver ? `${driver.name} — Motorista` : 'Detalhes do Motorista')

  function renderContent() {
    if (driverRequest.status === 'loading') {
      return <StateMessage variant="loading" title="Carregando motorista..." />
    }

    if (driverRequest.status === 'error' || !driver) {
      return (
        <StateMessage
          variant="error"
          title="Motorista não encontrado."
          action={
            <ButtonLink variant="secondary" to="/motoristas">
              Voltar para a lista
            </ButtonLink>
          }
        />
      )
    }

    return (
      <Card>
        <div className={styles.summary}>
          <Avatar name={driver.name} src={driver.photo} size="lg" />
          <div className={styles.identity}>
            <h2 className={styles.name}>{driver.name}</h2>
            <DriverStatusBadge status={getEffectiveStatus(driver)} />
          </div>
          <ButtonLink to={`/motoristas/editar/${driver.id}`} className={styles.edit}>
            Editar
          </ButtonLink>
        </div>

        <dl className={styles.list}>
          {buildRows(driver).map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={styles.label}>{row.label}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Detalhes do Motorista"
        subtitle={driver?.name}
        breadcrumb={
          <Breadcrumb
            items={[{ label: 'Motoristas', to: '/motoristas' }, { label: 'Detalhes' }]}
          />
        }
      />
      {renderContent()}
    </div>
  )
}
