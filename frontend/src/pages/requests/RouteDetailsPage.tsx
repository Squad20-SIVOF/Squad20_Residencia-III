import { CarFront, UserRound } from 'lucide-react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { useParams } from 'react-router-dom'
import { useFeatureFlag } from '@/apps/motorista/features/useFeatureFlags'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { TrackedTripPreview } from './components/TrackedTripMap'
import { TripBackLink } from './components/TripBackLink'
import { DEMO_ROUTES } from './services/demoRoutes'
import { listTrackedTrips } from './services/trackedTripService'
import {
  getTrackedTripStatusLabel,
  getTrackedTripStatusVariant,
} from './utils/tripsPanelRules'
import styles from './RouteDetailsPage.module.scss'

function InfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <article>
      <h2>{title}</h2>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}:</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

export function RouteDetailsPage() {
  const { tripId = '' } = useParams()
  const monitoringEnabled = useFeatureFlag('gestor_route_monitoring')
  const result = useAsync(listTrackedTrips)
  const trip =
    result.status === 'success'
      ? result.data.find((item) => item.id === tripId)
      : undefined
  const route = trip && DEMO_ROUTES[trip.id]
  const details = route?.requestDetails
  const title = trip ? `Detalhes da Rota #${trip.routeCode}` : 'Detalhes da Rota'
  const isAssigned = Boolean(trip?.driverName && trip.plate)
  useDocumentTitle(title)

  if (result.status === 'loading')
    return <LoadingState label="Carregando detalhes da rota…" />

  return (
    <div className={styles.page}>
      <PageHeader
        title={title}
        subtitle={
          details
            ? `Solicitada às ${details.requestedTime} · Prioridade ${details.priority} · Dados demonstrativos`
            : 'Dados demonstrativos da viagem.'
        }
        className={styles.header}
        breadcrumb={
          monitoringEnabled ? (
            <TripBackLink to="/viagens/monitoramento">
              Voltar para o Monitoramento de Viagens
            </TripBackLink>
          ) : (
            <TripBackLink />
          )
        }
      />
      {result.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os detalhes"
          action={
            <Button variant="secondary" onClick={result.reload}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {result.status === 'success' && !trip && (
        <StateMessage title="Viagem não encontrada" />
      )}
      {trip && (
        <>
          <div title={getTrackedTripStatusLabel(trip)}>
            {isAssigned ? (
              <Badge variant="success">Atribuído</Badge>
            ) : (
              <Badge variant={getTrackedTripStatusVariant(trip.status)}>
                {getTrackedTripStatusLabel(trip)}
              </Badge>
            )}
          </div>
          <TrackedTripPreview trip={trip} route={route} className={styles.map} />
          <section className={styles.cards} aria-label="Informações da viagem">
            <InfoCard
              title="Rota"
              rows={[
                ['Origem', trip.origin],
                ['Destino', trip.destination],
                ['Paradas', details?.stops.join(', ') || 'Não informadas'],
              ]}
            />
            <InfoCard
              title="Solicitante"
              rows={[
                ['Nome', route?.requesterName ?? 'Não informado'],
                ['Setor', route?.requesterSector ?? 'Não informado'],
                ['Contato', details?.requesterContact ?? 'Não informado'],
              ]}
            />
            <InfoCard
              title="Detalhes da Carga"
              rows={[
                ['Tipo', details?.cargo.type ?? 'Não informado'],
                ['Peso total', details?.cargo.weight ?? 'Não informado'],
                ['Volumes', details?.cargo.volumes ?? 'Não informados'],
              ]}
            />
            <article>
              <h2>Veículo Atribuído</h2>
              {isAssigned ? (
                <div className={styles.assignment}>
                  <span>
                    <UserRound size={16} aria-hidden="true" /> {trip.driverName}
                  </span>
                  <span>
                    <CarFront size={16} aria-hidden="true" />
                    {details?.vehicleModel
                      ? `${details.vehicleModel} / ${trip.plate}`
                      : trip.plate}
                  </span>
                </div>
              ) : (
                <p className={styles.unassigned}>Atribuição não informada.</p>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  )
}
