import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { UsersPage } from './UsersPage'
import { api } from '@/service/api'
import { currentUser } from '@/service/authService'

vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
vi.mock('@/service/authService', () => ({ currentUser: vi.fn<typeof currentUser>() }))
const available = [
  'veiculos:ler',
  'veiculos:gerenciar',
  'motoristas:ler',
  'motoristas:gerenciar',
  'abastecimentos:ler',
  'abastecimentos:gerenciar',
  'manutencoes:ler',
  'manutencoes:gerenciar',
]
const people = [
  {
    id: 'u1',
    nome: 'Ana Souza',
    email: 'ana@example.invalid',
    permissoes: ['veiculos:ler'],
    perfis: [{ id: 'p1', nome: 'Motorista' }],
    permissoesHerdadas: ['motoristas:ler'],
  },
  {
    id: 'u2',
    nome: 'Bruno Lima',
    email: 'bruno@example.invalid',
    permissoes: ['motoristas:gerenciar'],
  },
]
let saved: string[]
let failSave: boolean
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  saved = ['veiculos:ler']
  failSave = false
  vi.mocked(currentUser).mockResolvedValue({
    id: 'gestor',
    nome: 'Gestor',
    email: 'gestor@example.invalid',
    permissoes: ['usuarios:delegar-permissoes'],
  })
  vi.mocked(api).mockImplementation(async (path, options) => {
    if (options?.method === 'PUT') {
      if (failSave) throw new Error('Não foi possível salvar os acessos')
      saved = JSON.parse(options.body as string).permissoes
      return {} as never
    }
    if (path === '/usuarios/permissoes')
      return {
        usuarios: [{ ...people[0], permissoes: saved }, people[1]],
        permissoesDisponiveis: available,
      } as never
    if (path === '/perfis')
      return {
        message: [{ id: 'p1', nome: 'Solicitante', codigo: 'solicitante' }],
      } as never
    return [] as never
  })
})

test('matriz fica oculta até selecionar usuário e carrega os acessos existentes', async () => {
  render(<UsersPage />)
  const select = await screen.findByRole('combobox', { name: 'Usuário' })
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Salvar permissões' }),
  ).not.toBeInTheDocument()
  await userEvent.selectOptions(select, 'u1')
  expect(screen.getByRole('checkbox', { name: 'Consultar veículos' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Gerenciar veículos' })).not.toBeChecked()
  expect(screen.getByText('2 de 8')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salvar permissões' })).toBeDisabled()
})

test('editar e salvar envia as permissões reais somente para o usuário selecionado', async () => {
  render(<UsersPage />)
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Usuário' }),
    'u1',
  )
  await userEvent.click(screen.getByRole('checkbox', { name: 'Gerenciar veículos' }))
  expect(vi.mocked(api).mock.calls.some(([, options]) => options?.method === 'PUT')).toBe(
    false,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Salvar permissões' }))
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith('/usuarios/u1/permissoes', {
      method: 'PUT',
      body: JSON.stringify({ permissoes: ['veiculos:ler', 'veiculos:gerenciar'] }),
    }),
  )
  expect(await screen.findByText('Permissões atualizadas.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Salvar permissões' })).toBeDisabled()
})

test('trocar usuário não carrega a seleção anterior para a outra pessoa', async () => {
  render(<UsersPage />)
  const select = await screen.findByRole('combobox', { name: 'Usuário' })
  await userEvent.selectOptions(select, 'u1')
  await userEvent.click(screen.getByRole('button', { name: 'Selecionar todas' }))
  await userEvent.selectOptions(select, 'u2')
  expect(screen.getByRole('checkbox', { name: 'Consultar veículos' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Gerenciar motoristas' })).toBeChecked()
  expect(screen.getByRole('button', { name: 'Salvar permissões' })).toBeDisabled()
})

test('erro ao salvar mantém a seleção para tentar novamente', async () => {
  failSave = true
  render(<UsersPage />)
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Usuário' }),
    'u1',
  )
  await userEvent.click(screen.getByRole('checkbox', { name: 'Gerenciar veículos' }))
  await userEvent.click(screen.getByRole('button', { name: 'Salvar permissões' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível salvar os acessos',
  )
  expect(screen.getByRole('checkbox', { name: 'Gerenciar veículos' })).toBeChecked()
  expect(screen.getByRole('button', { name: 'Salvar permissões' })).toBeEnabled()
})

test('seleção em lote respeita o catálogo recebido e limpar não salva automaticamente', async () => {
  render(<UsersPage />)
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Usuário' }),
    'u1',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Selecionar todas' }))
  expect(screen.getByText('8 de 8')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))
  expect(screen.getByText('1 de 8')).toBeInTheDocument()
  expect(vi.mocked(api).mock.calls.some(([, options]) => options?.method === 'PUT')).toBe(
    false,
  )
})

test('cadastro, perfis e vínculo continuam disponíveis na aba administrativa', async () => {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'admin',
    nome: 'Administrador',
    email: 'admin@example.invalid',
    permissoes: ['usuarios:gerenciar', 'usuarios:delegar-permissoes'],
  })
  render(<UsersPage />)
  await userEvent.click(await screen.findByRole('tab', { name: 'Usuários e vínculos' }))
  expect(screen.getByRole('heading', { name: 'Criar usuário' })).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Vincular conta a motorista' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Alterar perfis de um usuário' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('table')).not.toBeInTheDocument()
})

test('não exibe edição de permissões sem autorização', async () => {
  vi.mocked(currentUser).mockResolvedValue({
    id: 'u',
    nome: 'Usuário',
    email: 'user@example.invalid',
    permissoes: [],
  })
  render(<UsersPage />)
  expect(
    await screen.findByText('Seu usuário não possui acesso à gestão de usuários.'),
  ).toBeInTheDocument()
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(api).not.toHaveBeenCalled()
})

test('outro cargo exibe perfil e protege acessos herdados', async () => {
  render(<UsersPage />)
  await userEvent.selectOptions(
    await screen.findByRole('combobox', { name: 'Usuário' }),
    'u1',
  )
  expect(screen.getByText('Motorista')).toBeInTheDocument()
  const inherited = screen.getByRole('checkbox', {
    name: 'Consultar motoristas (herdado do perfil)',
  })
  expect(inherited).toBeChecked()
  expect(inherited).toBeDisabled()
  await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))
  expect(inherited).toBeChecked()
})
