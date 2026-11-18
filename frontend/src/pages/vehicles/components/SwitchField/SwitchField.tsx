import { useId } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './SwitchField.module.scss'

export interface SwitchFieldProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/** Interruptor liga/desliga: checkbox nativo com role="switch" (teclado e leitor de tela). */
export function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: SwitchFieldProps) {
  const inputId = useId()

  return (
    <div className={classNames(styles.field, className)}>
      <span className={styles.text}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        {description && (
          <span id={`${inputId}-description`} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <input
        id={inputId}
        type="checkbox"
        role="switch"
        className={styles.input}
        checked={checked}
        aria-checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${inputId}-description` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
    </div>
  )
}
