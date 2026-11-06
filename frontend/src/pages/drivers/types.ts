export const DRIVER_STATUSES = ['ativo', 'em_viagem', 'ferias', 'bloqueado'] as const
export type DriverStatus = (typeof DRIVER_STATUSES)[number]

export const DRIVER_FLEETS = [
  'Administrativa',
  'Assistencial',
  'Operacional',
  'SVO',
] as const
export type DriverFleet = (typeof DRIVER_FLEETS)[number]

export const CNH_CATEGORIES = [
  'ACC',
  'A',
  'B',
  'C',
  'D',
  'E',
  'AB',
  'AC',
  'AD',
  'AE',
] as const
export type CnhCategory = (typeof CNH_CATEGORIES)[number]

export interface Driver {
  id: string
  name: string
  cpf: string
  phone: string
  email: string
  photo?: string // data URL
  cnh: string
  cnhCategory: CnhCategory
  cnhExpiry: string // "AAAA-MM-DD"
  fleet: DriverFleet | ''
  vehicles: string[] // placas
  isWildcard: boolean // "coringa": atua em todas as frotas
  status: DriverStatus
  createdAt: string // ISO 8601
}

export type DriverInput = Omit<Driver, 'id' | 'createdAt'>

export type CnhSituation = 'valid' | 'expiring' | 'expired'

export interface DriverSummary {
  total: number
  active: number
  expiring: number
  expired: number
  blocked: number
}

/** Valores do formulário: tudo texto, a validade no formato "DD/MM/AAAA". */
export interface DriverFormValues extends Omit<
  DriverInput,
  'cnhCategory' | 'cnhExpiry' | 'photo'
> {
  cnhCategory: CnhCategory | ''
  cnhExpiry: string
  photo: string | undefined
}

export type DriverFormErrors = Partial<Record<keyof DriverFormValues, string>>

export type DriverStatusFilter = DriverStatus | 'todos'

export type DriverFleetFilter = DriverFleet | 'todas'
