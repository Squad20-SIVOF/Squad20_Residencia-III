import { useCallback, useEffect } from 'react'
import { currentUser } from '@/service/authService'
import { useAsync } from '@/hooks/useAsync'
import { maintenanceService, vehicleService } from '../services/maintenanceService'
export function useMaintenances() {
  const load = useCallback(async () => {
    const [maintenances, vehicles, user] = await Promise.all([
      maintenanceService.list(),
      vehicleService.list(),
      currentUser(),
    ])
    return {
      maintenances,
      vehicles,
      canManage: user.permissoes.includes('manutencoes:gerenciar'),
    }
  }, [])
  const request = useAsync(load)
  useEffect(() => {
    window.addEventListener(maintenanceService.CHANGE_EVENT, request.reload)
    return () =>
      window.removeEventListener(maintenanceService.CHANGE_EVENT, request.reload)
  }, [request.reload])
  return {
    canManage: request.status === 'success' && request.data.canManage,
    maintenances: request.status === 'success' ? request.data.maintenances : [],
    vehicles: request.status === 'success' ? request.data.vehicles : [],
    loading: request.status === 'loading',
    error:
      request.status === 'error'
        ? 'Não foi possível carregar as manutenções e os veículos.'
        : null,
    refresh: request.reload,
  }
}
