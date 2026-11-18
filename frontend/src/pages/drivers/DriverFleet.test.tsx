import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { DriverForm } from './components/DriverForm/DriverForm'
import { getVehicles } from '@/pages/vehicles/services/vehicleService'

vi.mock('@/pages/vehicles/services/vehicleService', () => ({
  getVehicles: vi.fn<typeof getVehicles>(),
}))

beforeEach(() => {
  vi.mocked(getVehicles).mockResolvedValue([
    {
      id: 'svo',
      plate: 'SVO0A01',
      model: 'Demo SVO',
      fuelType: 'Diesel',
      maxCapacity: 60,
      status: 'ativo',
      mileageKm: 0,
      fleet: 'SVO',
      exclusiveSvo: true,
      identification: '',
      nextInspection: '',
    },
    {
      id: 'adm',
      plate: 'ADM0A01',
      model: 'Demo administrativo',
      fuelType: 'Flex',
      maxCapacity: 50,
      status: 'ativo',
      mileageKm: 0,
      fleet: 'Administrativa',
      identification: '',
      nextInspection: '',
    },
  ])
})

test('filtra os veículos pela frota e libera todas para coringa', async () => {
  const user = userEvent.setup()
  render(
    <DriverForm onSubmit={vi.fn<() => Promise<void>>()} onCancel={vi.fn<() => void>()} />,
  )
  await user.selectOptions(screen.getByLabelText('Frota *'), 'Administrativa')
  await waitFor(() =>
    expect(screen.getByRole('option', { name: 'ADM0A01' })).toBeInTheDocument(),
  )
  expect(screen.queryByRole('option', { name: 'SVO0A01' })).not.toBeInTheDocument()
  await user.click(screen.getByLabelText(/Motorista coringa/))
  expect(screen.getByRole('option', { name: 'SVO0A01' })).toBeInTheDocument()
})

test('mantém o vínculo ao trocar a frota e avisa que deve ser removido', async () => {
  const user = userEvent.setup()
  render(
    <DriverForm onSubmit={vi.fn<() => Promise<void>>()} onCancel={vi.fn<() => void>()} />,
  )
  await user.selectOptions(screen.getByLabelText('Frota *'), 'SVO')
  await user.selectOptions(screen.getByLabelText('Escolher veículo'), 'SVO0A01')
  await user.click(screen.getByRole('button', { name: 'Adicionar' }))
  await user.selectOptions(screen.getByLabelText('Frota *'), 'Administrativa')
  expect(screen.getByText(/Remova os veículos incompatíveis/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remover SVO0A01' })).toBeInTheDocument()
})
