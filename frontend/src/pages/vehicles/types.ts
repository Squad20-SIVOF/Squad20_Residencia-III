/** Formato retornado pelo backend em GET /vehicle. */
export interface VehicleResponse {
  id: string
  identificacao?: string | null
  marca?: string | null
  proxima_vistoria?: string | null
  checklist_vistoria?: InspectionItem[]
  placa: string
  modelo: string
  tipo_combustivel: string
  ultimo_km_alertado?: number
  teto_gasto_mensal?: number | string | null
  quilometragem?: number
  capacidade_maxima: number
  status: string
  frota?: Fleet | null
  exclusivo_svo?: boolean
  ativo: boolean
}

/** Campos que ainda não existem no backend (mockados por enquanto). */
export interface VehicleExtraInfoResponse {
  identificacao: string
  quilometragem: number
  frota: Fleet
  proxima_vistoria: string // "AAAA-MM"
}

export type VehicleStatus = 'ativo' | 'manutencao' | 'em_viagem' | 'inativo'

export type Fleet =
  'Administrativa' | 'Assistencial' | 'Operacional' | 'SVO' | 'Não informada'

export interface Vehicle {
  id: string
  identification: string
  brand?: string
  inspectionChecklist?: InspectionItem[]
  plate: string
  model: string
  fuelType: string
  maxCapacity: number
  status: VehicleStatus
  mileageKm: number
  lastAlertedKm?: number
  monthlyCap?: number | null
  fleet: Fleet
  exclusiveSvo?: boolean
  nextInspection: string // "AAAA-MM"
}

export interface Trip {
  id: string
  code: string
  origin?: string
  destination?: string
  startedAt: string | null // ISO 8601; sem data para viagens ainda não iniciadas
  status?: string
  mileageStart?: number | null
  mileageEnd?: number | null
}

export type MaintenanceType = 'preventiva' | 'corretiva' | 'impeditiva' | 'preditiva'

export interface Maintenance {
  id: string
  type: MaintenanceType
  description: string
  date: string // "AAAA-MM-DD"
  mileageKm: number | null
  cost: number
}

export interface InspectionItem {
  id: string
  label: string
  isOk: boolean
}

export interface VehicleDetails {
  availability?: { trips: boolean; checklist: boolean; maintenance: boolean }
  vehicle: Vehicle
  trips: Trip[]
  tripsError?: string
  maintenances: Maintenance[]
  checklist: InspectionItem[]
}

export type VehicleStatusFilter = VehicleStatus | 'todos'

export type FleetFilter = Fleet | 'todas'
