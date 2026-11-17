import { Card } from '@/components/Card'
import { classNames } from '@/utils/classNames'
import type { InspectionItem } from '../../types'
import styles from './InspectionChecklistCard.module.scss'

export interface InspectionChecklistCardProps {
  items: InspectionItem[]
  unavailable?: boolean
  className?: string
}

export function InspectionChecklistCard({
  items,
  unavailable = false,
  className,
}: InspectionChecklistCardProps) {
  return (
    <Card title="Checklist de vistorias" className={className}>
      {unavailable ? (
        <p className={styles.empty}>
          O registro de vistorias ainda não está integrado à API.
        </p>
      ) : items.length === 0 ? (
        <p className={styles.empty}>Nenhuma vistoria registrada para este veículo.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <svg
                className={classNames(
                  styles.icon,
                  item.isOk ? styles.iconOk : styles.iconPending,
                )}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="8" />
                {item.isOk ? (
                  <path d="M6.5 10.2l2.4 2.4 4.6-4.9" />
                ) : (
                  <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" />
                )}
              </svg>
              <span>
                {item.label}
                <span className={styles.srOnly}>
                  {item.isOk ? ': aprovado' : ': pendente'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
