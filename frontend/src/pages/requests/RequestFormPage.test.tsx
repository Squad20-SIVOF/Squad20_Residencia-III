import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'
import { REDIRECT_DELAY_MS } from './RequestFormPage'
import { createRequest } from './services/requestService'

// Expõe a URL atual para conferir redirecionamentos e navegações.
function CurrentPath() {
  return <output aria-label="URL atual">{useLocation().pathname}</output>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <CurrentPath />
    </MemoryRouter>,
  )
}

test('renderiza o formulário de solicitação no item Viagens', async () => {
  renderAt('/viagens/solicitar')

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Solicitar Veículo' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Preencha os dados abaixo para solicitar uma viagem institucional.'),
  ).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Rota da Solicitação' })).toBeInTheDocument()
  expect(
    screen.getByRole('region', { name: 'Mapa da rota entre a origem e o destino' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText('A solicitação será enviada para aprovação do gestor.'),
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Origem')).toHaveValue('Central SVO')
  expect(screen.getByLabelText('Setor solicitante')).toHaveValue('Administrativo')
  expect(screen.getByText('Status: Aguardando aprovação')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar Solicitação' })).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Ver solicitações pendentes' }),
  ).toHaveAttribute('href', '/viagens/solicitacoes')
  // Só veículos disponíveis entram como preferência.
  expect(
    await screen.findByRole('option', { name: /Fiat Fiorino · ABC-1D23/ }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /Renault Master/ })).not.toBeInTheDocument()
})

test('mostra o link de voltar ao Painel de Viagens acima do título', async () => {
  const user = userEvent.setup()
  renderAt('/viagens/solicitar')

  const backLink = await screen.findByRole('link', {
    name: /voltar para o painel de viagens/i,
  })
  expect(backLink).toHaveAttribute('href', '/viagens')
  expect(
    backLink.compareDocumentPosition(
      screen.getByRole('heading', { level: 1, name: 'Solicitar Veículo' }),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()

  await user.click(backLink)
  expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent(
    /^\/viagens$/,
  )
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Painel de Viagens' }),
  ).toBeInTheDocument()
})

test('não envia sem os campos obrigatórios e foca o primeiro erro', async () => {
  const user = userEvent.setup()
  renderAt('/viagens/solicitar')

  await user.click(await screen.findByRole('button', { name: 'Enviar Solicitação' }))

  expect(screen.getByText('Corrija os campos destacados.')).toBeInTheDocument()
  expect(screen.getByText('Informe o destino.')).toBeInTheDocument()
  expect(screen.getByText('Descreva o motivo da solicitação.')).toBeInTheDocument()
  expect(screen.getByLabelText('Destino')).toHaveFocus()
  expect(screen.getByLabelText('Destino')).toHaveAttribute('aria-invalid', 'true')
})

test('limita os passageiros à lotação do veículo escolhido', async () => {
  const user = userEvent.setup()
  renderAt('/viagens/solicitar')

  await user.selectOptions(
    await screen.findByLabelText('Veículo preferencial'),
    await screen.findByRole('option', { name: /Fiat Fiorino/ }),
  )
  await user.type(screen.getByLabelText('Nº de passageiros'), '5')
  await user.click(screen.getByRole('button', { name: 'Enviar Solicitação' }))

  expect(
    screen.getByText('O veículo escolhido leva no máximo 2 passageiros.'),
  ).toBeInTheDocument()
})

const SENT_MESSAGE = 'Solicitação enviada! Aguardando aprovação do gestor.'

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByLabelText('Destino'),
    'Hospital de Urgência de Sergipe',
  )
  await user.type(screen.getByLabelText('Data da solicitação'), '31122099')
  await user.type(screen.getByLabelText('Horário de saída'), '0830')
  await user.type(screen.getByLabelText('Horário retorno previsto'), '1200')
  await user.type(screen.getByLabelText('Nº de passageiros'), '2')
  await user.type(
    screen.getByLabelText('Motivo da solicitação'),
    'Transporte de equipe para coleta.',
  )
  await user.click(screen.getByRole('checkbox', { name: 'Marcar como importante' }))
  await user.click(screen.getByRole('button', { name: 'Enviar Solicitação' }))
}

// O aviso usa role="status" para ser anunciado pelo leitor de tela.
async function findSentNotice() {
  const message = await screen.findByText(SENT_MESSAGE)
  const notice = message.closest<HTMLElement>('[role="status"]')
  expect(notice).not.toBeNull()
  return notice as HTMLElement
}

function currentPath() {
  return screen.getByRole('status', { name: 'URL atual' })
}

afterEach(() => {
  vi.useRealTimers()
})

test('mostra o aviso de envio e redireciona para as solicitações pendentes', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderAt('/viagens/solicitar')

  await fillAndSubmit(user)

  await findSentNotice()
  expect(
    screen.getByRole('link', { name: 'Ver solicitações pendentes' }),
  ).toHaveAttribute('href', '/viagens/solicitacoes')
  expect(createRequest).toHaveBeenCalledOnce()
  // O aviso aparece antes do redirecionamento.
  expect(currentPath()).toHaveTextContent('/viagens/solicitar')

  await act(() => vi.advanceTimersByTimeAsync(REDIRECT_DELAY_MS))

  expect(currentPath()).toHaveTextContent(/^\/viagens\/solicitacoes$/)
  expect(
    await screen.findByRole('heading', { level: 1, name: 'Solicitações Pendentes' }),
  ).toBeInTheDocument()
})

test('mostra o erro de envio e permanece na tela', async () => {
  vi.mocked(createRequest).mockRejectedValueOnce(new Error('Falha na conexão.'))
  const user = userEvent.setup()
  renderAt('/viagens/solicitar')

  await fillAndSubmit(user)

  expect(await screen.findByRole('alert')).toHaveTextContent('Falha na conexão.')
  expect(screen.queryByText(SENT_MESSAGE)).not.toBeInTheDocument()
  expect(currentPath()).toHaveTextContent('/viagens/solicitar')
  expect(screen.getByRole('button', { name: 'Enviar Solicitação' })).toBeEnabled()
})

vi.mock('./services/requestService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/requestService')>()
  return {
    ...actual,
    createRequest: vi.fn<typeof actual.createRequest>().mockResolvedValue({} as never),
  }
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
