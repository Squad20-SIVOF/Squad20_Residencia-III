import type { Driver } from '@/pages/drivers/types'
import { canTakeNewTrips } from '@/pages/drivers/utils/driverRules'
import type { Vehicle } from '@/pages/vehicles/types'
import { normalizeText } from '@/utils/format'
import { onlyDigits } from '@/utils/masks'

/** Acima disso o veículo exige CNH D (CTB: a categoria B leva até 8 passageiros). */
const MAX_PASSENGERS_CNH_B = 8
/** Até essa lotação o veículo é tratado como carro; acima, van. */
const MAX_PASSENGERS_CAR = 7
/** Acima dessa lotação, micro-ônibus. */
const MAX_PASSENGERS_VAN = 16

export function isVehicleAvailable(vehicle: Pick<Vehicle, 'status'>): boolean {
  return vehicle.status === 'ativo'
}

/** Motorista ativo e com CNH dentro da validade. */
export function isDriverAvailable(
  driver: Pick<Driver, 'status' | 'cnhExpiry'>,
  today: Date = new Date(),
): boolean {
  return canTakeNewTrips(driver, today)
}

export function getRequiredCnh(maxCapacity: number): 'B' | 'D' {
  return maxCapacity > MAX_PASSENGERS_CNH_B ? 'D' : 'B'
}

// O backend ainda não tem o tipo do veículo; ele é deduzido da lotação.
export function getVehicleKind(maxCapacity: number): string {
  if (maxCapacity <= MAX_PASSENGERS_CAR) return 'Carro'
  if (maxCapacity <= MAX_PASSENGERS_VAN) return 'Van'
  return 'Micro-ônibus'
}

/** "abc-1d23" → "ABC1D23" (placa Mercosul, sem hífen). */
export function formatPlate(plate: string): string {
  return plate.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

export function getVehicleName(vehicle: Pick<Vehicle, 'brand' | 'model'>): string {
  return [vehicle.brand, vehicle.model].filter(Boolean).join(' ')
}

/** "529.982.247-25" → "***.982.247-**" (mostra só o miolo do CPF). */
export function maskCpfPartially(cpf: string): string {
  const digits = onlyDigits(cpf)
  if (digits.length !== 11) return '—'
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

/** Busca por modelo (ou marca) e por placa, ignorando acentos, caixa e hífen. */
export function matchesVehicleSearch(
  vehicle: Pick<Vehicle, 'brand' | 'model' | 'plate'>,
  query: string,
): boolean {
  const text = normalizeText(query)
  if (!text) return true
  const plateQuery = formatPlate(text)
  return (
    normalizeText(getVehicleName(vehicle)).includes(text) ||
    (plateQuery !== '' && formatPlate(vehicle.plate).includes(plateQuery))
  )
}

/** Busca por nome ou número da CNH. */
export function matchesDriverSearch(
  driver: Pick<Driver, 'name' | 'cnh'>,
  query: string,
): boolean {
  const text = normalizeText(query)
  if (!text) return true
  const digits = onlyDigits(text)
  return (
    normalizeText(driver.name).includes(text) ||
    (digits !== '' && onlyDigits(driver.cnh).includes(digits))
  )
}
