import { currentUser } from '@/service/authService'
import { deleteVehicle } from './services/vehicleService'
import { Alert } from '@/components/Alert'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { VehicleForm } from './VehicleForm'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { StateMessage } from '@/components/StateMessage'
import { VehiclePagination } from './components/VehiclePagination'
import { VehicleTable } from './components/VehicleTable'
import { VehicleToolbar } from './components/VehicleToolbar'
import { useVehicleFilters } from './hooks/useVehicleFilters'
import { useVehicles } from './hooks/useVehicles'
import type { Vehicle } from './types'
import styles from './VehiclesPage.module.scss'

// Divisão de código: a tela de detalhes só é baixada quando o usuário abre um veículo.
const VehicleDetailsPage = lazy(() =>
  import('./VehicleDetailsPage').then((module) => ({
    default: module.VehicleDetailsPage,
  })),
)

const NO_VEHICLES: Vehicle[] = []

export function VehiclesPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null | undefined>(
    undefined,
  )
  const [canManage, setCanManage] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  useEffect(() => {
    let active = true
    currentUser()
      .then((user) => {
        if (active) setCanManage(user.permissoes.includes('veiculos:gerenciar'))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const vehiclesRequest = useVehicles()
  async function confirmDelete() {
    if (!vehicleToDelete || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteVehicle(vehicleToDelete.id)
      setVehicleToDelete(null)
      vehiclesRequest.reload()
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : 'Não foi possível excluir o veículo.',
      )
      setVehicleToDelete(null)
    } finally {
      setDeleting(false)
    }
  }
  const vehicles =
    vehiclesRequest.status === 'success' ? vehiclesRequest.data : NO_VEHICLES
  const filters = useVehicleFilters(vehicles)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasOpenedDetailsRef = useRef(false)

  // Ao voltar dos detalhes, leva o foco e a rolagem para o topo da lista.
  useEffect(() => {
    if (selectedVehicleId !== null) {
      hasOpenedDetailsRef.current = true
      return
    }
    if (hasOpenedDetailsRef.current) {
      window.scrollTo({ top: 0 })
      headingRef.current?.focus()
    }
  }, [selectedVehicleId])

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
  }

  function handleCreate() {
    setEditingVehicle(null)
  }

  if (editingVehicle !== undefined)
    return (
      <VehicleForm
        vehicle={editingVehicle}
        onBackToList={() => {
          setEditingVehicle(undefined)
          setSelectedVehicleId(null)
        }}
        onCancel={() => setEditingVehicle(undefined)}
        onSave={() => {
          setEditingVehicle(undefined)
          setSelectedVehicleId(null)
          vehiclesRequest.reload()
        }}
      />
    )

  if (selectedVehicleId !== null) {
    return (
      <Suspense
        fallback={<StateMessage variant="loading" title="Carregando detalhes..." />}
      >
        <VehicleDetailsPage
          vehicleId={selectedVehicleId}
          onEdit={handleEdit}
          onBack={() => setSelectedVehicleId(null)}
        />
      </Suspense>
    )
  }

  function renderList() {
    if (vehiclesRequest.status === 'loading') {
      return <StateMessage variant="loading" title="Carregando veículos..." />
    }

    if (vehiclesRequest.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os veículos."
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="secondary" onClick={vehiclesRequest.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }

    if (filters.filteredVehicles.length === 0) {
      const hasVehicles = vehicles.length > 0
      return (
        <StateMessage
          title={
            hasVehicles ? 'Nenhum veículo encontrado.' : 'Nenhum veículo cadastrado.'
          }
          description={
            hasVehicles
              ? 'Ajuste a busca ou os filtros para ver outros resultados.'
              : 'Cadastre o primeiro veículo da frota para começar.'
          }
        />
      )
    }

    return (
      <>
        <VehicleTable
          vehicles={filters.pageVehicles}
          onView={(vehicle) => setSelectedVehicleId(vehicle.id)}
          onEdit={handleEdit}
          onDelete={setVehicleToDelete}
          canManage={canManage}
        />
        <VehiclePagination
          shownCount={filters.pageVehicles.length}
          totalCount={filters.filteredVehicles.length}
          hasPrevious={filters.currentPage > 1}
          hasNext={filters.currentPage < filters.totalPages}
          onPrevious={filters.goToPreviousPage}
          onNext={filters.goToNextPage}
        />
      </>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Controle de Veículos
        </h1>
        <p className={styles.subtitle}>
          Cadastro, disponibilidade e situação operacional da frota
        </p>
      </header>

      <VehicleToolbar
        search={filters.search}
        status={filters.status}
        fleet={filters.fleet}
        onSearchChange={filters.setSearch}
        onStatusChange={filters.setStatus}
        onFleetChange={filters.setFleet}
        onCreate={handleCreate}
        canManage={canManage}
      />

      {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      <section className={styles.list} aria-label="Veículos">
        {renderList()}
      </section>
      <ConfirmDialog
        isOpen={vehicleToDelete !== null}
        title="Excluir veículo?"
        description={`Confirma a exclusão do veículo ${vehicleToDelete?.plate ?? ''}? O cadastro será removido da frota.`}
        confirmLabel={deleting ? 'Excluindo…' : 'Excluir'}
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setVehicleToDelete(null)
        }}
      />
    </div>
  )
}
