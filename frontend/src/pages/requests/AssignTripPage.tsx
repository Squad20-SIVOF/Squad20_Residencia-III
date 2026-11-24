import { useEffect, useState } from 'react'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '@/components/Alert'
import { BackLink } from '@/components/BackLink/BackLink'
import { Button } from '@/components/Button'
import { PageHeader } from '@/components/PageHeader'
import { StateMessage } from '@/components/StateMessage'
import type { AsyncResult } from '@/hooks/useAsync'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { AssignmentFooter } from './components/AssignmentFooter'
import { AssignmentSummary } from './components/AssignmentSummary'
import { DriverOption } from './components/DriverOption'
import { ResourceColumn } from './components/ResourceColumn'
import { VehicleOption } from './components/VehicleOption'
import { useTripAssignment } from './hooks/useTripAssignment'
import {
  assignmentExampleDrivers,
  assignmentExampleSpecs,
  assignmentExampleVehicles,
} from './services/assignmentExamples'
import { saveAssignment } from './services/assignmentService'
import {
  formatPlate,
  getVehicleName,
  matchesDriverSearch,
  matchesVehicleSearch,
} from './utils/assignmentRules'
import styles from './AssignTripPage.module.scss'

// Tempo para o aviso ser lido (e anunciado) antes de voltar aos detalhes.
export const REDIRECT_DELAY_MS = 2000

type SaveStatus = 'idle' | 'saving' | 'saved'

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Tente novamente.'

interface ColumnStateLabels {
  error: string
  empty: string
  notFound: string
}

/** Carregando, erro, vazio ou busca sem resultado; `undefined` quando há itens para listar. */
function getColumnState<T>(
  result: Exclude<AsyncResult<T[]>, { status: 'loading' }>,
  visibleCount: number,
  labels: ColumnStateLabels,
): ReactNode {
  if (result.status === 'error')
    return (
      <StateMessage
        variant="error"
        title={labels.error}
        description={errorMessage(result.error)}
        action={<Button onClick={result.reload}>Tentar novamente</Button>}
      />
    )
  if (!result.data.length) return <StateMessage title={labels.empty} />
  if (!visibleCount)
    return <StateMessage title={labels.notFound} description="Revise o termo da busca." />
  return undefined
}

