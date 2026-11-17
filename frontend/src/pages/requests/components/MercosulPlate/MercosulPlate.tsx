import { classNames } from '@/utils/classNames'
import { formatPlate } from '../../utils/assignmentRules'
import styles from './MercosulPlate.module.scss'

export interface MercosulPlateProps {
  plate: string
  className?: string
}

/** Placa no estilo Mercosul (faixa azul com "BRASIL" e os caracteres sem hífen). */
export function MercosulPlate({ plate, className }: MercosulPlateProps) {
  return (
    <span className={classNames(styles.plate, className)}>
      <span className={styles.band} aria-hidden="true">
        Brasil
      </span>
      <span className={styles.number}>
        <span className={styles.hidden}>Placa </span>
        {formatPlate(plate)}
      </span>
    </span>
  )
}
