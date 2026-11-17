import { VehicleQrPrintButton } from './components/VehicleQrPrintButton'
import { Breadcrumb } from '@/components/Breadcrumb'
import type { Vehicle } from './types'
import { useEffect, useRef, useState } from 'react'
import { ButtonLink } from '@/components/ButtonLink'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/Button'
import { StateMessage } from '@/components/StateMessage'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { currentUser } from '@/service/authService'
import { FuelCapCard } from './components/FuelCapCard'
import { FuelHistoryCard } from './components/FuelHistoryCard'
import { InspectionChecklistCard } from './components/InspectionChecklistCard'
import { MaintenanceCard } from './components/MaintenanceCard'
import { TripHistoryCard } from './components/TripHistoryCard'
import { VehicleHeroCard } from './components/VehicleHeroCard'
import { VehicleSummaryCard } from './components/VehicleSummaryCard'
import { useVehicleDetails } from './hooks/useVehicleDetails'
import {
  formatMonthLong,
  summarizeMonthlyFuel,
  vehicleDisplayName,
  vehicleFullModel,
} from './utils/vehicleRules'
import styles from './VehicleDetailsPage.module.scss'

export interface VehicleDetailsPageProps {
  vehicleId: string
  /** Exibe "Editar veículo" (permissão veiculos:gerenciar). */
  canManage?: boolean
  onEdit?: (vehicle: Vehicle) => void
  onBack: () => void
}

export function VehicleDetailsPage({
  vehicleId,
  canManage = false,
  onBack,
  onEdit,
}: VehicleDetailsPageProps) {
  useDocumentTitle('Detalhes do veículo')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [permissions, setPermissions] = useState<string[]>([])
  // Mês de referência do teto: fixado na abertura da tela.
  const [now] = useState(() => new Date())
  const detailsRequest = useVehicleDetails(vehicleId)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const details = detailsRequest.status === 'success' ? detailsRequest.data : null

  // Ao abrir a tela, o foco vai para o título (navegação sem rotas).
  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    currentUser()
      .then((user) => {
        if (active) setPermissions(user.permissoes)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function handleEdit() {
    if (details) onEdit?.(details.vehicle)
  }

  const canReadFuel = details?.availability?.fuel !== false
  const fuelings = details?.fuelings ?? []
  const monthSummary = summarizeMonthlyFuel(fuelings, now)
  const canRegisterMaintenance = permissions.includes('manutencoes:gerenciar')
  const canRegisterFuel = permissions.includes('abastecimentos:gerenciar')

  return (
    <div className={styles.page}>
      <Breadcrumb
        items={[
          { label: 'Veículos', to: '/veiculos', onClick: onBack },
          { label: 'Detalhes' },
        ]}
      />
      <header className={styles.header}>
        <div className={styles.heading}>
          <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
            Detalhes do veículo{details && ` — ${vehicleDisplayName(details.vehicle)}`}
          </h1>
          {details && (
            <p className={styles.subtitle}>
              {vehicleFullModel(details.vehicle)} · {details.vehicle.plate}
            </p>
          )}
        </div>
        {details && (
          <div className={styles.headerActions}>
            <VehicleQrPrintButton
              id={vehicleId}
              plate={details.vehicle.plate}
              model={details.vehicle.model}
            />
            {canManage && onEdit && (
              <Button variant="secondary" onClick={handleEdit}>
                Editar veículo
              </Button>
            )}
          </div>
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
          <div className={styles.top}>
            <VehicleHeroCard vehicle={details.vehicle} />
            <VehicleSummaryCard vehicle={details.vehicle} />
          </div>
          <div>
            <FuelCapCard
              cap={details.vehicle.monthlyCap ?? null}
              spent={canReadFuel ? monthSummary.spent : null}
              monthLabel={formatMonthLong(now)}
              error={details.fuelError}
              onRetry={detailsRequest.reload}
              actions={
                canRegisterMaintenance || canRegisterFuel ? (
                  <>
                    {canRegisterMaintenance && (
                      <ButtonLink to="/manutencoes/nova">Registrar manutenção</ButtonLink>
                    )}
                    {canRegisterFuel && (
                      <ButtonLink to="/abastecimentos/registrar" variant="secondary">
                        Registrar abastecimento
                      </ButtonLink>
                    )}
                  </>
                ) : undefined
              }
            />
          </div>
          {(details.availability?.maintenance !== false || canReadFuel) && (
            <div className={styles.pair}>
              {details.availability?.maintenance !== false && (
                <MaintenanceCard
                  className={styles.panel}
                  maintenances={details.maintenances}
                />
              )}
              {canReadFuel && (
                <FuelHistoryCard
                  className={styles.panel}
                  fuelings={fuelings}
                  monthSummary={monthSummary}
                  error={details.fuelError}
                  onRetry={detailsRequest.reload}
                />
              )}
            </div>
          )}
          <div className={styles.history}>
            <TripHistoryCard
              className={styles.panel}
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
            <InspectionChecklistCard
              className={styles.panel}
              items={details.checklist}
              unavailable={details.availability?.checklist === false}
            />
          </div>
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
