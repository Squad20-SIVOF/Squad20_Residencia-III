import { onlyDigits, parseBrDate } from '@/utils/masks'
import type {
  CnhSituation,
  Driver,
  DriverFormErrors,
  DriverFormValues,
  DriverStatus,
  DriverSummary,
} from '../types'

/** Antecedência (em dias) para avisar que a CNH está perto de vencer. */
export const CNH_ALERT_DAYS = 30

const MS_PER_DAY = 86_400_000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Dias entre hoje e a data ISO (negativo quando já passou). */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.round((target.getTime() - startOfDay(today).getTime()) / MS_PER_DAY)
}

export function getCnhSituation(
  cnhExpiry: string,
  today: Date = new Date(),
): CnhSituation {
  const days = daysUntil(cnhExpiry, today)
  if (days < 0) return 'expired'
  if (days <= CNH_ALERT_DAYS) return 'expiring'
  return 'valid'
}

/** CNH vencida sempre bloqueia o motorista, independentemente do status cadastrado. */
export function getEffectiveStatus(
  driver: Pick<Driver, 'status' | 'cnhExpiry'>,
  today: Date = new Date(),
): DriverStatus {
  return getCnhSituation(driver.cnhExpiry, today) === 'expired'
    ? 'bloqueado'
    : driver.status
}

export function canTakeNewTrips(
  driver: Pick<Driver, 'status' | 'cnhExpiry'>,
  today: Date = new Date(),
): boolean {
  return getEffectiveStatus(driver, today) === 'ativo'
}

export function summarizeDrivers(
  drivers: Driver[],
  today: Date = new Date(),
): DriverSummary {
  const summary: DriverSummary = {
    total: drivers.length,
    active: 0,
    expiring: 0,
    expired: 0,
    blocked: 0,
  }

  for (const driver of drivers) {
    const situation = getCnhSituation(driver.cnhExpiry, today)
    const status = getEffectiveStatus(driver, today)
    if (status === 'ativo') summary.active += 1
    if (status === 'bloqueado') summary.blocked += 1
    if (situation === 'expiring') summary.expiring += 1
    if (situation === 'expired') summary.expired += 1
  }

  return summary
}

// ---------- Validação do formulário ----------

export function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf)
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  const checkDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index++) {
      sum += Number(digits[index]) * (length + 1 - index)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10])
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  return [10, 11].includes(onlyDigits(phone).length)
}

/** Ordem em que os campos aparecem no formulário (usada para focar o primeiro erro). */
export const FORM_FIELD_ORDER: (keyof DriverFormValues)[] = [
  'name',
  'cpf',
  'phone',
  'email',
  'cnh',
  'cnhCategory',
  'cnhExpiry',
  'fleet',
  'status',
]

export function validateDriverForm(
  values: DriverFormValues,
  today: Date = new Date(),
): DriverFormErrors {
  const errors: DriverFormErrors = {}

  if (values.name.trim().split(/\s+/).length < 2) errors.name = 'Informe o nome completo.'
  if (!isValidCpf(values.cpf)) errors.cpf = 'CPF inválido.'
  if (values.phone && !isValidPhone(values.phone)) errors.phone = 'Telefone inválido.'
  if (values.email && !isValidEmail(values.email)) errors.email = 'E-mail inválido.'
  if (onlyDigits(values.cnh).length !== 11) errors.cnh = 'A CNH deve ter 11 dígitos.'
  if (!values.cnhCategory) errors.cnhCategory = 'Selecione a categoria.'

  const expiry = parseBrDate(values.cnhExpiry)
  if (!expiry) {
    errors.cnhExpiry = 'Data inválida (DD/MM/AAAA).'
  } else if (
    getCnhSituation(expiry, today) === 'expired' &&
    values.status !== 'bloqueado'
  ) {
    errors.cnhExpiry =
      'CNH vencida: a validade deve ser posterior a hoje, ou o motorista deve ficar Bloqueado.'
  }

  if (!values.isWildcard && !values.fleet) {
    errors.fleet = 'Selecione a frota (ou marque motorista coringa).'
  }
  if (!values.status) errors.status = 'Selecione o status.'

  return errors
}
