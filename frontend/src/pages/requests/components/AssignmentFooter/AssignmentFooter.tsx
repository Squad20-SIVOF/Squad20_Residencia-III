import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { classNames } from '@/utils/classNames'
import styles from './AssignmentFooter.module.scss'

export interface AssignmentFooterProps {
  /** "Fiat Ducato · QRS3T45"; vazio enquanto nenhum veículo foi escolhido. */
  vehicleLabel: string | undefined
  driverLabel: string | undefined
  cancelTo: string
  canConfirm: boolean
  isSaving: boolean
  onConfirm: () => void
  className?: string
}

/** Resumo da seleção e ações para confirmar ou cancelar a atribuição. */
export function AssignmentFooter({
  vehicleLabel,
  driverLabel,
  cancelTo,
  canConfirm,
  isSaving,
  onConfirm,
  className,
}: AssignmentFooterProps) {
  return (
    <footer className={classNames(styles.footer, className)}>
      <p className={styles.selection}>
        <span className={styles.label}>Seleção para esta viagem</span>{' '}
        <span className={styles.values}>
          <span className={vehicleLabel ? undefined : styles.empty}>
            {vehicleLabel ?? 'Nenhum veículo selecionado'}
          </span>
          <span aria-hidden="true"> + </span>
          <span className={styles.hidden}> e </span>
          <span className={driverLabel ? undefined : styles.empty}>
            {driverLabel ?? 'Nenhum motorista selecionado'}
          </span>
        </span>
      </p>
      <div className={styles.actions}>
        <ButtonLink variant="secondary" to={cancelTo}>
          Cancelar
        </ButtonLink>
        <Button
          className={styles.confirm}
          onClick={onConfirm}
          disabled={!canConfirm}
          isLoading={isSaving}
        >
          Confirmar atribuição
        </Button>
      </div>
    </footer>
  )
}
