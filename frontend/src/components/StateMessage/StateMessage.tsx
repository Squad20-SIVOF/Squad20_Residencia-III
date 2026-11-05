import type { ReactNode } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { classNames } from '@/utils/classNames'
import styles from './StateMessage.module.scss'

export interface StateMessageProps {
  title: string
  description?: string
  variant?: 'loading' | 'empty' | 'error'
  action?: ReactNode
  className?: string
}

export function StateMessage({
  title,
  description,
  variant = 'empty',
  action,
  className,
}: StateMessageProps) {
  if (variant === 'loading') return <LoadingState label={title} />
  return (
    <div
      className={classNames(styles.state, styles[variant], className)}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
