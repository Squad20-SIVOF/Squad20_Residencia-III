import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import type { RequestRecord } from './services/requestApi'
import { TripsPanelPage } from './TripsPanelPage'

vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))

const URGENT_ID = '22222222-2222-4222-8222-222222222222'
const REGULAR_ID = '11111111-1111-4111-8111-111111111111'

function record(overrides: Partial<RequestRecord>): RequestRecord {
  return {
    id: REGULAR_ID,
    solicitante_id: null,
    solicitante_nome: 'Maria Real',
    setor_nome: 'Administrativo',
    categoria: 'Documentos Oficiais',
    flag_urgencia: false,
    data_necessidade: '2026-12-01T09:00:00Z',
    criado_em: '2026-11-10T12:00:00Z',
    status: 'Pendente',
    ...overrides,
  }
}

let rows: RequestRecord[]
let total: number

beforeEach(() => {
  vi.resetAllMocks()
  rows = [
    record({}),
    record({
      id: URGENT_ID,
      setor_nome: 'Logística',
      categoria: 'Equipamentos',
      flag_urgencia: true,
      data_necessidade: '2026-12-02T13:30:00Z',
      criado_em: '2026-11-12T12:00:00Z',
    }),
  ]
  total = 2
  vi.mocked(api).mockImplementation(
    async () => ({ message: { dados: rows, total, pagina: 1, limite: 20 } }) as never,
  )
})

// Expõe a URL atual para conferir para onde cada ligação leva.
function CurrentPath() {
  return <output aria-label="URL atual">{useLocation().pathname}</output>
}

function renderPanel() {
  render(
    <MemoryRouter initialEntries={['/viagens']}>
      <Routes>
        <Route path="/viagens" element={<TripsPanelPage />} />
        <Route path="*" element={<p>Outra tela</p>} />
      </Routes>
      <CurrentPath />
    </MemoryRouter>,
  )
}

function currentPath() {
  return screen.getByRole('status', { name: 'URL atual' })
}

function pendingTable() {
  return screen.findByRole('table', { name: 'Solicitações de viagens pendentes' })
}

/** Códigos dos pedidos na ordem em que aparecem na tabela. */
async function requestCodes() {
  const table = await pendingTable()
  return within(table)
    .getAllByRole('link', { name: /^Ver detalhes da solicitação/ })
    .map((link) =>
      link.getAttribute('aria-label')?.replace('Ver detalhes da solicitação ', ''),
    )
}

