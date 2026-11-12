import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { AppRoutes } from './App'

// Expõe a URL atual para conferir redirecionamentos.
function CurrentPath() {
  return <output aria-label="URL atual">{useLocation().pathname}</output>
}

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

test('renderiza a página de login em /login', () => {
  renderAt('/login')

  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
})

test('renderiza o início dentro do menu lateral', async () => {
  renderAt('/')

  expect(
    screen.getByRole('heading', { name: /bem-vindo ao frotamanager/i }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  expect(await screen.findByText(/motoristas ativos/i)).toBeInTheDocument()
})

test('renderiza a página de perfil em /perfil', async () => {
  renderAt('/perfil')

  expect(
    await screen.findByRole('heading', { name: 'Perfil de Usuário' }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
})

test('navega pelo menu lateral e marca o item ativo', async () => {
  const user = userEvent.setup()
  renderAt('/')

  // No mobile o menu fica recolhido até ser aberto.
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  await user.click(screen.getByRole('link', { name: 'Viagens' }))

  expect(
    screen.getByRole('heading', { level: 1, name: 'Solicitar Veículo' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
})

test('mantém a página provisória nos módulos ainda não implementados', async () => {
  const user = userEvent.setup()
  renderAt('/')

  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  await user.click(screen.getByRole('link', { name: 'Relatórios' }))

  expect(screen.getByRole('heading', { name: 'Relatórios' })).toBeInTheDocument()
  expect(screen.getByText(/módulo em construção/i)).toBeInTheDocument()
})

test('/viagens redireciona para a solicitação enquanto o Painel não existe', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/', '/viagens']} initialIndex={1}>
      <AppRoutes />
      <CurrentPath />
    </MemoryRouter>,
  )

  expect(
    screen.getByRole('heading', { level: 1, name: 'Solicitar Veículo' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent(
    '/viagens/solicitar',
  )
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('o acompanhamento da rota também marca Viagens no menu', async () => {
  const user = userEvent.setup()
  renderAt('/viagens/qualquer-id')

  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('mostra a página 404 para rotas desconhecidas', () => {
  renderAt('/rota-que-nao-existe')

  expect(
    screen.getByRole('heading', { name: /página não encontrada/i }),
  ).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
