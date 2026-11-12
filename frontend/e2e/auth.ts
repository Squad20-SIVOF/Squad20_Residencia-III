import type { Page } from '@playwright/test'
export const testCredentials = {
  email: 'gestor@example.invalid',
  password: 'senha-apenas-do-teste',
}
export async function mockApi(page: Page) {
  const token = 'a'.repeat(64)
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    nome: 'Gestor de teste',
    email: testCredentials.email,
    permissoes: [
      'veiculos:ler',
      'veiculos:gerenciar',
      'motoristas:ler',
      'viagens:ler-proprias',
      'viagens:atualizar-proprias',
      'veiculos:vistoriar-proprios',
      'abastecimentos:criar-proprio',
    ],
  }
  await page.route('**/auth/**', async (route) => {
    const request = route.request()
    if (!['fetch', 'xhr'].includes(request.resourceType())) {
      await route.fallback()
      return
    }
    const path = new URL(request.url()).pathname.replace(/^\/api(?=\/|$)/, '')
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'Content-Type,Authorization',
        },
      })
      return
    }
    if (path === '/auth/login') {
      const input = request.postDataJSON() as { email: string; password: string }
      const valid =
        input.email === testCredentials.email &&
        input.password === testCredentials.password
      await route.fulfill({
        status: valid ? 200 : 401,
        json: valid ? { token, user } : { message: 'E-mail ou senha inválidos' },
      })
      return
    }
    if (path === '/auth/me' && request.headers().authorization === `Bearer ${token}`) {
      await route.fulfill({ json: user })
      return
    }
    await route.fulfill({ status: 401, json: { message: 'Autenticação necessária' } })
  })
  for (const path of ['vehicles', 'drivers'])
    await page.route(`**/${path}`, (route) => route.fulfill({ json: { message: [] } }))
}
export async function signIn(page: Page, selectVehicle = true) {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(testCredentials.email)
  await page.getByLabel('Senha', { exact: true }).fill(testCredentials.password)
  await page.getByRole('button', { name: /^(Confirmar|Entrar)$/, exact: true }).click()
  await page.waitForURL(/\/(veiculo-sessao)?$/)
  if (selectVehicle && new URL(page.url()).pathname === '/veiculo-sessao') {
    const continueButton = page.getByRole('link', { name: 'Continuar para o início' })
    await continueButton.waitFor()
    await continueButton.click()
    await page.waitForURL('/')
  }
}
