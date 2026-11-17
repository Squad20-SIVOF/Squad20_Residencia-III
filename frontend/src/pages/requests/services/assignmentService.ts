import { getDrivers } from '@/pages/drivers/services/driverService'
import type { Driver } from '@/pages/drivers/types'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AssignmentRequestSummary, TripAssignment } from '../types'
import { isDriverAvailable, isVehicleAvailable } from '../utils/assignmentRules'
import { getRequestDetails } from './requestApi'

const MOCK_DELAY_MS = 400

/** GET /solicitacoes/:id, reduzido ao que a tela de atribuição mostra. */
export async function getAssignmentRequest(
  id: string,
): Promise<AssignmentRequestSummary> {
  const request = await getRequestDetails(id)
  return {
    id: request.id,
    code: request.id.slice(0, 8),
    sector: request.setor_nome,
    // A API ainda não guarda trajeto nem paradas.
    origin: null,
    destination: null,
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

/*
 * O backend ainda não tem rota para atribuir veículo e motorista: a função só simula o
 * envio (nada é salvo) e a tela avisa que é demonstrativo. Para integrar, troque o corpo
 * pela chamada real, por exemplo:
 * api(`/solicitacoes/${encodeURIComponent(requestId)}/atribuir`, {
 *   method: 'POST',
 *   body: JSON.stringify({ veiculo_id: vehicleId, motorista_id: driverId }),
 * })
 */
export async function saveAssignment(assignment: TripAssignment): Promise<void> {
  void assignment
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
}
