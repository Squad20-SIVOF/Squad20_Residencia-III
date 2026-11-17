import { expect, test } from 'vitest'
import type { Fueling, Vehicle, VehicleStatus } from '../types'
import {
  formatMonthLong,
  fuelCapUsage,
  summarizeFleet,
  summarizeMonthlyFuel,
  toLocalIsoDate,
  vehicleDisplayName,
  vehicleFullModel,
} from './vehicleRules'

function vehicle(status: VehicleStatus, overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: status,
    identification: 'SVO-01',
    plate: 'ABC1D23',
    model: 'Fiorino',
    fuelType: 'Flex',
    maxCapacity: 58,
    status,
    mileageKm: 0,
    fleet: 'SVO',
    nextInspection: '',
    ...overrides,
  }
}

function fueling(date: string, liters: number, total: number): Fueling {
  return {
    id: date,
    date,
    fuel: 'Gasolina',
    liters,
    total,
    station: null,
    mileageKm: 0,
    driverName: null,
  }
}

test('resumo da frota conta veículos em viagem como ativos', () => {
  expect(
    summarizeFleet([
      vehicle('ativo'),
      vehicle('em_viagem'),
      vehicle('manutencao'),
      vehicle('inativo'),
      vehicle('inativo'),
    ]),
  ).toEqual({ total: 5, active: 2, maintenance: 1, inactive: 2 })
})

test('gasto mensal considera só os abastecimentos do mês corrente', () => {
  const now = new Date(2026, 9, 25)
  expect(
    summarizeMonthlyFuel(
      [
        fueling(new Date(2026, 9, 21, 10).toISOString(), 30, 255),
        fueling(new Date(2026, 9, 1, 8).toISOString(), 35, 297.5),
        fueling(new Date(2026, 8, 30, 23).toISOString(), 40, 340),
      ],
      now,
    ),
  ).toEqual({ count: 2, liters: 65, spent: 552.5 })
})

test('teto mensal entra em atenção a partir de 80% e excede acima de 100%', () => {
  expect(fuelCapUsage(500, 1000)).toEqual({ percent: 50, level: 'ok' })
  expect(fuelCapUsage(850, 1000)).toEqual({ percent: 85, level: 'attention' })
  expect(fuelCapUsage(1000, 1000)).toEqual({ percent: 100, level: 'attention' })
  expect(fuelCapUsage(1200, 1000)).toEqual({ percent: 120, level: 'exceeded' })
  expect(fuelCapUsage(10, 0)).toEqual({ percent: 100, level: 'exceeded' })
  expect(fuelCapUsage(0, 0)).toEqual({ percent: 0, level: 'ok' })
})

test('data local preserva o dia do calendário de quem está na tela', () => {
  expect(toLocalIsoDate(new Date(2026, 9, 21, 23, 30).toISOString())).toBe('2026-10-21')
})

test('mês por extenso começa com maiúscula', () => {
  expect(formatMonthLong(new Date(2026, 9, 1))).toBe('Outubro de 2026')
})

test('nome do veículo usa a placa quando falta a identificação', () => {
  expect(vehicleDisplayName(vehicle('ativo'))).toBe('SVO-01')
  expect(vehicleDisplayName(vehicle('ativo', { identification: '—' }))).toBe('ABC1D23')
  expect(vehicleDisplayName(vehicle('ativo', { identification: '' }))).toBe('ABC1D23')
})

test('modelo completo não repete a marca', () => {
  expect(vehicleFullModel({ brand: 'Fiat', model: 'Fiorino 1.4' })).toBe(
    'Fiat Fiorino 1.4',
  )
  expect(vehicleFullModel({ brand: 'Fiat', model: 'Fiat Fiorino' })).toBe('Fiat Fiorino')
  expect(vehicleFullModel({ model: 'Fiorino' })).toBe('Fiorino')
})
