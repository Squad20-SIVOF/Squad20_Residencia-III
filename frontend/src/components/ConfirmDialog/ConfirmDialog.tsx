import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '@/components/Button'
import { classNames } from '@/utils/classNames'
import styles from './ConfirmDialog.module.scss'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string | null
  children?: ReactNode
  className?: string
  titleAccessory?: ReactNode
  footer?: ReactNode
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Diálogo modal de confirmação, baseado no <dialog> nativo (foco e Esc já tratados). */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  children,
  className,
  titleAccessory,
  footer,
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className={classNames(
        styles.dialog,
        Boolean(children) && styles.withContent,
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <header>
        <div className={titleAccessory ? styles.titleRow : undefined}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {titleAccessory}
        </div>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      </header>
      {children && <div className={styles.content}>{children}</div>}
      {footer ?? (
        <div className={styles.buttons}>
          {cancelLabel && (
            <Button variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      )}
    </dialog>
  )
}
