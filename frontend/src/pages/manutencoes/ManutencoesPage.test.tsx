import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { RegistrarManutencaoPage } from './ManutencoesPage'
import { maintenanceService, vehicleService } from './services/maintenanceService'
import { currentUser } from '@/service/authService'
vi.mock('./services/maintenanceService', () => ({
  maintenanceService: {
    CHANGE_EVENT: 'maintenance:test',
    list: vi.fn<typeof maintenanceService.list>(),
  },
  vehicleService: { list: vi.fn<typeof vehicleService.list>() },
}))
vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(currentUser).mockResolvedValue({
    id: 'u1',
    nome: 'Gestor',
    email: 'gestor@example.com',
    permissoes: ['manutencoes:ler', 'manutencoes:gerenciar'],
  })
  vi.mocked(vehicleService.list).mockResolvedValue([
    {
      id: 'v1',
      codigo: '',
      placa: 'ABC1D23',
      marca: '',
      modelo: 'Fiorino',
      quilometragem: 100,
      status: 'Disponível',
    },
  ])
})
test('edição espera o carregamento e preenche os campos com o registro do banco', async () => {
  vi.mocked(maintenanceService.list).mockResolvedValue([
    {
      id: 'm1',
      vehicleId: 'v1',
      tipo: 'Corretiva',
      descricao: 'Troca de peça',
      dataServico: '2026-10-29',
      quilometragem: 100,
      oficina: 'Oficina teste',
      valorEstimado: 50,
      status: 'Agendada',
      tipoProximaRevisao: 'Não definida',
      notificarRevisao: false,
      criadoEm: '2026-10-29',
      atualizadoEm: '2026-10-29',
    },
  ])
  render(
    <MemoryRouter initialEntries={['/manutencoes/editar/m1']}>
      <Routes>
        <Route path="/manutencoes/editar/:id" element={<RegistrarManutencaoPage />} />
      </Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByLabelText('Descrição do serviço *')).toHaveValue(
    'Troca de peça',
  )
  expect(screen.getByLabelText('Oficina / fornecedor *')).toHaveValue('Oficina teste')
  expect(screen.queryByText('Manutenção não encontrada')).not.toBeInTheDocument()
})
test('erro de carregamento oferece nova tentativa em vez de apresentar registro inexistente', async () => {
  vi.mocked(maintenanceService.list).mockRejectedValue(new Error('Sem conexão'))
  render(
    <MemoryRouter>
      <RegistrarManutencaoPage />
    </MemoryRouter>,
  )
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar')
  expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
})
