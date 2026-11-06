import * as authService from '@/service/authService'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { DriverRoutes } from './DriverApp'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DriverRoutes />
    </MemoryRouter>,
  )
}

test('abre o início do motorista com a barra de abas', async () => {
  renderAt('/')

  expect(
    await screen.findByRole('heading', { name: /olá, carlos/i }, { timeout: 5000 }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('navigation', { name: /navegação do motorista/i }),
  ).toBeVisible()
  expect(screen.getByText('Próxima viagem')).toBeInTheDocument()
})

test('navega para as viagens pela barra de abas', async () => {
  const user = userEvent.setup()
  renderAt('/')

  await user.click(await screen.findByRole('link', { name: 'Viagens' }))

  expect(
    await screen.findByRole('heading', { name: 'Minhas viagens' }),
  ).toBeInTheDocument()
  expect(await screen.findByText('VG-2041')).toBeInTheDocument()
})

test('valida o formulário de abastecimento', async () => {
  vi.spyOn(authService, 'currentUser').mockResolvedValueOnce({
    id: 'user',
    nome: 'Motorista',
    email: 'motorista@example.com',
    permissoes: ['abastecimentos:criar-proprio'],
  })
  const user = userEvent.setup()
  renderAt('/abastecimento')

  await user.click(await screen.findByRole('button', { name: 'Salvar abastecimento' }))

  expect(screen.getByLabelText('Volume abastecido (L) *')).toBeInvalid()
})

test('avisa quando o aparelho fica sem internet', async () => {
  renderAt('/')
  await screen.findByRole('heading', { name: /olá, carlos/i })

  window.dispatchEvent(new Event('offline'))
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  window.dispatchEvent(new Event('offline'))

  expect(await screen.findByText(/sem conexão/i)).toBeInTheDocument()
  vi.restoreAllMocks()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})

vi.mock('@/pages/abastecimentos/services/fuelService', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/pages/abastecimentos/services/fuelService')>()
  return {
    ...original,
    fuelService: {
      ...original.fuelService,
      ownOptions: async () => ({
        veiculos: [],
        motoristas: [{ id: 'driver', nome: 'Motorista de teste' }],
      }),
    },
  }
})
