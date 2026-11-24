import type { Maintenance } from '@/pages/manutencoes/types/maintenance'
import type { TrackedTrip } from '@/pages/requests/types'
import type { Vehicle } from '@/pages/vehicles/types'
import type { AlertSummary, LicenseAlert, MaintenanceAlert } from '@/service/alertService'
import { formatDate, formatDecimal, formatKm } from '@/utils/format'
import type {
  FleetAlert,
  FleetAvailability,
  FleetUtilization,
  NextAction,
  WeeklyTrips,
} from '../types'

export const NEXT_ACTIONS_LIMIT = 3

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]
const FRIDAY = 5
const DAYS_PER_WEEK = 7
const CHART_TICK_COUNT = 4

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseIsoDate(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

// ---------- Frota ----------

/** Frota ativa = veículos que não estão inativos; o restante se divide por status. */
export function summarizeFleet(vehicles: Vehicle[]): FleetAvailability {
  const count = (status: Vehicle['status']) =>
    vehicles.filter((vehicle) => vehicle.status === status).length
  const active = vehicles.filter((vehicle) => vehicle.status !== 'inativo').length
  const available = count('ativo')
  return {
    active,
    available,
    maintenance: count('manutencao'),
    traveling: count('em_viagem'),
    refueling: null,
    availablePercent: active === 0 ? 0 : Math.round((available / active) * 100),
  }
}

/** Parte da frota ativa, de 0 a 100, para a largura das barras de disponibilidade. */
export function shareOfFleet(value: number | null, active: number): number {
  if (value === null || active === 0) return 0
  return Math.min(100, Math.round((value / active) * 100))
}

/** "18 disponíveis · 4 em manutenção · — em abastecimento" (+ "· 2 em viagem" se houver) */
export function formatFleetBreakdown(fleet: FleetAvailability): string {
  const parts = [
    plural(fleet.available, 'disponível', 'disponíveis'),
    `${fleet.maintenance} em manutenção`,
    `${fleet.refueling ?? '—'} em abastecimento`,
  ]
  if (fleet.traveling > 0) parts.push(`${fleet.traveling} em viagem`)
  return parts.join(' · ')
}

/** 2 → "+2"; -1 → "-1"; 0 → "0" */
export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

// ---------- Viagens ----------

export function summarizeTrips(trips: TrackedTrip[]) {
  const inProgress = trips.filter((trip) => trip.status !== 'programada')
  const delayed = inProgress.filter((trip) => trip.status === 'atrasada').length
  return { inProgress: inProgress.length, delayed, onTime: inProgress.length - delayed }
}

export function buildUtilization(
  weekly: WeeklyTrips,
  today: Date = new Date(),
): FleetUtilization {
  const todayIso = toIsoDate(today)
  const bars = weekly.days.map((day) => {
    const weekday = parseIsoDate(day.date).getDay()
    return {
      date: day.date,
      dayLabel: WEEKDAY_LABELS[weekday] ?? '',
      dayName: WEEKDAY_NAMES[weekday] ?? '',
      trips: day.trips,
      isToday: day.date === todayIso,
    }
  })
  const weeklyTotal = bars.reduce((sum, bar) => sum + bar.trips, 0)
  const highest = Math.max(0, weekly.dailyGoal, ...bars.map((bar) => bar.trips))
  const step = Math.max(1, Math.ceil(highest / CHART_TICK_COUNT))
  const scaleMax = step * CHART_TICK_COUNT

  return {
    bars,
    scaleMax,
    ticks: Array.from({ length: CHART_TICK_COUNT + 1 }, (_, index) => index * step),
    weeklyTotal,
    dailyAverage: bars.length === 0 ? 0 : weeklyTotal / bars.length,
    dailyGoal: weekly.dailyGoal,
    variationPercent:
      weekly.previousWeekTotal > 0
        ? ((weeklyTotal - weekly.previousWeekTotal) / weekly.previousWeekTotal) * 100
        : 0,
  }
}

/** 8.42 → "+8,4%"; -3 → "-3%" */
export function formatVariation(percent: number): string {
  const rounded = Math.round(percent * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : ''
  return `${sign}${formatDecimal(Math.abs(rounded))}%`
}

/** Texto alternativo do gráfico, com o valor de cada dia. */
export function describeUtilization(utilization: FleetUtilization): string {
  const days = utilization.bars
    .map(
      (bar) =>
        `${bar.dayName}${bar.isToday ? ' (hoje)' : ''}: ${plural(bar.trips, 'viagem', 'viagens')}`,
    )
    .join('; ')
  return `Gráfico de barras das viagens realizadas nos últimos 7 dias. ${days}.`
}

// ---------- Manutenções ----------

/** Próxima sexta depois de hoje (se hoje é sexta, a da semana seguinte). */
function nextFriday(today: Date): Date {
  const days = (FRIDAY - today.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK || DAYS_PER_WEEK
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
}

export function summarizeScheduledMaintenances(
  maintenances: Maintenance[],
  today: Date = new Date(),
) {
  const todayIso = toIsoDate(today)
  const fridayIso = toIsoDate(nextFriday(today))
  const upcoming = maintenances.filter(
    (item) => item.status === 'Agendada' && item.dataServico >= todayIso,
  )
  return {
    scheduled: upcoming.length,
    today: upcoming.filter((item) => item.dataServico === todayIso).length,
    untilFriday: upcoming.filter(
      (item) => item.dataServico > todayIso && item.dataServico <= fridayIso,
    ).length,
  }
}

// ---------- Alertas ----------

export function countOpenAlerts(summary: AlertSummary) {
  return {
    total: summary.cnh.total + summary.manutencao.total,
    critical: summary.cnh.criticas + summary.manutencao.criticas,
  }
}

const SEVERITY_ORDER: Record<string, number> = { critica: 0, alta: 1 }

/*
 * Selos da lista (mesmos critérios do backend em alertRules):
 * "critica" → Crítico (CNH vencida ou manutenção já passou do km);
 * "alta" → Hoje (CNH vence em até 7 dias: tratar hoje);
 * o restante → Revisar.
 */
function toBadge(severity: string): Pick<FleetAlert, 'badgeLabel' | 'badgeVariant'> {
  if (severity === 'critica') return { badgeLabel: 'Crítico', badgeVariant: 'danger' }
  if (severity === 'alta') return { badgeLabel: 'Hoje', badgeVariant: 'warning' }
  return { badgeLabel: 'Revisar', badgeVariant: 'info' }
}

function fromLicenseAlert(alert: LicenseAlert): FleetAlert {
  const days = alert.dias_restantes
  const expiry = formatDate(alert.validade_cnh.slice(0, 10))
  const title =
    days < 0
      ? 'CNH vencida'
      : days === 0
        ? 'CNH vence hoje'
        : `CNH vence em ${plural(days, 'dia', 'dias')}`
  return {
    id: `cnh-${alert.id}`,
    kind: 'cnh',
    title,
    detail: `${alert.nome} · ${days < 0 ? 'venceu em' : 'validade'} ${expiry}`,
    isCritical: alert.severity === 'critica',
    to: '/motoristas',
    ...toBadge(alert.severity),
  }
}

function fromMaintenanceAlert(alert: MaintenanceAlert): FleetAlert {
  const remaining = alert.km_restantes
  const detail =
    remaining < 0
      ? `${formatKm(-remaining)} além da revisão prevista`
      : remaining === 0
        ? 'revisão prevista para a quilometragem atual'
        : `faltam ${formatKm(remaining)} para a revisão`
  return {
    id: `manutencao-${alert.id}`,
    kind: 'manutencao',
    title: remaining <= 0 ? 'Manutenção atrasada' : 'Manutenção próxima',
    detail: `${alert.placa} · ${detail}`,
    isCritical: alert.severity === 'critica',
    to: '/manutencoes',
    ...toBadge(alert.severity),
  }
}

/** Lista única de alertas abertos, dos mais graves para os menos graves. */
export function buildFleetAlerts(summary: AlertSummary): FleetAlert[] {
  const items = [
    ...summary.cnh.itens.map((alert) => ({ alert, item: fromLicenseAlert(alert) })),
    ...summary.manutencao.itens.map((alert) => ({
      alert,
      item: fromMaintenanceAlert(alert),
    })),
  ]
  return items
    .map((entry, index) => ({ ...entry, index }))
    .sort(
      (a, b) =>
        (SEVERITY_ORDER[a.alert.severity] ?? 2) -
          (SEVERITY_ORDER[b.alert.severity] ?? 2) || a.index - b.index,
    )
    .map((entry) => entry.item)
}

// ---------- Próximas ações ----------

function actionFromAlert(alert: FleetAlert, source: AlertSummary): NextAction {
  const tone = alert.isCritical ? 'danger' : 'warning'
  if (alert.kind === 'cnh') {
    const license = source.cnh.itens.find((item) => `cnh-${item.id}` === alert.id)
    return {
      id: alert.id,
      text: `Revisar CNH de ${license?.nome ?? 'motorista'} antes da próxima viagem`,
      to: alert.to,
      tone,
    }
  }
  const vehicle = source.manutencao.itens.find(
    (item) => `manutencao-${item.id}` === alert.id,
  )
  return {
    id: alert.id,
    text: `${alert.isCritical ? 'Agendar' : 'Programar'} a revisão do ${vehicle?.placa ?? 'veículo'}`,
    to: alert.to,
    tone,
  }
}

/** Ações sugeridas: alertas críticos, viagens atrasadas e, depois, os demais alertas. */
export function buildNextActions(
  alerts: AlertSummary | null,
  trips: TrackedTrip[],
  limit: number = NEXT_ACTIONS_LIMIT,
): NextAction[] {
  const fleetAlerts = alerts ? buildFleetAlerts(alerts) : []
  const fromAlerts = (isCritical: boolean) =>
    alerts
      ? fleetAlerts
          .filter((alert) => alert.isCritical === isCritical)
          .map((alert) => actionFromAlert(alert, alerts))
      : []
  const fromTrips: NextAction[] = trips
    .filter((trip) => trip.status === 'atrasada')
    .map((trip) => ({
      id: `viagem-${trip.id}`,
      text: `Acompanhar a rota ${trip.routeCode} (${trip.plate}), atrasada${
        trip.delayMinutes > 0 ? ` ${trip.delayMinutes} min` : ''
      }`,
      to: '/viagens',
      tone: 'info',
    }))
  return [...fromAlerts(true), ...fromTrips, ...fromAlerts(false)].slice(0, limit)
}
