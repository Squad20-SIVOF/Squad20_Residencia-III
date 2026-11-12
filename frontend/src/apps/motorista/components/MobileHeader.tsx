import { Link, useNavigate } from 'react-router-dom'
import { logout } from '@/service/authService'
import { Button } from '@/components/Button'
import menuIcon from '../assets/menu.svg'
import arrowIcon from '../assets/arrow-left.svg'
import styles from '../pages/flow/DriverFlow.module.scss'
export function MobileHeader({ back, menu = true }: { back?: string; menu?: boolean }) {
  const navigate = useNavigate()
  return (
    <header className={styles.header}>
      {back ? (
        <Link to={back} className={styles.iconButton} aria-label="Voltar">
          <img src={arrowIcon} alt="" />
        </Link>
      ) : (
        <span className={styles.headerSpacer} />
      )}
      <span>SIVOF Driver</span>
      {menu ? (
        <details className={styles.menu}>
          <summary aria-label="Abrir opções">
            <img src={menuIcon} alt="" />
          </summary>
          <nav aria-label="Opções do motorista">
            <Link to="/">Início</Link>
            <Link to="/viagens">Minhas viagens</Link>
            <Link to="/checklist">Vistoria</Link>
            <Link to="/abastecimento">Abastecer</Link>
            <Link to="/perfil">Perfil</Link>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await logout()
                } finally {
                  navigate('/login', { replace: true })
                }
              }}
            >
              Sair
            </Button>
          </nav>
        </details>
      ) : (
        <span className={styles.headerSpacer} />
      )}
    </header>
  )
}
