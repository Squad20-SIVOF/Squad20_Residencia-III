import type { FormEventHandler, ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './Toolbar.module.scss'

export interface ToolbarProps {
  /** Ordem esperada: busca, filtros e, por último, a ação principal. */
  children: ReactNode
  label?: string
  onSubmit?: FormEventHandler<HTMLFormElement>
  className?: string
}

/** Barra de busca + filtros + ação principal das telas de listagem. */
export function Toolbar({ children, label, onSubmit, className }: ToolbarProps) {
  const classes = classNames(styles.toolbar, className)

  if (onSubmit) {
    return (
      <form className={classes} aria-label={label} onSubmit={onSubmit}>
        {children}
      </form>
    )
  }

  return (
    <search className={classes} aria-label={label}>
      {children}
    </search>
  )
}
