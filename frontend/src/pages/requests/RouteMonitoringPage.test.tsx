import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import { RouteMonitoringPage } from './RouteMonitoringPage'
import * as trackedTripService from './services/trackedTripService'
import type { TrackedTrip } from './types'

// A rota fica atrás da flag gestor_route_monitoring (desligada por padrão), então a
// tela é renderizada direto.
test('mostra o mapa da viagem selecionada', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RouteMonitoringPage />
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole('region', { name: 'Mapa demonstrativo da rota #101' }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /Rota #102/ }))
  expect(
    screen.getByRole('region', { name: 'Mapa demonstrativo da rota #102' }),
  ).toBeInTheDocument()
})

test('exibe cinco rotas por página e sincroniza a prévia com a lista', async () => {
  const trips = Array.from({ length: 7 }, (_, index): TrackedTrip => ({
    id: `demo-rota-${101 + index}`,
    routeCode: String(101 + index),
    plate: 'ABC1D23',
    driverName: 'Motorista de teste',
    origin: `Origem ${index + 1}`,
    destination: 'Destino de teste',
    status: 'programada',
    delayMinutes: 0,
  }))
  using listTrips = vi
    .spyOn(trackedTripService, 'listTrackedTrips')
    .mockResolvedValue(trips)
  const user = userEvent.setup()
  render(
    <MemoryRouter>
      <RouteMonitoringPage />
    </MemoryRouter>,
  )

  const list = within(await screen.findByRole('list', { name: 'Lista de viagens' }))
  const preview = within(screen.getByRole('region', { name: 'Prévia do trajeto' }))
  const previous = screen.getByRole('button', { name: 'Anterior' })
  const next = screen.getByRole('button', { name: 'Próxima' })
  expect(list.getAllByRole('listitem')).toHaveLength(5)
  expect(previous).toBeDisabled()
  expect(preview.getByText('Origem 1')).toBeVisible()

  await user.click(next)
  expect(list.getAllByRole('listitem')).toHaveLength(2)
  expect(next).toBeDisabled()
  expect(preview.getByText('Origem 6')).toBeVisible()
  await user.click(previous)
  expect(list.getAllByRole('listitem')).toHaveLength(5)

  await user.click(next)
  await user.type(screen.getByRole('searchbox'), '#107')
  expect(screen.getByText('Página 1 de 1')).toBeVisible()
  expect(list.getAllByRole('listitem')).toHaveLength(1)
  expect(preview.getByText('Origem 7')).toBeVisible()
  expect(previous).toBeDisabled()
  expect(next).toBeDisabled()
  expect(listTrips).toHaveBeenCalledTimes(1)
})
