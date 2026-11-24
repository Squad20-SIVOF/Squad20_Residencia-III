import { useCallback, useState } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
import { Pagination } from '@/components/Pagination'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { normalizeText } from '@/utils/format'
import {
  listPendingRequests,
  type RequestRecord,
} from '@/pages/requests/services/requestApi'
import { getRequestCode } from '@/pages/requests/utils/tripsPanelRules'
import styles from './SolicitacoesPendentesPage.module.scss'

const COLUMNS: DataTableColumn<RequestRecord>[] = [
  {
    key: 'code',
    header: 'Solicitação',
    isPrimary: true,
    keepTogether: true,
    render: (row) => getRequestCode(row.id),
  },
  {
    key: 'requester',
    header: 'Solicitante',
    minWidth: 9,
    render: (row) => row.solicitante_nome || 'Não informado',
  },
  {
    key: 'sector',
    header: 'Setor',
    minWidth: 8,
    render: (row) => row.setor_nome || 'Não informado',
  },
  { key: 'category', header: 'Categoria', minWidth: 8, render: (row) => row.categoria },
  {
    key: 'date',
    header: 'Necessidade',
    keepTogether: true,
    render: (row) => (
      <time dateTime={row.data_necessidade}>
        {new Date(row.data_necessidade).toLocaleString('pt-BR')}
      </time>
    ),
  },
  {
    key: 'priority',
    header: 'Prioridade',
    render: (row) =>
      row.flag_urgencia ? <Badge variant="warning">Urgente</Badge> : 'Normal',
  },
]

export default function SolicitacoesPendentesPage() {
  useDocumentTitle('Solicitações pendentes')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const load = useCallback(() => listPendingRequests(page), [page])
  const result = useAsync(load)
  if (result.status === 'loading') return <LoadingState label="Carregando solicitações" />

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
      <p>Aprovação e recusa ainda indisponíveis.</p>
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
        <TablePanel
          title="Solicitações em análise"
          recordCount={data.total}
          recordLabel={['pendente', 'pendentes']}
          footer={
            <Pagination
              itemLabel="solicitações"
              shownCount={rows.length}
              totalCount={data.total}
              currentPage={data.pagina}
              totalPages={Math.max(1, Math.ceil(data.total / data.limite))}
              hasPrevious={page > 1}
              hasNext={page * data.limite < data.total}
              onPrevious={() => {
                setSearch('')
                setPage((current) => current - 1)
              }}
              onNext={() => {
                setSearch('')
                setPage((current) => current + 1)
              }}
            />
          }
        >
          <div className={styles.filterBar}>
            <Badge variant="danger">
              {data.dados.filter((row) => row.flag_urgencia).length} urgentes nesta página
            </Badge>
            <Toolbar label="Filtrar solicitações pendentes">
              <TextField
                type="search"
                label="Buscar nesta página"
                placeholder="Identificador, categoria, solicitante ou setor"
                value={search}
                onChange={setSearch}
              />
            </Toolbar>
          </div>
          {rows.length > 0 ? (
            <DataTable
              caption="Solicitações pendentes"
              rows={rows}
              columns={COLUMNS}
              getRowKey={(row) => row.id}
              renderActions={(row) => {
                const detailsPath = `/viagens/solicitacoes/${encodeURIComponent(row.id)}`
                const code = getRequestCode(row.id)

                return (
                  <>
                    <Button variant="secondary" disabled>
                      Aprovar
                    </Button>
                    <Button variant="secondary" disabled>
                      Recusar
                    </Button>
                    <ButtonLink
                      variant="secondary"
                      to={`${detailsPath}/atribuir`}
                      aria-label={`Atribuir veículo e motorista à solicitação ${code}`}
                    >
                      Atribuir
                    </ButtonLink>
                    <ButtonLink
                      variant="secondary"
                      to={detailsPath}
                      aria-label={`Ver detalhes da solicitação ${code}`}
                    >
                      Ver detalhes
                    </ButtonLink>
                  </>
                )
              }}
            />
          ) : (
            <StateMessage
              title={
                data.total === 0
                  ? 'Nenhuma solicitação pendente.'
                  : 'Nenhuma solicitação encontrada nesta página.'
              }
            />
          )}
        </TablePanel>
      )}
    </section>
  )
}
