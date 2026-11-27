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
    <figure className={styles.hero} data-has-photo={vehicle.photo ? true : undefined}>
      {vehicle.photo ? (
        <div className={styles.photoArea}>
          <img className={styles.photo} src={vehicle.photo} alt="Foto do veículo" />
        </div>
      ) : (
        <VanIllustration className={styles.illustration} />
      )}
      <figcaption className={styles.footer}>
        <span className={styles.identification}>{vehicleDisplayName(vehicle)}</span>
        <VehicleStatusBadge status={vehicle.status} labelSet="situation" />
      </figcaption>
    </figure>
  )
}
