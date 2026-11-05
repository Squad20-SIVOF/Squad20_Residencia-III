import { classNames } from '@/utils/classNames'
import styles from './RequestIcon.module.scss'

const ICON_PATHS = {
  back: 'M15 18l-6-6 6-6',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  flag: 'M4 22V4m0 0h12l-2 4 2 4H4',
  navigation: 'M3 11l19-9-9 19-2-8-8-2z',
  pin: 'M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12zm0-9a3 3 0 100-6 3 3 0 000 6z',
  phone:
    'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  document:
    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm0 0v6h6M8 13h8M8 17h8',
} as const

export type RequestIconName = keyof typeof ICON_PATHS

export interface RequestIconProps {
  name: RequestIconName
  className?: string
}

/** Ícones de linha do módulo; sempre decorativos (o texto ao lado dá o sentido). */
export function RequestIcon({ name, className }: RequestIconProps) {
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
