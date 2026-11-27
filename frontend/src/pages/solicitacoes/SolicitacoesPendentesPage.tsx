import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Car, Check, Clock, Info, X } from 'lucide-react'
import { BackLink } from '@/components/BackLink/BackLink'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { PageHeader } from '@/components/PageHeader'
import { Pagination, TABLE_PAGE_SIZE } from '@/components/Pagination'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog/RecordDetailsDialog'
import detailStyles from '@/components/RecordDetailsDialog/RecordDetailsDialog.module.scss'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import { useAsync } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { listPendingRequests } from '@/pages/requests/services/requestApi'
import { assignmentExamples } from '@/pages/requests/services/assignmentExamples'
import {
  formatPendingCount,
  getRequestCode,
  sortPendingRequests,
} from '@/pages/requests/utils/tripsPanelRules'
import { formatShortDateTime, normalizeText } from '@/utils/format'
import styles from './SolicitacoesPendentesPage.module.scss'

interface RequestCardData {
  code: string
  important: boolean
  schedule: string
  neededAt?: string
  fields: [label: string, value: string][]
  detailsPath?: string
  assignmentPath: string
}

const examples: RequestCardData[] = assignmentExamples.map((example) => ({
  code: `#${example.code}`,
  important: example.important,
  schedule: example.schedule,
  fields: [
    ['Origem', example.origin ?? '—'],
    ['Destino', example.destination ?? '—'],
    ['Carga', example.category],
    ['Setor', example.sector ?? '—'],
  ],
  assignmentPath: `/viagens/solicitacoes/${encodeURIComponent(example.id)}/atribuir`,
}))

