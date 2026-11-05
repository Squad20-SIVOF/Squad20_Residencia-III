import { useId } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './CheckboxField.module.scss'

export type CheckboxFieldVariant = 'highlight' | 'plain'

export interface CheckboxFieldProps {
  label: string
  description?: string
  disabled?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
  /** "highlight" (padrão) destaca a opção em amarelo; "plain" é só a caixa e o texto. */
  variant?: CheckboxFieldVariant
  /** Ícone decorativo antes do texto. */
  iconStart?: ReactNode
  id?: string
  className?: string
}

export function CheckboxField({
  label,
  description,
  disabled,
  checked,
  onChange,
  variant = 'highlight',
  iconStart,
  id,
  className,
}: CheckboxFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <label
      htmlFor={inputId}
      className={classNames(styles.field, styles[variant], className)}
    >
      <input
        id={inputId}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        aria-describedby={description ? `${inputId}-description` : undefined}
        onChange={(event) => onChange(event.target.checked)}
      />
      {iconStart && (
        <span className={styles.icon} aria-hidden="true">
          {iconStart}
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && (
          <span id={`${inputId}-description`} className={styles.description}>
            {description}
          </span>
        )}
      </span>
    </label>
  )
}
