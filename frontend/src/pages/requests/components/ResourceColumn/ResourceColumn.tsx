import { useId } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/Badge'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import { classNames } from '@/utils/classNames'
import styles from './ResourceColumn.module.scss'

export interface ResourceColumnProps {
  title: string
  /** Quantidade disponível; sem valor enquanto carrega ou em erro. */
  count?: number | undefined
  searchLabel: string
  searchPlaceholder: string
  search: string
  onSearchChange: (value: string) => void
  /** Carregando, erro ou vazio: aparece no lugar da lista. */
  state?: ReactNode
  /** Opções (ResourceOption) do grupo. */
  children?: ReactNode
  className?: string
}

/** Coluna de recursos (veículos ou motoristas) com contagem, busca e seleção única. */
export function ResourceColumn({
  title,
  count,
  searchLabel,
  searchPlaceholder,
  search,
  onSearchChange,
  state,
  children,
  className,
}: ResourceColumnProps) {
  const headingId = useId()

  return (
    <section className={classNames(styles.column, className)} aria-labelledby={headingId}>
      <header className={styles.header}>
        <h2 id={headingId} className={styles.title}>
          {title}
        </h2>
        {count !== undefined && <Badge variant="success">{count} disponíveis</Badge>}
      </header>
      <Toolbar label={searchLabel}>
        <TextField
          type="search"
          label={searchLabel}
          isLabelHidden
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
          disabled={count === undefined}
          autoComplete="off"
        />
      </Toolbar>
      {state ?? (
        <div className={styles.list} role="radiogroup" aria-labelledby={headingId}>
          {children}
        </div>
      )}
    </section>
  )
}
