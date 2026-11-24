import type { ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './DataTable.module.scss'

export interface DataTableColumn<TRow> {
  key: string
  header: string
  render: (row: TRow) => ReactNode
  /** Coluna de destaque: vira o título do card no mobile (sem rótulo). */
  isPrimary?: boolean
}

export interface DataTableProps<TRow> {
  caption: string
  rows: TRow[]
  columns: DataTableColumn<TRow>[]
  getRowKey: (row: TRow) => string
  /** Conteúdo da coluna "Ações" (botões/links). */
  renderActions?: (row: TRow) => ReactNode
  className?: string
}

/*
 * Uma única tabela: no xs cada linha vira um card via CSS (o rótulo vem do atributo
 * data-label, sem duplicar o markup); a partir do md ela volta a ser uma tabela.
 */
export function DataTable<TRow>({
  caption,
  rows,
  columns,
  getRowKey,
  renderActions,
  className,
}: DataTableProps<TRow>) {
  return (
    <div className={classNames(styles.wrapper, className)}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead className={styles.head}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
            {renderActions && <th scope="col">Ações</th>}
          </tr>
        </thead>
        <tbody className={styles.body}>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className={styles.row}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.isPrimary ? styles.primary : undefined}
                  data-label={column.isPrimary ? undefined : column.header}
                >
                  {column.render(row)}
                </td>
              ))}
              {renderActions && <td className={styles.actions}>{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
