import type { DriverHomeData } from '../types'

/*
 * Dados mockados enquanto a API do app do motorista não existe.
 * Para integrar, troque os corpos por chamadas fetch mantendo os tipos.
 */

const MOCK_DELAY_MS = 400

function respondWith<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY_MS))
}

function isoAt(daysFromNow: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export function fetchDriverHome(): Promise<DriverHomeData> {
  return respondWith({
    driverName: 'Carlos Almeida',
    vehicle: {
      plate: 'ABC-1D23',
      model: 'Fiat Ducato Minibus',
      mileageKm: 45320,
      fuelType: 'Diesel S10',
    },
    trips: [
      {
        id: 't1',
        code: 'VG-2041',
        origin: 'Sede FSPH',
        destination: 'Hospital Regional',
        scheduledAt: isoAt(0, 14, 30),
        status: 'agendada',
        distanceKm: 18,
      },
      {
        id: 't2',
        code: 'VG-2038',
        origin: 'Almoxarifado Central',
        destination: 'UPA Norte',
        scheduledAt: isoAt(0, 9, 0),
        status: 'concluida',
        distanceKm: 12,
      },
      {
        id: 't3',
        code: 'VG-2030',
        origin: 'Sede FSPH',
        destination: 'Centro de Especialidades',
        scheduledAt: isoAt(-1, 8, 15),
        status: 'concluida',
        distanceKm: 27,
      },
      {
        id: 't4',
        code: 'VG-2044',
        origin: 'Sede FSPH',
        destination: 'Laboratório Municipal',
        scheduledAt: isoAt(1, 10, 0),
        status: 'agendada',
        distanceKm: 9,
      },
    ],
    checklist: [
      { id: 'c1', label: 'Pneus e calibragem' },
      { id: 'c2', label: 'Nível de óleo e água' },
      { id: 'c3', label: 'Freios' },
      { id: 'c4', label: 'Faróis e setas' },
      { id: 'c5', label: 'Documentos do veículo' },
      { id: 'c6', label: 'Limpeza interna' },
    ],
  })
}
