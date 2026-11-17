import { useId, type ReactNode } from 'react'
import { classNames } from '@/utils/classNames'
import { formatKm } from '@/utils/format'
import type { Vehicle } from '../../types'
import { VehicleStatusBadge } from '../VehicleStatusBadge'
import styles from './VehicleTable.module.scss'

export interface VehicleTableProps {
  vehicles: Vehicle[]
  /** Total de veículos encontrados (todas as páginas). */
  recordCount?: number
  /** Estado de carregando, erro ou vazio exibido no lugar da tabela. */
  state?: ReactNode
  onView: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onDelete?: (vehicle: Vehicle) => void
  canManage?: boolean
}

/*
 * Uma única tabela: no xs cada linha é reestruturada como card via CSS (sem duplicar o markup);
 * a partir do md ela volta a ser uma tabela dentro do card "Veículos cadastrados".
 */
export function VehicleTable({
  vehicles,
  recordCount,
  state,
  onView,
  onEdit,
  onDelete,
  canManage = true,
}: VehicleTableProps) {
  const titleId = useId()

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          Veículos cadastrados
        </h2>
        {recordCount !== undefined && (
          <p className={styles.count}>
            {recordCount} {recordCount === 1 ? 'registro' : 'registros'}
          </p>
        )}
      </header>
      {state ? (
        <div className={styles.state}>{state}</div>
      ) : (
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
                    <button
                      type="button"
                      className={styles.action}
                      aria-label={`Ver detalhes do veículo ${vehicle.identification}`}
                      onClick={() => onView(vehicle)}
                    >
                      Ver
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        className={styles.action}
                        aria-label={`Editar veículo ${vehicle.identification}`}
                        onClick={() => onEdit(vehicle)}
                      >
                        Editar
                      </button>
                    )}
                    {canManage && onDelete && (
                      <button
                        type="button"
                        className={classNames(styles.action, styles.actionDanger)}
                        aria-label={`Excluir veículo ${vehicle.plate}`}
                        onClick={() => onDelete(vehicle)}
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
