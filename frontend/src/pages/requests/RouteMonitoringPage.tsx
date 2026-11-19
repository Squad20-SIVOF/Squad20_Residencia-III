import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { RouteMap } from './components/RouteMap'
import { listTrackedTrips } from './services/trackedTripService'
import type { TrackedTrip } from './types'
import styles from './RouteMonitoringPage.module.scss'

const EMPTY_TRIPS: TrackedTrip[] = []

export function RouteMonitoringPage() {
  useDocumentTitle('Monitoramento de rotas')
  const result = useAsync(listTrackedTrips)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const trips = result.status === 'success' ? result.data : EMPTY_TRIPS
  const filteredTrips = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    if (!normalized) return trips
    return trips.filter((trip) =>
      [trip.routeCode, trip.plate, trip.driverName, trip.origin, trip.destination].some(
        (value) => value.toLocaleLowerCase('pt-BR').includes(normalized),
      ),
    )
  }, [query, trips])
  const selectedTrip =
    filteredTrips.find((trip) => trip.id === selectedId) ?? filteredTrips[0]

  return (
    <main className={styles.page}>
      <PageHeader
        title="Monitoramento de viagens"
        subtitle="Acompanhe deslocamentos e ocorrências da frota."
      />
      <p className={styles.demo}>
        Demonstração: as posições e rotas são simuladas; não representam GPS ao vivo.
      </p>
      <label className={styles.search}>
        <span className={styles.srOnly}>Buscar veículo, motorista ou rota</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar veículo, motorista ou rota…"
        />
        <span>{filteredTrips.length} viagens</span>
      </label>
      {result.status === 'loading' && (
        <StateMessage variant="loading" title="Carregando viagens…" />
      )}
      {result.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as viagens"
          action={<button onClick={result.reload}>Tentar novamente</button>}
        />
      )}
      {result.status === 'success' && (
        <section className={styles.layout}>
          <div className={styles.list} aria-label="Lista de viagens">
            {filteredTrips.length ? (
              filteredTrips.map((trip) => (
                <button
                  key={trip.id}
                  className={`${styles.trip} ${selectedTrip?.id === trip.id ? styles.selected : ''}`}
                  onClick={() => setSelectedId(trip.id)}
                >
                  <strong>Rota #{trip.routeCode}</strong>
                  <span>
                    {trip.plate} · {trip.driverName}
                  </span>
                  <span>
                    {trip.origin} → {trip.destination}
                  </span>
                </button>
              ))
            ) : (
              <StateMessage title="Nenhuma viagem encontrada" />
            )}
          </div>
          {selectedTrip && (
            <article className={styles.mapPanel}>
              <RouteMap
                label={`Mapa ilustrativo de ${selectedTrip.origin} até ${selectedTrip.destination}`}
              />
              <div className={styles.mapDetails}>
                <h2>Rota #{selectedTrip.routeCode}</h2>
                <p>
                  {selectedTrip.origin} → {selectedTrip.destination}
                </p>
                <p>
                  Motorista: {selectedTrip.driverName} · {selectedTrip.plate}
                </p>
                <Link
                  to={`/viagens/monitoramento/${encodeURIComponent(selectedTrip.id)}`}
                >
                  Ver detalhes da rota
                </Link>
              </div>
            </article>
          )}
        </section>
      )}
    </main>
  )
}
