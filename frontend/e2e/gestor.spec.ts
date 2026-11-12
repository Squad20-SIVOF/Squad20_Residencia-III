import { test, expect } from '@playwright/test'
import { mockApi, signIn, testCredentials } from './auth'
test.beforeEach(async ({ page }) => {
  await mockApi(page)
})
test('visitante é redirecionado ao login', async ({ page }) => {
  await page.goto('/motoristas')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
})
test('credenciais inválidas não liberam o painel', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('E-mail', { exact: true }).fill(testCredentials.email)
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta')
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível entrar')
  await expect(page).toHaveURL(/\/login$/)
})
test('login válido carrega a página inicial', async ({ page }) => {
  await signIn(page)
  await expect(
    page.getByRole('heading', { name: /bem-vindo ao frotamanager/i }),
  ).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByText('Motoristas ativos', { exact: true })).toBeVisible()
})

test('detalhes de veículo mostram histórico e vistoria, e breadcrumb volta à lista', async ({
  page,
}) => {
  const vehicle = {
    id: '22222222-2222-4222-8222-222222222222',
    placa: 'SVO0A01',
    modelo: 'SVO demonstração',
    tipo_combustivel: 'Diesel',
    capacidade_maxima: 60,
    quilometragem: 0,
    ultimo_km_alertado: 0,
    frota: 'SVO',
    exclusivo_svo: true,
    status: 'ativo',
    ativo: true,
  }
  await page.route('**/vehicles', (route) =>
    route.fulfill({ json: { message: [vehicle] } }),
  )
  await page.route(`**/vehicles/${vehicle.id}`, (route) =>
    route.fulfill({ json: { message: vehicle } }),
  )
  await page.route(`**/vehicles/${vehicle.id}/trips`, (route) =>
    route.fulfill({ json: { message: [] } }),
  )
  await signIn(page)
  await page.goto('/veiculos')
  await page.getByRole('button', { name: /Ver detalhes do veículo/ }).click()
  await expect(
    page.getByRole('heading', { name: 'Checklist de Vistorias', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Ver histórico completo', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Histórico de viagens', exact: true })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByText('Nenhuma viagem registrada para este veículo.'),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Editar veículo', exact: true }).click()
  const breadcrumb = page.getByRole('navigation', { name: 'Você está em', exact: true })
  await expect(breadcrumb.getByText('Editar cadastro')).toBeVisible()
  await breadcrumb.getByRole('link', { name: 'Veículos', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Controle de Veículos', exact: true }),
  ).toBeVisible()
})

test('solicitações consultam a API e cancelamento aguarda confirmação do servidor', async ({
  page,
}, testInfo) => {
  const id = '11111111-1111-4111-8111-111111111111'
  let cancelled = false
  const record = () => ({
    id,
    solicitante_id: null,
    solicitante_nome: 'Solicitante de teste',
    setor_nome: 'Operacional',
    categoria: 'SVO',
    flag_urgencia: true,
    data_necessidade: '2026-12-01T12:00:00Z',
    criado_em: '2026-11-12T12:00:00Z',
    status: cancelled ? 'Cancelada' : 'Pendente',
    pode_editar: false,
    pode_cancelar: !cancelled,
    historico: cancelled
      ? [
          {
            id: 'historico-teste',
            status_anterior: 'Pendente',
            status_novo: 'Cancelada',
            data_hora: '2026-11-12T13:00:00Z',
            motivo: 'Reprogramação',
          },
        ]
      : [],
  })
  await page.route('**/solicitacoes**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'PATCH') {
      expect(url.pathname).toBe(`/api/solicitacoes/${id}/cancelar`)
      expect(request.postDataJSON()).toEqual({ motivo: 'Reprogramação' })
      cancelled = true
      await route.fulfill({ json: { message: record() } })
    } else if (url.pathname === '/api/solicitacoes') {
      expect(url.searchParams.get('status')).toBe('Pendente')
      await route.fulfill({
        json: { message: { dados: [record()], total: 1, pagina: 1, limite: 20 } },
      })
    } else {
      expect(url.pathname).toBe(`/api/solicitacoes/${id}`)
      await route.fulfill({ json: { message: record() } })
    }
  })
  await signIn(page)
  await page.goto('/viagens/solicitacoes')
  await expect(page.getByText('Solicitante de teste', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aprovar', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Recusar', exact: true })).toBeDisabled()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('solicitacoes-lista.png'),
    fullPage: true,
  })
  await page.getByRole('link', { name: 'Ver detalhes da solicitação #11111111' }).click()
  await expect(
    page.getByRole('heading', { name: 'Detalhes da Solicitação #11111111' }),
  ).toBeVisible()
  await expect(page.getByText('Solicitante de teste', { exact: true })).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('solicitacoes-detalhes.png'),
    fullPage: true,
  })
  await page.getByRole('button', { name: 'Cancelar solicitação', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }),
  ).toBeDisabled()
  await page.getByLabel('Motivo do cancelamento').fill('Reprogramação')
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click()
  await expect(page.getByText('Cancelada', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Cancelar solicitação', exact: true }),
  ).toHaveCount(0)
})
