export const MAINTENANCE_TYPES = [
  'Preventiva',
  'Corretiva',
  'Preditiva',
  'Impeditiva',
] as const
export const MAINTENANCE_STATUSES = [
  'Agendada',
  'Em andamento',
  'Concluída',
  'Cancelada',
] as const
export const NEXT_REVISION_TYPES = [
  'Quilometragem',
  'Data',
  'Data e quilometragem',
  'Não definida',
] as const

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number]
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number]
export type NextRevisionType = (typeof NEXT_REVISION_TYPES)[number]

export interface Maintenance {
  id: string
  vehicleId: string
  tipo: MaintenanceType
  descricao: string
  /** ISO date (yyyy-MM-dd) */
  dataServico: string
  /** HH:mm */
  horaServico?: string
  quilometragem: number
  oficina: string
  /** Plain number, no currency symbol */
  valorEstimado: number
  status: MaintenanceStatus
  tipoProximaRevisao: NextRevisionType
  proximaRevisaoKm?: number
  /** ISO date (yyyy-MM-dd) */
  proximaRevisaoData?: string
  notificarRevisao: boolean
  comprovanteNome?: string
  criadoEm: string
  atualizadoEm: string
}

export type MaintenanceInput = Omit<Maintenance, 'id' | 'criadoEm' | 'atualizadoEm'>

export interface MaintenanceFiltersValue {
  search: string
  vehicleId: string // "all" or vehicle id
  status: MaintenanceStatus | 'all'
  /** ISO dates */
  from?: string
  to?: string
}
