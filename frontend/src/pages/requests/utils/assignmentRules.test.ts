import { describe, expect, test } from 'vitest'
import {
  formatPlate,
  getRequiredCnh,
  getVehicleKind,
  isDriverAvailable,
  isVehicleAvailable,
  maskCpfPartially,
  matchesDriverSearch,
  matchesVehicleSearch,
} from './assignmentRules'

const today = new Date(2026, 10, 17)

describe('disponibilidade', () => {
  test('só veículos com status ativo estão disponíveis', () => {
    expect(isVehicleAvailable({ status: 'ativo' })).toBe(true)
    expect(isVehicleAvailable({ status: 'manutencao' })).toBe(false)
    expect(isVehicleAvailable({ status: 'em_viagem' })).toBe(false)
    expect(isVehicleAvailable({ status: 'inativo' })).toBe(false)
  })

  test('motorista precisa estar ativo e com a CNH válida', () => {
    expect(isDriverAvailable({ status: 'ativo', cnhExpiry: '2027-01-01' }, today)).toBe(
      true,
    )
    expect(isDriverAvailable({ status: 'ativo', cnhExpiry: '2026-11-16' }, today)).toBe(
      false,
    )
    expect(isDriverAvailable({ status: 'ferias', cnhExpiry: '2027-01-01' }, today)).toBe(
      false,
    )
  })
})

test('categoria de CNH e tipo do veículo seguem a lotação', () => {
  expect(getRequiredCnh(5)).toBe('B')
  expect(getRequiredCnh(8)).toBe('B')
  expect(getRequiredCnh(16)).toBe('D')
  expect(getVehicleKind(5)).toBe('Carro')
  expect(getVehicleKind(15)).toBe('Van')
  expect(getVehicleKind(30)).toBe('Micro-ônibus')
})

test('formata a placa e mascara o CPF', () => {
  expect(formatPlate('abc-1d23')).toBe('ABC1D23')
  expect(maskCpfPartially('529.982.247-25')).toBe('***.982.247-**')
  expect(maskCpfPartially('')).toBe('—')
})

test('busca de veículo por modelo ou placa', () => {
  const vehicle = { brand: 'Fiat', model: 'Ducato', plate: 'QRS-3T45' }
  expect(matchesVehicleSearch(vehicle, '')).toBe(true)
  expect(matchesVehicleSearch(vehicle, 'duca')).toBe(true)
  expect(matchesVehicleSearch(vehicle, 'qrs3t')).toBe(true)
  expect(matchesVehicleSearch(vehicle, 'QRS-3T45')).toBe(true)
  expect(matchesVehicleSearch(vehicle, 'sprinter')).toBe(false)
})

test('busca de motorista por nome ou CNH', () => {
  const driver = { name: 'João da Silva', cnh: '01234567890' }
  expect(matchesDriverSearch(driver, 'joao')).toBe(true)
  expect(matchesDriverSearch(driver, '4567')).toBe(true)
  expect(matchesDriverSearch(driver, 'maria')).toBe(false)
})
