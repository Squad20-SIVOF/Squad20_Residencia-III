import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './TextAreaField.module.scss'

export interface TextAreaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange'
> {
  label: string
  isLabelHidden?: boolean
  isInvalid?: boolean
  errorMessage?: string | undefined
  onChange?: (value: string) => void
}

/** Campo de texto com várias linhas; mesma API e visual do TextField. */
export function TextAreaField({
  label,
  isLabelHidden = false,
  isInvalid = false,
  errorMessage,
  onChange,
  className,
  id,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  const generatedId = useId()
  const textAreaId = id ?? generatedId

  return (
    <div className={classNames(styles.field, className)}>
      <label
        htmlFor={textAreaId}
        className={classNames(styles.label, isLabelHidden && styles.labelHidden)}
      >
        {label}
      </label>
      <textarea
        id={textAreaId}
        rows={rows}
        className={classNames(styles.textArea, isInvalid && styles.textAreaInvalid)}
        aria-invalid={isInvalid}
        aria-errormessage={errorMessage ? `${textAreaId}-error` : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        {...rest}
      />
      {errorMessage ? (
        <span id={`${textAreaId}-error`} className={styles.errorMessage} role="alert">
          {errorMessage}
        </span>
      ) : null}
    </div>
  )
}
