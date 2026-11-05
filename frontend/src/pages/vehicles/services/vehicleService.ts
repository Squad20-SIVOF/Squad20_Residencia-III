import { currentUser } from '@/service/authService'
import { api } from '@/service/api'
import type { Vehicle, VehicleDetails, VehicleResponse, VehicleStatus } from '../types'

const toVehicle = (row: VehicleResponse): Vehicle => ({
  id: row.id,
  identification: row.identificacao || '—',
  brand: row.marca ?? '',
  inspectionChecklist: row.checklist_vistoria ?? [],
  plate: row.placa,
  model: row.modelo,
  fuelType: row.tipo_combustivel,
  maxCapacity: row.capacidade_maxima,
  status: !row.ativo
    ? 'inativo'
    : (({ Disponível: 'ativo', 'Em manutenção': 'manutencao', 'Em viagem': 'em_viagem' }[
        row.status
      ] ??
        (['ativo', 'manutencao', 'em_viagem', 'inativo'].includes(row.status)
          ? row.status
          : 'inativo')) as VehicleStatus),
  mileageKm: Number(row.quilometragem ?? 0),
  lastAlertedKm: row.ultimo_km_alertado ?? 0,
  monthlyCap: row.teto_gasto_mensal == null ? null : Number(row.teto_gasto_mensal),
  fleet: row.frota ?? 'Não informada',
  exclusiveSvo: row.exclusivo_svo ?? false,
  nextInspection: row.proxima_vistoria ?? '',
})
export async function getVehicles(): Promise<Vehicle[]> {
  return (await api<{ message: VehicleResponse[] }>('/vehicles')).message.map(toVehicle)
}
export async function getVehicleDetails(id: string): Promise<VehicleDetails> {
  const row = (
    await api<{ message: VehicleResponse }>(`/vehicles/${encodeURIComponent(id)}`)
  ).message
  interface TripRow {
    id: string
    status: string
    data_inicio: string | null
    km_inicial: number | null
    km_final: number | null
  }
  let tripsError: string | undefined
  const tripRows = await api<{ message: TripRow[] }>(
    `/vehicles/${encodeURIComponent(id)}/trips`,
  )
    .then((response) => response.message)
    .catch(() => {
      tripsError = 'Não foi possível carregar o histórico de viagens.'
      return [] as TripRow[]
    })
  const user = await currentUser()
  const canReadMaintenance = user.permissoes.includes('manutencoes:ler')
  interface MaintenanceRow {
    id: string
    veiculo_id: string
    tipo_manutencao: 'preventiva' | 'impeditiva' | 'corretiva' | 'preditiva'
    descricao: string | null
    data_inicio: string
    km_realizado: number | null
    custo: string | number
  }
  const history = canReadMaintenance
    ? (await api<{ message: MaintenanceRow[] }>('/maintance')).message
    : []
  return {
    vehicle: toVehicle(row),
    trips: tripRows.map((trip) => ({
      id: trip.id,
      code: trip.id.slice(0, 8),
      startedAt: trip.data_inicio,
      status: trip.status,
      mileageStart: trip.km_inicial,
      mileageEnd: trip.km_final,
    })),
    ...(tripsError ? { tripsError } : {}),
    checklist: row.checklist_vistoria ?? [],
    availability: {
      trips: !tripsError,
      checklist: true,
      maintenance: canReadMaintenance,
    },
    maintenances: history
      .filter((m) => m.veiculo_id === id)
      .map((m) => ({
        id: m.id,
        type: m.tipo_manutencao,
        description: m.descricao ?? '',
        date: m.data_inicio.slice(0, 10),
        mileageKm: m.km_realizado,
        cost: Number(m.custo),
      })),
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await api(`/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
