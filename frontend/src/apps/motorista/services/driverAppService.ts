import { api } from '@/service/api'
import type { CaptureType, DriverHomeData, DriverTrip, DriverTripPage } from '../types'
export async function fetchDriverHome(): Promise<DriverHomeData> {
  return (await api<{ message: DriverHomeData }>('/motorista/resumo')).message
}
export async function fetchDriverTrips(page: number): Promise<DriverTripPage> {
  return (
    await api<{ message: DriverTripPage }>(`/motorista/viagens?pagina=${page}&limite=20`)
  ).message
}
export async function fetchDriverTrip(id: string): Promise<DriverTrip> {
  return (
    await api<{ message: DriverTrip }>(`/motorista/viagens/${encodeURIComponent(id)}`)
  ).message
}
export async function recordTripCapture(
  id: string,
  type: CaptureType,
  km: number,
  foto: string,
  simulada = false,
): Promise<DriverTrip> {
  return (
    await api<{ message: DriverTrip }>(
      `/motorista/viagens/${encodeURIComponent(id)}/${type === 'inicio' ? 'iniciar' : 'finalizar'}`,
      {
        method: 'POST',
        body: JSON.stringify(simulada ? { km, simulada: true } : { km, foto }),
      },
    )
  ).message
}
export async function confirmArrival(id: string): Promise<void> {
  await api(`/viagens/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Em andamento' }),
  })
}
