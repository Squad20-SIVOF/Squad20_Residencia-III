import { logout } from '@/service/authService'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { useTheme } from '@/hooks/useTheme'
import ProfilePage from '@/pages/perfil/ProfilePage.module'
export function DriverProfilePage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  return (
    <ProfilePage>
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
    </ProfilePage>
  )
}
