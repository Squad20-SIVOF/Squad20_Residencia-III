import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { RouteMonitoringPage } from './RouteMonitoringPage'

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
    await screen.findByRole('region', { name: 'Mapa de Central SVO até Posto Sul' }),
  ).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: /Rota #102/ }))
  expect(
    screen.getByRole('region', { name: 'Mapa de Terminal Norte até Base SVO' }),
  ).toBeInTheDocument()
})
