import { CnhExpiry } from '@/pages/drivers/components/CnhExpiry'
import type { Driver } from '@/pages/drivers/types'
import { maskCpfPartially } from '../../utils/assignmentRules'
import { ResourceOption } from '../ResourceOption'
import styles from './DriverOption.module.scss'

export interface DriverOptionProps {
  driver: Driver
  isSelected: boolean
  onSelect: (driverId: string) => void
}

export function DriverOption({ driver, isSelected, onSelect }: DriverOptionProps) {
  return (
    <ResourceOption
      name="driver"
      value={driver.id}
      title={driver.name}
      isSelected={isSelected}
      selectedLabel="Selecionada"
      onSelect={onSelect}
    >
      <span>CPF {maskCpfPartially(driver.cpf)}</span>
      <span>
        CNH {driver.cnh} · Categoria {driver.cnhCategory}
      </span>
      <span className={styles.expiry}>
        Validade <CnhExpiry expiry={driver.cnhExpiry} format="date" />
      </span>
    </ResourceOption>
  )
}
