import { REQUEST_SECTORS } from '../types'
import type {
  RequestBody,
  RequestInput,
  RequestResponse,
  RequestSector,
  RequestStatus,
  VehicleRequest,
} from '../types'

const MOCK_DELAY_MS = 400
const MOCK_FIRST_CODE = 1842

let nextCode = MOCK_FIRST_CODE

function respondWith<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY_MS))
}

function mockId(code: number): string {
  return `00000000-0000-4000-9000-${String(code).padStart(12, '0')}`
}

// ---------- Conversão entre o formato da API e o do app ----------

function toRequestBody(input: RequestInput): RequestBody {
  return {
    origem: input.origin,
    destino: input.destination,
    setor: input.sector,
    data_necessidade: input.departureAt,
    data_retorno_prevista: input.returnAt,
    numero_passageiros: input.passengers,
    veiculo_preferencial_id: input.vehicleId,
    motivo: input.reason,
    flag_urgencia: input.isImportant,
  }
}

const STATUS_FROM_API: Record<string, RequestStatus> = {
  Pendente: 'aguardando_aprovacao',
  Aprovada: 'aprovada',
  Recusada: 'recusada',
  Cancelada: 'cancelada',
}

function toSector(value: string): RequestSector {
  return REQUEST_SECTORS.find((sector) => sector === value) ?? 'Administrativo'
}

function toVehicleRequest(row: RequestResponse): VehicleRequest {
  return {
    id: row.id,
    code: String(row.codigo),
    status: STATUS_FROM_API[row.status] ?? 'aguardando_aprovacao',
    createdAt: row.criado_em,
    origin: row.origem,
    destination: row.destino,
    sector: toSector(row.setor),
    departureAt: row.data_necessidade,
    returnAt: row.data_retorno_prevista,
    passengers: row.numero_passageiros,
    vehicleId: row.veiculo_preferencial_id,
    reason: row.motivo,
    isImportant: row.flag_urgencia,
  }
}

/** Simula POST /solicitacoes. A leitura e as ações existentes usam requestApi.ts. */
export async function createRequest(input: RequestInput): Promise<VehicleRequest> {
  const code = nextCode++
  const response = await respondWith<RequestResponse>({
    ...toRequestBody(input),
    id: mockId(code),
    codigo: code,
    status: 'Pendente',
    criado_em: new Date().toISOString(),
  })
  return toVehicleRequest(response)
}
