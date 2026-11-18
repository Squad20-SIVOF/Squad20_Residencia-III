import { classNames } from '@/utils/classNames'
import styles from './MercosulPlate.module.scss'

export interface MercosulPlateProps {
  plate: string
  size?: 'sm' | 'md'
  className?: string
}

/** Placa no padrão Mercosul: faixa azul "BRASIL" e caracteres sem hífen. */
export function MercosulPlate({ plate, size = 'md', className }: MercosulPlateProps) {
  const characters = plate.replace(/[^a-z0-9]/gi, '').toUpperCase()

  return (
    <span className={classNames(styles.plate, styles[size], className)}>
      <span className={styles.band} aria-hidden="true">
        {size === 'md' && <span className={styles.region}>MERCOSUL</span>}
        <span className={styles.country}>BRASIL</span>
        {size === 'md' && <span className={styles.flag} />}
      </span>
      <strong className={styles.characters}>
        <span className={styles.srOnly}>Placa </span>
        {characters}
      </strong>
    </span>
  )
}
