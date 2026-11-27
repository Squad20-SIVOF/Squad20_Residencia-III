import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { VehicleForm } from './VehicleForm'
import { api } from '@/service/api'

const renderWithRouter = (ui: ReactNode) => render(ui, { wrapper: MemoryRouter })

vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII='
const photoData = `data:image/png;base64,${png}`

test('cadastra veículo com valores numéricos e prévia da placa', async () => {
  const user = userEvent.setup()
  vi.mocked(api).mockResolvedValueOnce({})
  const onSave = vi.fn<() => void>()
  renderWithRouter(
    <VehicleForm vehicle={null} onSave={onSave} onCancel={vi.fn<() => void>()} />,
  )
  await user.type(screen.getByLabelText('Placa Mercosul *'), 'abc1d23')
  await user.type(screen.getByLabelText('Modelo *'), 'Fiat Fiorino')
  await user.type(screen.getByLabelText('Combustível *'), 'Flex')
  await user.type(screen.getByLabelText('Capacidade do tanque (L) *'), '58')
  expect(screen.getByText('ABC1D23')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Adicionar foto do veículo' }),
  ).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Arquivo da foto do veículo')).not.toBeInTheDocument()
  expect(
    screen.queryByLabelText('Quilometragem do último alerta'),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
  expect(api).toHaveBeenCalledWith(
    '/vehicles',
    expect.objectContaining({
      method: 'POST',
      body: expect.any(String),
    }),
  )
  const options = vi.mocked(api).mock.calls[vi.mocked(api).mock.calls.length - 1]?.[1]
  expect(JSON.parse(options?.body as string)).toMatchObject({
    placa: 'ABC1D23',
    capacidade_maxima: 58,
    quilometragem: 0,
    ultimo_km_alertado: 0,
    ativo: true,
  })
  expect(JSON.parse(options?.body as string)).not.toHaveProperty('foto')
  expect(onSave).toHaveBeenCalledOnce()
})

test('mantém os dados preenchidos quando a API recusa o cadastro', async () => {
  const user = userEvent.setup()
  vi.mocked(api).mockRejectedValueOnce(new Error('Placa já cadastrada.'))
  renderWithRouter(
    <VehicleForm
      vehicle={null}
      onSave={vi.fn<() => void>()}
      onCancel={vi.fn<() => void>()}
    />,
  )
  await user.type(screen.getByLabelText('Placa Mercosul *'), 'abc1d23')
  await user.type(screen.getByLabelText('Modelo *'), 'Fiat Fiorino')
  await user.type(screen.getByLabelText('Combustível *'), 'Flex')
  await user.type(screen.getByLabelText('Capacidade do tanque (L) *'), '58')
  await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
  expect(await screen.findByText('Placa já cadastrada.')).toBeInTheDocument()
  expect(screen.getByLabelText('Placa Mercosul *')).toHaveValue('ABC1D23')
})

test('adiciona e remove a foto pelo formulário de edição', async () => {
  const user = userEvent.setup()
  vi.mocked(api).mockResolvedValueOnce({}).mockResolvedValueOnce({})
  renderWithRouter(
    <VehicleForm
      vehicle={{
        id: 'vehicle-1',
        identification: '',
        plate: 'ABC1D23',
        photo: null,
        model: 'Fiorino',
        fuelType: 'Flex',
        maxCapacity: 58,
        mileageKm: 1200,
        lastAlertedKm: 1000,
        monthlyCap: 1500,
        status: 'ativo',
        fleet: 'Não informada',
        nextInspection: '',
      }}
      onSave={vi.fn<() => void>()}
      onCancel={vi.fn<() => void>()}
    />,
  )
  expect(screen.getByLabelText('Modelo *')).toHaveValue('Fiorino')
  expect(screen.getByRole('button', { name: 'Adicionar foto do veículo' })).toBeEnabled()
  const file = new File(
    [Uint8Array.from(atob(png), (character) => character.charCodeAt(0))],
    'veiculo.png',
    { type: 'image/png' },
  )
  await user.upload(screen.getByLabelText('Arquivo da foto do veículo'), file)
  expect(await screen.findByRole('img', { name: 'Foto do veículo' })).toHaveAttribute(
    'src',
    photoData,
  )
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  const calls = vi.mocked(api).mock.calls
  const uploadOptions = calls[calls.length - 1]?.[1]
  expect(JSON.parse(uploadOptions?.body as string).foto).toBe(photoData)
  await user.click(screen.getByRole('button', { name: 'Remover foto' }))
  expect(screen.queryByRole('img', { name: 'Foto do veículo' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  const options = vi.mocked(api).mock.calls[vi.mocked(api).mock.calls.length - 1]?.[1]
  expect(JSON.parse(options?.body as string).ultimo_km_alertado).toBe(1000)
  expect(JSON.parse(options?.body as string).foto).toBeNull()
  expect(api).toHaveBeenLastCalledWith(
    '/vehicles/vehicle-1',
    expect.objectContaining({ method: 'PUT' }),
  )
})

test('link Voltar usa a ação de retorno à lista', async () => {
  const user = userEvent.setup()
  const onBackToList = vi.fn<() => void>()
  const onCancel = vi.fn<() => void>()
  renderWithRouter(
    <VehicleForm
      vehicle={null}
      onSave={vi.fn<() => void>()}
      onCancel={onCancel}
      onBackToList={onBackToList}
    />,
  )
  const link = screen.getByRole('link', { name: 'Voltar para Veículos' })
  expect(link).toHaveAttribute('href', '/veiculos')
  await user.click(link)
  expect(onBackToList).toHaveBeenCalledOnce()
  expect(onCancel).not.toHaveBeenCalled()
})

test('atualiza a prévia e envia a disponibilidade e a exclusividade selecionadas', async () => {
  const user = userEvent.setup()
  vi.mocked(api).mockResolvedValueOnce({})
  renderWithRouter(
    <VehicleForm
      vehicle={null}
      onSave={vi.fn<() => void>()}
      onCancel={vi.fn<() => void>()}
    />,
  )
  const preview = screen.getByRole('complementary', { name: 'Prévia do veículo' })
  expect(within(preview).getByText('Novo cadastro')).toBeInTheDocument()
  await user.type(screen.getByLabelText('Identificação interna'), 'SVO-01')
  await user.type(screen.getByLabelText('Marca'), 'Fiat')
  await user.type(screen.getByLabelText('Modelo *'), 'Fiorino')
  await user.type(screen.getByLabelText('Placa Mercosul *'), 'abc-1d23')
  await user.type(screen.getByLabelText('Combustível *'), 'Flex')
  await user.type(screen.getByLabelText('Capacidade do tanque (L) *'), '58')
  expect(within(preview).getByText('SVO-01 · Fiat Fiorino')).toBeInTheDocument()
  expect(within(preview).getByText('ABC1D23')).toBeInTheDocument()
  expect(within(preview).getByText('Não informada · Flex · 58 L')).toBeInTheDocument()

  await user.click(screen.getByRole('switch', { name: 'Disponível para viagens' }))
  await user.click(screen.getByText('Exclusividade SVO e vistoria', { exact: true }))
  const exclusive = screen.getByRole('switch', { name: 'Exclusivo SVO' })
  await user.click(exclusive)
  expect(exclusive).toBeChecked()
  expect(screen.getByLabelText('Frota')).toHaveValue('SVO')
  await user.click(screen.getByRole('button', { name: 'Cadastrar veículo' }))
  const options = vi.mocked(api).mock.calls[vi.mocked(api).mock.calls.length - 1]?.[1]
  expect(JSON.parse(options?.body as string)).toMatchObject({
    frota: 'SVO',
    exclusivo_svo: true,
    marca: 'Fiat',
    identificacao: 'SVO-01',
    ativo: false,
  })
})
