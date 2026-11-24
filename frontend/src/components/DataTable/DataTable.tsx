import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './DataTable.module.scss'

export interface DataTableColumn<TRow> {
  key: string
  header: string
  render: (row: TRow) => ReactNode
  /** Destaca o valor que identifica o registro. */
  isPrimary?: boolean
  /** Usa a célula como cabeçalho semântico da linha. */
  isRowHeader?: boolean
  /** Largura mínima da coluna em rem para conteúdos que podem quebrar linha. */
  minWidth?: number
  /** Mantém dados curtos, como datas e valores, em uma linha. */
  keepTogether?: boolean
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

export function DataTable<TRow>({
  caption,
  rows,
  columns,
  getRowKey,
  renderActions,
  className,
}: DataTableProps<TRow>) {
  const wrapperRef = useRef<HTMLElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const hintId = useId()
  const [canScroll, setCanScroll] = useState(false)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const table = tableRef.current
    if (!wrapper || !table) return

    const measure = () => setCanScroll(wrapper.scrollWidth > wrapper.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(measure)
    observer.observe(wrapper)
    observer.observe(table)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {canScroll && (
        <p className={styles.scrollHint} id={hintId}>
          Deslize a tabela para ver mais colunas.
        </p>
      )}
      <section
        ref={wrapperRef}
        className={classNames(styles.wrapper, className)}
        aria-label={caption}
        aria-describedby={canScroll ? hintId : undefined}
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Permite rolar as colunas pelo teclado.
        tabIndex={0}
      >
        <table ref={tableRef} className={styles.table}>
          <caption className={styles.caption}>{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={
                    column.minWidth ? { minWidth: `${column.minWidth}rem` } : undefined
                  }
                >
                  {column.header}
                </th>
              ))}
              {renderActions && (
                <th className={styles.actions} scope="col">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => {
                  const Cell = column.isRowHeader ? 'th' : 'td'
                  return (
                    <Cell
                      key={column.key}
                      scope={column.isRowHeader ? 'row' : undefined}
                      className={classNames(
                        column.isPrimary && styles.primary,
                        column.keepTogether && styles.keepTogether,
                      )}
                    >
                      {column.render(row)}
                    </Cell>
                  )
                })}
                {renderActions && (
                  <td className={styles.actions}>
                    <div className={styles.actionGroup}>{renderActions(row)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
