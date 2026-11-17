import { api } from './api'

/** Total de alertas abertos (CNH + manutenção) do resumo da API. */
export async function getAlertCount(): Promise<number> {
  const data = await api<unknown>('/alerts/resume')
  const summary =
    typeof data === 'object' && data !== null && 'message' in data ? data.message : null
  if (typeof summary !== 'object' || summary === null) return 0

  return Object.values(summary).reduce<number>((sum, group: unknown) => {
    const total =
      typeof group === 'object' && group !== null && 'total' in group ? group.total : 0
    return sum + (typeof total === 'number' ? total : 0)
  }, 0)
}
