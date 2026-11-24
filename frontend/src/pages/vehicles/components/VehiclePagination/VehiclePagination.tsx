import { Button } from '@/components/Button'
import styles from './VehiclePagination.module.scss'

export interface VehiclePaginationProps {
  shownCount: number
  totalCount: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}

export function VehiclePagination({
  shownCount,
  totalCount,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: VehiclePaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Paginação de veículos">
      <p className={styles.summary} aria-live="polite">
        Mostrando {shownCount} de {totalCount} veículos
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
