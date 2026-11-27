import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { maintenanceService } from '@/pages/manutencoes/services/maintenanceService'
import type { Maintenance } from '@/pages/manutencoes/types/maintenance'
import { listTrackedTrips } from '@/pages/requests/services/trackedTripService'
import type { TrackedTrip } from '@/pages/requests/types'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'
import type { Vehicle } from '@/pages/vehicles/types'
import { getAlertSummary } from '@/service/alertService'
import type { AlertSummary } from '@/service/alertService'
import { currentUser } from '@/service/authService'
import { HomePage } from './HomePage'

vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))
vi.mock('@/service/alertService', () => ({
  getAlertSummary: vi.fn<typeof getAlertSummary>(),
}))
vi.mock('@/pages/vehicles/services/vehicleService', () => ({
  getVehicles: vi.fn<typeof getVehicles>(),
}))
vi.mock('@/pages/manutencoes/services/maintenanceService', () => ({
  maintenanceService: { list: vi.fn<typeof maintenanceService.list>() },
}))
vi.mock('@/pages/requests/services/trackedTripService', () => ({
  listTrackedTrips: vi.fn<typeof listTrackedTrips>(),
}))

const ALL_PERMISSIONS = ['veiculos:ler', 'motoristas:ler', 'manutencoes:ler']

function vehicle(id: string, status: Vehicle['status']): Vehicle {
  return {
    id,
    identification: id,
    plate: `${id}-0000`,
    model: 'Modelo',
    fuelType: 'Flex',
    maxCapacity: 5,
    status,
    mileageKm: 0,
    fleet: 'SVO',
    nextInspection: '2027-01',
  }
}

function maintenance(
  id: string,
  dataServico: string,
  status: Maintenance['status'] = 'Agendada',
): Maintenance {
  return {
    id,
    vehicleId: 'v1',
    tipo: 'Preventiva',
    descricao: '',
    dataServico,
    quilometragem: 0,
    oficina: '',
    valorEstimado: 0,
    status,
    tipoProximaRevisao: 'Não definida',
    notificarRevisao: false,
    criadoEm: '',
    atualizadoEm: '',
  }
}

function trip(id: string, status: TrackedTrip['status'], delayMinutes = 0): TrackedTrip {
  return {
    id,
    routeCode: id,
    plate: `PL-${id}`,
    driverName: 'Motorista',
    origin: 'A',
    destination: 'B',
    status,
    delayMinutes,
  }
}

const EMPTY_ALERTS: AlertSummary = {
  cnh: { total: 0, criticas: 0, itens: [] },
  manutencao: { total: 0, criticas: 0, itens: [] },
}

const ALERTS: AlertSummary = {
  cnh: {
    total: 1,
    criticas: 1,
    itens: [
      {
        id: 'c1',
        nome: 'Ana Pereira',
        validade_cnh: '2026-09-30',
        dias_restantes: -49,
        severity: 'critica',
      },
    ],
  },
  manutencao: {
    total: 1,
    criticas: 0,
    itens: [
      {
        id: 'm1',
        placa: 'EFG-4H56',
        quilometragem: 30150,
        km_restantes: 150,
        severity: 'aviso',
      },
    ],
  },
}

