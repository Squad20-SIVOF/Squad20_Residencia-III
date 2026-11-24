export const REQUEST_SECTORS = [
  'Administrativo',
  'Assistencial',
  'Operacional',
  'SVO',
] as const
export type RequestSector = (typeof REQUEST_SECTORS)[number]

export const REQUEST_STATUSES = [
  'aguardando_aprovacao',
  'aprovada',
  'recusada',
  'cancelada',
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

// ---------- Formulário ----------

/** Valores do formulário: tudo texto, como digitado ("DD/MM/AAAA", "HH:MM"). */
export interface RequestFormValues {
  origin: string
  destination: string
  sector: RequestSector | ''
  date: string
  departureTime: string
  returnTime: string
  passengers: string
  vehicleId: string // vazio = sem preferência
  reason: string
  isImportant: boolean
}

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>

export interface RequestInput {
  origin: string
  destination: string
  sector: RequestSector
  departureAt: string // "AAAA-MM-DDTHH:MM:00" (horário local)
  returnAt: string | null
  passengers: number
  vehicleId: string | null
  reason: string
  isImportant: boolean
}

export interface VehicleRequest extends RequestInput {
  id: string
  code: string // número exibido ao usuário, ex.: "1842"
  status: RequestStatus
  createdAt: string // ISO 8601
}

// ---------- Formato da API (ainda não existe no backend) ----------

/** Corpo de POST /solicitacoes. */
export interface RequestBody {
  origem: string
  destino: string
  setor: string
  data_necessidade: string
  data_retorno_prevista: string | null
  numero_passageiros: number
  veiculo_preferencial_id: string | null
  motivo: string
  flag_urgencia: boolean
}

/** Resposta de POST /solicitacoes. */
export interface RequestResponse extends RequestBody {
  id: string
  codigo: number
  status: string
  criado_em: string
}

// ---------- Atribuição de veículo e motorista ----------

/** Resumo da solicitação exibido na tela de atribuição; `null` = a API não informa. */
export interface AssignmentRequestSummary {
  id: string
  code: string
  sector: string | null
  origin: string | null
  destination: string | null
  cargo: string | null
  stops: string[] | null
}

export interface TripAssignment {
  requestId: string
  vehicleId: string
  driverId: string
}

// ---------- Painel de Viagens ----------

export const TRACKED_TRIP_STATUSES = [
  'em_viagem',
  'a_caminho',
  'atrasada',
  'programada',
] as const
export type TrackedTripStatus = (typeof TRACKED_TRIP_STATUSES)[number]

/** Viagem exibida em "Viagens em acompanhamento"; abre os detalhes da rota. */
export interface TrackedTrip {
  id: string
  routeCode: string // ex.: "101"
  plate: string
  driverName: string
  origin: string
  destination: string
  status: TrackedTripStatus
  delayMinutes: number // só conta quando status = 'atrasada'
}

/** Resposta planejada de GET /viagens/acompanhamento (ainda não existe no backend). */
export interface TrackedTripResponse {
  id: string
  codigo_rota: number
  placa: string
  motorista_nome: string
  origem: string
  destino: string
  status: string
  atraso_min: number | null
}