/** Atribuir veículo e motorista a uma solicitação (`/viagens/solicitacoes/:id/atribuir`). */
export function AssignTripPage() {
  useDocumentTitle('Atribuir veículo e motorista')
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const { example, request, vehicles, drivers } = useTripAssignment(id)
  const returnPath = example
    ? '/viagens/solicitacoes?exemplos=1'
    : `/viagens/solicitacoes/${encodeURIComponent(id)}`
  const returnLabel = example
    ? 'Voltar para as solicitações pendentes'
    : 'Voltar para os detalhes da solicitação'

  const [vehicleSearch, setVehicleSearch] = useState('')
  const [driverSearch, setDriverSearch] = useState('')
  const [vehicleId, setVehicleId] = useState(() =>
    example ? (assignmentExampleVehicles[0]?.id ?? null) : null,
  )
  const [driverId, setDriverId] = useState(() =>
    example ? (assignmentExampleDrivers[0]?.id ?? null) : null,
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const allVehicles = vehicles.status === 'success' ? vehicles.data : []
  const allDrivers = drivers.status === 'success' ? drivers.data : []
  const visibleVehicles = allVehicles.filter((vehicle) =>
    matchesVehicleSearch(vehicle, vehicleSearch),
  )
  const visibleDrivers = allDrivers.filter((driver) =>
    matchesDriverSearch(driver, driverSearch),
  )
  const selectedVehicle = allVehicles.find((vehicle) => vehicle.id === vehicleId)
  const selectedDriver = allDrivers.find((driver) => driver.id === driverId)
  const vehicleLabel =
    selectedVehicle &&
    `${getVehicleName(selectedVehicle)} · ${formatPlate(selectedVehicle.plate)}`
  const canConfirm =
    request.status === 'success' &&
    Boolean(selectedVehicle && selectedDriver) &&
    saveStatus !== 'saved'

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => navigate(returnPath), REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [saveStatus, returnPath, navigate])

  async function handleConfirm() {
    if (!selectedVehicle || !selectedDriver || saveStatus !== 'idle') return
    setSaveStatus('saving')
    setSaveError(null)
    try {
      if (!example) {
        await saveAssignment({
          requestId: id,
          vehicleId: selectedVehicle.id,
          driverId: selectedDriver.id,
        })
      }
      setSaveStatus('saved')
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível registrar a atribuição.',
      )
      setSaveStatus('idle')
    }
  }

  if (
    request.status === 'loading' ||
    vehicles.status === 'loading' ||
    drivers.status === 'loading'
  )
    return <LoadingState label="Carregando atribuição da viagem" />

  return (
    <div className={styles.page}>
      <PageHeader
        title="Atribuir veículo e motorista"
        subtitle="Selecione os recursos disponíveis para realizar esta viagem."
        breadcrumb={<BackLink to={returnPath}>{returnLabel}</BackLink>}
      />
      {example && (
        <Alert variant="info">
          Demonstração com veículos e motoristas de exemplo. Nenhuma atribuição será
          gravada.
        </Alert>
      )}

      {request.status === 'error' && (
        <StateMessage
          variant="error"
          title="Não foi possível carregar a solicitação"
          description={errorMessage(request.error)}
          action={<Button onClick={request.reload}>Tentar novamente</Button>}
        />
      )}
      {request.status === 'success' && <AssignmentSummary request={request.data} />}

      <div className={styles.columns}>
        <ResourceColumn
          title="Veículos disponíveis"
          count={vehicles.status === 'success' ? allVehicles.length : undefined}
          searchLabel="Buscar veículo"
          searchPlaceholder="Buscar por modelo ou placa"
          search={vehicleSearch}
          onSearchChange={setVehicleSearch}
          state={getColumnState(vehicles, visibleVehicles.length, {
            error: 'Não foi possível carregar os veículos',
            empty: 'Nenhum veículo disponível',
            notFound: 'Nenhum veículo encontrado',
          })}
        >
          {visibleVehicles.map((vehicle) => (
            <VehicleOption
              key={vehicle.id}
              vehicle={vehicle}
              specifications={example ? assignmentExampleSpecs[vehicle.id] : undefined}
              isSelected={vehicle.id === vehicleId}
              onSelect={setVehicleId}
            />
          ))}
        </ResourceColumn>

        <ResourceColumn
          title="Motoristas disponíveis"
          count={drivers.status === 'success' ? allDrivers.length : undefined}
          searchLabel="Buscar motorista"
          searchPlaceholder="Buscar por nome ou CNH"
          search={driverSearch}
          onSearchChange={setDriverSearch}
          state={getColumnState(drivers, visibleDrivers.length, {
            error: 'Não foi possível carregar os motoristas',
            empty: 'Nenhum motorista disponível',
            notFound: 'Nenhum motorista encontrado',
          })}
        >
          {visibleDrivers.map((driver) => (
            <DriverOption
              key={driver.id}
              driver={driver}
              isSelected={driver.id === driverId}
              onSelect={setDriverId}
            />
          ))}
        </ResourceColumn>
      </div>

      {saveError && <Alert variant="danger">{saveError}</Alert>}
      {saveStatus === 'saved' && (
        <Alert
          variant="success"
          action={
            <Link to={returnPath} className={styles.noticeLink}>
              {example ? 'Ver solicitações pendentes' : 'Ver detalhes da solicitação'}
            </Link>
          }
        >
          Atribuição registrada (demonstrativo): {vehicleLabel} com {selectedDriver?.name}
          . A seleção vale só nesta tela.
        </Alert>
      )}

      <AssignmentFooter
        vehicleLabel={vehicleLabel}
        driverLabel={selectedDriver?.name}
        cancelTo={returnPath}
        canConfirm={canConfirm}
        isSaving={saveStatus === 'saving'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
