import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BusFront,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Fuel,
  LayoutDashboard,
  Menu,
  Moon,
  Route,
  Sun,
  TriangleAlert,
  UserRound,
  UserRoundCog,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import styles from './Sidebar.module.scss';
import { useTheme } from '@/hooks/useTheme';


const NAV_ITEMS = [
  { label: 'Início', Icon: LayoutDashboard, to: '/' },
  { label: 'Veículos', Icon: BusFront, to: '/veiculos' },
  { label: 'Motoristas', Icon: UsersRound, to: '/motoristas' },
  { label: 'Abastecimentos', Icon: Fuel, to: '/abastecimento' },
  { label: 'Manutenções', Icon: Wrench, to: '/manutencoes' },
  { label: 'Viagens', Icon: Route, to: '/viagens' },
  { label: 'Relatórios', Icon: ChartNoAxesCombined, to: '/relatorios' },
  { label: 'Perfil', Icon: UserRound, to: '/perfil' },
  { label: 'Usuários e permissões', Icon: UserRoundCog, to: '/usuarios' },
] as const;

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pendingNotifications = 2;//notificação fixa- mude o numero para testar//
  const hasPendingNotifications = pendingNotifications > 0;
  const { isDark, toggleTheme } = useTheme();

  function handleCloseMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuButton}
          type="button"
          aria-label="Abrir menu"
          onClick={() => setIsOpen(true)}
        >
          <Menu />
        </button>
        <span>SIVOF Manager</span>
      </header>

      {isOpen && (
        <button
          className={styles.scrim}
          type="button"
          aria-label="Fechar menu"
          onClick={handleCloseMenu}
        />
      )}

      <aside
        className={[
          styles.sidebar,
          isOpen ? styles.sidebarOpen : '',
          isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
        ].filter(Boolean).join(' ')}
        aria-label="Menu principal"
      >
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">SM</div>

          <div className={styles.brandText}>
            <div className={styles.brandName}>SIVOF Manager</div>
            <div className={styles.brandSubtitle}>Gestão de Frota · FPSH</div>
          </div>

          <button
            className={styles.collapseButton}
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <button
            className={styles.closeButton}
            type="button"
            aria-label="Fechar menu"
            onClick={handleCloseMenu}
          >
            <X size={19} />
          </button>
        </div>

        <nav className={styles.navList} aria-label="Navegação">
          {NAV_ITEMS.map(({ label, Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              title={isCollapsed ? label : undefined}
              onClick={handleCloseMenu}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={17} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            className={styles.utilityItem}
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-pressed={isDark}
            title={isCollapsed ? (isDark ? 'Modo claro' : 'Modo escuro') : undefined}
          >
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            <span>{isDark ? 'Modo claro' : 'Modo escuro'}</span>
          </button>

        <button
  className={`${styles.utilityItem} ${
    hasPendingNotifications ? styles.hasNotifications : ''
  }`}
  type="button"
  aria-label={`Notificações: ${pendingNotifications} pendentes`}
  title={isCollapsed ? `Notificações: ${pendingNotifications}` : undefined}
>
  <TriangleAlert size={17} aria-hidden="true" />

    {hasPendingNotifications && (
    <span className={styles.notificationCount}>
      {pendingNotifications}
    </span>
  )}

  <span className={styles.notificationLabel}>
    Notificações
  </span>

</button>

          <div className={styles.profile}>
            <div className={styles.profileAvatar}>GF</div>
            <div className={styles.profileText}>
              <strong>Gestor de Frota</strong>
              <button type="button">Sair</button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
