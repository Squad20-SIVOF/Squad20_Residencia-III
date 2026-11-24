import type { BadgeVariant } from '@/components/Badge'
import type { Maintenance } from '@/pages/manutencoes/types/maintenance'
import type { TrackedTrip } from '@/pages/requests/types'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AlertSummary } from '@/service/alertService'

/** Resultado de uma fonte de dados do dashboard. */
export type DashboardSection<TData> =
  { status: 'ok'; data: TData } | { status: 'error' } | { status: 'forbidden' }

/** Viagens realizadas em um dia (histórico de 7 dias). */
export interface DailyTrips {
  date: string // "AAAA-MM-DD"
  trips: number
}

export interface WeeklyTrips {
  days: DailyTrips[] // do mais antigo para hoje
  previousWeekTotal: number
  dailyGoal: number
}

/** Dados brutos que alimentam o dashboard. */
export interface DashboardData {
  vehicles: DashboardSection<Vehicle[]>
  alerts: DashboardSection<AlertSummary>
  maintenances: DashboardSection<Maintenance[]>
  trips: TrackedTrip[]
  weeklyTrips: WeeklyTrips
  /** Variação de veículos disponíveis em relação a ontem. */
  availableVsYesterday: number
}

export const ALERT_KINDS = ['cnh', 'manutencao'] as const
export type AlertKind = (typeof ALERT_KINDS)[number]

/** Alerta já pronto para a lista "Alertas da frota". */
export interface FleetAlert {
  id: string
  kind: AlertKind
  title: string
  detail: string
  badgeLabel: 'Crítico' | 'Hoje' | 'Revisar'
  badgeVariant: BadgeVariant
  isCritical: boolean
  to: string
}

export interface FleetAvailability {
  active: number
  available: number
  maintenance: number
  traveling: number
  /** Ainda sem status na API: `null` mostra "—". */
  refueling: number | null
  availablePercent: number
}

export interface UtilizationBar {
  date: string
  dayLabel: string // "Seg"
  dayName: string // "segunda-feira"
  trips: number
  isToday: boolean
}

export interface FleetUtilization {
  bars: UtilizationBar[]
  scaleMax: number
  ticks: number[]
  weeklyTotal: number
  dailyAverage: number
  dailyGoal: number
  /** Variação percentual em relação à semana anterior. */
  variationPercent: number
}

export interface NextAction {
  id: string
  text: string
  to: string
  tone: 'danger' | 'warning' | 'info'
}
