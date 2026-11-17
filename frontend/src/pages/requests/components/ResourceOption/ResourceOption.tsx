import { useId } from 'react'
import type { ReactNode } from 'react'
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
  /** "side": selo à direita dos detalhes; "stacked": selo embaixo, com `aside` à direita. */
  layout?: 'side' | 'stacked'
  /** Conteúdo alinhado à direita do selo no layout "stacked" (ex.: validade da CNH). */
  aside?: ReactNode
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
  layout = 'side',
  aside,
  children,
  className,
}: ResourceOptionProps) {
  const titleId = useId()
  const detailsId = useId()

  return (
    <label
      className={classNames(
        styles.option,
        styles[layout],
        isSelected && styles.selected,
        className,
      )}
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
      <span id={titleId} className={styles.title}>
        {title}
      </span>
      <svg
        className={styles.chevron}
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <path
          d="M6 3l5 5-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span id={detailsId} className={styles.details}>
        {children}
      </span>
      <span className={styles.badge}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5.25 8.25l1.75 1.75 3.75-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {isSelected ? selectedLabel : 'Disponível'}
      </span>
      {layout === 'stacked' && aside && <span className={styles.aside}>{aside}</span>}
    </label>
  )
}
