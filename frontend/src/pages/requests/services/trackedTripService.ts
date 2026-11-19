import { TRACKED_TRIP_STATUSES } from '../types'
import type { TrackedTrip, TrackedTripResponse, TrackedTripStatus } from '../types'

/*
 * DADOS DEMONSTRATIVOS. O backend ainda não tem um endpoint de viagens em
 * acompanhamento: esta função devolve rotas de exemplo com a assinatura planejada,
 * e a tela avisa que são exemplos. Para integrar, troque o corpo de
 * listTrackedTrips por api<{ message: TrackedTripResponse[] }>('/viagens/acompanhamento')
 * e mantenha a conversão de toTrackedTrip.
 */

const MOCK_DELAY_MS = 400

const MOCK_TRACKED_TRIPS: TrackedTripResponse[] = [
  {
    id: 'demo-rota-101',
    codigo_rota: 101,
    placa: 'ABC-1D23',
    motorista_nome: 'João da Silva',
    origem: 'Central SVO',
    destino: 'Posto Sul',
    status: 'em_viagem',
    atraso_min: null,
  },
  {
    id: 'demo-rota-102',
    codigo_rota: 102,
    placa: 'EFG-4H56',
    motorista_nome: 'Maria Oliveira',
    origem: 'Terminal Norte',
    destino: 'Base SVO',
    status: 'a_caminho',
    atraso_min: null,
  },
  {
    id: 'demo-rota-103',
    codigo_rota: 103,
    placa: 'IJK-7L89',
    motorista_nome: 'Carlos Souza',
    origem: 'Almoxarifado',
    destino: 'Hospital',
    status: 'atrasada',
    atraso_min: 12,
  },
  {
    id: 'demo-rota-104',
    codigo_rota: 104,
    placa: 'MNO-0P12',
    motorista_nome: 'Pedro Santos',
    origem: 'Base SVO',
    destino: 'Posto Atalaia',
    status: 'programada',
    atraso_min: null,
  },
]

function toStatus(value: string): TrackedTripStatus {
  return TRACKED_TRIP_STATUSES.find((status) => status === value) ?? 'programada'
}

function toTrackedTrip(row: TrackedTripResponse): TrackedTrip {
  return {
    id: row.id,
    routeCode: String(row.codigo_rota),
    plate: row.placa,
    driverName: row.motorista_nome,
    origin: row.origem,
    destination: row.destino,
    status: toStatus(row.status),
    delayMinutes: Math.max(0, row.atraso_min ?? 0),
  }
}

/** GET /viagens/acompanhamento (demonstrativo) */
export async function listTrackedTrips(): Promise<TrackedTrip[]> {
  const rows = await new Promise<TrackedTripResponse[]>((resolve) =>
    setTimeout(() => resolve(MOCK_TRACKED_TRIPS), MOCK_DELAY_MS),
  )
  return rows.map(toTrackedTrip)
}
