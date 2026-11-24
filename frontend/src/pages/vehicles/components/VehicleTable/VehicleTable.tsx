import type { ReactNode } from 'react'
import { Button } from '@/components/Button'
import { DataTable, TablePanel, type DataTableColumn } from '@/components/DataTable'
import { formatKm } from '@/utils/format'
import type { Vehicle } from '../../types'
import { VehicleStatusBadge } from '../VehicleStatusBadge'

const COLUMNS: DataTableColumn<Vehicle>[] = [
  {
    key: 'identification',
    header: 'Identificação',
    isPrimary: true,
    minWidth: 9,
    render: (vehicle) => vehicle.identification,
  },
  { key: 'model', header: 'Modelo', minWidth: 10, render: (vehicle) => vehicle.model },
  {
    key: 'plate',
    header: 'Placa',
    keepTogether: true,
    render: (vehicle) => vehicle.plate,
  },
  {
    key: 'mileage',
    header: 'Quilometragem',
    keepTogether: true,
    render: (vehicle) => formatKm(vehicle.mileageKm),
  },
  {
    key: 'status',
    header: 'Status',
    render: (vehicle) => <VehicleStatusBadge status={vehicle.status} />,
  },
]

export interface VehicleTableProps {
  vehicles: Vehicle[]
  /** Total de veículos encontrados (todas as páginas). */
  recordCount?: number
  /** Estado de carregando, erro ou vazio exibido no lugar da tabela. */
  state?: ReactNode
  footer?: ReactNode
  onView: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
  canManage?: boolean
}

export function VehicleTable({
  vehicles,
  recordCount,
  state,
  footer,
  onView,
  onEdit,
  onDelete,
  canManage = true,
}: VehicleTableProps) {
  return (
    <TablePanel title="Veículos cadastrados" recordCount={recordCount} footer={footer}>
      {state ?? (
        <DataTable
          caption="Lista de veículos da frota"
          rows={vehicles}
          columns={COLUMNS}
          getRowKey={(vehicle) => vehicle.id}
          renderActions={(vehicle) => (
            <>
              <Button
                variant="secondary"
                aria-label={`Ver detalhes do veículo ${vehicle.identification}`}
                onClick={() => onView(vehicle)}
              >
                Ver
              </Button>
              {canManage && (
                <Button
                  variant="secondary"
                  aria-label={`Editar veículo ${vehicle.identification}`}
                  onClick={() => onEdit(vehicle)}
                >
                  Editar
                </Button>
              )}
              {canManage && onDelete && (
                <Button
                  variant="secondary"
                  data-table-destructive
                  aria-label={`Excluir veículo ${vehicle.plate}`}
                  onClick={() => onDelete(vehicle)}
                >
                  Excluir
                </Button>
              )}
            </>
          )}
        />
      )}
    </TablePanel>
  )
}
