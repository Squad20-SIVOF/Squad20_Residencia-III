import { classNames } from '@/utils/classNames'
import styles from './PanelIcon.module.scss'

const ICON_PATHS = {
  car: 'M5 17h14M5 17a2 2 0 01-2-2v-3l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v3a2 2 0 01-2 2M5 17v2m14-2v2M3 12h18M7 14.5h1m8 0h1',
  route:
    'M6 21a3 3 0 100-6 3 3 0 000 6zm12-12a3 3 0 100-6 3 3 0 000 6zM6 15V9a4 4 0 014-4h2m6 4v6a4 4 0 01-4 4h-2',
  document:
    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm0 0v6h6M9 15l2 2 4-4',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35',
  sort: 'M3 6h13M3 12h9m-9 6h5m9-9v12m0 0l-3-3m3 3l3-3',
  flag: 'M4 22V4m0 0h12l-2 4 2 4H4',
} as const

export type PanelIconName = keyof typeof ICON_PATHS

export interface PanelIconProps {
  name: PanelIconName
  className?: string
}

/** Ícones de linha do Painel de Viagens; sempre decorativos (o texto ao lado dá o sentido). */
export function PanelIcon({ name, className }: PanelIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={classNames(styles.icon, className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
