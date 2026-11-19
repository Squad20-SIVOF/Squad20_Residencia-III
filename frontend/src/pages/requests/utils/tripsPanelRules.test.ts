import { expect, test } from 'vitest'
import type { RequestRecord } from '../services/requestApi'
import type { TrackedTrip } from '../types'
import {
  filterPendingRequests,
  formatImportantCount,
  formatPendingCount,
  formatShowingCount,
  formatTripCount,
  getRequestCode,
  getTrackedTripStatusLabel,
  getTrackedTripStatusVariant,
  sortPendingRequests,
} from './tripsPanelRules'

function record(id: string, overrides: Partial<RequestRecord> = {}): RequestRecord {
  return {
    id,
    solicitante_id: null,
    solicitante_nome: null,
    setor_nome: 'Administrativo',
    categoria: 'Documentos',
    flag_urgencia: false,
    data_necessidade: '2026-12-01T10:00:00Z',
    criado_em: '2026-11-01T10:00:00Z',
    status: 'Pendente',
    ...overrides,
  }
}

const early = record('aaaa', { data_necessidade: '2026-12-01T08:00:00Z' })
const late = record('bbbb', {
  data_necessidade: '2026-12-03T08:00:00Z',
  criado_em: '2026-11-05T10:00:00Z',
})
const urgent = record('cccc', {
  flag_urgencia: true,
  setor_nome: 'Logística',
  data_necessidade: '2026-12-05T08:00:00Z',
})

test('getRequestCode usa os 8 primeiros caracteres do ID', () => {
  expect(getRequestCode('11111111-1111-4111-8111-111111111111')).toBe('#11111111')
})

test('filterPendingRequests busca por ID (com ou sem #) e setor, sem acento', () => {
  const rows = [early, late, urgent]
  expect(filterPendingRequests(rows, '')).toEqual(rows)
  expect(filterPendingRequests(rows, 'LOGISTICA')).toEqual([urgent])
  expect(filterPendingRequests(rows, '#bbb')).toEqual([late])
  expect(filterPendingRequests(rows, 'nada')).toEqual([])
})

test('sortPendingRequests ordena sem alterar a lista original', () => {
  const rows = [late, early, urgent]
  expect(sortPendingRequests(rows, 'importantes')).toEqual([urgent, early, late])
  expect(sortPendingRequests(rows, 'data')).toEqual([early, late, urgent])
  expect(sortPendingRequests(rows, 'recentes')[0]).toBe(late)
  expect(rows).toEqual([late, early, urgent])
})

test('contagens no singular e no plural', () => {
  expect(formatPendingCount(1)).toBe('1 pendente')
  expect(formatPendingCount(2)).toBe('2 pendentes')
  expect(formatImportantCount(1)).toBe('1 solicitação importante')
  expect(formatImportantCount(3)).toBe('3 solicitações importantes')
  expect(formatShowingCount(2, 2)).toBe('Exibindo 2 de 2 solicitações pendentes')
  expect(formatShowingCount(1, 1)).toBe('Exibindo 1 de 1 solicitação pendente')
  expect(formatTripCount(1)).toBe('1 viagem')
  expect(formatTripCount(4)).toBe('4 viagens')
})

test('selo de status das viagens em acompanhamento', () => {
  const trip: TrackedTrip = {
    id: 'x',
    routeCode: '103',
    plate: 'IJK-7L89',
    driverName: 'Carlos Souza',
    origin: 'Almoxarifado',
    destination: 'Hospital',
    status: 'atrasada',
    delayMinutes: 12,
  }
  expect(getTrackedTripStatusLabel(trip)).toBe('Atraso 12 min')
  expect(getTrackedTripStatusLabel({ ...trip, delayMinutes: 0 })).toBe('Atrasada')
  expect(getTrackedTripStatusLabel({ ...trip, status: 'em_viagem' })).toBe('Em viagem')
  expect(getTrackedTripStatusLabel({ ...trip, status: 'a_caminho' })).toBe('A caminho')
  expect(getTrackedTripStatusLabel({ ...trip, status: 'programada' })).toBe('Programada')
  expect(getTrackedTripStatusVariant('atrasada')).toBe('danger')
  expect(getTrackedTripStatusVariant('programada')).toBe('warning')
})
