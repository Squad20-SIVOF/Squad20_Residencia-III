import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
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

afterEach(() => {
  delete document.documentElement.dataset.theme
})

test('alterna o tema pelo menu e salva a preferência', async () => {
  const user = userEvent.setup()
  renderAt('/')

  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  await user.click(screen.getByRole('button', { name: 'Modo escuro' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(localStorage.getItem('sivof:tema')).toBe('dark')

  await user.click(screen.getByRole('button', { name: 'Modo claro' }))
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  expect(localStorage.getItem('sivof:tema')).toBe('light')
})

test('renderiza a página de login em /login', () => {
  renderAt('/login')

  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument()
})

test('renderiza o início dentro do menu lateral', async () => {
  renderAt('/')

  expect(screen.getByRole('heading', { name: 'Dashboard Principal' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  expect(await screen.findByText('Veículos disponíveis')).toBeInTheDocument()
})

test('renderiza a página de perfil em /perfil', async () => {
  renderAt('/perfil')

  expect(
    await screen.findByRole('heading', { name: 'Perfil de Usuário' }),
  ).toBeInTheDocument()
  expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
})

test('abre o formulário de Atendimento SVO pelo Painel de Viagens', async () => {
  const user = userEvent.setup()
  renderAt('/viagens')

  await user.click(await screen.findByRole('link', { name: 'Iniciar atendimento' }))
  expect(screen.getByRole('heading', { name: 'Atendimento SVO', level: 1 })).toBeVisible()
  expect(screen.getByRole('textbox', { name: 'Endereço de origem' })).toBeVisible()

  await user.click(screen.getByRole('link', { name: /Voltar para o Painel de Viagens/ }))
  expect(await screen.findByRole('heading', { name: 'Painel de Viagens' })).toBeVisible()
})

test('navega pelo menu lateral e marca o item ativo', async () => {
  const user = userEvent.setup()
  renderAt('/')

  // No mobile o menu fica recolhido até ser aberto.
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  await user.click(screen.getByRole('link', { name: 'Viagens' }))

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Painel de Viagens' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
})

test('abre a exportação de relatórios implementada', async () => {
  localStorage.setItem(
    'frotamanager.dev.feature-flags',
    JSON.stringify({ gestor_relatorios: true }),
  )
  const user = userEvent.setup()
  renderAt('/')

  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  await user.click(screen.getByRole('link', { name: 'Relatórios' }))

  expect(
    screen.getByRole('heading', { name: 'Exportação de Relatórios' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/Gere arquivos gerenciais por período/i)).toBeInTheDocument()
  expect(screen.queryByText(/módulo em construção/i)).not.toBeInTheDocument()
})

test('/viagens abre o Painel de Viagens, sem redirecionar', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/', '/viagens']} initialIndex={1}>
      <AppRoutes />
      <CurrentPath />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole('heading', { level: 1, name: 'Painel de Viagens' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('status', { name: 'URL atual' })).toHaveTextContent(
    /^\/viagens$/,
  )
  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('marca Viagens no menu ao abrir o monitoramento', async () => {
  const user = userEvent.setup()
  localStorage.setItem(
    'frotamanager.dev.feature-flags',
    JSON.stringify({ gestor_route_monitoring: true }),
  )
  renderAt('/viagens/monitoramento')

  await user.click(screen.getByRole('button', { name: /abrir menu/i }))
  expect(screen.getByRole('link', { name: 'Viagens' })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test.each(['/rota-que-nao-existe'])('mostra a página 404 em %s', (path) => {
  renderAt(path)

  expect(
    screen.getByRole('heading', { name: /página não encontrada/i }),
  ).toBeInTheDocument()
})

vi.mock('@/components/RequireAuth/RequireAuth', async () => {
  const { Outlet } = await import('react-router-dom')
  return { RequireAuth: () => <Outlet /> }
})