test('mostra o título, as ações rápidas e os links para as outras telas de Viagens', () => {
  renderPanel()

  expect(
    screen.getByRole('heading', { level: 1, name: 'Painel de Viagens' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      'Gerencie solicitações, acompanhe rotas e inicie novos atendimentos de viagens.',
    ),
  ).toBeInTheDocument()
  for (const title of ['Solicitar Veículo', 'Mapa de Rotas', 'Novo Atendimento SVO'])
    expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()

  expect(screen.getByRole('link', { name: 'Nova solicitação' })).toHaveAttribute(
    'href',
    '/viagens/solicitar',
  )
  expect(screen.getByRole('link', { name: 'Iniciar atendimento' })).toHaveAttribute(
    'href',
    '/viagens/atendimento-svo',
  )
  expect(screen.getByRole('link', { name: 'Ver todas' })).toHaveAttribute(
    'href',
    '/viagens/solicitacoes',
  )
})

test('Mapa de Rotas aparece como "Em breve", desabilitado e sem destino', async () => {
  const user = userEvent.setup()
  renderPanel()

  for (const name of ['Acessar mapa Em breve', 'Abrir mapa de rotas Em breve']) {
    const link = screen.getByRole('link', { name })
    expect(link).toHaveAttribute('aria-disabled', 'true')
    expect(link).not.toHaveAttribute('href')
    await user.click(link)
    expect(currentPath()).toHaveTextContent(/^\/viagens$/)
  }
})

test('o link Nova solicitação abre o formulário de solicitação', async () => {
  const user = userEvent.setup()
  renderPanel()

  await user.click(screen.getByRole('link', { name: 'Nova solicitação' }))
  expect(currentPath()).toHaveTextContent(/^\/viagens\/solicitar$/)
})

test('Ver todas abre a lista de solicitações pendentes', async () => {
  const user = userEvent.setup()
  renderPanel()

  await user.click(screen.getByRole('link', { name: 'Ver todas' }))
  expect(currentPath()).toHaveTextContent(/^\/viagens\/solicitacoes$/)
})

test('lista as pendentes reais, com "Importante", trajeto não informado e rodapé', async () => {
  renderPanel()

  const table = await pendingTable()
  expect(api).toHaveBeenCalledWith('/solicitacoes?status=Pendente&pagina=1&limite=20')
  expect(screen.getByText('2 pendentes')).toBeInTheDocument()
  expect(within(table).getByText('#22222222')).toBeInTheDocument()
  expect(within(table).getByText('Importante')).toBeInTheDocument()
  expect(within(table).getByText('Equipamentos')).toBeInTheDocument()
  expect(within(table).getByText('Logística')).toBeInTheDocument()
  expect(within(table).getAllByText('Não informado')).toHaveLength(2)
  expect(within(table).getAllByText('Pendente')).toHaveLength(2)
  expect(screen.getByText('Exibindo 2 de 2 solicitações pendentes')).toBeInTheDocument()
  expect(screen.getByText('1 solicitação importante')).toBeInTheDocument()
})

test('Ver detalhes da solicitação abre os detalhes pelo ID', async () => {
  const user = userEvent.setup()
  renderPanel()

  const details = await screen.findByRole('link', {
    name: 'Ver detalhes da solicitação #22222222',
  })
  expect(details).toHaveAttribute('href', `/viagens/solicitacoes/${URGENT_ID}`)
  await user.click(details)
  expect(currentPath()).toHaveTextContent(`/viagens/solicitacoes/${URGENT_ID}`)
})

test('a busca filtra por ID ou setor e avisa quando nada é encontrado', async () => {
  const user = userEvent.setup()
  renderPanel()

  const search = await screen.findByRole('searchbox', {
    name: 'Buscar solicitação pendente',
  })
  expect(search).toHaveAttribute('placeholder', 'Buscar por ID ou setor...')

  await user.type(search, 'logistica')
  expect(await requestCodes()).toEqual(['#22222222'])

  await user.clear(search)
  await user.type(search, '#1111')
  expect(await requestCodes()).toEqual(['#11111111'])

  await user.clear(search)
  await user.type(search, 'inexistente')
  expect(
    screen.getByText('Nenhuma solicitação encontrada para “inexistente”.'),
  ).toBeInTheDocument()
  expect(screen.getByText('Exibindo 0 de 2 solicitações pendentes')).toBeInTheDocument()
})

test('ordena com as importantes primeiro e permite trocar a ordenação', async () => {
  const user = userEvent.setup()
  renderPanel()

  const sort = await screen.findByRole('combobox', { name: 'Ordenar solicitações' })
  expect(sort).toHaveDisplayValue('Importantes primeiro')
  expect(await requestCodes()).toEqual(['#22222222', '#11111111'])

  await user.selectOptions(sort, 'Data mais próxima')
  expect(await requestCodes()).toEqual(['#11111111', '#22222222'])
})

test('mostra no máximo 5 solicitações no Painel', async () => {
  rows = Array.from({ length: 7 }, (_, index) =>
    record({ id: `${index}0000000-0000-4000-8000-000000000000` }),
  )
  total = 7
  renderPanel()

  expect(await requestCodes()).toHaveLength(5)
  expect(screen.getByText('Exibindo 5 de 7 solicitações pendentes')).toBeInTheDocument()
  expect(screen.queryByText(/solicitaç(ão|ões) importantes?$/)).not.toBeInTheDocument()
})

test('erro na API oferece "Tentar novamente" e recarrega a lista', async () => {
  const user = userEvent.setup()
  vi.mocked(api).mockRejectedValueOnce(new Error('Permissão insuficiente'))
  renderPanel()

  expect(await screen.findByRole('alert')).toHaveTextContent('Permissão insuficiente')
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(await pendingTable()).toBeInTheDocument()
  expect(api).toHaveBeenCalledTimes(2)
})

test('sem pendentes mostra o estado vazio', async () => {
  rows = []
  total = 0
  renderPanel()

  expect(await screen.findByText('Nenhuma solicitação pendente.')).toBeInTheDocument()
  expect(screen.getByText('0 pendentes')).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

test('as viagens em acompanhamento levam ao acompanhamento da rota', async () => {
  const user = userEvent.setup()
  renderPanel()

  expect(await screen.findByText('4 viagens')).toBeInTheDocument()
  const list = screen.getByRole('list')
  expect(within(list).getAllByRole('link')).toHaveLength(4)
  for (const status of ['Em viagem', 'A caminho', 'Atraso 12 min', 'Programada'])
    expect(within(list).getByText(status)).toBeInTheDocument()
  expect(within(list).getByText('ABC-1D23 · João da Silva')).toBeInTheDocument()

  const trip = within(list).getByRole('link', {
    name: /^Acompanhar Rota #101, Em viagem/,
  })
  expect(trip).toHaveAttribute('href', '/viagens/demo-rota-101')
  await user.click(trip)
  expect(currentPath()).toHaveTextContent('/viagens/demo-rota-101')
})
