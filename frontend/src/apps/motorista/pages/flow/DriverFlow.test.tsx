import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { DriverRoutes } from '../../DriverApp'
import { api } from '@/service/api'
import type { DriverTrip } from '../../types'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
vi.mock('@/components/RequireAuth/RequireAuth', async () => ({
  RequireAuth: (await import('react-router-dom')).Outlet,
}))
const id = '40000000-0000-4000-8000-000000000001'
const foto =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII='
let trip: DriverTrip
let fail: boolean
beforeEach(() => {
  vi.resetAllMocks()
  fail = false
  trip = {
    id,
    veiculo_id: '30000000-0000-4000-8000-000000000001',
    motorista_id: 'driver',
    status: 'Agendada',
    placa: 'TEST001',
    modelo: 'Viatura de teste',
    identificacao: 'SVO-128',
    quilometragem: 90,
    tipo_combustivel: 'Diesel',
    km_inicial: null,
    km_final: null,
    data_inicio: null,
    data_fim: null,
    data_necessidade: null,
    criado_em: '2026-11-12T12:00:00Z',
    categoria: 'SVO',
    flag_urgencia: false,
  }
  vi.mocked(api).mockImplementation(async (path, options) => {
    if (options?.method === 'POST') {
      if (fail) throw new Error('Falha de conexão. Tente novamente.')
      const body = JSON.parse(options.body as string) as { km: number }
      trip = {
        ...trip,
        quilometragem: body.km,
        status: path.endsWith('iniciar') ? 'Em deslocamento' : 'Finalizada',
        ...(path.endsWith('iniciar') ? { km_inicial: body.km } : { km_final: body.km }),
      }
    }
    if (options?.method === 'PATCH') trip = { ...trip, status: 'Em andamento' }
    return { message: trip } as never
  })
})
function mount(path = `/viagens/${id}/inicio/identificar`) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <DriverRoutes />
    </MemoryRouter>,
  )
}
async function identify() {
  await userEvent.type(await screen.findByLabelText('Código do veículo'), 'SVO-128')
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar veículo' }))
}
async function capture(km: string) {
  const bytes = Uint8Array.from(atob(foto), (c) => c.charCodeAt(0))
  await userEvent.upload(
    await screen.findByLabelText(/Foto do painel \(JPG/),
    new File([bytes], 'painel.png', { type: 'image/png' }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Informar quilometragem' }))
  await userEvent.type(await screen.findByLabelText('Quilometragem (km)'), km)
  await userEvent.click(screen.getByRole('button', { name: 'Salvar leitura' }))
}
test('código incorreto não avança nem grava uma viagem', async () => {
  mount()
  await userEvent.type(await screen.findByLabelText('Código do veículo'), 'OUTRO')
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar veículo' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('não corresponde')
  expect(vi.mocked(api).mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false)
})
test('foto e leitura reais são confirmadas antes do início e da finalização', async () => {
  mount()
  await identify()
  await capture('100')
  await userEvent.click(
    await screen.findByRole('button', { name: 'Confirmar e iniciar viagem' }),
  )
  expect(await screen.findByText('Em deslocamento')).toBeVisible()
  expect(api).toHaveBeenCalledWith(`/motorista/viagens/${id}/iniciar`, {
    method: 'POST',
    body: JSON.stringify({ km: 100, foto: `data:image/png;base64,${foto}` }),
  })
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar chegada' }))
  expect(await screen.findByText('Em andamento')).toBeVisible()
  await userEvent.click(screen.getByRole('link', { name: 'Finalizar viagem' }))
  await capture('110')
  await userEvent.click(
    await screen.findByRole('button', { name: 'Confirmar finalização' }),
  )
  expect(await screen.findByText('Finalizada')).toBeVisible()
  expect(screen.getByText('Percorrido: 10 km')).toBeInTheDocument()
})
test('falha de envio preserva foto e leitura para tentar novamente', async () => {
  fail = true
  mount()
  await identify()
  await capture('100')
  await userEvent.click(
    await screen.findByRole('button', { name: 'Confirmar e iniciar viagem' }),
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Falha de conexão')
  expect(screen.getByAltText('Foto do painel a ser registrada')).toBeVisible()
  expect(screen.getByText('100 km')).toBeVisible()
  fail = false
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirmar e iniciar viagem' }),
  )
  expect(await screen.findByText('Em deslocamento')).toBeVisible()
})
test('recarregar confirmação sem evidência não inicia uma viagem', async () => {
  mount(`/viagens/${id}/inicio/quilometragem`)
  expect(await screen.findByText('Leitura não disponível')).toBeVisible()
  expect(vi.mocked(api).mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false)
})
test('bloqueia confirmação de km menor que o último registro', async () => {
  mount()
  await identify()
  await capture('80')
  expect(await screen.findByRole('alert')).toHaveTextContent('igual ou superior')
  expect(
    screen.getByRole('button', { name: 'Confirmar e iniciar viagem' }),
  ).toBeDisabled()
})
test('estado final da viagem não mostra ações de início ou finalização', async () => {
  trip.status = 'Cancelada'
  mount(`/viagens/${id}`)
  await waitFor(() => expect(screen.getByText('Cancelada')).toBeVisible())
  expect(
    screen.queryByRole('link', { name: 'Identificar veículo' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Finalizar viagem' })).not.toBeInTheDocument()
})
