import { useMemo, useState } from 'react'
import { normalizeText } from '@/utils/format'
import type { FleetFilter, Vehicle, VehicleStatusFilter } from '../types'

export const VEHICLES_PAGE_SIZE = 6

export function useVehicleFilters(vehicles: Vehicle[]) {
  const [search, setSearchState] = useState('')
  const [status, setStatusState] = useState<VehicleStatusFilter>('todos')
  const [fleet, setFleetState] = useState<FleetFilter>('todas')
  const [page, setPage] = useState(1)

  const filteredVehicles = useMemo(() => {
    const term = normalizeText(search)

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        term === '' ||
        [vehicle.identification, vehicle.model, vehicle.plate].some((value) =>
          normalizeText(value).includes(term),
        )
      const matchesStatus = status === 'todos' || vehicle.status === status
      const matchesFleet = fleet === 'todas' || vehicle.fleet === fleet
      return matchesSearch && matchesStatus && matchesFleet
    })
  }, [vehicles, search, status, fleet])

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / VEHICLES_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageVehicles = filteredVehicles.slice(
    (currentPage - 1) * VEHICLES_PAGE_SIZE,
    currentPage * VEHICLES_PAGE_SIZE,
  )

  // Aplicar filtros sempre volta para a primeira página.
  function applyFilters(values: {
    search: string
    status: VehicleStatusFilter
    fleet: FleetFilter
  }) {
    setSearchState(values.search)
    setStatusState(values.status)
    setFleetState(values.fleet)
    setPage(1)
  }

  return {
    search,
    status,
    fleet,
    applyFilters,
    filteredVehicles,
    pageVehicles,
    currentPage,
    totalPages,
    goToPreviousPage: () => setPage(Math.max(1, currentPage - 1)),
    goToNextPage: () => setPage(Math.min(totalPages, currentPage + 1)),
  }
}
