import { useAsync } from '@/hooks/useAsync'
import { getDashboardData } from '../services/dashboardService'

export function useDashboard() {
  return useAsync(getDashboardData)
}
