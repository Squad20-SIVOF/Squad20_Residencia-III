import { onlyDigits, parseBrDate, parseTime } from '@/utils/masks'
import { TRIP_STAGES } from '../types'
import type {
  RequestFormErrors,
  RequestFormValues,
  RequestInput,
  TripStage,
} from '../types'

// ---------- Validação do formulário ----------

/** Ordem em que os campos aparecem na tela (usada para focar o primeiro erro). */
export const REQUEST_FORM_FIELD_ORDER: (keyof RequestFormValues)[] = [
  'origin',
  'destination',
  'sector',
  'date',
  'departureTime',
  'returnTime',
  'passengers',
  'vehicleId',
  'reason',
]

export interface RequestValidationContext {
  now?: Date
  /** Lotação do veículo preferencial escolhido; sem veículo, não há limite. */
  vehicleCapacity?: number | undefined
}

function toLocalDate(isoDate: string, minutes: number): Date {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60)
}

function isBeforeToday(isoDate: string, now: Date): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return toLocalDate(isoDate, 0) < today
}

export function validateRequestForm(
  values: RequestFormValues,
  { now = new Date(), vehicleCapacity }: RequestValidationContext = {},
): RequestFormErrors {
  const errors: RequestFormErrors = {}

  if (!values.origin.trim()) errors.origin = 'Informe a origem.'
  if (!values.destination.trim()) errors.destination = 'Informe o destino.'
  if (!values.sector) errors.sector = 'Selecione o setor solicitante.'
  if (!values.reason.trim()) errors.reason = 'Descreva o motivo da solicitação.'

  const date = parseBrDate(values.date)
  const departure = parseTime(values.departureTime)
  if (!date) errors.date = 'Data inválida (DD/MM/AAAA).'
  if (departure === null) errors.departureTime = 'Horário inválido (HH:MM).'

  if (date && isBeforeToday(date, now)) {
    errors.date = 'A data não pode estar no passado.'
  } else if (date && departure !== null && toLocalDate(date, departure) <= now) {
    errors.departureTime = 'O horário de saída já passou.'
  }

  if (values.returnTime) {
    const returnTime = parseTime(values.returnTime)
    if (returnTime === null) {
      errors.returnTime = 'Horário inválido (HH:MM).'
    } else if (departure !== null && returnTime <= departure) {
      errors.returnTime = 'O retorno deve ser depois do horário de saída.'
    }
  }

  const passengers = Number(values.passengers)
  if (!/^\d+$/.test(values.passengers) || passengers < 1) {
    errors.passengers = 'Informe um número inteiro a partir de 1.'
  } else if (vehicleCapacity !== undefined && passengers > vehicleCapacity) {
    errors.passengers = `O veículo escolhido leva no máximo ${vehicleCapacity} passageiros.`
  }

  return errors
}

/** Converte os valores já validados; devolve null se algum campo ainda for inválido. */
export function toRequestInput(values: RequestFormValues): RequestInput | null {
  const date = parseBrDate(values.date)
  const departure = parseTime(values.departureTime)
  const returnTime = values.returnTime ? parseTime(values.returnTime) : null
  if (!date || departure === null || !values.sector) return null

  const toIso = (minutes: number) => `${date}T${minutesToTime(minutes)}:00`

  return {
    origin: values.origin.trim(),
    destination: values.destination.trim(),
    sector: values.sector,
    departureAt: toIso(departure),
    returnAt: returnTime === null ? null : toIso(returnTime),
    passengers: Number(onlyDigits(values.passengers)),
    vehicleId: values.vehicleId || null,
    reason: values.reason.trim(),
    isImportant: values.isImportant,
  }
}

function minutesToTime(minutes: number): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

// ---------- Acompanhamento da rota ----------

/** Velocidade média urbana usada para estimar a chegada. */
export const URBAN_SPEED_KMH = 23

/** A partir deste ponto do trajeto o motorista está "chegando". */
export const ARRIVING_PROGRESS = 0.8

/** Sem nova posição por mais tempo que isso, avisamos que o dado pode estar velho. */
export const STALE_LOCATION_SECONDS = 30

export function getTripStage(progress: number): TripStage {
  if (progress <= 0) return 'confirmada'
  if (progress < ARRIVING_PROGRESS) return 'a_caminho'
  if (progress < 1) return 'chegando'
  return 'embarque'
}

/** Distância que falta, arredondada a 100 m. */
export function getRemainingKm(totalKm: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  return Math.round(totalKm * (1 - clamped) * 10) / 10
}

export function getEtaMinutes(remainingKm: number): number {
  if (remainingKm <= 0) return 0
  return Math.max(1, Math.round((remainingKm * 60) / URBAN_SPEED_KMH))
}

/** Horário previsto de chegada, a partir da última posição recebida. */
export function getArrivalTime(updatedAt: string, etaMinutes: number): string {
  return new Date(new Date(updatedAt).getTime() + etaMinutes * 60_000).toISOString()
}

export function getSecondsSince(isoDateTime: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(isoDateTime).getTime()) / 1000))
}

export function isLocationStale(updatedAt: string, now: Date = new Date()): boolean {
  return getSecondsSince(updatedAt, now) > STALE_LOCATION_SECONDS
}

export function getStageIndex(stage: TripStage): number {
  return TRIP_STAGES.indexOf(stage)
}

const STAGE_STATUS: Record<TripStage, string> = {
  confirmada: 'Motorista confirmado',
  a_caminho: 'Motorista a caminho',
  chegando: 'Motorista chegando',
  embarque: 'Motorista no ponto de embarque',
}

const STAGE_MAP_BADGE: Record<TripStage, string> = {
  confirmada: 'Aguardando saída',
  a_caminho: 'Em aproximação',
  chegando: 'Em aproximação',
  embarque: 'No ponto de embarque',
}

export function getStageStatus(stage: TripStage): string {
  return STAGE_STATUS[stage]
}

export function getStageMapBadge(stage: TripStage): string {
  return STAGE_MAP_BADGE[stage]
}
