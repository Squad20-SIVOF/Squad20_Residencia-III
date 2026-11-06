import type { ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { classNames } from '@/utils/classNames'
import { useOnlineStatus } from '../../pwa/useOnlineStatus'
import styles from './DriverLayout.module.scss'

interface TabItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const iconProps = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const TABS: TabItem[] = [
  {
    to: '/',
    label: 'Início',
    end: true,
    icon: (
      <svg {...iconProps}>
        <path d="M3 11l9-8 9 8M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    to: '/viagens',
    label: 'Viagens',
    icon: (
      <svg {...iconProps}>
        <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
  {
    to: '/abastecimento',
    label: 'Abastecer',
    icon: (
      <svg {...iconProps}>
        <path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M5 21h10M15 9h2a2 2 0 012 2v6a1.5 1.5 0 003 0V9l-3-3" />
      </svg>
    ),
  },
  {
    to: '/perfil',
    label: 'Perfil',
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

/** Casca do app do motorista: conteúdo em coluna única + barra de abas fixa embaixo. */
export function DriverLayout() {
  const isOnline = useOnlineStatus()
  const { pathname } = useLocation()

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <span className={styles.logo} aria-hidden="true">
          FM
        </span>
        <span className={styles.brand}>FrotaManager Motorista</span>
      </header>

      {!isOnline && (
        <p className={styles.offline} role="alert">
          Sem conexão. Sua rota só é atualizada com internet.
        </p>
      )}

      <main key={pathname} className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.tabBar} aria-label="Navegação do motorista">
        <ul className={styles.tabList}>
          {TABS.map((tab) => (
            <li key={tab.to} className={styles.tabItem}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  classNames(styles.tab, isActive && styles.tabActive)
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
