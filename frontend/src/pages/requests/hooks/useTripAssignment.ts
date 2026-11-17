import { useCallback } from 'react'
import { useAsync } from '@/hooks/useAsync'
import {
  getAssignmentRequest,
  getAvailableDrivers,
  getAvailableVehicles,
} from '../services/assignmentService'

/** Solicitação, veículos e motoristas da tela de atribuição, cada um com seu estado. */
export function useTripAssignment(requestId: string) {
  const loadRequest = useCallback(() => getAssignmentRequest(requestId), [requestId])
  return {
    request: useAsync(loadRequest),
    vehicles: useAsync(getAvailableVehicles),
    drivers: useAsync(getAvailableDrivers),
  }
}
