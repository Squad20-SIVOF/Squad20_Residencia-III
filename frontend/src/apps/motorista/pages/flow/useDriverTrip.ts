import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { fetchDriverTrip } from '../../services/driverAppService'
export function useDriverTrip() {
  const { id = '' } = useParams()
  return useAsync(useCallback(() => fetchDriverTrip(id), [id]))
}
