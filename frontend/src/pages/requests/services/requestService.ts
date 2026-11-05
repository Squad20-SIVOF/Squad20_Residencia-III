import { REQUEST_SECTORS, TRIP_STAGES } from '../types'
import type {
  RequestBody,
  RequestInput,
  RequestResponse,
  RequestSector,
  RequestStatus,
  RequestTracking,
  RequestTrackingResponse,
  TripStage,
  VehicleRequest,
} from '../types'
import { getEtaMinutes, getRemainingKm, getTripStage } from '../utils/requestRules'

/*
 * O backend de solicitações ainda não existe: as funções devolvem dados mockados
 * com a mesma assinatura da versão real. Para integrar, troque o corpo por
 * api<RequestResponse>('/solicitacoes', { method: 'POST', body }) e
 * api<RequestTrackingResponse>(`/solicitacoes/${id}/acompanhamento`).
 */

const MOCK_DELAY_MS = 400
/** Tempo entre a confirmação e a saída do motorista. */
const MOCK_DISPATCH_MS = 3_000
/** Duração simulada do trajeto até o ponto de embarque. */
const MOCK_TRIP_DURATION_MS = 45_000
/** Intervalo entre as posições enviadas pelo GPS do veículo. */
const MOCK_GPS_INTERVAL_MS = 2_000
const MOCK_ROUTE_KM = 2.6
const MOCK_FIRST_CODE = 1842

interface MockRequest {
  response: RequestResponse
  startedAt: number
}

const mockRequests = new Map<string, MockRequest>()
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

function toStage(value: string): TripStage {
  return TRIP_STAGES.find((stage) => stage === value) ?? 'confirmada'
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

function toRequestTracking(row: RequestTrackingResponse): RequestTracking {
  return {
    requestId: row.solicitacao_id,
    code: String(row.codigo),
    stage: toStage(row.etapa),
    progress: Math.min(1, Math.max(0, row.progresso)),
    remainingKm: row.distancia_restante_km,
    etaMinutes: row.tempo_estimado_min,
    updatedAt: row.atualizado_em,
    origin: row.origem,
    destination: row.destino,
    driver: { name: row.motorista.nome, phone: row.motorista.telefone },
    vehicle: { model: row.veiculo.modelo, plate: row.veiculo.placa },
    pickup: {
      address: row.ponto_embarque.endereco,
      instructions: row.ponto_embarque.instrucoes,
    },
  }
}

// ---------- Simulação do trajeto ----------

function registerMockRequest(body: RequestBody, now: number, id?: string): MockRequest {
  const code = nextCode++
  const mock: MockRequest = {
    startedAt: now,
    response: {
      ...body,
      id: id ?? mockId(code),
      codigo: code,
      status: 'Pendente',
      criado_em: new Date(now).toISOString(),
    },
  }
  mockRequests.set(mock.response.id, mock)
  return mock
}

/** Abrir /viagens/:id direto (ex.: após recarregar) cria uma solicitação de exemplo. */
function findOrCreateMockRequest(id: string, now: number): MockRequest {
  const existing = mockRequests.get(id)
  if (existing) return existing

  return registerMockRequest(
    {
      origem: 'Central SVO',
      destino: 'Hospital de Urgência de Sergipe',
      setor: 'SVO',
      data_necessidade: new Date(now).toISOString(),
      data_retorno_prevista: null,
      numero_passageiros: 2,
      veiculo_preferencial_id: null,
      motivo: 'Solicitação de exemplo.',
      flag_urgencia: false,
    },
    now,
    id,
  )
}

function buildMockTracking(mock: MockRequest, now: number): RequestTrackingResponse {
  const elapsed = now - mock.startedAt
  // A posição só muda quando chega um novo ponto do GPS.
  const lastFixAt = mock.startedAt + elapsed - (elapsed % MOCK_GPS_INTERVAL_MS)
  const progress = Math.min(
    1,
    Math.max(0, (lastFixAt - mock.startedAt - MOCK_DISPATCH_MS) / MOCK_TRIP_DURATION_MS),
  )
  const remainingKm = getRemainingKm(MOCK_ROUTE_KM, progress)

  return {
    solicitacao_id: mock.response.id,
    codigo: mock.response.codigo,
    etapa: getTripStage(progress),
    progresso: progress,
    distancia_restante_km: remainingKm,
    tempo_estimado_min: getEtaMinutes(remainingKm),
    atualizado_em: new Date(lastFixAt).toISOString(),
    origem: mock.response.origem,
    destino: mock.response.destino,
    motorista: { nome: 'Rafael Mendes', telefone: '79998765432' },
    veiculo: { modelo: 'Chevrolet Spin', placa: 'QWE-4J18' },
    ponto_embarque: {
      endereco: 'Av. Ipiranga, 1.234 · Portão 2',
      instrucoes: 'Aguarde no Portão 2. O motorista verá este ponto de embarque.',
    },
  }
}

// ---------- Funções públicas ----------

/** POST /solicitacoes */
export async function createRequest(input: RequestInput): Promise<VehicleRequest> {
  const mock = registerMockRequest(toRequestBody(input), Date.now())
  return toVehicleRequest(await respondWith(mock.response))
}

/** GET /solicitacoes/:id/acompanhamento */
export async function getRequestTracking(id: string): Promise<RequestTracking> {
  const now = Date.now()
  const response = await respondWith(
    buildMockTracking(findOrCreateMockRequest(id, now), now),
  )
  return toRequestTracking(response)
}
