import { Button } from '@/components/Button'
import { formatKm } from '@/utils/format'
import type { Vehicle } from '../../types'
import { VehicleStatusBadge } from '../VehicleStatusBadge'
import styles from './VehicleTable.module.scss'

export interface VehicleTableProps {
  vehicles: Vehicle[]
  onView: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
  canManage?: boolean
}

/*
 * Uma única tabela: no xs cada linha é reestruturada como card via CSS (sem duplicar o markup);
 * a partir do md ela volta a ser uma tabela.
 */
export function VehicleTable({
  vehicles,
  onView,
  onEdit,
  onDelete,
  canManage = true,
}: VehicleTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>Lista de veículos da frota</caption>
        <thead className={styles.head}>
          <tr>
            <th scope="col">Identificação</th>
            <th scope="col">Modelo</th>
            <th scope="col">Placa</th>
            <th scope="col">Quilometragem</th>
            <th scope="col">Status</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody className={styles.body}>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id} className={styles.row}>
              <td className={styles.identification}>{vehicle.identification}</td>
              <td className={styles.model}>
                <span className={styles.cellLabel} aria-hidden="true">
                  Modelo
                </span>
                {vehicle.model}
              </td>
              <td className={styles.plate}>
                <span className={styles.cellLabel} aria-hidden="true">
                  Placa
                </span>
                {vehicle.plate}
              </td>
              <td className={styles.mileage}>
                <span className={styles.cellLabel} aria-hidden="true">
                  Quilometragem
                </span>
                {formatKm(vehicle.mileageKm)}
              </td>
              <td className={styles.status}>
                <VehicleStatusBadge status={vehicle.status} />
              </td>
              <td className={styles.actions}>
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
                    variant="danger"
                    aria-label={`Excluir veículo ${vehicle.plate}`}
                    onClick={() => onDelete(vehicle)}
                  >
                    Excluir
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
