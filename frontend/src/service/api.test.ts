import { afterEach, beforeEach, expect, test, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('VITE_API_URL', '')
  vi.stubEnv('DEV', true)
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

test('login em desenvolvimento usa o proxy da mesma origem sem configuração extra', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(
      new Response(JSON.stringify({ token: 'session-token' }), { status: 200 }),
    )
  vi.stubGlobal('fetch', fetch)
  const { api } = await import('./api')
  const body = JSON.stringify({ email: 'teste@example.com', password: 'teste' })
  expect(await api('/auth/login', { method: 'POST', body })).toEqual({
    token: 'session-token',
  })
  expect(fetch).toHaveBeenCalledWith(
    '/api/auth/login',
    expect.objectContaining({ method: 'POST', body }),
  )
})

test('preserva a URL explícita da API configurada para hospedagem', async () => {
  vi.stubEnv('DEV', false)
  vi.stubEnv('VITE_API_URL', 'https://api.example.com/')
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValue(new Response('{}', { status: 200 }))
  vi.stubGlobal('fetch', fetch)
  const { api } = await import('./api')
  await api('/auth/me')
  expect(fetch).toHaveBeenCalledWith('https://api.example.com/auth/me', expect.anything())
})
