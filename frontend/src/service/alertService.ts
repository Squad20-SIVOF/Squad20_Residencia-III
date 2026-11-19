import { api } from './api'

export interface LicenseAlert {
  id: string
  nome: string
  validade_cnh: string
  dias_restantes: number
  severity: string
}

export interface MaintenanceAlert {
  id: string
  placa: string
  quilometragem: number
  km_restantes: number
  severity: string
}

export interface AlertGroup<T> {
  total: number
  criticas: number
  itens: T[]
}

export interface AlertSummary {
  cnh: AlertGroup<LicenseAlert>
  manutencao: AlertGroup<MaintenanceAlert>
}

/** Alertas atuais de CNH e manutenção retornados pela API. */
export async function getAlertSummary(): Promise<AlertSummary> {
  const data = await api<unknown>('/alerts/resume')
  const summary =
    typeof data === 'object' && data !== null && 'message' in data ? data.message : null
  if (
    typeof summary !== 'object' ||
    summary === null ||
    !('cnh' in summary) ||
    !('manutencao' in summary)
  ) {
    throw new Error('A API retornou um resumo de alertas inválido.')
  }
  return summary as AlertSummary
}

/** Total de alertas abertos (CNH + manutenção) do resumo da API. */
export async function getAlertCount(): Promise<number> {
  const summary = await getAlertSummary()
  return summary.cnh.total + summary.manutencao.total
}
