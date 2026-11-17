import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { LoginPage } from './LoginPage'

test('mostra a marca SIVOF Manager no login', () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )

  const brand = screen.getByRole('complementary', { name: 'SIVOF Manager' })
  expect(brand).toHaveTextContent('SM')
  expect(brand).toHaveTextContent('SIVOF Manager')
  expect(brand).toHaveTextContent('Gestão de Frota · FSPH')
  expect(screen.getByText('Acesse sua conta do SIVOF Manager')).toBeInTheDocument()
  expect(screen.queryByText(/FrotaManager/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
})
