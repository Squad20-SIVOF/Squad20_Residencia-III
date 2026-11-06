import { currentUser, logout, type SessionUser } from '@/service/authService'
import { useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  useOutletContext,
} from 'react-router-dom'
import { classNames } from '@/utils/classNames'
import styles from './AppLayout.module.scss'

interface NavItem {
  to: string
  label: string
  permission?: string
  anyPermission?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Início' },
  { to: '/veiculos', label: 'Veículos', permission: 'veiculos:ler' },
  { to: '/motoristas', label: 'Motoristas', permission: 'motoristas:ler' },
  { to: '/abastecimentos', label: 'Abastecimentos', permission: 'abastecimentos:ler' },
  { to: '/manutencoes', label: 'Manutenções' },
  { to: '/viagens', label: 'Viagens' },
  { to: '/relatorios', label: 'Relatórios' },
  { to: '/perfil', label: 'Perfil' },
  {
    to: '/usuarios',
    label: 'Usuários e permissões',
    anyPermission: ['usuarios:delegar-permissoes', 'usuarios:gerenciar'],
  },
]

export interface AppLayoutProps {
  /** Sem `children`, renderiza a rota filha (<Outlet />). */
  children?: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const session = useOutletContext<SessionUser | undefined>()
  const [user, setUser] = useState<SessionUser | null>(session ?? null)
  useEffect(() => {
    if (session) return
    currentUser()
      .then(setUser)
      .catch(() => {})
  }, [session])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const panelId = useId()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!isMenuOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  async function handleLogout() {
    setIsMenuOpen(false)
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              FM
            </span>
            <span className={styles.brandText}>
              <span className={styles.brandName}>FrotaManager</span>
              <span className={styles.brandTagline}>Gestão de Frota · FSPH</span>
            </span>
          </div>

          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={isMenuOpen}
            aria-controls={panelId}
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              {isMenuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
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
                    className={({ isActive }) =>
                      classNames(styles.navItem, isActive && styles.navItemActive)
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.userBox}>
            <span className={styles.avatar} aria-hidden="true" />
            <span className={styles.userText}>
              <span className={styles.userName}>{user?.nome ?? 'Usuário'}</span>
              <button type="button" className={styles.logout} onClick={handleLogout}>
                Sair
              </button>
            </span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div key={pathname} className={styles.content}>
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  )
}
