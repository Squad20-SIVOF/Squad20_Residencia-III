import { api } from '@/service/api'

export interface RequestRecord {
  id: string
  solicitante_id: string | null
  solicitante_nome: string | null
  setor_nome: string | null
  categoria: string
  flag_urgencia: boolean
  data_necessidade: string
  criado_em: string
  status: string
  motivo_cancelamento?: string | null
}
export interface RequestDetails extends RequestRecord {
  pode_editar: boolean
  pode_cancelar: boolean
  historico: {
    id: string
    status_anterior: string | null
    status_novo: string
    data_hora: string
    motivo?: string | null
  }[]
}
export interface RequestPage {
  dados: RequestRecord[]
  total: number
  pagina: number
  limite: number
}
export interface RequestUpdate {
  categoria: string
  flag_urgencia: boolean
  data_necessidade: string
}
const requestPath = (id: string) => `/solicitacoes/${encodeURIComponent(id)}`
export async function listPendingRequests(page: number): Promise<RequestPage> {
  const result = await api<{ message: RequestPage }>(
    `/solicitacoes?status=Pendente&pagina=${page}&limite=20`,
  )
  return result.message
}
export async function getRequestDetails(id: string): Promise<RequestDetails> {
  return (await api<{ message: RequestDetails }>(requestPath(id))).message
}
export async function updateRequest(id: string, input: RequestUpdate): Promise<void> {
  await api(requestPath(id), { method: 'PUT', body: JSON.stringify(input) })
}
export async function cancelRequest(id: string, reason: string): Promise<void> {
  await api(`${requestPath(id)}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ motivo: reason.trim() }),
  })
}
