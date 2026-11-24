import { maintenanceService } from '@/pages/manutencoes/services/maintenanceService'
import { listTrackedTrips } from '@/pages/requests/services/trackedTripService'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'
import { getAlertSummary } from '@/service/alertService'
import { currentUser } from '@/service/authService'
import type { DashboardData, DashboardSection } from '../types'
import { getAvailableVsYesterday, getWeeklyTrips } from './dashboardDemoService'

/** Permissões exigidas pelo backend para cada fonte de dados. */
export const DASHBOARD_PERMISSIONS = {
  vehicles: 'veiculos:ler',
  maintenance: 'manutencoes:ler',
} as const

async function loadSection<TData>(
  isAllowed: boolean,
  loader: () => Promise<TData>,
): Promise<DashboardSection<TData>> {
  if (!isAllowed) return { status: 'forbidden' }
  try {
    return { status: 'ok', data: await loader() }
  } catch {
    return { status: 'error' }
  }
}

/**
 * Busca, em paralelo, só o que o usuário pode ver. A falha de uma fonte vira erro
 * do bloco correspondente; a tela inteira só falha se nenhuma fonte responder.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const user = await currentUser()
  const can = (permission: string) => user.permissoes.includes(permission)
  const canReadMaintenance = can(DASHBOARD_PERMISSIONS.maintenance)

  const [vehicles, alerts, maintenances, trips, weeklyTrips, availableVsYesterday] =
    await Promise.all([
      loadSection(can(DASHBOARD_PERMISSIONS.vehicles), getVehicles),
      loadSection(canReadMaintenance, getAlertSummary),
      loadSection(canReadMaintenance, () => maintenanceService.list()),
      listTrackedTrips(),
      getWeeklyTrips(),
      getAvailableVsYesterday(),
    ])

  const sections = [vehicles, alerts, maintenances]
  const allowed = sections.filter((section) => section.status !== 'forbidden')
  if (allowed.length > 0 && allowed.every((section) => section.status === 'error')) {
    throw new Error('Não foi possível carregar os dados do dashboard.')
  }

  return { vehicles, alerts, maintenances, trips, weeklyTrips, availableVsYesterday }
}
