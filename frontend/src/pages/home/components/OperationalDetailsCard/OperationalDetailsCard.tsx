import { useId } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { classNames } from '@/utils/classNames'
import type { NextAction } from '../../types'
import styles from './OperationalDetailsCard.module.scss'

export interface OperationalDetail {
  label: string
  value: number | string
  tone?: 'success' | 'warning' | 'info' | 'danger'
}

export interface OperationalDetailsCardProps {
  details: OperationalDetail[]
  actions: NextAction[]
  className?: string
}

const DOT_CLASS: Record<NextAction['tone'], string | undefined> = {
  danger: styles.dotDanger,
  warning: styles.dotWarning,
  info: styles.dotInfo,
}

export function OperationalDetailsCard({
  details,
  actions,
  className,
}: OperationalDetailsCardProps) {
  const nextTitleId = useId()

  return (
    <Card title="Detalhes operacionais" className={className}>
      <p className={styles.subtitle}>
        Informações concretas para apoiar decisões e acompanhamento
      </p>

      <dl className={styles.details}>
        {details.map((detail) => (
          <div key={detail.label} className={styles.row}>
            <dt>{detail.label}</dt>
            <dd className={detail.tone ? styles[detail.tone] : undefined}>
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className={styles.next} aria-labelledby={nextTitleId}>
        <h3 id={nextTitleId} className={styles.nextTitle}>
          Próximas ações
        </h3>
        {actions.length === 0 ? (
          <p className={styles.empty}>Nenhuma ação pendente no momento.</p>
        ) : (
          <ul className={styles.actions}>
            {actions.map((action) => (
              <li key={action.id}>
                <Link to={action.to} className={styles.action}>
                  <span
                    className={classNames(styles.dot, DOT_CLASS[action.tone])}
                    aria-hidden="true"
                  />
                  {action.text}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  )
}
