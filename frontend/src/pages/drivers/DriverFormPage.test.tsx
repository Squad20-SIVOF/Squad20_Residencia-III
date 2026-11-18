import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { AppRoutes } from '@/App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

test('não salva um cadastro vazio e foca o primeiro campo inválido', async () => {
  const user = userEvent.setup()
  renderAt('/motoristas/novo')

  await user.click(await screen.findByRole('button', { name: /salvar/i }))

  expect(screen.getByText('Corrija os campos destacados.')).toBeInTheDocument()
  expect(screen.getByText('Informe o nome completo.')).toBeInTheDocument()
  expect(screen.getByText('CPF inválido.')).toBeInTheDocument()
  expect(screen.getByLabelText('Nome completo *')).toHaveFocus()
})

test('cadastra um motorista e volta para a lista com a confirmação', async () => {
  const user = userEvent.setup()
  renderAt('/motoristas/novo')

  await user.type(await screen.findByLabelText('Nome completo *'), 'Paulo Henrique')
  await user.type(screen.getByLabelText('CPF *'), '52998224725')
  await user.type(screen.getByLabelText('Nº da CNH *'), '11122233344')
  await user.selectOptions(screen.getByLabelText('Categoria *'), 'D')
  await user.type(screen.getByLabelText('Validade *'), '31122030')
  await user.click(screen.getByRole('button', { name: /salvar/i }))

  expect(await screen.findByText(/motorista cadastrado com sucesso/i)).toBeInTheDocument()
  expect(await screen.findByText('Paulo Henrique')).toBeInTheDocument()
})

test('impede duas CNHs iguais', async () => {
  const user = userEvent.setup()
  renderAt('/motoristas/novo')

  await user.type(await screen.findByLabelText('Nome completo *'), 'Paulo Henrique')
  await user.type(screen.getByLabelText('CPF *'), '52998224725')
  await user.type(screen.getByLabelText('Nº da CNH *'), '01234567890') // já usada no seed
  await user.selectOptions(screen.getByLabelText('Categoria *'), 'D')
  await user.type(screen.getByLabelText('Validade *'), '31122030')
  await user.click(screen.getByRole('button', { name: /salvar/i }))

  expect(
    await screen.findByText('Já existe um motorista com essa CNH.'),
  ).toBeInTheDocument()
})

test('edita um motorista existente', async () => {
  const user = userEvent.setup()
  renderAt('/motoristas/editar/01234567890')

  const nameField = await screen.findByLabelText('Nome completo *')
  expect(nameField).toHaveValue('João da Silva')
  expect(screen.getByLabelText('Validade *')).toHaveValue('31/12/2027')

  await user.clear(nameField)
  await user.type(nameField, 'João Pedro da Silva')
  await user.click(screen.getByRole('button', { name: /salvar/i }))

  expect(await screen.findByText(/motorista atualizado com sucesso/i)).toBeInTheDocument()
  expect(await screen.findByText('João Pedro da Silva')).toBeInTheDocument()
})

test('avisa quando o motorista a editar não existe', async () => {
  renderAt('/motoristas/editar/nao-existe')

  expect(await screen.findByText('Motorista não encontrado.')).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
