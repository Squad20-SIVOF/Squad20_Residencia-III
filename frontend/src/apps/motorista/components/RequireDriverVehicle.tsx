import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api } from '@/service/api'
import { useAsync } from '@/hooks/useAsync'
import { StateMessage } from '@/components/StateMessage'
import { Button } from '@/components/Button'
import type { DriverVehicle } from '../types'
const load = async () =>
  (await api<{ message: DriverVehicle | null }>('/motorista/veiculo-sessao')).message
function VerifyVehicle() {
  const result = useAsync(load)
  if (result.status === 'loading')
    return <StateMessage variant="loading" title="Verificando veículo da sessão" />
  if (result.status === 'error')
    return (
      <StateMessage
        variant="error"
        title="Não foi possível verificar o veículo"
        action={<Button onClick={result.reload}>Tentar novamente</Button>}
      />
    )
  return result.data?.id ? <Outlet /> : <Navigate to="/veiculo-sessao" replace />
}
export function RequireDriverVehicle() {
  const { key } = useLocation()
  // Remonta a verificação em cada navegação; não reutiliza o vínculo de outra rota.
  return <VerifyVehicle key={key} />
}
