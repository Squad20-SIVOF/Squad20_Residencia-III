import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { api } from '@/service/api'
import { RequireDriverVehicle } from './RequireDriverVehicle'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
function mount() {
  render(
    <MemoryRouter initialEntries={['/viagens']}>
      <Routes>
        <Route element={<RequireDriverVehicle />}>
          <Route path="viagens" element={<h1>Viagens liberadas</h1>} />
        </Route>
        <Route path="veiculo-sessao" element={<h1>Identificar veículo</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}
test('sem vínculo, acesso direto retorna à identificação', async () => {
  vi.mocked(api).mockResolvedValue({ message: null } as never)
  mount()
  expect(
    await screen.findByRole('heading', { name: 'Identificar veículo' }),
  ).toBeVisible()
  expect(screen.queryByText('Viagens liberadas')).not.toBeInTheDocument()
})
test('falha de consulta não libera acesso', async () => {
  vi.mocked(api).mockRejectedValue(new Error('Falha de rede'))
  mount()
  expect(await screen.findByText('Não foi possível verificar o veículo')).toBeVisible()
  expect(screen.queryByText('Viagens liberadas')).not.toBeInTheDocument()
})
test('vínculo confirmado pelo servidor libera acesso', async () => {
  vi.mocked(api).mockResolvedValue({ message: { id: 'vehicle' } } as never)
  mount()
  expect(await screen.findByRole('heading', { name: 'Viagens liberadas' })).toBeVisible()
})
