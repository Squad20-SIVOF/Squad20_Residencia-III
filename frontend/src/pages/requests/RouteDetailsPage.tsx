import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { RouteMap } from './components/RouteMap'
import { listTrackedTrips } from './services/trackedTripService'
import styles from './RouteDetailsPage.module.scss'

export function RouteDetailsPage() {
  const { tripId = '' } = useParams()
  const result = useAsync(listTrackedTrips)
  const trip =
    result.status === 'success'
      ? result.data.find((item) => item.id === tripId)
      : undefined
  useDocumentTitle(`Detalhes da rota ${trip?.routeCode ?? ''}`)

  if (result.status === 'loading')
    return <StateMessage variant="loading" title="Carregando detalhes da rota…" />
  if (result.status === 'error')
    return (
      <StateMessage
        variant="error"
        title="Não foi possível carregar os detalhes"
        action={<button onClick={result.reload}>Tentar novamente</button>}
      />
    )
  if (!trip)
    return (
      <StateMessage
        title="Viagem não encontrada"
        description="A rota não está disponível na demonstração atual."
      />
    )

  return (
    <main className={styles.page}>
      <Link to="/viagens/monitoramento" className={styles.back}>
        ← Voltar para o monitoramento
      </Link>
      <PageHeader
        title={`Detalhes da rota #${trip.routeCode}`}
        subtitle={`Status: ${trip.status.replace(/_/g, ' ')}`}
      />
      <p className={styles.demo}>
        Demonstração: as informações abaixo usam dados estáticos até a API de rastreamento
        ser integrada.
      </p>
      <RouteMap
        label={`Mapa ilustrativo da rota ${trip.origin} para ${trip.destination}`}
        className={styles.map}
      />
      <section className={styles.cards} aria-label="Informações da viagem">
        <article>
          <h2>Rota</h2>
          <dl>
            <dt>Origem</dt>
            <dd>{trip.origin}</dd>
            <dt>Destino</dt>
            <dd>{trip.destination}</dd>
            <dt>Código</dt>
            <dd>#{trip.routeCode}</dd>
          </dl>
        </article>
        <article>
          <h2>Motorista</h2>
          <dl>
            <dt>Nome</dt>
            <dd>{trip.driverName}</dd>
            <dt>Veículo</dt>
            <dd>{trip.plate}</dd>
          </dl>
        </article>
        <article>
          <h2>Acompanhamento</h2>
          <dl>
            <dt>Status</dt>
            <dd>{trip.status.replace(/_/g, ' ')}</dd>
            <dt>Atraso</dt>
            <dd>
              {trip.delayMinutes
                ? `${trip.delayMinutes} minutos`
                : 'Sem atraso informado'}
            </dd>
          </dl>
        </article>
      </section>
    </main>
  )
}
