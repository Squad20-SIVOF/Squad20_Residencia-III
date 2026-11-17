import type { Vehicle } from '../../types'
import { vehicleDisplayName } from '../../utils/vehicleRules'
import { VanIllustration } from '../VanIllustration'
import { VehicleStatusBadge } from '../VehicleStatusBadge'
import styles from './VehicleHeroCard.module.scss'

export interface VehicleHeroCardProps {
  vehicle: Vehicle
}

export function VehicleHeroCard({ vehicle }: VehicleHeroCardProps) {
  return (
    <figure className={styles.hero}>
      <VanIllustration className={styles.illustration} />
      <figcaption className={styles.footer}>
        <span className={styles.identification}>{vehicleDisplayName(vehicle)}</span>
        <VehicleStatusBadge status={vehicle.status} labelSet="situation" />
      </figcaption>
    </figure>
  )
}
