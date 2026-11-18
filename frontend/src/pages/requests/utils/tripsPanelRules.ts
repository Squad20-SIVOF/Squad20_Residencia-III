import { normalizeText } from '@/utils/format'
import type { RequestRecord } from '../services/requestApi'
import type { BadgeVariant } from '@/components/Badge'
import type { TrackedTrip, TrackedTripStatus } from '../types'

/** Quantas solicitações pendentes o Painel mostra; a lista completa fica em "Ver todas". */
export const PANEL_REQUEST_LIMIT = 5

export const PENDING_SORTS = ['importantes', 'data', 'recentes'] as const
export type PendingSort = (typeof PENDING_SORTS)[number]

export const PENDING_SORT_LABELS: Record<PendingSort, string> = {
  importantes: 'Importantes primeiro',
  data: 'Data mais próxima',
  recentes: 'Mais recentes',
}

/** UUID → "#11111111", o mesmo código curto da lista de solicitações pendentes. */
export function getRequestCode(id: string): string {
  return `#${id.slice(0, 8)}`
}

/** Busca por ID, setor ou categoria, sem diferenciar acento e caixa. */
export function filterPendingRequests(
  rows: RequestRecord[],
  search: string,
): RequestRecord[] {
  const term = normalizeText(search.replace(/^#/, ''))
  if (!term) return rows
  return rows.filter((row) =>
    normalizeText([row.id, row.setor_nome ?? '', row.categoria].join(' ')).includes(term),
  )
}

function byNeededDate(a: RequestRecord, b: RequestRecord): number {
  return Date.parse(a.data_necessidade) - Date.parse(b.data_necessidade)
}

/** Devolve uma cópia ordenada; não altera a lista recebida. */
export function sortPendingRequests(
  rows: RequestRecord[],
  sort: PendingSort,
): RequestRecord[] {
  const sorted = [...rows]
  if (sort === 'recentes') {
    return sorted.sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em))
  }
  if (sort === 'data') return sorted.sort(byNeededDate)
  return sorted.sort(
    (a, b) => Number(b.flag_urgencia) - Number(a.flag_urgencia) || byNeededDate(a, b),
  )
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/** 1 → "1 pendente"; 2 → "2 pendentes" */
export function formatPendingCount(count: number): string {
  return plural(count, 'pendente', 'pendentes')
}

/** 1 → "1 solicitação importante"; 2 → "2 solicitações importantes" */
export function formatImportantCount(count: number): string {
  return plural(count, 'solicitação importante', 'solicitações importantes')
}

/** "Exibindo 2 de 2 solicitações pendentes" */
export function formatShowingCount(shown: number, total: number): string {
  return `Exibindo ${shown} de ${total} ${total === 1 ? 'solicitação pendente' : 'solicitações pendentes'}`
}

/** 1 → "1 viagem"; 4 → "4 viagens" */
export function formatTripCount(count: number): string {
  return plural(count, 'viagem', 'viagens')
}

const TRIP_STATUS_VARIANTS: Record<TrackedTripStatus, BadgeVariant> = {
  em_viagem: 'info',
  a_caminho: 'success',
  atrasada: 'danger',
  programada: 'warning',
}

/** Texto do selo de status: "Em viagem", "A caminho", "Atraso 12 min" ou "Programada". */
export function getTrackedTripStatusLabel(trip: TrackedTrip): string {
  switch (trip.status) {
    case 'em_viagem':
      return 'Em viagem'
    case 'a_caminho':
      return 'A caminho'
    case 'atrasada':
      return trip.delayMinutes > 0 ? `Atraso ${trip.delayMinutes} min` : 'Atrasada'
    case 'programada':
      return 'Programada'
  }
}

export function getTrackedTripStatusVariant(status: TrackedTripStatus): BadgeVariant {
  return TRIP_STATUS_VARIANTS[status]
}
