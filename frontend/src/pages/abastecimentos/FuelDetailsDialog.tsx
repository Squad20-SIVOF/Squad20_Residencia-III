import { Alert } from '@/components/Alert'
import { Badge } from '@/components/Badge'
import { RecordDetailsDialog } from '@/components/RecordDetailsDialog/RecordDetailsDialog'
import styles from '@/components/RecordDetailsDialog/RecordDetailsDialog.module.scss'
import { formatKm } from '@/utils/format'
import { money, type FuelRecord } from './services/fuelService'

interface FuelDetailsDialogProps {
  record: FuelRecord
  canManage: boolean
  error: string
  onClose: () => void
  onDelete: () => void
}

export function FuelDetailsDialog({
  record,
  canManage,
  error,
  onClose,
  onDelete,
}: FuelDetailsDialogProps) {
  const vehicleName = [record.identificacao, record.modelo].filter(Boolean).join(' · ')
  const fields = [
    ['Motorista', record.motorista_nome ?? 'Motorista removido'],
    ['Posto', record.posto ?? 'Não registrado'],
    [
      'Data e horário',
      new Date(record.data_abastecimento).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    ],
    ['Combustível', record.combustivel ?? 'Não registrado'],
    ['Hodômetro', formatKm(record.km_momento_abastecimento)],
    ['Volume abastecido', `${Number(record.litros).toLocaleString('pt-BR')} L`],
  ]

  return (
    <RecordDetailsDialog
      title="Detalhes do abastecimento"
      description="Informações do abastecimento e valores registrados."
      titleAccessory={
        record.alerta_teto_excedido && <Badge variant="warning">Teto excedido</Badge>
      }
      plate={record.placa}
      vehicleName={
        vehicleName || (record.placa ? 'Nome não informado' : 'Veículo removido')
      }
      notice={error && <Alert variant="danger">{error}</Alert>}
      editTo={
        canManage ? `/abastecimentos/editar/${encodeURIComponent(record.id)}` : undefined
      }
      onDelete={canManage ? onDelete : undefined}
      onClose={onClose}
    >
      <section className={styles.detailService}>
        <h3>Informações do abastecimento</h3>
        <dl className={styles.details}>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className={styles.detailLabel}>{label}</dt>
              <dd className={styles.detailValue}>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <dl className={`${styles.details} ${styles.detailHighlight}`}>
        <div>
          <dt>Valor total</dt>
          <dd className={styles.detailPrice}>{money(record.valor_total)}</dd>
        </div>
        <div>
          <dt>Preço por litro</dt>
          <dd>
            <strong>
              {record.preco_litro == null ? 'Não informado' : money(record.preco_litro)}
            </strong>
          </dd>
        </div>
      </dl>
    </RecordDetailsDialog>
  )
}
