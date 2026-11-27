import type { Vehicle } from '@/pages/vehicles/types'
import {
  getRequiredCnh,
  getVehicleKind,
  getVehicleName,
} from '../../utils/assignmentRules'
import { MercosulPlate } from '../MercosulPlate'
import { ResourceOption } from '../ResourceOption'
import styles from './VehicleOption.module.scss'

export interface VehicleOptionProps {
  vehicle: Vehicle
  specifications?: string | undefined
  isSelected: boolean
  onSelect: (vehicleId: string) => void
}

export function VehicleOption({
  vehicle,
  specifications,
  isSelected,
  onSelect,
}: VehicleOptionProps) {
  return (
    <ResourceOption
      name="vehicle"
      value={vehicle.id}
      title={getVehicleName(vehicle)}
      isSelected={isSelected}
      selectedLabel="Selecionado"
      onSelect={onSelect}
    >
      <MercosulPlate plate={vehicle.plate} />
      <span className={styles.specs}>
        {specifications ??
          `${getVehicleKind(vehicle.maxCapacity)} · Capacidade: ${vehicle.maxCapacity} lugares · CNH ${getRequiredCnh(vehicle.maxCapacity)}`}
      </span>
    </ResourceOption>
  )
}
