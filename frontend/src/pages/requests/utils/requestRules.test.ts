import { expect, test } from 'vitest'
import type { RequestFormValues } from '../types'
import { toRequestInput, validateRequestForm } from './requestRules'
import { ROUTE_POINTS, getPointAlongRoute } from './routeGeometry'

// 26/10/2026, 10:00 (horário local)
const NOW = new Date(2026, 9, 26, 10, 0)

const VALID_VALUES: RequestFormValues = {
  origin: 'Central SVO',
  destination: 'Hospital de Urgência',
  sector: 'SVO',
  date: '27/10/2026',
  departureTime: '08:30',
  returnTime: '12:00',
  passengers: '2',
  vehicleId: '',
  reason: 'Transporte de equipe para coleta.',
  isImportant: true,
}

function validate(values: Partial<RequestFormValues>, vehicleCapacity?: number) {
  return validateRequestForm(
    { ...VALID_VALUES, ...values },
    { now: NOW, vehicleCapacity },
  )
}

// ---------- Formulário ----------

test('aceita uma solicitação completa e válida', () => {
  expect(validate({})).toEqual({})
})

test('exige origem, destino, data, horário de saída e motivo', () => {
  const errors = validate({
    origin: ' ',
    destination: '',
    date: '',
    departureTime: '',
    reason: '   ',
  })

  expect(errors.origin).toBe('Informe a origem.')
  expect(errors.destination).toBe('Informe o destino.')
  expect(errors.date).toBe('Data inválida (DD/MM/AAAA).')
  expect(errors.departureTime).toBe('Horário inválido (HH:MM).')
  expect(errors.reason).toBe('Descreva o motivo da solicitação.')
})

test('recusa data e horário no passado', () => {
  expect(validate({ date: '25/10/2026' }).date).toBe('A data não pode estar no passado.')
  expect(validate({ date: '26/10/2026', departureTime: '09:59' }).departureTime).toBe(
    'O horário de saída já passou.',
  )
  expect(validate({ date: '26/10/2026', departureTime: '10:01' })).toEqual({})
})

test('exige retorno depois da saída, mas o retorno é opcional', () => {
  expect(validate({ returnTime: '08:30' }).returnTime).toBe(
    'O retorno deve ser depois do horário de saída.',
  )
  expect(validate({ returnTime: '25:00' }).returnTime).toBe('Horário inválido (HH:MM).')
  expect(validate({ returnTime: '' })).toEqual({})
})

test('passageiros: inteiro a partir de 1 e até a lotação do veículo escolhido', () => {
  const minimum = 'Informe um número inteiro a partir de 1.'
  expect(validate({ passengers: '' }).passengers).toBe(minimum)
  expect(validate({ passengers: '0' }).passengers).toBe(minimum)
  expect(validate({ passengers: '1.5' }).passengers).toBe(minimum)
  expect(validate({ passengers: '3' }, 2).passengers).toBe(
    'O veículo escolhido leva no máximo 2 passageiros.',
  )
  expect(validate({ passengers: '2' }, 2)).toEqual({})
  expect(validate({ passengers: '40' })).toEqual({}) // sem veículo, sem limite
})

test('toRequestInput monta datas ISO locais e normaliza os campos', () => {
  expect(
    toRequestInput({ ...VALID_VALUES, vehicleId: 'v1', reason: ' Motivo ' }),
  ).toEqual({
    origin: 'Central SVO',
    destination: 'Hospital de Urgência',
    sector: 'SVO',
    departureAt: '2026-10-27T08:30:00',
    returnAt: '2026-10-27T12:00:00',
    passengers: 2,
    vehicleId: 'v1',
    reason: 'Motivo',
    isImportant: true,
  })
  expect(toRequestInput({ ...VALID_VALUES, returnTime: '' })?.returnAt).toBeNull()
  expect(toRequestInput({ ...VALID_VALUES, date: '31/02/2026' })).toBeNull()
})

test('posição do carro no trajeto do mapa', () => {
  expect(getPointAlongRoute(ROUTE_POINTS, 0)).toEqual(ROUTE_POINTS[0])
  expect(getPointAlongRoute(ROUTE_POINTS, 1)).toEqual(
    ROUTE_POINTS[ROUTE_POINTS.length - 1],
  )
  expect(getPointAlongRoute(ROUTE_POINTS, 2)).toEqual(
    ROUTE_POINTS[ROUTE_POINTS.length - 1],
  )

  const half = getPointAlongRoute(
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ],
    0.5,
  )
  expect(half).toEqual({ x: 5, y: 0 })
})
