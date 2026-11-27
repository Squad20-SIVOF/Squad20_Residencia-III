import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { AppLayout } from '@/layouts/AppLayout'
import AbastecimentosPage from '@/pages/abastecimentos/AbastecimentosPage'
import { fuelService } from '@/pages/abastecimentos/services/fuelService'
import { getAlertSummary } from '@/service/alertService'
import { currentUser } from '@/service/authService'
import { NotificationsPage } from './NotificationsPage'

vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))
vi.mock('@/service/alertService', () => ({
  getAlertSummary: vi.fn<typeof getAlertSummary>(),
}))

test('ordena alertas por prioridade e abre o abastecimento mantendo o estado de leitura', async () => {
  sessionStorage.clear()
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor',
    email: 'gestor@example.invalid',
    permissoes: ['motoristas:ler', 'manutencoes:ler', 'abastecimentos:ler'],
  })
  vi.mocked(getAlertSummary).mockResolvedValue({
    cnh: {
      total: 1,
      criticas: 1,
      itens: [
        {
          id: 'm1',
          nome: 'João Oliveira',
          validade_cnh: '2026-11-05',
          dias_restantes: -5,
          severity: 'critica',
        },
      ],
    },
    manutencao: {
      total: 1,
      criticas: 0,
      itens: [
        {
          id: 'v1',
          placa: 'ABC1D23',
          quilometragem: 45320,
          km_restantes: 100,
          severity: 'aviso',
        },
      ],
    },
  })
  using fuel = vi.spyOn(fuelService, 'list').mockResolvedValue([
    {
      id: 'registro-1',
      veiculo_id: 'v1',
      motorista_id: 'm1',
      data_abastecimento: new Date().toISOString(),
      combustivel: 'Gasolina',
      posto: 'Posto Sul',
      litros: 30,
      preco_litro: 8.5,
      valor_total: 255,
      km_momento_abastecimento: 45320,
      alerta_teto_excedido: false,
      placa: 'ABC1D23',
      modelo: 'Fiat Fiorino',
      identificacao: 'SVO-128',
      motorista_nome: 'João Oliveira',
      teto_gasto_mensal: null,
    },
  ])
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/notificacoes']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/notificacoes" element={<NotificationsPage />} />
          <Route
            path="/abastecimentos"
            element={
              <>
                <AbastecimentosPage />
                <Link to="/notificacoes">Voltar às notificações</Link>
              </>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

  const feed = within(
    await screen.findByRole('region', { name: 'Lista de notificações' }),
  )
  expect(screen.getByText('3')).toHaveTextContent('3 notificações')
  expect(feed.getByRole('button', { name: 'Todas (3)' })).toBeVisible()
  expect(getAlertSummary).toHaveBeenCalledTimes(1)
  expect(feed.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
    'CNH vencida',
    'Revisão próxima',
    'Abastecimento registrado',
  ])
  expect(feed.getByRole('link', { name: 'Ver motorista' })).toHaveAttribute(
    'href',
    '/motoristas/m1',
  )
  expect(feed.getByRole('link', { name: 'Ver manutenção' })).toHaveAttribute(
    'href',
    '/manutencoes?placa=ABC1D23',
  )
  expect(screen.getByText('2 alertas precisam da sua atenção')).toBeVisible()

  await user.click(feed.getByRole('link', { name: 'Ver abastecimento' }))
  const details = within(
    await screen.findByRole('dialog', { name: 'Detalhes do abastecimento' }),
  )
  expect(details.getByText('Posto Sul')).toBeVisible()
  await user.click(details.getByRole('button', { name: 'Fechar' }))
  expect(
    screen.queryByRole('dialog', { name: 'Detalhes do abastecimento' }),
  ).not.toBeInTheDocument()
  expect(fuel).toHaveBeenCalledTimes(2)

  await user.click(screen.getByRole('link', { name: 'Voltar às notificações' }))
  await user.click(await screen.findByRole('button', { name: 'Não lidas (2)' }))
  expect(
    screen.queryByRole('heading', { name: 'Abastecimento registrado' }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Marcar todas como lidas' }))
  expect(screen.getByText('Nenhuma notificação não lida.')).toBeVisible()
  expect(screen.getByText('3')).toHaveTextContent('3 notificações')
})
