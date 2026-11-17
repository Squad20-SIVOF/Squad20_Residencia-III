import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import { currentUser } from '@/service/authService'
import { getVehicleDetails } from './services/vehicleService'

vi.unmock('@/pages/vehicles/services/vehicleService')
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(currentUser).mockResolvedValue({
    id: 'leitor',
    nome: 'Leitor',
    email: 'leitor@example.com',
    permissoes: ['veiculos:ler'],
  })
})
const vehicle = {
  id: 'v1',
  placa: 'SVO0A01',
  modelo: 'Demo',
  tipo_combustivel: 'Diesel',
  capacidade_maxima: 60,
  status: 'ativo',
  ativo: true,
}

test('preserva o veículo quando o histórico falha e permite mostrar o erro no card', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ message: vehicle })
    .mockRejectedValueOnce(new Error('Servidor indisponível'))
  const details = await getVehicleDetails('v1')
  expect(details.vehicle.plate).toBe('SVO0A01')
  expect(details.tripsError).toBe('Não foi possível carregar o histórico de viagens.')
  expect(details.availability?.trips).toBe(false)
})

test('carrega viagens reais sem inventar data ou trajeto para viagem agendada', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ message: vehicle })
    .mockResolvedValueOnce({
      message: [
        {
          id: 'trip-1',
          status: 'Agendada',
          data_inicio: null,
          km_inicial: null,
          km_final: null,
        },
      ],
    })
  const details = await getVehicleDetails('v1')
  expect(details.trips).toEqual([
    {
      id: 'trip-1',
      code: 'trip-1',
      status: 'Agendada',
      startedAt: null,
      mileageStart: null,
      mileageEnd: null,
    },
  ])
  expect(details.tripsError).toBeUndefined()
  expect(api).toHaveBeenNthCalledWith(2, '/vehicles/v1/trips')
})

test('lê abastecimentos e manutenções do veículo só com permissão, sem quebrar se falharem', async () => {
  vi.mocked(currentUser).mockResolvedValueOnce({
    id: 'gestor',
    nome: 'Gestor',
    email: 'gestor@example.com',
    permissoes: ['veiculos:ler', 'manutencoes:ler', 'abastecimentos:ler'],
  })
  vi.mocked(api)
    .mockResolvedValueOnce({ message: vehicle })
    .mockResolvedValueOnce({ message: [] })
    .mockResolvedValueOnce({
      message: [
        {
          id: 'm1',
          veiculo_id: 'v1',
          tipo_manutencao: 'preventiva',
          descricao: 'Revisão',
          data_inicio: '2026-10-28T03:00:00.000Z',
          km_realizado: 45320,
          custo: '650.00',
          status: 'Agendada',
          oficina: 'AutoCentro Sul',
        },
        { id: 'm2', veiculo_id: 'outro', tipo_manutencao: 'corretiva', data_inicio: '' },
      ],
    })
    .mockRejectedValueOnce(new Error('Servidor indisponível'))
  const details = await getVehicleDetails('v1')
  expect(api).toHaveBeenNthCalledWith(4, '/abastecimentos?veiculo_id=v1')
  expect(details.maintenances).toEqual([
    expect.objectContaining({ id: 'm1', status: 'Agendada', workshop: 'AutoCentro Sul' }),
  ])
  expect(details.fuelings).toEqual([])
  expect(details.fuelError).toBe('Não foi possível carregar os abastecimentos.')
  expect(details.availability).toMatchObject({ maintenance: true, fuel: true })
})

test('sem permissão de abastecimentos não consulta a API e marca como indisponível', async () => {
  vi.mocked(api)
    .mockResolvedValueOnce({ message: vehicle })
    .mockResolvedValueOnce({ message: [] })
  const details = await getVehicleDetails('v1')
  expect(api).toHaveBeenCalledTimes(2)
  expect(details.availability?.fuel).toBe(false)
  expect(details.fuelError).toBeUndefined()
})
