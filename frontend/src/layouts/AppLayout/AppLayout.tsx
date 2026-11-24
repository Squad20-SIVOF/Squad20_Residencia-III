import { currentUser, logout, type SessionUser } from '@/service/authService'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  useOutletContext,
} from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { useAsync } from '@/hooks/useAsync'
import { useTheme } from '@/hooks/useTheme'
import { loadNotifications } from '@/pages/notifications/notificationFeed'
import { classNames } from '@/utils/classNames'
import { SidebarIcon, type SidebarIconName } from './SidebarIcon'
import styles from './AppLayout.module.scss'
import { useFeatureFlag } from '@/apps/motorista/features/useFeatureFlags'

interface NavItem {
  to: string
  label: string
  icon: SidebarIconName
  permission?: string
  anyPermission?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início', icon: 'home' },
  { to: '/veiculos', label: 'Veículos', icon: 'vehicles', permission: 'veiculos:ler' },
  {
    to: '/motoristas',
    label: 'Motoristas',
    icon: 'drivers',
    permission: 'motoristas:ler',
  },
  {
    to: '/abastecimentos',
    label: 'Abastecimentos',
    icon: 'fuel',
    permission: 'abastecimentos:ler',
  },
  { to: '/manutencoes', label: 'Manutenções', icon: 'maintenance' },
  { to: '/viagens', label: 'Viagens', icon: 'trips' },
  { to: '/relatorios', label: 'Relatórios', icon: 'reports' },
  { to: '/perfil', label: 'Perfil', icon: 'profile' },
  {
    to: '/usuarios',
    label: 'Usuários e permissões',
    icon: 'users',
    anyPermission: ['usuarios:delegar-permissoes', 'usuarios:gerenciar'],
  },
]

// A escolha de recolher vale só para a sessão da aba.
const COLLAPSED_KEY = 'sivof:menu-recolhido'

function readIsCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function saveIsCollapsed(isCollapsed: boolean) {
  try {
    sessionStorage.setItem(COLLAPSED_KEY, isCollapsed ? '1' : '0')
  } catch {
    // Sem armazenamento (aba privada): a escolha vale só até recarregar.
  }
}

export interface AppLayoutProps {
  /** Sem `children`, renderiza a rota filha (<Outlet />). */
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const session = useOutletContext<SessionUser | undefined>()
  const [fetchedUser, setUser] = useState<SessionUser | null>(null)
  const user = session ?? fetchedUser
  useEffect(() => {
    if (session) return
    currentUser()
      .then(setUser)
      .catch(() => {})
  }, [session])
  const canReadAlerts = Boolean(user?.permissoes.includes('manutencoes:ler'))
  const canReadFuel = Boolean(user?.permissoes.includes('abastecimentos:ler'))
  const fuelEnabled = useFeatureFlag('gestor_abastecimentos')
  const driversEnabled = useFeatureFlag('gestor_motoristas')
  const maintenanceEnabled = useFeatureFlag('gestor_manutencoes')
  const notificationsEnabled = useFeatureFlag('gestor_notificacoes')
  const canViewNotifications =
    notificationsEnabled && (canReadAlerts || (canReadFuel && fuelEnabled))
  const loadFeed = useCallback(
    async () =>
      user && canViewNotifications
        ? loadNotifications(user, fuelEnabled, driversEnabled, maintenanceEnabled)
        : null,
    [user, canViewNotifications, fuelEnabled, driversEnabled, maintenanceEnabled],
  )
  const notificationFeed = useAsync(loadFeed)
  const { reload: reloadNotifications } = notificationFeed
  const notificationCount =
    notificationFeed.status === 'success'
      ? (notificationFeed.data?.notifications.length ?? 0)
      : 0
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(readIsCollapsed)
  const { theme, toggleTheme } = useTheme()
  const themeLabel = theme === 'dark' ? 'Modo claro' : 'Modo escuro'
  const panelId = useId()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const onNotificationsPage = pathname === '/notificacoes'
  const wasOnNotificationsPage = useRef(onNotificationsPage)
  const userName = user?.nome ?? 'Usuário'

