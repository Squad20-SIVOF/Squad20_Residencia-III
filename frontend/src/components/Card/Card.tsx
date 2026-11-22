import { useId } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './Card.module.scss'

export interface CardProps {
  children: ReactNode
  title?: string
  /** Conteúdo ao lado do título (ex.: um Badge de resumo). */
  action?: ReactNode
  className?: string
}

export function Card({ children, title, action, className }: CardProps) {
  const titleId = useId()
  const heading = title && (
    <h2 id={titleId} className={styles.title}>
      {title}
    </h2>
  )

  return (
    <section
      className={classNames(styles.card, className)}
      aria-labelledby={title ? titleId : undefined}
    >
      {action ? (
        <div className={styles.header}>
          {heading}
          {action}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  )
}
