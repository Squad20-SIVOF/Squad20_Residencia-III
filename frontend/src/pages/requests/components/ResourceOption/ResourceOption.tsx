import { useId } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/Badge'
import { classNames } from '@/utils/classNames'
import styles from './ResourceOption.module.scss'

export interface ResourceOptionProps {
  /** Nome do grupo: um único item marcado por grupo. */
  name: string
  value: string
  title: string
  isSelected: boolean
  /** Texto do selo quando marcado ("Selecionado" ou "Selecionada"). */
  selectedLabel: string
  onSelect: (value: string) => void
  children: ReactNode
  className?: string
}

/**
 * Card selecionável. Usa um radio nativo (escondido) para que Tab, setas e Espaço
 * funcionem como em qualquer grupo de opções.
 */
export function ResourceOption({
  name,
  value,
  title,
  isSelected,
  selectedLabel,
  onSelect,
  children,
  className,
}: ResourceOptionProps) {
  const titleId = useId()
  const detailsId = useId()

  return (
    <label
      className={classNames(styles.option, isSelected && styles.selected, className)}
    >
      <input
        type="radio"
        className={styles.input}
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => onSelect(value)}
        aria-labelledby={titleId}
        aria-describedby={detailsId}
      />
      <span className={styles.header}>
        <span id={titleId} className={styles.title}>
          {title}
        </span>
        <Badge variant={isSelected ? 'info' : 'success'}>
          <span className={styles.badgeIcon} aria-hidden="true">
            {isSelected ? '✓' : '●'}
          </span>
          {isSelected ? selectedLabel : 'Disponível'}
        </Badge>
      </span>
      <span id={detailsId} className={styles.details}>
        {children}
      </span>
    </label>
  )
}
