import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'
import type { Driver } from '@/pages/drivers/types'
import type { Vehicle } from '@/pages/vehicles/types'
import { api } from '@/service/api'
import { REDIRECT_DELAY_MS } from './AssignTripPage'
import {
  getAvailableDrivers,
  getAvailableVehicles,
  saveAssignment,
} from './services/assignmentService'

vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))

vi.mock('./services/assignmentService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/assignmentService')>()
  return {
    ...actual,
    getAvailableVehicles: vi.fn<typeof actual.getAvailableVehicles>(),
    getAvailableDrivers: vi.fn<typeof actual.getAvailableDrivers>(),
    saveAssignment: vi.fn<typeof actual.saveAssignment>(),
  }
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})

const id = '11111111-1111-4111-8111-111111111111'
const ASSIGN_PATH = `/viagens/solicitacoes/${id}/atribuir`
const DETAILS_PATH = `/viagens/solicitacoes/${id}`

function vehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: 'v1',
    identification: 'SVO-05',
    brand: '',
    plate: 'QRS-3T45',
    model: 'Fiat Ducato',
    fuelType: 'Diesel',
    maxCapacity: 16,
    status: 'ativo',
    mileageKm: 0,
    fleet: 'Assistencial',
    nextInspection: '',
    ...overrides,
  }
}

function driver(overrides: Partial<Driver>): Driver {
  return {
    id: 'd1',
    name: 'João da Silva',
    cpf: '529.982.247-25',
    phone: '',
    email: '',
    cnh: '01234567890',
    cnhCategory: 'D',
    cnhExpiry: '2099-12-31',
    fleet: 'SVO',
    vehicles: [],
    isWildcard: false,
    status: 'ativo',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const VEHICLES = [
  vehicle({}),
  vehicle({ id: 'v2', model: 'Hyundai HB20', plate: 'HIJ-6K78', maxCapacity: 5 }),
]
const DRIVERS = [
  driver({}),
  driver({ id: 'd2', name: 'Rafael Costa', cnh: '75315945600', cpf: '' }),
]

function CurrentPath() {
  return <output aria-label="URL atual">{useLocation().pathname}</output>
}

function renderAt(path = ASSIGN_PATH) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <CurrentPath />
    </MemoryRouter>,
  )
}

const currentPath = () => screen.getByRole('status', { name: 'URL atual' })
const vehicleColumn = () => screen.getByRole('region', { name: /Veículos disponíveis/ })
const driverColumn = () => screen.getByRole('region', { name: /Motoristas disponíveis/ })
// Texto quebrado em vários elementos (ex.: "2" + " disponíveis" só para leitor de tela).
const fullText = (text: string) => (_: string, element: Element | null) =>
  element?.textContent === text
const confirmButton = () => screen.getByRole('button', { name: 'Confirmar atribuição' })

beforeEach(() => {
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === '/solicitacoes?status=Pendente&pagina=1&limite=5')
      return { message: { dados: [], total: 0, pagina: 1, limite: 5 } } as never
    if (path === `/solicitacoes/${id}`)
      return {
        message: {
          id,
          categoria: 'Transporte de equipe',
          status: 'Pendente',
          flag_urgencia: false,
          solicitante_id: null,
          solicitante_nome: 'Maria Real',
          setor_nome: 'Operacional',
          data_necessidade: '2026-12-01T12:00:00Z',
          criado_em: '2026-11-12T12:00:00Z',
          historico: [],
          pode_editar: false,
          pode_cancelar: true,
        },
      } as never
    throw new Error(`Rota inesperada: ${path}`)
  })
  vi.mocked(getAvailableVehicles).mockResolvedValue(VEHICLES)
  vi.mocked(getAvailableDrivers).mockResolvedValue(DRIVERS)
  vi.mocked(saveAssignment).mockResolvedValue()
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

