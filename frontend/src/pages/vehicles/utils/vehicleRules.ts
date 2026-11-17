import type { Fueling, Vehicle, VehicleStatus } from '../types'

/** A partir desta fração do teto mensal o veículo entra em "Atenção". */
export const FUEL_CAP_ATTENTION_RATIO = 0.8

export interface FleetSummary {
  total: number
  active: number
  maintenance: number
  inactive: number
}

/** Veículo em viagem continua ativo: só manutenção e inativo saem da operação. */
export function summarizeFleet(vehicles: Vehicle[]): FleetSummary {
  const count = (statuses: VehicleStatus[]) =>
    vehicles.filter((vehicle) => statuses.includes(vehicle.status)).length
  return {
    total: vehicles.length,
    active: count(['ativo', 'em_viagem']),
    maintenance: count(['manutencao']),
    inactive: count(['inativo']),
  }
}

export interface MonthlyFuelSummary {
  count: number
  liters: number
  spent: number
}

/** Soma os abastecimentos do mês de `now` (horário local). */
export function summarizeMonthlyFuel(
  fuelings: Fueling[],
  now: Date = new Date(),
): MonthlyFuelSummary {
  const inMonth = fuelings.filter((fueling) => {
    const date = new Date(fueling.date)
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  })
  return {
    count: inMonth.length,
    liters: inMonth.reduce((sum, fueling) => sum + fueling.liters, 0),
    spent: inMonth.reduce((sum, fueling) => sum + fueling.total, 0),
  }
}

export type FuelCapLevel = 'ok' | 'attention' | 'exceeded'

export interface FuelCapUsage {
  /** Percentual inteiro do teto já gasto (pode passar de 100). */
  percent: number
  level: FuelCapLevel
}

export function fuelCapUsage(spent: number, cap: number): FuelCapUsage {
  const ratio = cap > 0 ? spent / cap : spent > 0 ? Infinity : 0
  const level: FuelCapLevel =
    ratio > 1 ? 'exceeded' : ratio >= FUEL_CAP_ATTENTION_RATIO ? 'attention' : 'ok'
  return { percent: Number.isFinite(ratio) ? Math.round(ratio * 100) : 100, level }
}

/** "2026-10-21T02:00:00Z" → "2026-10-20" em UTC-3: o dia do calendário local. */
export function toLocalIsoDate(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** "Outubro de 2026" */
export function formatMonthLong(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Nome curto do veículo: identificação interna ou, sem ela, a placa. */
export function vehicleDisplayName(vehicle: Vehicle): string {
  return vehicle.identification && vehicle.identification !== '—'
    ? vehicle.identification
    : vehicle.plate
}

/** "Fiat Fiorino 1.4", sem repetir a marca quando ela já faz parte do modelo. */
export function vehicleFullModel(vehicle: Pick<Vehicle, 'brand' | 'model'>): string {
  const brand = vehicle.brand?.trim() ?? ''
  if (!brand || vehicle.model.toLowerCase().startsWith(brand.toLowerCase())) {
    return vehicle.model
  }
  return `${brand} ${vehicle.model}`
}
