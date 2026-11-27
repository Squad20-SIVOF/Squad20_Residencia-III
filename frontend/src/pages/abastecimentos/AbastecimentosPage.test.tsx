import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, onTestFinished, test, vi } from 'vitest'
import { currentUser } from '@/service/authService'
import AbastecimentosPage from './AbastecimentosPage'
import { fuelService, type FuelRecord } from './services/fuelService'

vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))

test('pagina o histórico e volta à primeira página ao filtrar', async () => {
  const records = Array.from({ length: 13 }, (_, index): FuelRecord => ({
    id: String(index + 1),
    veiculo_id: 'vehicle',
    motorista_id: 'driver',
    data_abastecimento: '2026-11-12T12:00:00-03:00',
    combustivel: 'Diesel',
    posto: 'Posto de teste',
    litros: 20,
    preco_litro: 8,
    valor_total: 160,
    km_momento_abastecimento: 10000,
    alerta_teto_excedido: false,
    placa: 'ABC1D23',
    modelo: 'Veículo de teste',
    identificacao: 'SVO01',
    motorista_nome: `Motorista ${index + 1}`,
    teto_gasto_mensal: null,
  }))
  using list = vi.spyOn(fuelService, 'list').mockResolvedValue(records)
  const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  onTestFinished(() => {
    scrollTo.mockRestore()
  })
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor de teste',
    email: 'gestor@example.invalid',
    permissoes: ['abastecimentos:ler'],
  })
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <AbastecimentosPage />
    </MemoryRouter>,
  )

  const table = within(
    await screen.findByRole('table', { name: 'Histórico de abastecimentos' }),
  )
  const pagination = within(
    screen.getByRole('navigation', { name: 'Paginação de abastecimentos' }),
  )
  const previous = pagination.getByRole('button', { name: 'Anterior' })
  const next = pagination.getByRole('button', { name: 'Próxima' })
  expect(table.getAllByRole('row')).toHaveLength(6)
  expect(previous).toBeDisabled()
  expect(next).toBeEnabled()

  await user.click(next)
  expect(table.getByText('Motorista 6')).toBeVisible()
  await user.click(next)
  expect(table.getByText('Motorista 13')).toBeVisible()
  expect(next).toBeDisabled()
  await user.click(previous)
  expect(pagination.getByText('Página 2 de 3')).toBeVisible()

  await user.type(
    screen.getByRole('searchbox', { name: 'Buscar motorista ou posto' }),
    'Motorista 13',
  )
  expect(pagination.getByText('Página 1 de 1')).toBeVisible()
  expect(previous).toBeDisabled()
  expect(next).toBeDisabled()
  expect(table.getByText('Motorista 13')).toBeVisible()
  expect(list).toHaveBeenCalledTimes(1)
})
