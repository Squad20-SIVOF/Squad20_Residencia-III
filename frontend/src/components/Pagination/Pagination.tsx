import { Button } from '@/components/Button'
import styles from './Pagination.module.scss'

export interface PaginationProps {
  shownCount: number
  totalCount: number
  /** Nome do item no plural, ex.: "motoristas". */
  itemLabel: string
  currentPage?: number
  totalPages?: number
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
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label={`Paginação de ${itemLabel}`}>
      <p className={styles.summary} aria-live="polite">
        Mostrando {shownCount} de {totalCount} {itemLabel}
        {currentPage !== undefined && totalPages !== undefined && (
          <span className={styles.page}>
            {' '}
            · Página {currentPage} de {totalPages}
          </span>
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
