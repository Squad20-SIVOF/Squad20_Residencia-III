import { useId, type ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import styles from './TablePanel.module.scss'

interface TablePanelProps {
  title: string
  recordCount?: number | undefined
  recordLabel?: [singular: string, plural: string]
  headingLevel?: 2 | 3
  footer?: ReactNode
  children: ReactNode
  className?: string | undefined
}

export function TablePanel({
  title,
  recordCount,
  recordLabel = ['registro', 'registros'],
  headingLevel = 2,
  footer,
  children,
  className,
}: TablePanelProps) {
  const titleId = useId()
  const Heading = headingLevel === 3 ? 'h3' : 'h2'

  return (
    <section className={classNames(styles.panel, className)} aria-labelledby={titleId}>
      <header className={styles.header}>
        <Heading id={titleId} className={styles.title}>
          {title}
        </Heading>
        {recordCount !== undefined && (
          <span className={styles.count}>
            {recordCount} {recordLabel[recordCount === 1 ? 0 : 1]}
          </span>
        )}
      </header>
      {children}
      {footer}
    </section>
  )
}
