import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import { maintenanceService } from './maintenanceService'
import type { MaintenanceInput } from '../types/maintenance'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
beforeEach(() => vi.resetAllMocks())
const input: MaintenanceInput = {
  vehicleId: 'v1',
  tipo: 'Corretiva',
  descricao: 'Troca de peça',
  dataServico: '2026-10-29',
  horaServico: '09:30',
  quilometragem: 100,
  oficina: 'Oficina',
  valorEstimado: 50,
  status: 'Agendada',
  tipoProximaRevisao: 'Data e quilometragem',
  proximaRevisaoKm: 200,
  proximaRevisaoData: '2026-11-29',
  notificarRevisao: true,
}
const row = {
  id: 'm1',
  veiculo_id: 'v1',
  tipo_manutencao: 'corretiva',
  descricao: 'Troca de peça',
  data_inicio: '2026-10-29T12:30:00Z',
  data_servico: '2026-10-29',
  hora_servico: '09:30',
  km_realizado: 100,
  oficina: 'Oficina',
  custo: '50.00',
  status: 'Agendada',
  km_proxima: 200,
  proxima_revisao_data: '2026-11-29',
  notificar_revisao: true,
  criado_em: '2026-10-29',
  atualizado_em: '2026-10-29',
}
test('criação envia todos os campos ao CRUD e mapeia resposta real', async () => {
  vi.mocked(api).mockResolvedValue({ message: row })
  const result = await maintenanceService.create(input)
  const options = vi.mocked(api).mock.calls[0]?.[1]
  expect(api).toHaveBeenCalledWith(
    '/maintance',
    expect.objectContaining({ method: 'POST' }),
  )
  expect(JSON.parse(options?.body as string)).toMatchObject({
    tipo_manutencao: 'corretiva',
    status: 'Agendada',
    data_servico: '2026-10-29',
    hora_servico: '09:30',
    oficina: 'Oficina',
    km_proxima: 200,
    proxima_revisao_data: '2026-11-29',
    notificar_revisao: true,
  })
  expect(result).toMatchObject({
    valorEstimado: 50,
    tipo: 'Corretiva',
    tipoProximaRevisao: 'Data e quilometragem',
  })
})
test('edição e exclusão aguardam a API e propagam erro', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ message: row })
    .mockRejectedValueOnce(new Error('Permissão insuficiente'))
  await maintenanceService.update('m1', input)
  expect(api).toHaveBeenCalledWith(
    '/maintance/m1',
    expect.objectContaining({ method: 'PUT' }),
  )
  await expect(maintenanceService.remove('m1')).rejects.toThrow('Permissão insuficiente')
})
