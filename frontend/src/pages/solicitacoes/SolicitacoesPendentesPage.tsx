import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizeText } from '@/utils/format'
import { listPendingRequests } from '@/pages/requests/services/requestApi'
import styles from './SolicitacoesPendentesPage.module.scss'

export default function SolicitacoesPendentesPage() {
  useDocumentTitle('Solicitações pendentes')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const load = useCallback(() => listPendingRequests(page), [page])
  const result = useAsync(load)
  const data = result.status === 'success' ? result.data : null
  const rows =
    data?.dados.filter((row) =>
      normalizeText(
        [row.id, row.categoria, row.solicitante_nome, row.setor_nome].join(' '),
      ).includes(normalizeText(search)),
    ) ?? []

  return (
    <section className={styles.page}>
      <Link to="/viagens" className={styles.backLink}>
        ← Voltar para Viagens
      </Link>
      <PageHeader
        title="Solicitações Pendentes"
        subtitle="Consulte as solicitações que aguardam análise."
      />
      <p>
        Aprovação, recusa e atribuição ainda estão indisponíveis. Abra os detalhes para
        consultar as ações disponíveis.
      </p>
      {result.status === 'loading' && (
        <StateMessage title="Carregando solicitações" variant="loading" />
      )}
      {result.status === 'error' && (
        <StateMessage
          title="Não foi possível carregar as solicitações"
          variant="error"
          description={
            result.error instanceof Error ? result.error.message : 'Tente novamente.'
          }
          action={<Button onClick={result.reload}>Tentar novamente</Button>}
        />
      )}
      {data && (
        <>
          <div className={styles.filterBar}>
            <Badge variant="warning">{data.total} pendentes</Badge>
            <Badge variant="danger">
              {data.dados.filter((row) => row.flag_urgencia).length} urgentes nesta página
            </Badge>
            <TextField
              label="Buscar nesta página"
              placeholder="Identificador, categoria, solicitante ou setor"
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className={styles.list}>
            {rows.map((request) => (
              <Card key={request.id} className={styles.card}>
                <header className={styles.cardHeader}>
                  <h2>Solicitação #{request.id.slice(0, 8)}</h2>
                  {request.flag_urgencia && <Badge variant="warning">Urgente</Badge>}
                </header>
                <dl className={styles.cardDetails}>
                  <div>
                    <dt>Solicitante</dt>
                    <dd>{request.solicitante_nome || 'Não informado'}</dd>
                  </div>
                  <div>
                    <dt>Setor</dt>
                    <dd>{request.setor_nome || 'Não informado'}</dd>
                  </div>
                  <div>
                    <dt>Categoria</dt>
                    <dd>{request.categoria}</dd>
                  </div>
                  <div>
                    <dt>Necessidade</dt>
                    <dd>
                      <time dateTime={request.data_necessidade}>
                        {new Date(request.data_necessidade).toLocaleString('pt-BR')}
                      </time>
                    </dd>
                  </div>
                </dl>
                <div className={styles.cardActions}>
                  <Button variant="secondary" disabled>
                    Aprovar
                  </Button>
                  <Button variant="secondary" disabled>
                    Recusar
                  </Button>
                  <Button variant="secondary" disabled>
                    Atribuir
                  </Button>
                  <Link
                    className={styles.detailsLink}
                    to={`/viagens/solicitacoes/${encodeURIComponent(request.id)}`}
                  >
                    Ver detalhes da solicitação #{request.id.slice(0, 8)}
                  </Link>
                </div>
              </Card>
            ))}
            {!rows.length && (
              <StateMessage
                title={
                  data.total === 0
                    ? 'Nenhuma solicitação pendente.'
                    : 'Nenhuma solicitação encontrada nesta página.'
                }
              />
            )}
          </div>
          <nav className={styles.pagination} aria-label="Paginação de solicitações">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => {
                setSearch('')
                setPage((current) => current - 1)
              }}
            >
              Anterior
            </Button>
            <span>
              Página {data.pagina} de {Math.max(1, Math.ceil(data.total / data.limite))}
            </span>
            <Button
              variant="secondary"
              disabled={page * data.limite >= data.total}
              onClick={() => {
                setSearch('')
                setPage((current) => current + 1)
              }}
            >
              Próxima
            </Button>
          </nav>
        </>
      )}
    </section>
  )
}
