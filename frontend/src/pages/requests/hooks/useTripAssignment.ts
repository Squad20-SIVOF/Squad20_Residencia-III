import { useCallback } from 'react'
import { useAsync } from '@/hooks/useAsync'
import {
  assignmentExampleDrivers,
  assignmentExampleVehicles,
  assignmentExamples,
} from '../services/assignmentExamples'
import {
  getAssignmentRequest,
  getAvailableDrivers,
  getAvailableVehicles,
} from '../services/assignmentService'

/** Solicitação, veículos e motoristas da tela de atribuição, cada um com seu estado. */
export function useTripAssignment(requestId: string) {
  const example = assignmentExamples.find((item) => item.id === requestId)
  const loadRequest = useCallback(
    () => (example ? Promise.resolve(example) : getAssignmentRequest(requestId)),
    [example, requestId],
  )
  const loadVehicles = useCallback(
    () => (example ? Promise.resolve(assignmentExampleVehicles) : getAvailableVehicles()),
    [example],
  )
  const loadDrivers = useCallback(
    () => (example ? Promise.resolve(assignmentExampleDrivers) : getAvailableDrivers()),
    [example],
  )
  return {
    example,
    request: useAsync(loadRequest),
    vehicles: useAsync(loadVehicles),
    drivers: useAsync(loadDrivers),
  }
}