test('abre a atribuição de exemplo pelo card sem consultar recursos reais', async () => {
  const user = userEvent.setup()
  renderAt('/viagens/solicitacoes')

  await user.click(
    await screen.findByRole('link', {
      name: 'Atribuir veículo e motorista à solicitação #2401',
    }),
  )
  expect(
    await screen.findByRole('heading', { name: 'Solicitação #2401 · Logística' }),
  ).toBeVisible()
  expect(screen.getByText('Equipamentos · 120 kg · 4 caixas')).toBeVisible()
  expect(within(vehicleColumn()).getAllByRole('radio')).toHaveLength(3)
  expect(within(driverColumn()).getAllByRole('radio')).toHaveLength(3)
  expect(screen.getByRole('radio', { name: 'Fiat Fiorino' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Ana Martins' })).toBeChecked()
  expect(getAvailableVehicles).not.toHaveBeenCalled()
  expect(getAvailableDrivers).not.toHaveBeenCalled()
  expect(api).not.toHaveBeenCalledWith('/solicitacoes/exemplo-2401')

  await user.click(screen.getByRole('link', { name: 'Cancelar' }))
  expect(
    await screen.findByRole('heading', { name: 'Descrição da Solicitação #2401' }),
  ).toBeVisible()
})

test('mostra o resumo da solicitação real e os recursos disponíveis', async () => {
  renderAt()

  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Atribuir veículo e motorista',
    }),
  ).toBeInTheDocument()
  expect(
    await screen.findByRole('heading', { name: 'Solicitação #11111111 · Operacional' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Transporte de equipe')).toBeInTheDocument()
  // Trajeto e paradas ainda não vêm da API.
  expect(screen.getAllByText('—')).toHaveLength(2)

  expect(
    await within(vehicleColumn()).findByText(fullText('2 disponíveis')),
  ).toBeInTheDocument()
  expect(
    within(vehicleColumn()).getByText('Van · Capacidade: 16 lugares · CNH D'),
  ).toBeInTheDocument()
  expect(within(vehicleColumn()).getByText('QRS3T45')).toBeInTheDocument()
  expect(
    await within(driverColumn()).findByText(fullText('2 disponíveis')),
  ).toBeInTheDocument()
  expect(within(driverColumn()).getByText('CPF ***.982.247-**')).toBeInTheDocument()
  expect(
    within(driverColumn()).getByText('CNH 01234567890 · Categoria D'),
  ).toBeInTheDocument()
})

test('seleciona um veículo e um motorista e só então habilita a confirmação', async () => {
  const user = userEvent.setup()
  renderAt()

  const ducato = await screen.findByRole('radio', { name: 'Fiat Ducato' })
  const hb20 = screen.getByRole('radio', { name: 'Hyundai HB20' })
  expect(confirmButton()).toBeDisabled()
  expect(screen.getByText('Nenhum veículo selecionado')).toBeInTheDocument()

  await user.click(ducato)
  expect(ducato).toBeChecked()
  expect(within(vehicleColumn()).getByText('Selecionado')).toBeInTheDocument()
  expect(confirmButton()).toBeDisabled()

  // Um veículo por vez.
  await user.click(hb20)
  expect(hb20).toBeChecked()
  expect(ducato).not.toBeChecked()

  await user.click(await screen.findByRole('radio', { name: 'Rafael Costa' }))
  expect(within(driverColumn()).getByText('Selecionada')).toBeInTheDocument()
  expect(confirmButton()).toBeEnabled()
  expect(screen.getByText('Hyundai HB20 · HIJ6K78')).toBeInTheDocument()
  expect(
    screen.getByText('Rafael Costa', { selector: 'footer span' }),
  ).toBeInTheDocument()
})

test('seleção funciona pelo teclado', async () => {
  const user = userEvent.setup()
  renderAt()

  const ducato = await screen.findByRole('radio', { name: 'Fiat Ducato' })
  ducato.focus()
  await user.keyboard(' ')
  expect(ducato).toBeChecked()
})

test('filtra veículos por modelo ou placa e motoristas por nome ou CNH', async () => {
  const user = userEvent.setup()
  renderAt()

  const vehicleSearch = await screen.findByRole('searchbox', { name: 'Buscar veículo' })
  await user.type(vehicleSearch, 'hij-6k')
  expect(within(vehicleColumn()).getAllByRole('radio')).toHaveLength(1)
  expect(screen.getByRole('radio', { name: 'Hyundai HB20' })).toBeInTheDocument()

  await user.clear(vehicleSearch)
  await user.type(vehicleSearch, 'ducato')
  expect(screen.getByRole('radio', { name: 'Fiat Ducato' })).toBeInTheDocument()
  expect(screen.queryByRole('radio', { name: 'Hyundai HB20' })).not.toBeInTheDocument()

  await user.clear(vehicleSearch)
  await user.type(vehicleSearch, 'sprinter')
  expect(
    within(vehicleColumn()).getByText('Nenhum veículo encontrado'),
  ).toBeInTheDocument()

  const driverSearch = screen.getByRole('searchbox', { name: 'Buscar motorista' })
  await user.type(driverSearch, '7531')
  expect(within(driverColumn()).getAllByRole('radio')).toHaveLength(1)
  expect(screen.getByRole('radio', { name: 'Rafael Costa' })).toBeInTheDocument()

  await user.clear(driverSearch)
  await user.type(driverSearch, 'joao')
  expect(screen.getByRole('radio', { name: 'João da Silva' })).toBeInTheDocument()
  expect(screen.queryByRole('radio', { name: 'Rafael Costa' })).not.toBeInTheDocument()
})

test('confirma, avisa que é demonstrativo e volta para os detalhes', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderAt()

  await user.click(await screen.findByRole('radio', { name: 'Fiat Ducato' }))
  await user.click(await screen.findByRole('radio', { name: 'João da Silva' }))
  await user.click(confirmButton())

  const message = await screen.findByText(/Atribuição registrada \(demonstrativo\)/)
  expect(message.closest('[role="status"]')).not.toBeNull()
  expect(message).toHaveTextContent('Fiat Ducato · QRS3T45 com João da Silva')
  expect(saveAssignment).toHaveBeenCalledWith({
    requestId: id,
    vehicleId: 'v1',
    driverId: 'd1',
  })
  expect(currentPath()).toHaveTextContent(ASSIGN_PATH)

  await act(() => vi.advanceTimersByTimeAsync(REDIRECT_DELAY_MS))
  expect(currentPath()).toHaveTextContent(new RegExp(`^${DETAILS_PATH}$`))
})

test('falha ao registrar mostra o erro e permanece na tela', async () => {
  vi.mocked(saveAssignment).mockRejectedValueOnce(new Error('Falha na conexão.'))
  const user = userEvent.setup()
  renderAt()

  await user.click(await screen.findByRole('radio', { name: 'Fiat Ducato' }))
  await user.click(await screen.findByRole('radio', { name: 'João da Silva' }))
  await user.click(confirmButton())

  expect(await screen.findByRole('alert')).toHaveTextContent('Falha na conexão.')
  expect(confirmButton()).toBeEnabled()
  expect(currentPath()).toHaveTextContent(ASSIGN_PATH)
})

test('Cancelar e o link de voltar levam aos detalhes da solicitação', async () => {
  renderAt()

  expect(
    await screen.findByRole('link', { name: /Voltar para os detalhes da solicitação/ }),
  ).toHaveAttribute('href', DETAILS_PATH)
  expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
    'href',
    DETAILS_PATH,
  )
  expect(await screen.findByRole('radio', { name: 'Fiat Ducato' })).toBeInTheDocument()
})

test('mostra os estados vazios', async () => {
  vi.mocked(getAvailableVehicles).mockResolvedValue([])
  vi.mocked(getAvailableDrivers).mockResolvedValue([])
  renderAt()

  expect(await screen.findByText('Nenhum veículo disponível')).toBeInTheDocument()
  expect(await screen.findByText('Nenhum motorista disponível')).toBeInTheDocument()
  expect(confirmButton()).toBeDisabled()
})

test('erro ao carregar oferece "Tentar novamente"', async () => {
  vi.mocked(getAvailableVehicles)
    .mockRejectedValueOnce(new Error('Servidor indisponível'))
    .mockResolvedValue(VEHICLES)
  const user = userEvent.setup()
  renderAt()

  const column = await screen.findByRole('region', { name: /Veículos disponíveis/ })
  const error = within(column).getByRole('alert')
  expect(error).toHaveTextContent('Não foi possível carregar os veículos')
  await user.click(within(error).getByRole('button', { name: 'Tentar novamente' }))

  expect(await screen.findByRole('radio', { name: 'Fiat Ducato' })).toBeInTheDocument()
})
