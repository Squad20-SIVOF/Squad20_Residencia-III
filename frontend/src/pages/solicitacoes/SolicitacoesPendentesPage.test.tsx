import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import SolicitacoesPendentesPage from './SolicitacoesPendentesPage'
import { api } from '@/service/api'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
const id = '11111111-1111-4111-8111-111111111111'
let total: number
beforeEach(() => {
  vi.resetAllMocks()
  total = 6
  vi.mocked(api).mockImplementation(
    async (path) =>
      ({
        message: {
          dados: [
            {
              id: path.includes('pagina=2') ? '22222222-2222-4222-8222-222222222222' : id,
              categoria: 'SVO',
              solicitante_nome: 'Maria Real',
              setor_nome: 'Operacional',
              flag_urgencia: true,
              data_necessidade: '2026-12-01T12:00:00Z',
            },
          ],
          total,
          pagina: path.includes('pagina=2') ? 2 : 1,
          limite: 5,
        },
      }) as never,
  )
})
function mount() {
  render(
    <MemoryRouter>
      <SolicitacoesPendentesPage />
    </MemoryRouter>,
  )
}
test('consulta pendentes reais e abre detalhes pelo UUID, sem ações simuladas', async () => {
  mount()
  expect(await screen.findByText('Maria Real')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/solicitacoes?status=Pendente&pagina=1&limite=5')
  expect(
    screen.getByRole('link', { name: 'Ver detalhes da solicitação #11111111' }),
  ).toHaveAttribute('href', `/viagens/solicitacoes/${id}`)
  for (const action of ['Aprovar', 'Recusar'])
    expect(screen.getByRole('button', { name: action })).toBeDisabled()
  expect(
    screen.getByRole('link', {
      name: 'Atribuir veículo e motorista à solicitação #11111111',
    }),
  ).toHaveAttribute('href', `/viagens/solicitacoes/${id}/atribuir`)
  expect(screen.getByText('6 pendentes')).toBeInTheDocument()
})
test('paginação consulta a próxima página na API', async () => {
  mount()
  await userEvent.click(await screen.findByRole('button', { name: 'Próxima' }))
  expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith('/solicitacoes?status=Pendente&pagina=2&limite=5')
  expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
})
test('busca é explicitamente limitada à página carregada', async () => {
  mount()
  await userEvent.type(await screen.findByLabelText('Buscar nesta página'), 'ausente')
  expect(
    screen.getByText('Nenhuma solicitação encontrada nesta página.'),
  ).toBeInTheDocument()
  expect(api).toHaveBeenCalledTimes(1)
})
test('erro do servidor não gera uma lista fictícia', async () => {
  vi.mocked(api).mockRejectedValue(new Error('Permissão insuficiente'))
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Permissão insuficiente')
  expect(screen.queryByText('Maria Real')).not.toBeInTheDocument()
})
test('sem pendências reais, mostra os exemplos sinalizados com detalhes locais', async () => {
  vi.mocked(api).mockResolvedValue({
    message: { dados: [], total: 0, pagina: 1, limite: 5 },
  })
  mount()
  expect(await screen.findByText('Nenhuma solicitação pendente.')).toBeInTheDocument()
  expect(screen.getByText('Demonstração')).toBeVisible()
  expect(
    screen.getByRole('heading', { name: 'Descrição da Solicitação #2401' }),
  ).toBeVisible()
  expect(
    screen.getByRole('heading', { name: 'Descrição da Solicitação #2402' }),
  ).toBeVisible()
  await userEvent.click(
    screen.getByRole('button', { name: 'Ver detalhes da solicitação #2401' }),
  )
  const details = within(
    screen.getByRole('dialog', { name: 'Detalhes da Solicitação #2401' }),
  )
  expect(details.getByText('Central SVO')).toBeVisible()
  expect(details.getByText('Equipamentos')).toBeVisible()
  expect(details.getByText('Hoje · 10:30')).toBeVisible()
  expect(details.getByRole('link', { name: 'Atribuir' })).toHaveAttribute(
    'href',
    '/viagens/solicitacoes/exemplo-2401/atribuir',
  )
  await userEvent.click(details.getByRole('button', { name: 'Fechar' }))
  expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  expect(api).toHaveBeenCalledTimes(1)
})
test('o botão Atribuir abre a tela de atribuir veículo e motorista', async () => {
  function AssignRoute() {
    return <p>Atribuindo {useParams().id}</p>
  }
  render(
    <MemoryRouter initialEntries={['/viagens/solicitacoes']}>
      <Routes>
        <Route path="/viagens/solicitacoes" element={<SolicitacoesPendentesPage />} />
        <Route path="/viagens/solicitacoes/:id/atribuir" element={<AssignRoute />} />
      </Routes>
    </MemoryRouter>,
  )
  await userEvent.click(
    await screen.findByRole('link', { name: /^Atribuir veículo e motorista/ }),
  )
  expect(screen.getByText(`Atribuindo ${id}`)).toBeInTheDocument()
})
