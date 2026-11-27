import { useState } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { Info } from 'lucide-react'
import { useFeatureFlag } from '@/apps/motorista/features/useFeatureFlags'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { PageHeader } from '@/components/PageHeader'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizeText } from '@/utils/format'
import { TrackedTripPreview } from './components/TrackedTripMap'
import { BackLink } from '@/components/BackLink/BackLink'
import { DEMO_ROUTES } from './services/demoRoutes'
import { listTrackedTrips } from './services/trackedTripService'
import {
  formatTripCount,
  getTrackedTripStatusLabel,
  getTrackedTripStatusVariant,
} from './utils/tripsPanelRules'
import styles from './RouteMonitoringPage.module.scss'

export function RouteMonitoringPage() {
  useDocumentTitle('Monitoramento de viagens')
  const detailsEnabled = useFeatureFlag('gestor_route_details')
  const result = useAsync(listTrackedTrips)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  if (result.status === 'loading') return <LoadingState label="Carregando viagens…" />

  const trips = result.status === 'success' ? result.data : []
  const term = normalizeText(query.replace(/^#/, ''))
  const filteredTrips = trips.filter((trip) =>
    normalizeText(
      [trip.routeCode, trip.plate, trip.driverName, trip.origin, trip.destination].join(
        ' ',
      ),
    ).includes(term),
  )
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageTrips = filteredTrips.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )
  const selectedTrip = pageTrips.find((trip) => trip.id === selectedId) ?? pageTrips[0]
  const route = selectedTrip && DEMO_ROUTES[selectedTrip.id]

  return (
    <div className={styles.page}>
      <PageHeader
        title="Monitoramento de Viagens"
        subtitle="Acompanhe deslocamentos e ocorrências da frota com dados demonstrativos."
        className={styles.header}
        breadcrumb={<BackLink to="/viagens">Voltar para o Painel de Viagens</BackLink>}
      />
      {result.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as viagens"
          action={
            <Button variant="secondary" onClick={result.reload}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {result.status === 'success' && (
        <>
          <div className={styles.toolbar}>
            <Toolbar label="Filtrar viagens" className={styles.search}>
              <TextField
                type="search"
                label="Buscar veículo, motorista ou rota"
                isLabelHidden
                placeholder="Buscar veículo, motorista ou rota…"
                value={query}
                onChange={(value) => {
                  setQuery(value)
                  setPage(1)
                }}
              />
            </Toolbar>
            <output className={styles.tripCount}>
              {formatTripCount(filteredTrips.length)}
            </output>
          </div>
          {selectedTrip ? (
            <section className={styles.layout}>
              <div className={styles.tripPanel}>
                <ul className={styles.list} aria-label="Lista de viagens">
                  {pageTrips.map((trip) => (
                    <li key={trip.id} className={styles.trip}>
                      <button
                        type="button"
                        aria-pressed={selectedTrip.id === trip.id}
                        onClick={() => setSelectedId(trip.id)}
                      >
                        <span className={styles.tripHeader}>
                          <strong>Rota #{trip.routeCode}</strong>
                          <Badge
                            variant={getTrackedTripStatusVariant(trip.status)}
                            className={styles.tripBadge}
                          >
                            {getTrackedTripStatusLabel(trip)}
                          </Badge>
                        </span>
                        <span className={styles.tripMeta}>
                          {trip.plate} · {trip.driverName}
                        </span>
                        <span className={styles.tripRoute}>
                          {trip.origin} → {trip.destination}
                        </span>
                      </button>
                      {detailsEnabled && (
                        <ButtonLink
                          variant="secondary"
                          className={styles.detailsLink}
                          to={`/viagens/monitoramento/${encodeURIComponent(trip.id)}`}
                          aria-label={`Ver detalhes da rota #${trip.routeCode}`}
                          iconStart={<Info size={14} />}
                        >
                          Ver detalhes
                        </ButtonLink>
                      )}
                    </li>
                  ))}
                </ul>
                <Pagination
                  itemLabel="viagens"
                  stacked
                  shownCount={pageTrips.length}
                  totalCount={filteredTrips.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  hasPrevious={currentPage > 1}
                  hasNext={currentPage < totalPages}
                  onPrevious={() => setPage(currentPage - 1)}
                  onNext={() => setPage(currentPage + 1)}
                />
              </div>
              <TrackedTripPreview
                trip={selectedTrip}
                route={route}
                className={styles.map}
              />
            </section>
          ) : (
            <StateMessage title="Nenhuma viagem encontrada" />
          )}
        </>
      )}
    </div>
  )
}
