import type { ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './Toolbar.module.scss'

export interface ToolbarProps {
  /** Ordem esperada: busca, filtros e, por último, a ação principal. */
  children: ReactNode
  className?: string
}

/** Barra de busca + filtros + ação principal das telas de listagem. */
export function Toolbar({ children, className }: ToolbarProps) {
  return <search className={classNames(styles.toolbar, className)}>{children}</search>
}
