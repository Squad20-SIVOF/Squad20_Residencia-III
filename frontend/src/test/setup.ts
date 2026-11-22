import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

vi.mock(
  '@/pages/drivers/services/driverService',
  () => import('./fixtures/driverService'),
)
vi.mock(
  '@/pages/vehicles/services/vehicleService',
  () => import('./fixtures/vehicleService'),
)
vi.mock('leaflet', () => import('./fixtures/leaflet'))
vi.mock('@/service/authService', () => ({
  currentUser: async () => ({
    id: 'test',
    nome: 'Gestor de Frota',
    email: 'gestor@example.com',
    permissoes: ['veiculos:ler', 'motoristas:ler', 'usuarios:delegar-permissoes'],
  }),
  login: vi.fn<() => Promise<void>>(),
  logout: vi.fn<() => Promise<void>>(),
}))
