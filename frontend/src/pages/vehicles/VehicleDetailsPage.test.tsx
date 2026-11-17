import { MemoryRouter } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test, vi } from 'vitest'
import { currentUser } from '@/service/authService'
import { VehicleDetailsPage } from './VehicleDetailsPage'
import { getVehicleDetails } from './services/vehicleService'
import type { Vehicle } from './types'

vi.mock('./services/vehicleService', () => ({
  getVehicleDetails: vi.fn<typeof getVehicleDetails>(),
}))
vi.mock('@/service/authService', () => ({
  currentUser: vi.fn<typeof currentUser>(),
}))

const VEHICLE: Vehicle = {
  id: 'v1',
  plate: 'SVO0A01',
  model: 'SVO demo',
  fuelType: 'Diesel',
  maxCapacity: 60,
  mileageKm: 0,
  status: 'ativo',
  fleet: 'SVO',
  identification: '',
  nextInspection: '',
}

function mockPermissions(permissoes: string[]) {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor de Frota',
    email: 'gestor@example.com',
    permissoes,
  })
}

afterEach(() => vi.useRealTimers())

test('exibe card de vistoria indisponível e abre/fecha o histórico sem inventar viagens', async () => {
  mockPermissions(['veiculos:ler'])
  vi.mocked(getVehicleDetails).mockResolvedValue({
    vehicle: VEHICLE,
    trips: [],
    maintenances: [],
    checklist: [],
    availability: { trips: true, checklist: false, maintenance: false, fuel: false },
  })
  const user = userEvent.setup()
  render(<VehicleDetailsPage vehicleId="v1" onBack={vi.fn<() => void>()} />, {
    wrapper: MemoryRouter,
  })
  expect(
    await screen.findByRole('heading', { name: 'Checklist de vistorias' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText('O registro de vistorias ainda não está integrado à API.'),
  ).toBeInTheDocument()
  // Sem permissão de manutenção/abastecimento: cards escondidos, nada inventado.
  expect(screen.queryByRole('heading', { name: 'Manutenções' })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('heading', { name: 'Abastecimentos recentes' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByText('Seu usuário não tem acesso aos abastecimentos deste veículo.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Editar veículo' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Ver histórico completo' }))
  const dialog = screen.getByRole('dialog', { name: 'Histórico de viagens' })
  expect(
    within(dialog).getByText('Nenhuma viagem registrada para este veículo.'),
  ).toBeInTheDocument()
  await user.click(within(dialog).getByRole('button', { name: 'Fechar' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('mostra teto mensal, abastecimentos e manutenções da API com as ações permitidas', async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 25, 12))
  mockPermissions([
    'veiculos:gerenciar',
    'manutencoes:ler',
    'manutencoes:gerenciar',
    'abastecimentos:ler',
  ])
  vi.mocked(getVehicleDetails).mockResolvedValue({
    vehicle: {
      ...VEHICLE,
      identification: 'SVO-01',
      brand: 'Fiat',
      model: 'Fiorino 1.4',
      plate: 'ABC-1D23',
      mileageKm: 45320,
      fleet: 'Administrativa',
      fuelType: 'Flex',
      maxCapacity: 58,
      monthlyCap: 1000,
      nextInspection: '2027-01',
    },
    trips: [],
    maintenances: [
      {
        id: 'm1',
        type: 'preventiva',
        description: 'Revisão dos 45 mil km',
        date: '2026-10-28',
        mileageKm: 45320,
        cost: 650,
        status: 'Agendada',
        workshop: 'AutoCentro Sul',
      },
    ],
    checklist: [{ id: 'item-1', label: 'Freios', isOk: true }],
    fuelings: [
      {
        id: 'f1',
        date: new Date(2026, 9, 21, 10).toISOString(),
        fuel: 'Gasolina',
        liters: 30,
        total: 255,
        station: 'Posto Sul',
        mileageKm: 45320,
        driverName: 'Marina Costa',
      },
      {
        id: 'f2',
        date: new Date(2026, 9, 14, 10).toISOString(),
        fuel: 'Gasolina',
        liters: 70,
        total: 595,
        station: 'Posto Sul',
        mileageKm: 45010,
        driverName: 'Paulo Lima',
      },
    ],
    availability: { trips: true, checklist: true, maintenance: true, fuel: true },
  })
  const onEdit = vi.fn<(vehicle: Vehicle) => void>()
  const user = userEvent.setup()
  render(
    <VehicleDetailsPage
      vehicleId="v1"
      canManage
      onEdit={onEdit}
      onBack={vi.fn<() => void>()}
    />,
    { wrapper: MemoryRouter },
  )

  expect(
    await screen.findByRole('heading', {
      level: 1,
      name: 'Detalhes do veículo — SVO-01',
    }),
  ).toBeInTheDocument()
  expect(screen.getByText('Fiat Fiorino 1.4 · ABC-1D23')).toBeInTheDocument()

  const cap = screen.getByRole('region', { name: 'Teto mensal de abastecimento' })
  expect(within(cap).getByText('R$ 850,00')).toBeInTheDocument()
  expect(within(cap).getByText('85% do teto')).toBeInTheDocument()
  expect(within(cap).getByText('Atenção')).toBeInTheDocument()
  expect(within(cap).getByText('de R$ 1.000,00 · Outubro de 2026')).toBeInTheDocument()
  expect(within(cap).getByRole('progressbar')).toHaveValue(85)
  expect(within(cap).getByRole('link', { name: 'Registrar manutenção' })).toHaveAttribute(
    'href',
    '/manutencoes/nova',
  )
  // Sem abastecimentos:gerenciar, o atalho de registro não aparece.
  expect(
    within(cap).queryByRole('link', { name: 'Registrar abastecimento' }),
  ).not.toBeInTheDocument()

  const fuel = screen.getByRole('region', { name: 'Abastecimentos recentes' })
  expect(within(fuel).getByText('R$ 255,00 · Posto Sul')).toBeInTheDocument()
  expect(
    within(fuel).getByText('2 registros no mês · 100,00 L · R$ 850,00'),
  ).toBeInTheDocument()

  const maintenance = screen.getByRole('region', { name: 'Manutenções' })
  expect(within(maintenance).getByText('Agendada')).toBeInTheDocument()
  expect(within(maintenance).getByText(/AutoCentro Sul/)).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Editar veículo' }))
  expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'v1' }))
})
