import { useId, useState } from 'react'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { DataTable } from '@/components/DataTable'
import type { DataTableColumn } from '@/components/DataTable'
import { SelectField } from '@/components/SelectField'
import { StateMessage } from '@/components/StateMessage'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
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
    minWidth: 7,
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
    minWidth: 10,
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
    keepTogether: true,
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
  const rows = sortPendingRequests(
    filterPendingRequests(data?.dados ?? [], search),
    sort,
  ).slice(0, PANEL_REQUEST_LIMIT)
  const importantCount = data?.dados.filter((row) => row.flag_urgencia).length ?? 0

  function renderBody() {
    if (result.status === 'loading') {
      return (
        <StateMessage variant="loading" title="Carregando solicitações pendentes..." />
      )
    }

    if (result.status === 'error') {
      return (
        <StateMessage
          className={styles.message}
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
          className={styles.message}
          title="Nenhuma solicitação pendente."
          description="Quando um setor pedir um veículo, a solicitação aparece aqui."
        />
      )
    }

    return (
      <>
        <Toolbar className={styles.toolbar} label="Filtrar solicitações de viagens">
          <div className={styles.search}>
            <PanelIcon name="search" className={styles.fieldIcon} />
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
            <PanelIcon name="sort" className={styles.fieldIcon} />
            <SelectField
              label="Ordenar solicitações"
              isLabelHidden
              value={sort}
              options={SORT_OPTIONS}
              onChange={setSort}
            />
          </div>
        </Toolbar>

        {rows.length > 0 ? (
          <DataTable
            className={styles.table}
            caption="Solicitações de viagens pendentes"
            rows={rows}
            columns={COLUMNS}
            getRowKey={(row) => row.id}
            renderActions={(row) => (
              <ButtonLink
                to={requestDetailsPath(row.id)}
                className={styles.rowAction}
                aria-label={`Ver detalhes da solicitação ${getRequestCode(row.id)}`}
              >
                Ver detalhes da solicitação
              </ButtonLink>
            )}
          />
        ) : (
          <StateMessage
            className={styles.message}
            title={`Nenhuma solicitação encontrada para “${search.trim()}”.`}
            description="Confira o ID ou o setor digitado."
          />
        )}
      </>
    )
  }

  return (
    <section className={classNames(styles.panel, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h2 id={titleId}>Solicitações de Viagens Pendentes</h2>
            {data && (
              <Badge variant="warning">
                {data.total} {data.total === 1 ? 'pendente' : 'pendentes'}
              </Badge>
            )}
          </div>
          <p className={styles.muted}>
            Analise os pedidos e direcione os próximos passos.
          </p>
        </div>
        <ButtonLink
          className={styles.viewAll}
          variant="secondary"
          to={PENDING_REQUESTS_PATH}
        >
          Ver todas
        </ButtonLink>
      </header>
      {renderBody()}
      {data && data.dados.length > 0 && (
        <footer className={styles.footer}>
          <p className={styles.muted}>{formatShowingCount(rows.length, data.total)}</p>
          {importantCount > 0 && (
            <p className={styles.importantCount}>
              <PanelIcon name="flag" className={styles.smallIcon} />
              {formatImportantCount(importantCount)}
            </p>
          )}
        </footer>
      )}
    </section>
  )
}
