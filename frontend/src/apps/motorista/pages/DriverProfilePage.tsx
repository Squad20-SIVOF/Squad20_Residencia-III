import { logout } from '@/service/authService'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useTheme } from '@/hooks/useTheme'
import ProfilePage from '@/pages/perfil/ProfilePage.module'
import styles from '@/pages/perfil/ProfilePage.module.scss'
export function DriverProfilePage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  return (
    <ProfilePage>
      <div className={styles.mobileActions}>
        <Button variant="secondary" isFullWidth onClick={toggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          onClick={async () => {
            try {
              await logout()
            } finally {
              navigate('/login')
            }
          }}
        >
          Sair
        </Button>
      </div>
    </ProfilePage>
  )
}
