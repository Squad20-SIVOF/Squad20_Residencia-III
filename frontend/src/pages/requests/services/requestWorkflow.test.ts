import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import { createRequest } from './requestService'
import { saveAssignment } from './assignmentService'
import { rejectRequest } from './requestApi'

vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
beforeEach(() => vi.resetAllMocks())

test('envia criação autenticada pela API e converte horários locais', async () => {
  const input = {
    origin: 'Fundação',
    destination: 'Hospital',
    sector: 'Administrativo' as const,
    departureAt: '2026-12-01T08:00:00',
    returnAt: '2026-12-01T12:00:00',
    passengers: 2,
    vehicleId: null,
    reason: 'Visita',
    isImportant: false,
  }
  const row = {
    id: 'real-id',
    codigo: 42,
    origem: input.origin,
    destino: input.destination,
    setor: input.sector,
    data_necessidade: new Date(input.departureAt).toISOString(),
    data_retorno_prevista: new Date(input.returnAt).toISOString(),
    numero_passageiros: 2,
    veiculo_preferencial_id: null,
    motivo: 'Visita',
    flag_urgencia: false,
    status: 'Pendente',
    criado_em: '2026-11-24T12:00:00Z',
  }
  vi.mocked(api).mockResolvedValue({ message: row })
  expect(await createRequest(input)).toMatchObject({
    id: 'real-id',
    code: '42',
    status: 'aguardando_aprovacao',
  })
  expect(api).toHaveBeenCalledWith('/solicitacoes', {
    method: 'POST',
    body: JSON.stringify({
      origem: row.origem,
      destino: row.destino,
      setor: row.setor,
      data_necessidade: row.data_necessidade,
      data_retorno_prevista: row.data_retorno_prevista,
      numero_passageiros: 2,
      veiculo_preferencial_id: null,
      motivo: 'Visita',
      flag_urgencia: false,
    }),
  })
})

test('não simula sucesso se a API recusar criação ou reserva', async () => {
  vi.mocked(api).mockRejectedValue(new Error('Recurso já reservado'))
  await expect(
    saveAssignment({ requestId: 'request', vehicleId: 'vehicle', driverId: 'driver' }),
  ).rejects.toThrow('Recurso já reservado')
})

test('aprovação envia recursos e retorno previsto', async () => {
  vi.mocked(api).mockResolvedValue({})
  await saveAssignment({
    requestId: 'request',
    vehicleId: 'vehicle',
    driverId: 'driver',
    returnAt: '2026-12-01T15:00:00Z',
  })
  expect(api).toHaveBeenCalledWith('/solicitacoes/request/aprovar', {
    method: 'PATCH',
    body: JSON.stringify({
      veiculo_id: 'vehicle',
      motorista_id: 'driver',
      data_retorno_prevista: '2026-12-01T15:00:00Z',
    }),
  })
  await rejectRequest('request', '  Sem recursos  ')
  expect(api).toHaveBeenLastCalledWith('/solicitacoes/request/recusar', {
    method: 'PATCH',
    body: JSON.stringify({ motivo: 'Sem recursos' }),
  })
})
