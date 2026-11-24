import { Avatar } from '@/components/Avatar'
import { classNames } from '@/utils/classNames'
import { RequestIcon } from '../RequestIcon'
import styles from './DriverCard.module.scss'

export interface DriverCardProps {
  name: string
  phone: string
  vehicleModel: string
  plate: string
  className?: string
}

export function DriverCard({
  name,
  phone,
  vehicleModel,
  plate,
  className,
}: DriverCardProps) {
  return (
    <section className={classNames(styles.card, className)} aria-label="Motorista">
      <Avatar name={name} className={styles.avatar} />
      <div className={styles.info}>
        <p className={styles.name}>{name}</p>
        <p className={styles.vehicle}>
          {vehicleModel} · {plate}
        </p>
      </div>
      <a className={styles.call} href={`tel:${phone}`} aria-label={`Ligar para ${name}`}>
        <RequestIcon name="phone" />
      </a>
    </section>
  )
}
