import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import styles from './RecordDetailsDialog.module.scss'

interface RecordDetailsDialogProps {
  title: string
  description: string
  titleAccessory?: ReactNode
  plate?: string | null | undefined
  vehicleName: string
  notice?: ReactNode
  children: ReactNode
  editTo?: string | undefined
  onDelete?: (() => void) | undefined
  deleting?: boolean
  onClose: () => void
}

export function RecordDetailsDialog({
  title,
  description,
  titleAccessory,
  plate,
  vehicleName,
  notice,
  children,
  editTo,
  onDelete,
  deleting = false,
  onClose,
}: RecordDetailsDialogProps) {
  return (
    <ConfirmDialog
      isOpen
      className={styles.detailsDialog}
      title={title}
      description={description}
      titleAccessory={titleAccessory}
      onConfirm={onClose}
      onCancel={onClose}
      footer={
        <footer className={styles.detailsFooter}>
          {onDelete && (
            <Button
              className={styles.deleteDetails}
              variant="danger"
              disabled={deleting}
              onClick={onDelete}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          )}
          <div className={styles.detailsActions}>
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {editTo && <ButtonLink to={editTo}>Editar</ButtonLink>}
          </div>
        </footer>
      }
    >
      {notice}
      <div className={styles.detailVehicle}>
        {plate && <span className={styles.detailPlate}>{plate}</span>}
        <div>
          <p className={styles.detailLabel}>Veículo</p>
          <p className={styles.detailValue}>{vehicleName}</p>
        </div>
      </div>
      {children}
    </ConfirmDialog>
  )
}
