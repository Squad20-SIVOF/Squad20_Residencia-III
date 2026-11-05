import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

test('renderiza o formulário de solicitação no item Viagens', async () => {
  renderAt('/viagens')

  expect(
    screen.getByRole('heading', { level: 1, name: 'Solicitar Veículo' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      'Preencha os dados abaixo para reservar um veículo oficial do setor SVO.',
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Rota da Solicitação' })).toBeInTheDocument()
  expect(screen.getByLabelText('Origem')).toHaveValue('Central SVO')
  expect(screen.getByLabelText('Setor solicitante')).toHaveValue('Administrativo')
  expect(screen.getByText('Status: Aguardando aprovação')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Enviar Solicitação' })).toBeInTheDocument()
  // Só veículos disponíveis entram como preferência.
  expect(
    await screen.findByRole('option', { name: /Fiat Fiorino · ABC-1D23/ }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('option', { name: /Renault Master/ })).not.toBeInTheDocument()
})

test('não envia sem os campos obrigatórios e foca o primeiro erro', async () => {
  const user = userEvent.setup()
  renderAt('/viagens')

  await user.click(screen.getByRole('button', { name: 'Enviar Solicitação' }))

  expect(screen.getByText('Corrija os campos destacados.')).toBeInTheDocument()
  expect(screen.getByText('Informe o destino.')).toBeInTheDocument()
  expect(screen.getByText('Descreva o motivo da solicitação.')).toBeInTheDocument()
  expect(screen.getByLabelText('Destino')).toHaveFocus()
  expect(screen.getByLabelText('Destino')).toHaveAttribute('aria-invalid', 'true')
})

test('limita os passageiros à lotação do veículo escolhido', async () => {
  const user = userEvent.setup()
  renderAt('/viagens')

  await user.selectOptions(
    screen.getByLabelText('Veículo preferencial'),
    await screen.findByRole('option', { name: /Fiat Fiorino/ }),
  )
  await user.type(screen.getByLabelText('Nº de passageiros'), '5')
  await user.click(screen.getByRole('button', { name: 'Enviar Solicitação' }))

  expect(
    screen.getByText('O veículo escolhido leva no máximo 2 passageiros.'),
  ).toBeInTheDocument()
})

test('envia a solicitação e abre o acompanhamento da rota', async () => {
  const user = userEvent.setup()
  renderAt('/viagens')

  await user.type(screen.getByLabelText('Destino'), 'Hospital de Urgência de Sergipe')
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

  expect(
    await screen.findByRole('heading', { level: 1, name: 'SIVOF' }),
  ).toBeInTheDocument()
  const driverCard = await screen.findByRole('region', { name: 'Motorista' })
  expect(within(driverCard).getByText('Rafael Mendes')).toBeInTheDocument()
  expect(within(driverCard).getByText('Chevrolet Spin · QWE-4J18')).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
