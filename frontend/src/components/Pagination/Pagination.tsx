import { Button } from '@/components/Button'
import { classNames } from '@/utils/classNames'
import styles from './Pagination.module.scss'

export interface PaginationProps {
  shownCount: number
  totalCount: number
  /** Nome do item no plural, ex.: "motoristas". */
  itemLabel: string
  currentPage?: number
  totalPages?: number
  stacked?: boolean
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export function Pagination({
  shownCount,
  totalCount,
  itemLabel,
  currentPage,
  totalPages,
  stacked = false,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <nav
      className={classNames(styles.pagination, stacked && styles.stacked)}
      aria-label={`Paginação de ${itemLabel}`}
    >
      <p className={styles.summary} aria-live="polite">
        <span>
          Mostrando {shownCount} de {totalCount} {itemLabel}
        </span>
        {currentPage !== undefined && totalPages !== undefined && (
          <>
            {!stacked && <span aria-hidden="true"> · </span>}
            <span className={styles.pageNumber}>
              Página {currentPage} de {totalPages}
            </span>
          </>
        )}
      </p>
      <div className={styles.buttons}>
        <Button variant="secondary" onClick={onPrevious} disabled={!hasPrevious}>
          Anterior
        </Button>
        <Button variant="secondary" onClick={onNext} disabled={!hasNext}>
          Próxima
        </Button>
      </div>
    </nav>
  )
}
