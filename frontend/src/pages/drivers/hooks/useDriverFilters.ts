import { useMemo, useState } from 'react'
import { TABLE_PAGE_SIZE } from '@/components/Pagination'
import { normalizeText } from '@/utils/format'
import { onlyDigits } from '@/utils/masks'
import type { Driver, DriverFleetFilter, DriverStatusFilter } from '../types'
import { getCnhSituation, getEffectiveStatus } from '../utils/driverRules'

export function useDriverFilters(drivers: Driver[]) {
  const [search, setSearchState] = useState('')
  const [status, setStatusState] = useState<DriverStatusFilter>('todos')
  const [fleet, setFleetState] = useState<DriverFleetFilter>('todas')
  const [onlyAlerts, setOnlyAlertsState] = useState(false)
  const [page, setPage] = useState(1)

  const filteredDrivers = useMemo(() => {
    const term = normalizeText(search)
    const digits = onlyDigits(search)

    return drivers.filter((driver) => {
      const matchesSearch =
        term === '' ||
        normalizeText(driver.name).includes(term) ||
        (digits !== '' && driver.cnh.includes(digits))
      const matchesStatus = status === 'todos' || getEffectiveStatus(driver) === status
      // Motorista coringa atua em qualquer frota.
      const matchesFleet =
        fleet === 'todas' || driver.isWildcard || driver.fleet === fleet
      const matchesAlerts = !onlyAlerts || getCnhSituation(driver.cnhExpiry) !== 'valid'
      return matchesSearch && matchesStatus && matchesFleet && matchesAlerts
    })
  }, [drivers, search, status, fleet, onlyAlerts])

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / TABLE_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageDrivers = filteredDrivers.slice(
    (currentPage - 1) * TABLE_PAGE_SIZE,
    currentPage * TABLE_PAGE_SIZE,
  )

  // Qualquer mudança de filtro volta para a primeira página.
  function setSearch(value: string) {
    setSearchState(value)
    setPage(1)
  }

  function setStatus(value: DriverStatusFilter) {
    setStatusState(value)
    setPage(1)
  }

  function setFleet(value: DriverFleetFilter) {
    setFleetState(value)
    setPage(1)
  }

  function toggleOnlyAlerts() {
    setOnlyAlertsState((current) => !current)
    setPage(1)
  }

  return {
    search,
    status,
    fleet,
    onlyAlerts,
    setSearch,
    setStatus,
    setFleet,
    toggleOnlyAlerts,
    filteredDrivers,
    pageDrivers,
    currentPage,
    totalPages,
    goToPreviousPage: () => setPage(Math.max(1, currentPage - 1)),
    goToNextPage: () => setPage(Math.min(totalPages, currentPage + 1)),
  }
}
