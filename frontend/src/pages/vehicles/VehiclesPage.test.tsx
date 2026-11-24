import { MemoryRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { currentUser } from '@/service/authService'
import { VehiclesPage } from './VehiclesPage'
import { deleteVehicle, getVehicles } from './services/vehicleService'
import type { Vehicle, VehicleStatus } from './types'

vi.mock('./services/vehicleService', () => ({
  getVehicles: vi.fn<typeof getVehicles>(),
  deleteVehicle: vi.fn<typeof deleteVehicle>(),
}))
vi.mock('@/service/authService', () => ({
  currentUser: vi.fn<typeof currentUser>(),
}))

const STATUSES: VehicleStatus[] = [
  'ativo',
  'ativo',
  'em_viagem',
  'manutencao',
  'inativo',
  'ativo',
  'ativo',
]

const VEHICLES: Vehicle[] = STATUSES.map((status, index) => ({
  id: `v${index + 1}`,
  identification: `SVO-0${index + 1}`,
  plate: `ABC-1D2${index}`,
  model: index === 4 ? 'Volkswagen Saveiro' : 'Fiat Fiorino',
  fuelType: 'Flex',
  maxCapacity: 58,
  status,
  mileageKm: 45320 + index,
  fleet: index === 4 ? 'Operacional' : 'Administrativa',
  nextInspection: '',
}))

function mockPermissions(permissoes: string[]) {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor de Frota',
    email: 'gestor@example.com',
    permissoes,
  })
}

function renderPage() {
  return render(<VehiclesPage />, { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.mocked(getVehicles).mockResolvedValue(VEHICLES)
})

test('mostra os cards da frota, a tabela paginada e filtra só ao clicar em Filtrar', async () => {
  mockPermissions(['veiculos:ler'])
  const user = userEvent.setup()
  renderPage()

  const stats = await screen.findByRole('list', { name: 'Resumo da frota' })
  const active = within(stats).getByText('Veículos ativos').closest('article')
  expect(active).toHaveTextContent('5 / 7')
  expect(within(stats).getByText('Ativos / Total Cadastrados')).toBeInTheDocument()
  expect(within(stats).getByText('Exigem atenção')).toBeInTheDocument()
  expect(within(stats).getByText('Fora de serviço')).toBeInTheDocument()

  const table = screen.getByRole('region', { name: 'Veículos cadastrados' })
  expect(within(table).getByText('7 registros')).toBeInTheDocument()
  expect(within(table).getAllByRole('row')).toHaveLength(7) // cabeçalho + 6 por página
  expect(screen.getByText('Mostrando 6 de 7 veículos')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Próxima' }))
  expect(screen.getByText('Mostrando 1 de 7 veículos')).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Status'), 'inativo')
  expect(within(table).getByText('7 registros')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Filtrar' }))
  expect(within(table).getByText('1 registro')).toBeInTheDocument()
  expect(within(table).getByText('Volkswagen Saveiro')).toBeInTheDocument()

  await user.selectOptions(screen.getByLabelText('Status'), 'todos')
  await user.type(screen.getByLabelText('Modelo / Placa'), 'placa inexistente{Enter}')
  expect(screen.getByText('Nenhum veículo encontrado.')).toBeInTheDocument()

  // Sem veiculos:gerenciar não há cadastro, edição nem exclusão.
  expect(screen.queryByRole('button', { name: 'Cadastrar Novo' })).not.toBeInTheDocument()
})

test('gestor confirma a exclusão antes de remover e recarrega a lista', async () => {
  mockPermissions(['veiculos:ler', 'veiculos:gerenciar'])
  vi.mocked(deleteVehicle).mockResolvedValue()
  const user = userEvent.setup()
  renderPage()

  expect(
    await screen.findByRole('button', { name: 'Cadastrar Novo' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Editar veículo SVO-01' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Excluir veículo ABC-1D20' }))
  const dialog = screen.getByRole('dialog', { name: 'Excluir veículo?' })
  expect(deleteVehicle).not.toHaveBeenCalled()
  await user.click(within(dialog).getByRole('button', { name: 'Excluir' }))
  expect(deleteVehicle).toHaveBeenCalledWith('v1')
  expect(getVehicles).toHaveBeenCalledTimes(2)
})

test('erro ao carregar oferece tentar novamente', async () => {
  mockPermissions(['veiculos:ler'])
  vi.mocked(getVehicles).mockRejectedValueOnce(new Error('offline'))
  const user = userEvent.setup()
  renderPage()

  expect(
    await screen.findByText('Não foi possível carregar os veículos.'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await screen.findByText('7 registros')).toBeInTheDocument()
})
