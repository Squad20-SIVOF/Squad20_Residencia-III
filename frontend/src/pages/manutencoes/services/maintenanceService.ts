import { api } from '@/service/api'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'
import type { Maintenance, MaintenanceInput } from '../types/maintenance'
import type { Vehicle } from '../types/vehicle'
interface Row {
  id: string
  veiculo_id: string
  tipo_manutencao: 'preventiva' | 'impeditiva' | 'corretiva' | 'preditiva'
  data_inicio: string
  data_servico?: string | null
  hora_servico?: string | null
  custo: number | string
  descricao: string | null
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada'
  km_realizado: number | null
  km_proxima: number | null
  oficina?: string
  proxima_revisao_data?: string | null
  notificar_revisao?: boolean
  comprovante_nome?: string | null
  criado_em: string
  atualizado_em: string
}
const types = {
  preventiva: 'Preventiva',
  impeditiva: 'Impeditiva',
  corretiva: 'Corretiva',
  preditiva: 'Preditiva',
} as const
const fromRow = (row: Row): Maintenance => ({
  id: row.id,
  vehicleId: row.veiculo_id,
  tipo: types[row.tipo_manutencao],
  descricao: row.descricao ?? '',
  dataServico: row.data_servico ?? row.data_inicio.slice(0, 10),
  horaServico: row.hora_servico ?? '',
  quilometragem: row.km_realizado ?? 0,
  oficina: row.oficina ?? '',
  valorEstimado: Number(row.custo),
  status: row.status === 'Em Andamento' ? 'Em andamento' : row.status,
  tipoProximaRevisao:
    row.km_proxima != null && row.proxima_revisao_data
      ? 'Data e quilometragem'
      : row.km_proxima != null
        ? 'Quilometragem'
        : row.proxima_revisao_data
          ? 'Data'
          : 'Não definida',
  ...(row.km_proxima != null ? { proximaRevisaoKm: row.km_proxima } : {}),
  ...(row.proxima_revisao_data ? { proximaRevisaoData: row.proxima_revisao_data } : {}),
  notificarRevisao: row.notificar_revisao ?? false,
  ...(row.comprovante_nome ? { comprovanteNome: row.comprovante_nome } : {}),
  criadoEm: row.criado_em,
  atualizadoEm: row.atualizado_em,
})
const toBody = (input: MaintenanceInput) => ({
  veiculo_id: input.vehicleId,
  tipo_manutencao: input.tipo.toLowerCase(),
  descricao: input.descricao,
  data_servico: input.dataServico,
  hora_servico: input.horaServico || null,
  data_inicio: new Date(
    `${input.dataServico}T${input.horaServico || '12:00'}:00-03:00`,
  ).toISOString(),
  custo: input.valorEstimado,
  status: input.status === 'Em andamento' ? 'Em Andamento' : input.status,
  km_realizado: input.quilometragem,
  km_proxima: input.proximaRevisaoKm ?? null,
  oficina: input.oficina,
  proxima_revisao_data: input.proximaRevisaoData ?? null,
  notificar_revisao: input.notificarRevisao,
  comprovante_nome: input.comprovanteNome ?? null,
})
const CHANGE_EVENT = 'frotamanager:manutencoes-changed'
async function save(path: string, method: string, input: MaintenanceInput) {
  const row = (
    await api<{ message: Row }>(path, { method, body: JSON.stringify(toBody(input)) })
  ).message
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return fromRow(row)
}
export const maintenanceService = {
  CHANGE_EVENT,
  async list() {
    return (await api<{ message: Row[] }>('/maintance')).message.map(fromRow)
  },
  async getById(id: string) {
    return fromRow(
      (await api<{ message: Row }>(`/maintance/${encodeURIComponent(id)}`)).message,
    )
  },
  create(input: MaintenanceInput) {
    return save('/maintance', 'POST', input)
  },
  update(id: string, input: MaintenanceInput) {
    return save(`/maintance/${encodeURIComponent(id)}`, 'PUT', input)
  },
  async remove(id: string) {
    await api(`/maintance/${encodeURIComponent(id)}`, { method: 'DELETE' })
    window.dispatchEvent(new Event(CHANGE_EVENT))
  },
}
export const vehicleService = {
  async list(): Promise<Vehicle[]> {
    return (await getVehicles()).map((v) => ({
      id: v.id,
      codigo: v.identification,
      placa: v.plate,
      marca: '',
      modelo: v.model,
      quilometragem: v.mileageKm,
      status: (
        {
          ativo: 'Disponível',
          inativo: 'Inativo',
          manutencao: 'Em manutenção',
          em_viagem: 'Em uso',
        } as const
      )[v.status],
    }))
  },
}
