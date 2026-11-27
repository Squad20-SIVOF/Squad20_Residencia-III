import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ButtonLink } from '@/components/ButtonLink'
import { DataTable } from '@/components/DataTable'
import type { DataTableColumn } from '@/components/DataTable'
import type { Driver } from '../../types'
import { getEffectiveStatus } from '../../utils/driverRules'
import { CnhExpiry } from '../CnhExpiry'
import { DriverStatusBadge } from '../DriverStatusBadge'
import styles from './DriverTable.module.scss'

const COLUMNS: DataTableColumn<Driver>[] = [
  { key: 'name', header: 'Nome', isPrimary: true, render: (driver) => driver.name },
  { key: 'cnh', header: 'CNH', keepTogether: true, render: (driver) => driver.cnh },
  { key: 'category', header: 'Cat.', render: (driver) => driver.cnhCategory },
  {
    key: 'expiry',
    header: 'Validade CNH',
    keepTogether: true,
    render: (driver) => <CnhExpiry expiry={driver.cnhExpiry} />,
  },
  {
    key: 'vehicles',
    header: 'Veículos vinculados',
    render: (driver) =>
      driver.isWildcard ? (
        <Badge variant="info">Coringa · todas</Badge>
      ) : (
        driver.vehicles.join(', ') || '—'
      ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (driver) => <DriverStatusBadge status={getEffectiveStatus(driver)} />,
  },
]

export interface DriverTableProps {
  drivers: Driver[]
  onDelete: (driver: Driver) => void
}

export function DriverTable({ drivers, onDelete }: DriverTableProps) {
  return (
    <DataTable
      caption="Lista de motoristas da frota"
      className={styles.table}
      rows={drivers}
      columns={COLUMNS}
      getRowKey={(driver) => driver.id}
      renderActions={(driver) => (
        <>
          <ButtonLink
            variant="secondary"
            to={`/motoristas/${driver.id}`}
            aria-label={`Ver detalhes de ${driver.name}`}
          >
            Ver
          </ButtonLink>
          <ButtonLink
            variant="secondary"
            to={`/motoristas/editar/${driver.id}`}
            aria-label={`Editar ${driver.name}`}
          >
            Editar
          </ButtonLink>
          <Button
            variant="secondary"
            data-table-destructive
            aria-label={`Excluir ${driver.name}`}
            onClick={() => onDelete(driver)}
          >
            Excluir
          </Button>
        </>
      )}
    />
  )
}
