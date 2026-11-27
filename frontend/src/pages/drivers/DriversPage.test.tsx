import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'

function renderDrivers(path = '/motoristas') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

test('lista os motoristas e o resumo, com paginação', async () => {
  renderDrivers()

  expect(
    await screen.findByRole('table', { name: /motoristas da frota/i }),
  ).toBeInTheDocument()
  expect(screen.getByText('João da Silva')).toBeInTheDocument()
  expect(screen.getByText(/mostrando 5 de 8 motoristas/i)).toBeInTheDocument()
  expect(screen.getByText('Motoristas ativos')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))

  expect(screen.getByText(/mostrando 3 de 8 motoristas/i)).toBeInTheDocument()
})

test('filtra por nome e informa quando não há resultados', async () => {
  const user = userEvent.setup()
  renderDrivers()
  await screen.findByRole('table')

  await user.type(screen.getByRole('searchbox', { name: /buscar motoristas/i }), 'maria')
  expect(screen.getByText('Maria Oliveira')).toBeInTheDocument()
  expect(screen.queryByText('João da Silva')).not.toBeInTheDocument()

  await user.clear(screen.getByRole('searchbox', { name: /buscar motoristas/i }))
  await user.type(screen.getByRole('searchbox', { name: /buscar motoristas/i }), 'zzz')
  expect(screen.getByText('Nenhum motorista encontrado.')).toBeInTheDocument()
})

test('"Revisar alertas" mostra só quem tem CNH vencida ou a vencer', async () => {
  const user = userEvent.setup()
  renderDrivers()
  await screen.findByRole('table')

  await user.click(screen.getByRole('button', { name: /revisar alertas/i }))

  const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.length).toBeLessThan(8)
  expect(screen.getByRole('button', { name: /mostrar todos/i })).toBeInTheDocument()
})

test('exclui um motorista depois de confirmar', async () => {
  const user = userEvent.setup()
  renderDrivers()
  await screen.findByRole('table')

  await user.click(screen.getByRole('button', { name: 'Excluir João da Silva' }))
  expect(screen.getByRole('heading', { name: /excluir motorista/i })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Excluir' }))

  expect(await screen.findByText(/joão da silva foi excluído/i)).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Excluir João da Silva' }),
  ).not.toBeInTheDocument()
})

test('abre os detalhes de um motorista', async () => {
  const user = userEvent.setup()
  renderDrivers()
  await screen.findByRole('table')

  await user.click(screen.getByRole('link', { name: 'Ver detalhes de João da Silva' }))

  expect(
    await screen.findByRole('heading', { name: 'João da Silva' }),
  ).toBeInTheDocument()
  expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
  expect(screen.getByText('Liberado')).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
