import { useState, type FormEvent } from 'react'
import { Button } from '@/components/Button'
import { SelectField } from '@/components/SelectField'
import type { SelectOption } from '@/components/SelectField'
import { TextField } from '@/components/TextField'
import { Toolbar } from '@/components/Toolbar'
import type { FleetFilter, VehicleStatusFilter } from '../../types'
import { VEHICLE_STATUS_LABEL } from '../VehicleStatusBadge'

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

export interface VehicleFilterValues {
  search: string
  status: VehicleStatusFilter
  fleet: FleetFilter
}

export interface VehicleToolbarProps extends VehicleFilterValues {
  onApply: (values: VehicleFilterValues) => void
}

/** Os filtros só valem ao clicar em "Filtrar" (ou Enter), como no protótipo. */
export function VehicleToolbar({ search, status, fleet, onApply }: VehicleToolbarProps) {
  const [draft, setDraft] = useState<VehicleFilterValues>({ search, status, fleet })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <Toolbar label="Filtrar veículos" onSubmit={handleSubmit}>
      <TextField
        label="Modelo / Placa"
        type="search"
        placeholder="Buscar por identificação, modelo ou placa..."
        value={draft.search}
        onChange={(value) => setDraft((current) => ({ ...current, search: value }))}
        autoComplete="off"
      />
      <SelectField
        label="Status"
        value={draft.status}
        options={STATUS_OPTIONS}
        onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
      />
      <SelectField
        label="Frota"
        value={draft.fleet}
        options={FLEET_OPTIONS}
        onChange={(value) => setDraft((current) => ({ ...current, fleet: value }))}
      />
      <Button type="submit">Filtrar</Button>
    </Toolbar>
  )
}
