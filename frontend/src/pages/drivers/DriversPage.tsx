import { useState } from 'react'
import { Alert } from '@/components/Alert'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useFlashMessage } from '@/hooks/useFlashMessage'
import { DriverStats } from './components/DriverStats'
import { DriverTable } from './components/DriverTable'
import { DriverToolbar } from './components/DriverToolbar'
import { useDriverFilters } from './hooks/useDriverFilters'
import { useDrivers } from './hooks/useDrivers'
import { deleteDriver } from './services/driverService'
import type { Driver } from './types'
import { summarizeDrivers } from './utils/driverRules'
import styles from './DriversPage.module.scss'

const NO_DRIVERS: Driver[] = []

export function DriversPage() {
  useDocumentTitle('Motoristas')
  const driversRequest = useDrivers()
  const drivers = driversRequest.status === 'success' ? driversRequest.data : NO_DRIVERS
  const filters = useDriverFilters(drivers)
  const flash = useFlashMessage()
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const summary = summarizeDrivers(drivers)
  const alertCount = summary.expiring + summary.expired

  async function handleConfirmDelete() {
    if (!driverToDelete) return
    try {
      await deleteDriver(driverToDelete.id)
      setDeleteError(null)
      flash.show(`${driverToDelete.name} foi excluído.`)
      driversRequest.reload()
    } catch {
      setDeleteError('Não foi possível excluir o motorista. Tente novamente.')
    }
    setDriverToDelete(null)
  }

  function renderList() {
    if (driversRequest.status === 'loading') {
      return <StateMessage variant="loading" title="Carregando motoristas..." />
    }

    if (driversRequest.status === 'error') {
      return (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os motoristas."
          description="Tente novamente em instantes."
          action={
            <Button variant="secondary" onClick={driversRequest.reload}>
              Tentar novamente
            </Button>
          }
        />
      )
    }

    if (filters.filteredDrivers.length === 0) {
      return (
        <StateMessage
          title={
            drivers.length > 0
              ? 'Nenhum motorista encontrado.'
              : 'Nenhum motorista cadastrado.'
          }
          description={
            drivers.length > 0
              ? 'Ajuste a busca ou os filtros para ver outros resultados.'
              : 'Cadastre o primeiro motorista da frota para começar.'
          }
        />
      )
    }

    return (
      <>
        <DriverTable drivers={filters.pageDrivers} onDelete={setDriverToDelete} />
        <Pagination
          itemLabel="motoristas"
          shownCount={filters.pageDrivers.length}
          totalCount={filters.filteredDrivers.length}
          currentPage={filters.currentPage}
          totalPages={filters.totalPages}
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
      <div className={styles.headerContainer}>
        <PageHeader
          title="Gerenciamento de Motoristas"
          subtitle="Motoristas cadastrados, vínculos com veículos e situação da CNH"
        />
        <ButtonLink to="/motoristas/novo" className={styles.btnPrimary}>
          + Novo Motorista
        </ButtonLink>
      </div>

      {flash.message && (
        <Alert variant="success" onDismiss={flash.dismiss}>
          {flash.message}
        </Alert>
      )}
      {deleteError && (
        <Alert variant="danger" onDismiss={() => setDeleteError(null)}>
          {deleteError}
        </Alert>
      )}

      {driversRequest.status === 'success' && (
        <>
          <DriverStats summary={summary} />

          {alertCount > 0 && (
            <Alert
              variant="danger"
              action={
                <Button variant="secondary" onClick={filters.toggleOnlyAlerts}>
                  {filters.onlyAlerts ? 'Mostrar todos' : 'Revisar alertas'}
                </Button>
              }
            >
              <span className={styles.alertText}>
                ⚠️ {alertCount} motorista{alertCount > 1 ? 's' : ''} com CNH vencida ou a
                vencer em 30 dias — ficam bloqueados para novas viagens.
              </span>
            </Alert>
          )}

          <DriverToolbar
            search={filters.search}
            status={filters.status}
            fleet={filters.fleet}
            onSearchChange={filters.setSearch}
            onStatusChange={filters.setStatus}
            onFleetChange={filters.setFleet}
          />
        </>
      )}

      <section className={styles.list} aria-label="Motoristas">
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Motoristas cadastrados</h2>
          <span className={styles.tableCount}>
            {filters.filteredDrivers.length} registros
          </span>
        </div>
        {renderList()}
      </section>

      <ConfirmDialog
        isOpen={driverToDelete !== null}
        title="Excluir motorista?"
        description={`${driverToDelete?.name ?? 'O motorista'} será removido permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        isDestructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDriverToDelete(null)}
      />
    </div>
  )
}
