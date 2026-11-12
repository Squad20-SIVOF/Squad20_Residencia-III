import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { fetchDriverTrips } from '../services/driverAppService'
import styles from './DriverPages.module.scss'
export function DriverTripsPage() {
  useDocumentTitle('Minhas viagens')
  const [page, setPage] = useState(1)
  const load = useCallback(() => fetchDriverTrips(page), [page])
  const result = useAsync(load)
  return (
    <section className={styles.page}>
      <PageHeader title="Minhas viagens" subtitle="Viagens atribuídas ao seu cadastro" />
      {result.status === 'loading' && (
        <StateMessage variant="loading" title="Carregando viagens" />
      )}
      {result.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as viagens"
          description={
            result.error instanceof Error ? result.error.message : 'Tente novamente.'
          }
          action={<Button onClick={result.reload}>Tentar novamente</Button>}
        />
      )}
      {result.status === 'success' && (
        <>
          <ul className={styles.list}>
            {result.data.dados.map((trip) => (
              <li key={trip.id}>
                <Card>
                  <div className={styles.row}>
                    <strong>#{trip.id.slice(0, 8)}</strong>
                    <Badge variant="info">{trip.status}</Badge>
                  </div>
                  <p>
                    {trip.modelo} · {trip.placa}
                  </p>
                  <p>{trip.categoria ?? 'Categoria não informada'}</p>
                  {trip.km_inicial !== null && trip.km_final !== null && (
                    <p>{trip.km_final - trip.km_inicial} km percorridos</p>
                  )}
                  <Link to={`/viagens/${trip.id}`}>Ver viagem</Link>
                </Card>
              </li>
            ))}
          </ul>
          {!result.data.dados.length && (
            <StateMessage title="Nenhuma viagem atribuída ao seu cadastro." />
          )}
          <nav className={styles.row} aria-label="Paginação de viagens">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span>Página {page}</span>
            <Button
              variant="secondary"
              disabled={page * result.data.limite >= result.data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </nav>
        </>
      )}
    </section>
  )
}
