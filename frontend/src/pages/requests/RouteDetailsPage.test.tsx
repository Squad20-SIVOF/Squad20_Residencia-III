import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test } from 'vitest'
import { RouteDetailsPage } from './RouteDetailsPage'

// A rota fica atrás da flag gestor_route_details (desligada por padrão), então a
// tela é renderizada direto.
test('mostra o mapa da rota com origem e destino', async () => {
  render(
    <MemoryRouter initialEntries={['/viagens/monitoramento/demo-rota-101']}>
      <Routes>
        <Route path="/viagens/monitoramento/:tripId" element={<RouteDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(
    await screen.findByRole('region', {
      name: 'Mapa da rota Central SVO para Posto Sul',
    }),
  ).toBeInTheDocument()
})
