import { classNames } from '@/utils/classNames'
import { RequestIcon } from '../RequestIcon'
import styles from './PickupCard.module.scss'

export interface PickupCardProps {
  address: string
  className?: string
}

export function PickupCard({ address, className }: PickupCardProps) {
  return (
    <section
      className={classNames(styles.card, className)}
      aria-label="Ponto de embarque"
    >
      <span className={styles.icon}>
        <RequestIcon name="pin" />
      </span>
      <div>
        <p className={styles.label}>Ponto de embarque</p>
        <p className={styles.address}>{address}</p>
      </div>
    </section>
  )
}
