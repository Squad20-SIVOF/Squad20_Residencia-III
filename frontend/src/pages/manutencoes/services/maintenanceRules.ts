import type { Maintenance, MaintenanceFiltersValue } from '../types/maintenance'
import type { Vehicle } from '../types/vehicle'

/** Pure business rules — no storage, no UI. */

export function computeStats(list: Maintenance[]) {
  return {
    total: list.length,
    emAndamento: list.filter((m) => m.status === 'Em andamento').length,
    agendadas: list.filter((m) => m.status === 'Agendada').length,
    custoTotal: list
      .filter((m) => m.status !== 'Cancelada')
      .reduce((s, m) => s + m.valorEstimado, 0),
  }
}

export function filterMaintenances(
  list: Maintenance[],
  vehicles: Vehicle[],
  f: MaintenanceFiltersValue,
): Maintenance[] {
  const q = f.search.trim().toLowerCase()
  return list.filter((m) => {
    if (f.vehicleId !== 'all' && m.vehicleId !== f.vehicleId) return false
    if (f.status !== 'all' && m.status !== f.status) return false
    if (f.from && m.dataServico < f.from) return false
    if (f.to && m.dataServico > f.to) return false
    if (q) {
      const v = vehicles.find((x) => x.id === m.vehicleId)
      const hay = [v?.placa, v?.modelo, v?.codigo, m.descricao, m.tipo, m.oficina]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function sortByDateDesc(list: Maintenance[]) {
  return [...list].sort((a, b) =>
    b.dataServico === a.dataServico
      ? (b.horaServico ?? '').localeCompare(a.horaServico ?? '')
      : b.dataServico.localeCompare(a.dataServico),
  )
}

/** Most recent maintenance of a vehicle, optionally excluding one record (when editing). */
export function lastMaintenanceOf(
  list: Maintenance[],
  vehicleId: string,
  excludeId?: string,
) {
  return sortByDateDesc(
    list.filter(
      (m) => m.vehicleId === vehicleId && m.id !== excludeId && m.status !== 'Cancelada',
    ),
  )[0]
}

/** Highest odometer reading known for the vehicle. */
export function lastKnownKm(
  list: Maintenance[],
  vehicle: Vehicle | undefined,
  excludeId?: string,
) {
  if (!vehicle) return 0
  const kms = list
    .filter((m) => m.vehicleId === vehicle.id && m.id !== excludeId)
    .map((m) => m.quilometragem)
  return Math.max(vehicle.quilometragem, ...kms, 0)
}
