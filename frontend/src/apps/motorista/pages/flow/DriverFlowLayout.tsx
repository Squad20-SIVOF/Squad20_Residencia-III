import { Outlet } from 'react-router-dom'
import { MobileHeader } from '../../components/MobileHeader'
import { useOnlineStatus } from '../../pwa/useOnlineStatus'
import { Alert } from '@/components/Alert'
import styles from './DriverFlow.module.scss'
export function DriverFlowLayout() {
  const online = useOnlineStatus()
  return (
    <div className={styles.screen}>
      <MobileHeader back="/viagens" />
      {!online && (
        <Alert variant="warning">
          Sem conexão. As leituras só são registradas com internet.
        </Alert>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  )
}
