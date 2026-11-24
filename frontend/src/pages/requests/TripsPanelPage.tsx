import { useId } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { Link } from 'react-router-dom'
import { useFeatureFlag } from '@/apps/motorista/features/useFeatureFlags'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ComingSoonLink } from './components/ComingSoonLink'
import { PendingRequestsCard } from './components/PendingRequestsCard'
import { QuickActionCard } from './components/QuickActionCard'
import type { QuickActionCardProps } from './components/QuickActionCard'
import { TrackedTripCard } from './components/TrackedTripCard'
import { listPendingRequests } from './services/requestApi'
import { listTrackedTrips } from './services/trackedTripService'
import { formatTripCount } from './utils/tripsPanelRules'
import styles from './TripsPanelPage.module.scss'

// O Painel mostra só as primeiras pendentes; a paginação fica em "Ver todas".
const loadPendingRequests = () => listPendingRequests(1)

const QUICK_ACTIONS: QuickActionCardProps[] = [
  {
    icon: 'car',
    title: 'Solicitar Veículo',
    description: 'Reserve um veículo oficial para o seu setor.',
    linkLabel: 'Nova solicitação',
    to: '/viagens/solicitar',
  },
  {
    icon: 'route',
    title: 'Mapa de Rotas',
    description: 'Acompanhe viagens e ocorrências da frota.',
    linkLabel: 'Acessar mapa',
  },
  {
    icon: 'document',
    title: 'Novo Atendimento SVO',
    description: 'Registre a verificação de óbito e a remoção.',
    linkLabel: 'Iniciar atendimento',
    to: '/viagens/atendimento-svo',
  },
]

/** Entrada do módulo Viagens (`/viagens`): atalhos, solicitações pendentes e rotas em andamento. */
export function TripsPanelPage() {
  const monitoringEnabled = useFeatureFlag('gestor_route_monitoring')
  const detailsEnabled = useFeatureFlag('gestor_route_details')
  useDocumentTitle('Painel de Viagens')
  const quickActionsId = useId()
  const tripsId = useId()
  const pendingRequests = useAsync(loadPendingRequests)
  const trips = useAsync(listTrackedTrips)

  if (pendingRequests.status === 'loading' || trips.status === 'loading')
    return <LoadingState label="Carregando painel de viagens" />

  const renderTrips = () => {
    if (trips.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as viagens em acompanhamento."
          action={
            <Button variant="secondary" onClick={trips.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }

    if (trips.data.length === 0) {
      return <StateMessage title="Nenhuma viagem em acompanhamento." />
    }

    return (
      <ul className={styles.tripList}>
        {trips.data.map((trip) => (
          <li key={trip.id}>
            <TrackedTripCard
              trip={trip}
              to={
                detailsEnabled
                  ? `/viagens/monitoramento/${encodeURIComponent(trip.id)}`
                  : monitoringEnabled
                    ? '/viagens/monitoramento'
                    : undefined
              }
            />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        className={styles.header}
        title="Painel de Viagens"
        subtitle="Gerencie solicitações, acompanhe rotas e inicie novos atendimentos de viagens."
      />

      <section className={styles.section} aria-labelledby={quickActionsId}>
        <h2 id={quickActionsId} className={styles.sectionTitle}>
          Ações Rápidas
        </h2>
        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard
              key={action.title}
              {...(action.title === 'Mapa de Rotas' && monitoringEnabled
                ? { ...action, to: '/viagens/monitoramento' }
                : action)}
            />
          ))}
        </div>
      </section>

      <PendingRequestsCard result={pendingRequests} />

      <section className={styles.section} aria-labelledby={tripsId}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleRow}>
            <h2 id={tripsId} className={styles.sectionTitle}>
              Viagens em acompanhamento
            </h2>
            {trips.status === 'success' && (
              <span className={styles.count}>{formatTripCount(trips.data.length)}</span>
            )}
          </div>
          {monitoringEnabled ? (
            <Link to="/viagens/monitoramento" className={styles.monitoringLink}>
              Abrir mapa de rotas
            </Link>
          ) : (
            <ComingSoonLink
              label="Abrir mapa de rotas"
              className={styles.monitoringLink}
            />
          )}
        </div>
        <p className={styles.demoNote}>
          Demonstração: as rotas abaixo são exemplos até a integração com o rastreamento.
        </p>
        {renderTrips()}
      </section>
    </div>
  )
}
