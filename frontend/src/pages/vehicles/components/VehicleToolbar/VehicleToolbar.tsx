import { Button } from '@/components/Button'
import { SelectField } from '@/components/SelectField'
import type { SelectOption } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import type { FleetFilter, VehicleStatusFilter } from '../../types'
import { VEHICLE_STATUS_LABEL } from '../VehicleStatusBadge'
import styles from './VehicleToolbar.module.scss'

const STATUS_OPTIONS: SelectOption<VehicleStatusFilter>[] = [
  { value: 'todos', label: 'Status: Todos' },
  { value: 'ativo', label: `Status: ${VEHICLE_STATUS_LABEL.ativo}` },
  { value: 'manutencao', label: `Status: ${VEHICLE_STATUS_LABEL.manutencao}` },
  { value: 'em_viagem', label: `Status: ${VEHICLE_STATUS_LABEL.em_viagem}` },
  { value: 'inativo', label: `Status: ${VEHICLE_STATUS_LABEL.inativo}` },
]

const FLEET_OPTIONS: SelectOption<FleetFilter>[] = [
  { value: 'todas', label: 'Frota: Todas' },
  { value: 'SVO', label: 'Frota: SVO' },
  { value: 'Não informada', label: 'Frota: Não informada' },
  { value: 'Administrativa', label: 'Frota: Administrativa' },
  { value: 'Assistencial', label: 'Frota: Assistencial' },
  { value: 'Operacional', label: 'Frota: Operacional' },
]

export interface VehicleToolbarProps {
  search: string
  status: VehicleStatusFilter
  fleet: FleetFilter
  onSearchChange: (value: string) => void
  onStatusChange: (value: VehicleStatusFilter) => void
  onFleetChange: (value: FleetFilter) => void
  onCreate: () => void
  canManage?: boolean
}

export function VehicleToolbar({
  search,
  status,
  fleet,
  onSearchChange,
  onStatusChange,
  onFleetChange,
  onCreate,
  canManage = true,
}: VehicleToolbarProps) {
  return (
    <search className={styles.toolbar}>
      <TextField
        className={styles.search}
        label="Buscar veículos"
        isLabelHidden
        type="search"
        placeholder="Buscar por identificação, modelo ou placa..."
        value={search}
        onChange={onSearchChange}
        autoComplete="off"
      />
      <SelectField
        className={styles.filter}
        label="Filtrar por status"
        isLabelHidden
        value={status}
        options={STATUS_OPTIONS}
        onChange={onStatusChange}
      />
      <SelectField
        className={styles.filter}
        label="Filtrar por frota"
        isLabelHidden
        value={fleet}
        options={FLEET_OPTIONS}
        onChange={onFleetChange}
      />
      {canManage && (
        <Button
          className={styles.createButton}
          onClick={onCreate}
          iconStart={
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path
                d="M8 3v10M3 8h10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          }
        >
          Cadastrar Novo
        </Button>
      )}
    </search>
  )
}
