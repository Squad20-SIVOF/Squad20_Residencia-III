import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { LoginMobile } from './LoginMobile'
import { login, currentUser, logout } from '@/service/authService'
vi.mock('@/service/authService', () => ({
  login: vi.fn<typeof login>(),
  currentUser: vi.fn<typeof currentUser>(),
  logout: vi.fn<typeof logout>(),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(currentUser).mockResolvedValue({
    id: 'user',
    nome: 'Motorista',
    email: 'driver@example.invalid',
    permissoes: ['viagens:ler-proprias'],
  })
})
function mount() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginMobile />} />
        <Route path="/veiculo-sessao" element={<h1>Área do motorista</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}
async function submit() {
  await userEvent.type(screen.getByLabelText('E-mail'), 'driver@example.invalid')
  await userEvent.type(screen.getByLabelText('Senha'), 'senha-de-teste')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}
test('só entra após autenticação e verificação do acesso', async () => {
  mount()
  await submit()
  expect(await screen.findByRole('heading', { name: 'Área do motorista' })).toBeVisible()
  expect(login).toHaveBeenCalledWith({
    registration: 'driver@example.invalid',
    password: 'senha-de-teste',
  })
})
test('credenciais inválidas mantêm a tela de login', async () => {
  vi.mocked(login).mockRejectedValue(new Error('E-mail ou senha inválidos'))
  mount()
  await submit()
  expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos')
  expect(currentUser).not.toHaveBeenCalled()
})
test('conta sem acesso ao app não navega e encerra a sessão', async () => {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'user',
    nome: 'Gestor',
    email: 'driver@example.invalid',
    permissoes: [],
  })
  mount()
  await submit()
  expect(await screen.findByRole('alert')).toHaveTextContent('não possui acesso')
  expect(logout).toHaveBeenCalled()
  expect(screen.queryByText('Área do motorista')).not.toBeInTheDocument()
})