  useEffect(() => {
    if (onNotificationsPage && !wasOnNotificationsPage.current) reloadNotifications()
    wasOnNotificationsPage.current = onNotificationsPage
  }, [onNotificationsPage, reloadNotifications])

  useEffect(() => {
    if (!isMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  function handleToggleCollapsed() {
    const next = !isCollapsed
    setIsCollapsed(next)
    saveIsCollapsed(next)
  }

  async function handleLogout() {
    setIsMenuOpen(false)
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className={classNames(styles.layout, isCollapsed && styles.layoutCollapsed)}>
      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              SM
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>SIVOF Manager</span>
              <span className={styles.brandTagline}>Gestão de Frota · FSPH</span>
            </span>
          </div>

          <button
            type="button"
            className={styles.collapseToggle}
            aria-expanded={!isCollapsed}
            aria-controls={panelId}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            onClick={handleToggleCollapsed}
          >
            <SidebarIcon name={isCollapsed ? 'expand' : 'collapse'} />
          </button>

          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={isMenuOpen}
            aria-controls={panelId}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <SidebarIcon name={isMenuOpen ? 'close' : 'menu'} className={styles.icon} />
          </button>
        </div>

        <div
          id={panelId}
          className={classNames(styles.panel, isMenuOpen && styles.panelOpen)}
        >
          <nav aria-label="Menu principal">
            <ul className={styles.navList}>
              {NAV_ITEMS.filter(
                (item) =>
                  (!item.permission || user?.permissoes.includes(item.permission)) &&
                  (!item.anyPermission ||
                    item.anyPermission.some((p) => user?.permissoes.includes(p))),
              ).map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    aria-label={isCollapsed ? item.label : undefined}
                    data-tooltip={item.label}
                    className={({ isActive }) =>
                      classNames(
                        styles.navItem,
                        styles.hasTooltip,
                        isActive && styles.navItemActive,
                      )
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <SidebarIcon name={item.icon} className={styles.icon} />
                    <span className={styles.label}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.footer}>
            <button
              type="button"
              className={classNames(styles.footerItem, styles.hasTooltip)}
              aria-label={isCollapsed ? themeLabel : undefined}
              data-tooltip={themeLabel}
              onClick={toggleTheme}
            >
              <SidebarIcon
                name={theme === 'dark' ? 'sun' : 'moon'}
                className={styles.icon}
              />
              <span className={styles.label}>{themeLabel}</span>
            </button>

            {canViewNotifications ? (
              <NavLink
                to="/notificacoes"
                data-tooltip="Notificações"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  classNames(
                    styles.footerItem,
                    styles.footerItemStrong,
                    styles.hasTooltip,
                    isActive && styles.navItemActive,
                  )
                }
              >
                <span className={styles.iconWrap}>
                  <SidebarIcon name="alert" className={styles.icon} />
                  {notificationCount > 0 ? (
                    <span className={styles.badge}>
                      {notificationCount}
                      <span className={styles.visuallyHidden}>
                        {notificationCount === 1 ? ' notificação' : ' notificações'}
                      </span>
                    </span>
                  ) : null}
                </span>
                <span className={styles.label}>Notificações</span>
              </NavLink>
            ) : (
              <p
                className={classNames(
                  styles.footerItem,
                  styles.footerItemStrong,
                  styles.hasTooltip,
                )}
                data-tooltip="Notificações"
              >
                <SidebarIcon name="alert" className={styles.icon} />
                <span className={styles.label}>Notificações</span>
              </p>
            )}

            <div className={styles.userBox}>
              <Avatar name={userName} className={styles.avatar} />
              <span className={styles.userText}>
                <span className={styles.userName}>{userName}</span>
                <button
                  type="button"
                  className={classNames(styles.logout, styles.hasTooltip)}
                  data-tooltip="Sair"
                  onClick={handleLogout}
                >
                  <SidebarIcon name="logout" className={styles.logoutIcon} />
                  <span className={styles.label}>Sair</span>
                </button>
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div key={pathname} className={styles.content}>
          {children ?? <Outlet context={notificationFeed} />}
        </div>
      </main>
    </div>
  )
}
