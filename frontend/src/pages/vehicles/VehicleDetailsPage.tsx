import { Breadcrumb } from '@/components/Breadcrumb'
import type { Vehicle } from './types'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/Button'
import { StateMessage } from '@/components/StateMessage'
import { InspectionChecklistCard } from './components/InspectionChecklistCard'
import { MaintenanceCard } from './components/MaintenanceCard'
import { TripHistoryCard } from './components/TripHistoryCard'
import { VehicleHeroCard } from './components/VehicleHeroCard'
import { VehicleSummaryCard } from './components/VehicleSummaryCard'
import { useVehicleDetails } from './hooks/useVehicleDetails'
import styles from './VehicleDetailsPage.module.scss'

export interface VehicleDetailsPageProps {
  vehicleId: string
  onEdit?: (vehicle: Vehicle) => void
  onBack: () => void
}

export function VehicleDetailsPage({
  vehicleId,
  onBack,
  onEdit,
}: VehicleDetailsPageProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const detailsRequest = useVehicleDetails(vehicleId)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const details = detailsRequest.status === 'success' ? detailsRequest.data : null

  // Ao abrir a tela, o foco vai para o título (navegação sem rotas).
  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [])

  function handleEdit() {
    if (details) onEdit?.(details.vehicle)
  }

  return (
    <div className={styles.page}>
      <div>
        <Button
          variant="secondary"
          onClick={onBack}
          iconStart={
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path
                d="M10 3L5 8l5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          Voltar
        </Button>
      </div>

      <header className={styles.header}>
        <Breadcrumb
          items={[
            { label: 'Veículos', to: '/veiculos', onClick: onBack },
            { label: 'Detalhes' },
          ]}
        />
        <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
          Detalhes do Veículo{details && ` — ${details.vehicle.plate}`}
        </h1>
        {details && (
          <p className={styles.subtitle}>
            {details.vehicle.model} · {details.vehicle.plate}
          </p>
        )}
      </header>

      {detailsRequest.status === 'loading' && (
        <StateMessage variant="loading" title="Carregando detalhes do veículo..." />
      )}

      {detailsRequest.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar os detalhes do veículo."
          description="Tente novamente ou volte para a lista."
          action={
            <Button variant="secondary" onClick={detailsRequest.reload}>
              Tentar novamente
            </Button>
          }
        />
      )}

      {details && (
        <div className={styles.grid}>
          <div className={styles.hero}>
            <VehicleHeroCard vehicle={details.vehicle} />
          </div>
          <VehicleSummaryCard vehicle={details.vehicle} onEdit={handleEdit} />
          <TripHistoryCard
            trips={details.trips}
            error={
              details.tripsError ??
              (details.availability?.trips === false
                ? 'Histórico de viagens indisponível.'
                : undefined)
            }
            onRetry={detailsRequest.reload}
            onViewAll={() => setHistoryOpen(true)}
          />
          {details.availability?.maintenance !== false && (
            <MaintenanceCard maintenances={details.maintenances} />
          )}
          <InspectionChecklistCard
            items={details.checklist}
            unavailable={details.availability?.checklist === false}
          />
        </div>
      )}
      {details && (
        <ConfirmDialog
          isOpen={historyOpen}
          title="Histórico de viagens"
          description={`Veículo ${details.vehicle.plate}`}
          confirmLabel="Fechar"
          cancelLabel={null}
          onConfirm={() => setHistoryOpen(false)}
          onCancel={() => setHistoryOpen(false)}
        >
          <TripHistoryCard trips={details.trips} />
        </ConfirmDialog>
      )}
    </div>
  )
}
