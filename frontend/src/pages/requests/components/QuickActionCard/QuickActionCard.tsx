import { Link } from 'react-router-dom'
import { classNames } from '@/utils/classNames'
import { ComingSoonLink } from '../ComingSoonLink'
import { PanelIcon } from '../PanelIcon'
import type { PanelIconName } from '../PanelIcon'
import styles from './QuickActionCard.module.scss'

export interface QuickActionCardProps {
  icon: PanelIconName
  title: string
  description: string
  linkLabel: string
  /** Sem destino, o link aparece desabilitado com "Em breve". */
  to?: string
  className?: string
}

export function QuickActionCard({
  icon,
  title,
  description,
  linkLabel,
  to,
  className,
}: QuickActionCardProps) {
  return (
    <article className={classNames(styles.card, className)}>
      <div className={styles.heading}>
        <span className={styles.iconTile}>
          <PanelIcon name={icon} />
        </span>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <p className={styles.description}>{description}</p>
      {to ? (
        <Link to={to} className={styles.link}>
          {linkLabel}
          <PanelIcon name="arrowRight" className={styles.arrow} />
        </Link>
      ) : (
        <ComingSoonLink label={linkLabel} className={styles.soon} />
      )}
    </article>
  )
}
