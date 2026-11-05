import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'
import { TRACKING_POLL_MS } from './hooks/useRequestTracking'
import { getRequestTracking } from './services/requestService'
import type { RequestTracking } from './types'

vi.mock('./services/requestService', () => ({
  createRequest: vi.fn<() => Promise<never>>(),
  getRequestTracking: vi.fn<typeof getRequestTracking>(),
}))

// Última posição recebida às 09:41 (horário local); a tela abre 12 s depois.
const UPDATED_AT = new Date(2026, 9, 26, 9, 41, 0)

function makeTracking(overrides: Partial<RequestTracking> = {}): RequestTracking {
  return {
    requestId: 'abc',
    code: '1842',
    stage: 'a_caminho',
    progress: 0.3,
    remainingKm: 2.3,
    etaMinutes: 6,
    updatedAt: UPDATED_AT.toISOString(),
    origin: 'Central SVO',
    destination: 'Hospital de Urgência de Sergipe',
    driver: { name: 'Rafael Mendes', phone: '79998765432' },
    vehicle: { model: 'Chevrolet Spin', plate: 'QWE-4J18' },
    pickup: {
      address: 'Av. Ipiranga, 1.234 · Portão 2',
      instructions: 'Aguarde no Portão 2. O motorista verá este ponto de embarque.',
    },
    ...overrides,
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

function currentStep() {
  const steps = screen.getByRole('list', { name: 'Etapas da viagem' })
  return within(steps).getByRole('listitem', { current: 'step' })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(UPDATED_AT.getTime() + 12_000))
  vi.mocked(getRequestTracking).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

test('mostra motorista, placa, tempo estimado e etapa atual', async () => {
  vi.mocked(getRequestTracking).mockResolvedValue(makeTracking())
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderAt('/viagens/abc')

  expect(screen.getByRole('heading', { level: 1, name: 'SIVOF' })).toBeInTheDocument()
  expect(screen.getByText('Acompanhar rota')).toBeInTheDocument()
  const driverCard = await screen.findByRole('region', { name: 'Motorista' })
  expect(getRequestTracking).toHaveBeenCalledWith('abc')

  expect(within(driverCard).getByText('Rafael Mendes')).toBeInTheDocument()
  expect(within(driverCard).getByText('Chevrolet Spin · QWE-4J18')).toBeInTheDocument()
  expect(screen.getByText('Motorista a caminho')).toBeInTheDocument()
  expect(screen.getByText(/Localização atualizada há \d+ s/)).toBeInTheDocument()
  expect(screen.getByText('6 min')).toBeInTheDocument()
  expect(screen.getByText('previsão 09:47')).toBeInTheDocument()
  expect(screen.getByText('2,3 km')).toBeInTheDocument()
  expect(screen.getByText('Em aproximação')).toBeInTheDocument()
  expect(currentStep()).toHaveTextContent('A caminho (etapa atual)')
  expect(screen.getByText('Av. Ipiranga, 1.234 · Portão 2')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ligar para Rafael Mendes' })).toHaveAttribute(
    'href',
    'tel:79998765432',
  )
  expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/viagens')

  const details = screen.getByRole('button', { name: 'Ver detalhes' })
  expect(details).toHaveAttribute('aria-expanded', 'false')
  expect(
    screen.queryByRole('heading', { name: 'Detalhes da solicitação' }),
  ).not.toBeInTheDocument()
  await user.click(details)
  expect(
    screen.getByRole('heading', { name: 'Detalhes da solicitação' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Hospital de Urgência de Sergipe')).toBeInTheDocument()
})

test('atualiza a posição em tempo real e para ao chegar ao embarque', async () => {
  vi.mocked(getRequestTracking)
    .mockResolvedValueOnce(makeTracking())
    .mockResolvedValueOnce(
      makeTracking({ stage: 'chegando', progress: 0.9, remainingKm: 0.3, etaMinutes: 1 }),
    )
    .mockResolvedValue(
      makeTracking({ stage: 'embarque', progress: 1, remainingKm: 0, etaMinutes: 0 }),
    )
  renderAt('/viagens/abc')

  expect(await screen.findByText('Motorista a caminho')).toBeInTheDocument()

  await act(() => vi.advanceTimersByTimeAsync(TRACKING_POLL_MS))
  expect(await screen.findByText('Motorista chegando')).toBeInTheDocument()
  expect(screen.getByText('1 min')).toBeInTheDocument()
  expect(screen.getByText('0,3 km')).toBeInTheDocument()
  expect(currentStep()).toHaveTextContent('Chegando (etapa atual)')

  await act(() => vi.advanceTimersByTimeAsync(TRACKING_POLL_MS))
  expect(await screen.findByText('Motorista no ponto de embarque')).toBeInTheDocument()
  expect(screen.getByText('Agora')).toBeInTheDocument()
  expect(currentStep()).toHaveTextContent('Embarque (etapa atual)')

  // Depois do embarque não há mais consultas.
  const callsAtArrival = vi.mocked(getRequestTracking).mock.calls.length
  await act(() => vi.advanceTimersByTimeAsync(TRACKING_POLL_MS * 3))
  expect(getRequestTracking).toHaveBeenCalledTimes(callsAtArrival)
})

test('mostra erro com "Tentar novamente" quando o acompanhamento falha', async () => {
  vi.mocked(getRequestTracking)
    .mockRejectedValueOnce(new Error('Falha de rede'))
    .mockResolvedValue(makeTracking())
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderAt('/viagens/abc')

  expect(
    await screen.findByText('Não foi possível carregar o acompanhamento.'),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

  expect(await screen.findByText('Rafael Mendes')).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
