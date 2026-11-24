import { getDrivers } from '@/pages/drivers/services/driverService'
import type { Driver } from '@/pages/drivers/types'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AssignmentRequestSummary, TripAssignment } from '../types'
import { isDriverAvailable, isVehicleAvailable } from '../utils/assignmentRules'
import { getRequestDetails } from './requestApi'
import { api } from '@/service/api'

/** GET /solicitacoes/:id, reduzido ao que a tela de atribuição mostra. */
export async function getAssignmentRequest(
  id: string,
): Promise<AssignmentRequestSummary> {
  const request = await getRequestDetails(id)
  return {
    id: request.id,
    code: request.id.slice(0, 8),
    sector: request.setor_nome ?? request.setor ?? null,
    origin: request.origem ?? null,
    destination: request.destino ?? null,
    cargo: request.categoria || null,
    stops: null,
  }
}

export async function getAvailableVehicles(): Promise<Vehicle[]> {
  return (await getVehicles()).filter(isVehicleAvailable)
}

export async function getAvailableDrivers(): Promise<Driver[]> {
  return (await getDrivers()).filter((driver) => isDriverAvailable(driver))
}

/** Aprova e agenda a solicitação na mesma transação do backend. */
export async function saveAssignment(assignment: TripAssignment): Promise<void> {
  await api(`/solicitacoes/${encodeURIComponent(assignment.requestId)}/aprovar`, {
    method: 'PATCH',
    body: JSON.stringify({
      veiculo_id: assignment.vehicleId,
      motorista_id: assignment.driverId,
      ...(assignment.returnAt ? { data_retorno_prevista: assignment.returnAt } : {}),
    }),
  })
}
