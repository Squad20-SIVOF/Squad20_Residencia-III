import { logout } from '@/service/authService'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import ProfilePage from '@/pages/perfil'
export function DriverProfilePage() {
  const navigate = useNavigate()
  return (
    <div>
      <ProfilePage />
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
  )
}
