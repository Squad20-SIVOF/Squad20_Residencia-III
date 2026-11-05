import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, expect, test, vi } from 'vitest'
import { RequireAuth } from '@/components/RequireAuth/RequireAuth'
import { login, logout } from './authService'
import { api, getSessionToken, setSessionToken } from './api'
import { createDriver, getDrivers } from '@/pages/drivers/services/driverService'

vi.unmock('@/service/authService')
vi.unmock('@/pages/drivers/services/driverService')

afterEach(() => {
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

function mockResponse(body: unknown, status = 200) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', request)
  return request
}

test('login envia e-mail e senha à API e armazena apenas o token', async () => {
  const request = mockResponse({ token: 'test-token' })
  await login({ registration: 'gestor@example.com', password: 'senha-de-teste' })
  expect(JSON.parse(request.mock.calls[0]?.[1]?.body as string)).toEqual({
    email: 'gestor@example.com',
    password: 'senha-de-teste',
  })
  expect(getSessionToken()).toBe('test-token')
  expect(sessionStorage.getItem('password')).toBeNull()
})

test('401 remove uma sessão inválida', async () => {
  setSessionToken('old-token')
  mockResponse({ message: 'Sessão expirada' }, 401)
  await expect(api('/auth/me')).rejects.toThrow('Sessão expirada')
  expect(getSessionToken()).toBeNull()
})

test('logout revoga a sessão remota e limpa o token local', async () => {
  setSessionToken('old-token')
  const request = mockResponse({})
  await logout()
  expect(String(request.mock.calls[0]?.[0])).toContain('/auth/logout')
  expect((request.mock.calls[0]![1]!.headers as Headers).get('Authorization')).toBe(
    'Bearer old-token',
  )
  expect(getSessionToken()).toBeNull()
})

test('rota protegida redireciona visitante ao login', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<h1>Entrar</h1>} />
        <Route element={<RequireAuth />}>
          <Route index element={<h1>Área protegida</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
  expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  expect(screen.queryByText('Área protegida')).not.toBeInTheDocument()
})

const driver = {
  id: 'driver-id',
  nome: 'Maria Silva',
  cpf: '52998224725',
  cnh: '11122233344',
  categoria: 'D',
  validade_cnh: '2030-12-31',
  motorista_coringa: false,
  status: 'ativo',
  ativo: true,
  criado_em: '2026-01-01',
}

test('lista motoristas reais mapeando o contrato da API', async () => {
  mockResponse({ message: [driver] })
  expect((await getDrivers())[0]).toMatchObject({
    id: 'driver-id',
    name: 'Maria Silva',
    cnhExpiry: '2030-12-31',
    vehicles: [],
  })
})

test('cadastro envia somente campos suportados pela API', async () => {
  const request = mockResponse({ message: driver })
  await createDriver({
    name: 'Maria Silva',
    cpf: '52998224725',
    phone: '',
    email: '',
    cnh: '11122233344',
    cnhCategory: 'D',
    cnhExpiry: '2030-12-31',
    fleet: 'SVO',
    vehicles: ['SVO0A01'],
    isWildcard: false,
    status: 'ativo',
  })
  expect(JSON.parse(request.mock.calls[0]?.[1]?.body as string)).toEqual({
    nome: 'Maria Silva',
    telefone: null,
    email: null,
    foto: null,
    cpf: '52998224725',
    cnh: '11122233344',
    categoria: 'D',
    validade_cnh: '2030-12-31',
    motorista_coringa: false,
    frota: 'SVO',
    veiculos: ['SVO0A01'],
  })
})
