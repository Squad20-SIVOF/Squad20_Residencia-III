import { test, expect } from '@playwright/test'
import { mockApi, signIn } from './auth'
const id = '40000000-0000-4000-8000-000000000001'
const foto =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII='

test.beforeEach(async ({ page }) => {
  await mockApi(page)
  const trip = {
    id,
    veiculo_id: '30000000-0000-4000-8000-000000000001',
    motorista_id: '20000000-0000-4000-8000-000000000001',
    status: 'Agendada',
    modelo: 'Viatura de teste',
    placa: 'TEST001',
    identificacao: 'SVO-128',
    quilometragem: 90,
    tipo_combustivel: 'Diesel',
    km_inicial: null as number | null,
    km_final: null as number | null,
    data_inicio: null,
    data_fim: null,
    data_necessidade: '2026-12-01T12:00:00Z',
    criado_em: '2026-11-12T12:00:00Z',
    categoria: 'SVO',
    flag_urgencia: false,
  }
  await page.route('**/api/motorista/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    expect(request.headers().authorization).toBe(`Bearer ${'a'.repeat(64)}`)
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { km: number; foto: string }
      expect(Object.keys(body).sort()).toEqual(['foto', 'km'])
      expect(body.foto).toMatch(/^data:image\/png;base64,/)
      trip.quilometragem = body.km
      if (url.pathname.endsWith('/iniciar')) {
        trip.status = 'Em deslocamento'
        trip.km_inicial = body.km
      } else {
        trip.status = 'Finalizada'
        trip.km_final = body.km
      }
      await route.fulfill({ json: { message: trip } })
    } else if (url.pathname.endsWith('/resumo')) {
      await route.fulfill({
        json: {
          message: {
            motorista: { id: trip.motorista_id, nome: 'Carlos Almeida' },
            veiculos: [],
            viagem: trip,
          },
        },
      })
    } else if (url.pathname === '/api/motorista/viagens') {
      await route.fulfill({
        json: { message: { dados: [trip], total: 1, pagina: 1, limite: 20 } },
      })
    } else await route.fulfill({ json: { message: trip } })
  })
  await page.route(`**/api/viagens/${id}/status`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ status: 'Em andamento' })
    trip.status = 'Em andamento'
    await route.fulfill({ json: { message: trip } })
  })
})

test('app do motorista abre na raiz com viagens reais e barra de abas', async ({
  page,
}) => {
  await signIn(page)
  await expect(
    page.getByRole('navigation', { name: 'Navegação do motorista' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: /olá, carlos/i })).toBeVisible()
  await expect(page.getByText('Viatura de teste · TEST001')).toBeVisible()
})

test('é instalável como PWA (manifest e service worker)', async ({ page, request }) => {
  await page.goto('/')
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(manifestHref).toBe('/manifest.webmanifest')
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  expect((await request.get('/sw.js')).ok()).toBe(true)
})

test('mobile exige identificação, foto e confirmação antes de iniciar e finalizar', async ({
  page,
}, testInfo) => {
  await signIn(page)
  await expect(page.getByRole('heading', { name: /Olá, Carlos/ })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('mobile-inicio.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('link', { name: 'Identificar veículo', exact: true }).click()
  await page.getByLabel('Código do veículo').fill('OUTRO')
  await page.getByRole('button', { name: 'Confirmar veículo' }).click()
  await expect(page.getByRole('alert')).toContainText('não corresponde')
  await page.getByLabel('Código do veículo').fill('SVO-128')
  await page.screenshot({
    path: testInfo.outputPath('mobile-identificar.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Confirmar veículo' }).click()
  await page.getByLabel(/Foto do painel \(JPG/).setInputFiles({
    name: 'painel.png',
    mimeType: 'image/png',
    buffer: Buffer.from(foto, 'base64'),
  })
  await page.getByRole('button', { name: 'Informar quilometragem' }).click()
  await page.getByLabel('Quilometragem (km)').fill('100')
  await page.getByRole('button', { name: 'Salvar leitura' }).click()
  await expect(page.getByText('100 km', { exact: true })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('mobile-confirmar.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('button', { name: 'Confirmar e iniciar viagem' }).click()
  await expect(page.getByText('Em deslocamento', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar chegada' }).click()
  await expect(page.getByText('Em andamento', { exact: true })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('mobile-viagem.png'),
    fullPage: true,
    animations: 'disabled',
  })
  await page.getByRole('link', { name: 'Finalizar viagem', exact: true }).click()
  await page.getByLabel(/Foto do painel \(JPG/).setInputFiles({
    name: 'painel.png',
    mimeType: 'image/png',
    buffer: Buffer.from(foto, 'base64'),
  })
  await page.getByRole('button', { name: 'Informar quilometragem' }).click()
  await page.getByLabel('Quilometragem (km)').fill('110')
  await page.getByRole('button', { name: 'Salvar leitura' }).click()
  await page.getByRole('button', { name: 'Confirmar finalização', exact: true }).click()
  await expect(page.getByText('Finalizada', { exact: true })).toBeVisible()
  await expect(page.getByText('Percorrido: 10 km')).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true)
})

test('mobile não permite atalhar a confirmação sem foto', async ({ page }) => {
  await signIn(page)
  await page.goto(`/viagens/${id}/inicio/quilometragem`)
  await expect(
    page.getByRole('heading', { name: 'Leitura não disponível' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Confirmar e iniciar viagem' }),
  ).toHaveCount(0)
})
