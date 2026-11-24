import { useId, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { DataTable } from '@/components/DataTable'
import type { DataTableColumn } from '@/components/DataTable'
import { SelectField } from '@/components/SelectField'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import type { AsyncResult } from '@/hooks/useAsync'
import { classNames } from '@/utils/classNames'
import { formatShortDateTime } from '@/utils/format'
import type { RequestPage, RequestRecord } from '../../services/requestApi'
import {
  PANEL_REQUEST_LIMIT,
  PENDING_SORTS,
  PENDING_SORT_LABELS,
  filterPendingRequests,
  formatImportantCount,
  formatPendingCount,
  formatShowingCount,
  getRequestCode,
  sortPendingRequests,
} from '../../utils/tripsPanelRules'
import type { PendingSort } from '../../utils/tripsPanelRules'
import { PanelIcon } from '../PanelIcon'
import styles from './PendingRequestsCard.module.scss'

export const PENDING_REQUESTS_PATH = '/viagens/solicitacoes'

const SORT_OPTIONS = PENDING_SORTS.map((value) => ({
  value,
  label: PENDING_SORT_LABELS[value],
}))

function requestDetailsPath(id: string): string {
  return `${PENDING_REQUESTS_PATH}/${encodeURIComponent(id)}`
}

const COLUMNS: DataTableColumn<RequestRecord>[] = [
  {
    key: 'pedido',
    header: 'Pedido',
    isPrimary: true,
    render: (row) => (
      <span className={styles.stack}>
        <span className={styles.code}>{getRequestCode(row.id)}</span>
        {row.flag_urgencia && (
          <span className={styles.important}>
            <PanelIcon name="flag" className={styles.smallIcon} />
            Importante
          </span>
        )}
      </span>
    ),
  },
  {
    key: 'tipo',
    header: 'Tipo / Setor',
    render: (row) => (
      <span className={styles.stack}>
        <span className={styles.type}>{row.categoria}</span>
        <span className={styles.muted}>{row.setor_nome || 'Setor não informado'}</span>
      </span>
    ),
  },
  {
    key: 'trajeto',
    header: 'Trajeto',
    // A API de solicitações ainda não devolve origem e destino.
    render: () => (
      <span className={styles.muted}>
        <span aria-hidden="true">—</span>
        <span className={styles.visuallyHidden}>Não informado</span>
      </span>
    ),
  },
  {
    key: 'data',
    header: 'Data / Horário',
    render: (row) => (
      <time dateTime={row.data_necessidade}>
        {formatShortDateTime(row.data_necessidade)}
      </time>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: () => <Badge variant="warning">Pendente</Badge>,
  },
  {
    key: 'acao',
    header: 'Ação',
    render: (row) => (
      <ButtonLink
        to={requestDetailsPath(row.id)}
        className={styles.detailsButton}
        aria-label={`Ver detalhes da solicitação ${getRequestCode(row.id)}`}
      >
        Ver detalhes da solicitação
      </ButtonLink>
    ),
  },
]

export interface PendingRequestsCardProps {
  result: AsyncResult<RequestPage>
  className?: string
}

/** "Solicitações de Viagens Pendentes" do Painel: as primeiras pendentes, com busca e ordenação. */
export function PendingRequestsCard({ result, className }: PendingRequestsCardProps) {
  const titleId = useId()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<PendingSort>('importantes')
  const data = result.status === 'success' ? result.data : null

  function renderBody() {
    if (result.status === 'loading') {
      return (
        <StateMessage variant="loading" title="Carregando solicitações pendentes..." />
      )
    }

    if (result.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar as solicitações pendentes."
          description={
            result.error instanceof Error ? result.error.message : 'Tente novamente.'
          }
          action={
            <Button variant="secondary" onClick={result.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }

    if (!data || data.total === 0 || data.dados.length === 0) {
      return (
        <StateMessage
          title="Nenhuma solicitação pendente."
          description="Quando um setor pedir um veículo, a solicitação aparece aqui."
        />
      )
    }

    const rows = sortPendingRequests(
      filterPendingRequests(data.dados, search),
      sort,
    ).slice(0, PANEL_REQUEST_LIMIT)
    // A contagem cobre a página carregada da API (até 20), a mesma base da busca.
    const importantCount = data.dados.filter((row) => row.flag_urgencia).length

    return (
      <>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <PanelIcon name="search" className={styles.searchIcon} />
            <TextField
              type="search"
              label="Buscar solicitação pendente"
              isLabelHidden
              placeholder="Buscar por ID ou setor..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className={styles.sort}>
            <PanelIcon name="sort" className={styles.sortIcon} />
            <SelectField
              label="Ordenar solicitações"
              isLabelHidden
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
            />
          </div>
        </div>

        {rows.length > 0 ? (
          <DataTable
            caption="Solicitações de viagens pendentes"
            className={styles.table}
            rows={rows}
            columns={COLUMNS}
            getRowKey={(row) => row.id}
          />
        ) : (
          <StateMessage
            title={`Nenhuma solicitação encontrada para “${search.trim()}”.`}
            description="Confira o ID ou o setor digitado."
          />
        )}

        <footer className={styles.footer}>
          <p className={styles.muted}>{formatShowingCount(rows.length, data.total)}</p>
          {importantCount > 0 && (
            <p className={styles.importantCount}>
              <PanelIcon name="flag" className={styles.smallIcon} />
              {formatImportantCount(importantCount)}
            </p>
          )}
        </footer>
      </>
    )
  }

  return (
    <section className={classNames(styles.card, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <div className={styles.titleRow}>
            <h2 id={titleId} className={styles.title}>
              Solicitações de Viagens Pendentes
            </h2>
            {data && <Badge variant="warning">{formatPendingCount(data.total)}</Badge>}
          </div>
          <p className={styles.subtitle}>
            Analise os pedidos e direcione os próximos passos.
          </p>
        </div>
        <ButtonLink variant="secondary" to={PENDING_REQUESTS_PATH}>
          Ver todas
        </ButtonLink>
      </header>
      {renderBody()}
    </section>
  )
}