function RequestFields({
  fields,
  detailed = false,
}: {
  fields: RequestCardData['fields']
  detailed?: boolean
}) {
  return (
    <dl className={detailed ? detailStyles.details : styles.fields}>
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className={detailed ? detailStyles.detailLabel : undefined}>{label}</dt>
          <dd className={detailed ? detailStyles.detailValue : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function RequestCard({
  row,
  onShowExample,
}: {
  row: RequestCardData
  onShowExample: () => void
}) {
  return (
    <article className={styles.card} data-important={row.important || undefined}>
      <header className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <h2>Descrição da Solicitação {row.code}</h2>
          {row.important && <Badge variant="danger">Importante</Badge>}
        </div>
        <span className={styles.schedule}>
          <Clock size={15} aria-hidden="true" />
          {row.neededAt ? (
            <time dateTime={row.neededAt}>{row.schedule}</time>
          ) : (
            row.schedule
          )}
        </span>
      </header>

      <RequestFields fields={row.fields} />

      <div className={styles.actions}>
        <Button
          variant="secondary"
          className={styles.approve}
          iconStart={<Check size={16} />}
          disabled
        >
          Aprovar
        </Button>
        <Button
          variant="secondary"
          className={styles.reject}
          iconStart={<X size={16} />}
          disabled
        >
          Recusar
        </Button>
        <ButtonLink
          variant="secondary"
          className={styles.assign}
          to={row.assignmentPath}
          aria-label={`Atribuir veículo e motorista à solicitação ${row.code}`}
          iconStart={<Car size={16} />}
        >
          Atribuir
        </ButtonLink>
        {row.detailsPath ? (
          <ButtonLink
            variant="secondary"
            to={row.detailsPath}
            aria-label={`Ver detalhes da solicitação ${row.code}`}
            iconStart={<Info size={16} />}
          >
            Ver detalhes
          </ButtonLink>
        ) : (
          <Button
            variant="secondary"
            aria-label={`Ver detalhes da solicitação ${row.code}`}
            iconStart={<Info size={16} />}
            onClick={onShowExample}
          >
            Ver detalhes
          </Button>
        )}
      </div>
    </article>
  )
}

export default function SolicitacoesPendentesPage() {
  useDocumentTitle('Solicitações pendentes')
  const [params] = useSearchParams()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showExamples, setShowExamples] = useState(() => params.get('exemplos') === '1')
  const [openedExample, setOpenedExample] = useState<RequestCardData | null>(null)
  const load = useCallback(() => listPendingRequests(page, TABLE_PAGE_SIZE), [page])
  const result = useAsync(load)
  if (result.status === 'loading') return <LoadingState label="Carregando solicitações" />

  const data = result.status === 'success' ? result.data : null
  const showingExamples = Boolean(data && (data.total === 0 || showExamples))
  const cards: RequestCardData[] = showingExamples
    ? examples
    : sortPendingRequests(data?.dados ?? [], 'importantes').map((row) => ({
        code: getRequestCode(row.id),
        important: row.flag_urgencia,
        schedule: formatShortDateTime(row.data_necessidade),
        neededAt: row.data_necessidade,
        detailsPath: `/viagens/solicitacoes/${encodeURIComponent(row.id)}`,
        assignmentPath: `/viagens/solicitacoes/${encodeURIComponent(row.id)}/atribuir`,
        fields: [
          ['Solicitante', row.solicitante_nome || 'Não informado'],
          ['Categoria', row.categoria],
          ['Setor', row.setor_nome || 'Não informado'],
        ],
      }))
  const term = normalizeText(search.replace(/^#/, ''))
  const rows = cards.filter((row) =>
    normalizeText(
      [row.code, row.detailsPath, ...row.fields.map(([, value]) => value)].join(' '),
    ).includes(term),
  )
  const total = showingExamples ? examples.length : (data?.total ?? 0)
  const currentPage = showingExamples ? 1 : (data?.pagina ?? 1)
  const totalPages = showingExamples
    ? 1
    : Math.max(1, Math.ceil(total / (data?.limite || TABLE_PAGE_SIZE)))
  const important = cards.filter((row) => row.important).length

  function goToPage(target: number) {
    setSearch('')
    setPage(target)
  }

  function closeExample() {
    setOpenedExample(null)
  }

  return (
    <section className={styles.page}>
      <PageHeader
        title="Solicitações Pendentes"
        subtitle="Analise as novas solicitações e atribua veículos e motoristas."
        breadcrumb={<BackLink to="/viagens">Voltar para o Painel de Viagens</BackLink>}
      />
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
            <div className={styles.counts}>
              <Badge variant="warning">{formatPendingCount(total)}</Badge>
              {important > 0 && (
                <Badge variant="danger">
                  {important} {important === 1 ? 'importante' : 'importantes'}
                  {totalPages > 1 && ' nesta página'}
                </Badge>
              )}
              {showingExamples && <Badge variant="info">Demonstração</Badge>}
            </div>
            <Toolbar className={styles.search} label="Filtrar solicitações pendentes">
              <TextField
                type="search"
                label="Buscar nesta página"
                isLabelHidden
                placeholder="Buscar solicitação..."
                value={search}
                onChange={setSearch}
              />
            </Toolbar>
            {data.total > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setShowExamples(!showExamples)
                }}
              >
                {showingExamples ? 'Ver solicitações reais' : 'Ver exemplos'}
              </Button>
            )}
          </div>
          {data.total === 0 && (
            <p className={styles.note}>Nenhuma solicitação pendente.</p>
          )}
          {rows.length ? (
            <div className={styles.cards}>
              {rows.map((row) => (
                <RequestCard
                  key={row.detailsPath ?? row.code}
                  row={row}
                  onShowExample={() => setOpenedExample(row)}
                />
              ))}
            </div>
          ) : (
            <StateMessage title="Nenhuma solicitação encontrada nesta página." />
          )}
          {!showingExamples && (
            <p className={styles.note}>Aprovação e recusa ainda indisponíveis.</p>
          )}
          <Pagination
            itemLabel="solicitações"
            shownCount={rows.length}
            totalCount={total}
            currentPage={currentPage}
            totalPages={totalPages}
            hasPrevious={currentPage > 1}
            hasNext={currentPage < totalPages}
            onPrevious={() => goToPage(currentPage - 1)}
            onNext={() => goToPage(currentPage + 1)}
          />
        </>
      )}
      {openedExample && (
        <RecordDetailsDialog
          title={`Detalhes da Solicitação ${openedExample.code}`}
          description="Exemplo demonstrativo de solicitação."
          titleAccessory={<Badge variant="warning">Pendente</Badge>}
          onClose={closeExample}
          primaryAction={
            <ButtonLink to={openedExample.assignmentPath}>Atribuir</ButtonLink>
          }
        >
          <section
            className={`${detailStyles.detailService} ${styles.detailSection} ${styles.detailRoute}`}
          >
            <h3>Trajeto solicitado</h3>
            <RequestFields fields={openedExample.fields.slice(0, 2)} detailed />
          </section>
          <section className={`${detailStyles.detailService} ${styles.detailSection}`}>
            <h3>Informações da solicitação</h3>
            <RequestFields fields={openedExample.fields.slice(2)} detailed />
          </section>
          <dl className={`${detailStyles.details} ${detailStyles.detailHighlight}`}>
            <div>
              <dt>Horário solicitado</dt>
              <dd className={detailStyles.detailValue}>{openedExample.schedule}</dd>
            </div>
            <div>
              <dt>Prioridade</dt>
              <dd>
                <Badge variant={openedExample.important ? 'danger' : 'neutral'}>
                  {openedExample.important ? 'Importante' : 'Normal'}
                </Badge>
              </dd>
            </div>
          </dl>
        </RecordDetailsDialog>
      )}
    </section>
  )
}