function mockUser(permissoes: string[]) {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor de Frota',
    email: 'gestor@example.invalid',
    permissoes,
  })
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/relatorios" element={<h1>Página de relatórios</h1>} />
        <Route path="/veiculos" element={<h1>Página de veículos</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function findAlertsCard() {
  return screen.findByRole('region', { name: 'Alertas da frota' })
}

beforeEach(() => {
  vi.resetAllMocks()
  // Só o relógio é falso: os atrasos (setTimeout) dos serviços continuam reais.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 18, 10, 0)) // quarta-feira
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  mockUser(ALL_PERMISSIONS)
  vi.mocked(getVehicles).mockResolvedValue([
    vehicle('a', 'ativo'),
    vehicle('b', 'ativo'),
    vehicle('c', 'ativo'),
    vehicle('d', 'manutencao'),
    vehicle('e', 'inativo'),
  ])
  vi.mocked(getAlertSummary).mockResolvedValue(ALERTS)
  vi.mocked(maintenanceService.list).mockResolvedValue([
    maintenance('1', '2026-11-18'),
    maintenance('2', '2026-11-20'),
    maintenance('3', '2026-11-10'),
    maintenance('4', '2026-11-19', 'Concluída'),
  ])
  vi.mocked(listTrackedTrips).mockResolvedValue([
    trip('101', 'em_viagem'),
    trip('103', 'atrasada', 12),
    trip('104', 'programada'),
  ])
})

afterEach(() => {
  vi.useRealTimers()
})

test('mostra o carregamento e depois os números calculados a partir dos dados', async () => {
  renderHome()
  expect(screen.getByRole('status', { name: 'Carregando dashboard' })).toBeInTheDocument()

  expect(
    screen.queryByRole('heading', { level: 1, name: 'Dashboard Principal' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('region', { name: 'Indicadores principais' }),
  ).not.toBeInTheDocument()

  const fleetToday = await screen.findByRole('link', { name: /Frota ativa hoje/ })
  expect(
    screen.queryByRole('status', { name: 'Carregando dashboard' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('heading', { level: 1, name: 'Dashboard Principal' }),
  ).toBeVisible()
  expect(
    screen.getByText('Visão gerencial completa da operação em 18 de novembro de 2026'),
  ).toBeInTheDocument()

  expect(fleetToday).toHaveTextContent('4 veículos')
  expect(fleetToday).toHaveTextContent(
    '3 disponíveis · 1 em manutenção · — em abastecimento',
  )

  const available = screen.getByRole('link', { name: /Veículos disponíveis/ })
  expect(available).toHaveTextContent('3 / 4')
  expect(available).toHaveTextContent('+2')
  expect(available).toHaveTextContent('vs. ontem')

  const trips = screen.getByRole('link', { name: /Viagens em andamento/ })
  expect(trips).toHaveTextContent('2')
  expect(trips).toHaveTextContent('1 atrasada')
  expect(trips).toHaveTextContent('1 dentro do prazo')

  const kpis = screen.getByRole('region', { name: 'Indicadores principais' })
  const alertsKpi = within(kpis).getByRole('link', { name: /Alertas operacionais/ })
  expect(alertsKpi).toHaveAttribute('href', '/notificacoes')
  expect(alertsKpi).toHaveTextContent('2')
  expect(alertsKpi).toHaveTextContent('1 crítico')
  expect(alertsKpi).toHaveTextContent('1 em análise')

  const maintenances = screen.getByRole('link', { name: /Manutenções agendadas/ })
  expect(maintenances).toHaveTextContent('2')
  expect(maintenances).toHaveTextContent('1 hoje')
  expect(maintenances).toHaveTextContent('1 até sexta')

  const availability = screen.getByRole('region', { name: 'Disponibilidade da frota' })
  expect(within(availability).getByText('75% disponível')).toBeInTheDocument()

  const details = screen.getByRole('region', { name: 'Detalhes operacionais' })
  expect(within(details).getByText('Frota ativa').nextSibling).toHaveTextContent(
    '4 veículos',
  )
  expect(within(details).getByText('Em abastecimento').nextSibling).toHaveTextContent('—')
  expect(
    within(details).getByText('Viagens concluídas · 7 dias').nextSibling,
  ).toHaveTextContent('103')
})

test('gráfico de utilização tem descrição acessível com o valor de cada dia', async () => {
  renderHome()
  const chart = await screen.findByRole('figure')
  expect(chart).toHaveAccessibleName(
    /Gráfico de barras das viagens realizadas nos últimos 7 dias/,
  )
  expect(chart).toHaveAccessibleName(/quarta-feira \(hoje\): 16 viagens/)
})

test('alertas da frota mostram só os alertas existentes, cada um com seu destino', async () => {
  renderHome()
  const card = await findAlertsCard()
  expect(within(card).getByText('2 abertos')).toBeInTheDocument()
  expect(within(card).getAllByRole('listitem')).toHaveLength(2)

  expect(within(card).getByRole('link', { name: 'CNH vencida' })).toHaveAttribute(
    'href',
    '/motoristas',
  )
  expect(within(card).getByRole('link', { name: 'Manutenção próxima' })).toHaveAttribute(
    'href',
    '/manutencoes',
  )
  expect(within(card).getByText('Crítico')).toBeInTheDocument()
  expect(within(card).getByText('Revisar')).toBeInTheDocument()

  const reports = within(card).getAllByRole('link', { name: /^Relatório/ })
  expect(reports).toHaveLength(2)
  for (const report of reports) expect(report).toHaveAttribute('href', '/relatorios')
  expect(within(card).getByText('Status do sistema: OK')).toBeInTheDocument()
})

test('sem alertas, o card mostra só a faixa de status', async () => {
  vi.mocked(getAlertSummary).mockResolvedValue(EMPTY_ALERTS)
  renderHome()
  const card = await findAlertsCard()
  expect(within(card).queryByRole('list')).not.toBeInTheDocument()
  expect(within(card).queryByText(/abertos?$/)).not.toBeInTheDocument()
  expect(within(card).queryByRole('link', { name: /Relatório/ })).not.toBeInTheDocument()
  expect(within(card).getByText('Status do sistema: OK')).toBeInTheDocument()
})

test('próximas ações e cards levam aos módulos', async () => {
  renderHome()
  const details = await screen.findByRole('region', { name: 'Detalhes operacionais' })
  const actions = within(details).getByRole('region', { name: 'Próximas ações' })
  expect(
    within(actions).getByRole('link', {
      name: 'Revisar CNH de Ana Pereira antes da próxima viagem',
    }),
  ).toHaveAttribute('href', '/motoristas')
  expect(
    within(actions).getByRole('link', { name: /Acompanhar a rota 103/ }),
  ).toHaveAttribute('href', '/viagens')

  expect(screen.getByRole('link', { name: /Viagens em andamento/ })).toHaveAttribute(
    'href',
    '/viagens',
  )
  expect(screen.getByRole('link', { name: /Manutenções agendadas/ })).toHaveAttribute(
    'href',
    '/manutencoes',
  )

  await userEvent.click(screen.getByRole('link', { name: /Veículos disponíveis/ }))
  expect(screen.getByRole('heading', { name: 'Página de veículos' })).toBeInTheDocument()
})

test('botão Relatório abre a página de relatórios', async () => {
  renderHome()
  const card = await findAlertsCard()
  const [firstReport] = within(card).getAllByRole('link', { name: /^Relatório/ })
  if (!firstReport) throw new Error('Nenhum botão Relatório encontrado')
  await userEvent.click(firstReport)
  expect(
    screen.getByRole('heading', { name: 'Página de relatórios' }),
  ).toBeInTheDocument()
})

test('erro geral mostra a mensagem e "Tentar novamente" recarrega', async () => {
  vi.mocked(currentUser).mockRejectedValueOnce(new Error('offline'))
  renderHome()
  expect(
    await screen.findByText('Não foi possível carregar o dashboard.'),
  ).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(
    await screen.findByRole('region', { name: 'Disponibilidade da frota' }),
  ).toBeInTheDocument()
})

test('falha só nos alertas não derruba o restante do dashboard', async () => {
  vi.mocked(getAlertSummary).mockRejectedValue(new Error('500'))
  renderHome()
  const card = await findAlertsCard()
  expect(
    within(card).getByText('Não foi possível carregar os alertas.'),
  ).toBeInTheDocument()
  expect(
    within(card).getByRole('button', { name: 'Tentar novamente' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Veículos disponíveis/ })).toHaveTextContent(
    '3 / 4',
  )
})

test('frota sem veículos ativos mostra o estado vazio', async () => {
  vi.mocked(getVehicles).mockResolvedValue([])
  renderHome()
  const availability = await screen.findByRole('region', {
    name: 'Disponibilidade da frota',
  })
  expect(
    within(availability).getByText('Nenhum veículo ativo na frota.'),
  ).toBeInTheDocument()
  expect(
    within(availability).getByRole('link', { name: 'Ir para Veículos' }),
  ).toHaveAttribute('href', '/veiculos')
})

test('sem permissão de manutenções, os blocos de alertas e manutenções ficam ocultos', async () => {
  mockUser(['veiculos:ler'])
  renderHome()
  await screen.findByRole('region', { name: 'Disponibilidade da frota' })
  expect(
    screen.queryByRole('region', { name: 'Alertas da frota' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText('Manutenções agendadas')).not.toBeInTheDocument()
  expect(screen.queryByText('Alertas operacionais')).not.toBeInTheDocument()
  expect(getAlertSummary).not.toHaveBeenCalled()
  expect(maintenanceService.list).not.toHaveBeenCalled()
})

test('sem permissão de veículos, os blocos da frota ficam ocultos', async () => {
  mockUser(['manutencoes:ler'])
  renderHome()
  await findAlertsCard()
  expect(screen.queryByRole('link', { name: /Frota ativa hoje/ })).not.toBeInTheDocument()
  expect(
    screen.queryByRole('region', { name: 'Disponibilidade da frota' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText('Veículos disponíveis')).not.toBeInTheDocument()
  expect(getVehicles).not.toHaveBeenCalled()
})
