import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { getAlertCount } from '@/service/alertService'
import { logout, type SessionUser } from '@/service/authService'
import { AppLayout } from './AppLayout'

vi.mock('@/service/alertService', () => ({
  getAlertCount: vi.fn<() => Promise<number>>().mockResolvedValue(3),
}))

afterEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
})

function makeUser(permissoes: string[]): SessionUser {
  return { id: 'u1', nome: 'Gestor de Frota', email: 'gestor@example.com', permissoes }
}

// O jsdom não aplica media queries: vale o CSS base (celular), com o painel
// fechado até tocar em "Abrir menu".
async function renderLayout(user: SessionUser, path = '/') {
  const events = userEvent.setup()
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<h1>Entrar</h1>} />
        <Route element={<Outlet context={user} />}>
          <Route element={<AppLayout />}>
            <Route path="*" element={<h1>Conteúdo</h1>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  await events.click(screen.getByRole('button', { name: 'Abrir menu' }))
  return { ...view, events }
}

// O botão de recolher só aparece a partir do lg (escondido no CSS base).
function collapseToggle(name: string) {
  return screen.getByLabelText(name, { selector: 'button' })
}

function navLinks() {
  return within(screen.getByRole('navigation', { name: 'Menu principal' })).getAllByRole(
    'link',
  )
}

test('mostra a marca SIVOF Manager e o rodapé do menu', async () => {
  await renderLayout(makeUser([]))

  expect(screen.getByText('SIVOF Manager')).toBeInTheDocument()
  expect(screen.getByText('Gestão de Frota · FSPH')).toBeInTheDocument()
  expect(screen.queryByText('FrotaManager')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Modo claro' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  expect(screen.getByText('Notificações')).toBeInTheDocument()
  expect(screen.getByText('Gestor de Frota')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
})

test('sem permissões mostra só os itens livres', async () => {
  await renderLayout(makeUser([]))

  expect(navLinks().map((link) => link.textContent)).toEqual([
    'Início',
    'Manutenções',
    'Viagens',
    'Relatórios',
    'Perfil',
  ])
})

test('cada permissão libera o seu item', async () => {
  await renderLayout(
    makeUser([
      'veiculos:ler',
      'motoristas:ler',
      'abastecimentos:ler',
      'usuarios:gerenciar',
    ]),
  )

  expect(navLinks().map((link) => link.textContent)).toEqual([
    'Início',
    'Veículos',
    'Motoristas',
    'Abastecimentos',
    'Manutenções',
    'Viagens',
    'Relatórios',
    'Perfil',
    'Usuários e permissões',
  ])
})

test('marca o item da rota atual como ativo', async () => {
  await renderLayout(makeUser(['veiculos:ler']), '/veiculos')

  expect(screen.getByRole('link', { name: 'Veículos' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-current')
})

test('recolhe e expande o menu, guardando a escolha na sessão', async () => {
  const { events, unmount } = await renderLayout(makeUser([]))

  const collapse = collapseToggle('Recolher menu lateral')
  expect(collapse).toHaveAttribute('aria-expanded', 'true')
  await events.click(collapse)

  expect(collapseToggle('Expandir menu lateral')).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  // Recolhido, cada ícone mantém o nome acessível do item.
  expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute(
    'aria-label',
    'Início',
  )
  expect(screen.getByRole('button', { name: 'Modo claro' })).toBeInTheDocument()
  expect(sessionStorage.getItem('sivof:menu-recolhido')).toBe('1')

  unmount()
  const reopened = await renderLayout(makeUser([]))
  await reopened.events.click(collapseToggle('Expandir menu lateral'))

  expect(collapseToggle('Recolher menu lateral')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Início' })).not.toHaveAttribute('aria-label')
  expect(sessionStorage.getItem('sivof:menu-recolhido')).toBe('0')
})

test('abre e fecha o menu no celular, inclusive com Esc', async () => {
  const { events } = await renderLayout(makeUser([]))

  expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await events.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  expect(
    screen.queryByRole('navigation', { name: 'Menu principal' }),
  ).not.toBeInTheDocument()
})

test('mostra o número de alertas para quem pode ler manutenções', async () => {
  await renderLayout(makeUser(['manutencoes:ler']))

  expect(await screen.findByText('3')).toHaveTextContent('3 alertas')
  expect(getAlertCount).toHaveBeenCalledTimes(1)
})

test('não consulta alertas sem permissão', async () => {
  await renderLayout(makeUser([]))

  expect(getAlertCount).not.toHaveBeenCalled()
  expect(screen.queryByText(/alertas?$/)).not.toBeInTheDocument()
})

test('Sair encerra a sessão e volta ao login', async () => {
  const { events } = await renderLayout(makeUser([]))

  await events.click(screen.getByRole('button', { name: 'Sair' }))

  expect(logout).toHaveBeenCalledTimes(1)
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
})
