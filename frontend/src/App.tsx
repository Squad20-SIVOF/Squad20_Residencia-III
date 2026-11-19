import AbastecimentosPage from '@/pages/abastecimentos/AbastecimentosPage'
import RegistrarAbastecimento from '@/pages/abastecimentos/registrar/RegistrarAbastecimento'
import SolicitacoesPendentesPage from '@/pages/solicitacoes/SolicitacoesPendentesPage'
import { UsersPage } from '@/pages/users/UsersPage'
import { RequireAuth } from '@/components/RequireAuth/RequireAuth'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DriverDetailsPage } from '@/pages/drivers/DriverDetailsPage'
import { DriverFormPage } from '@/pages/drivers/DriverFormPage'
import { DriversPage } from '@/pages/drivers/DriversPage'
import { HomePage } from '@/pages/home/HomePage'
import { ComingSoonPage } from '@/pages/placeholder/ComingSoonPage'
import { NotFoundPage } from '@/pages/placeholder/NotFoundPage'
import ProfilePage from '@/pages/perfil'
import { RequestFormPage } from '@/pages/requests/RequestFormPage'
import { RequestTrackingPage } from '@/pages/requests/RequestTrackingPage'
import { RequestDetailsPage } from '@/pages/requests/RequestDetailsPage'
import { AssignTripPage } from '@/pages/requests/AssignTripPage'
import { TripsPanelPage } from '@/pages/requests/TripsPanelPage'
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage'
import {
  ManutencoesPage,
  RegistrarManutencaoPage,
} from '@/pages/manutencoes/ManutencoesPage'
import { FeatureFlagRoute } from '@/components/FeatureFlagRoute'
import { isDevFeatureFlagsEnabled } from '@/apps/motorista/features/featureFlags'
import { lazy, Suspense } from 'react'
import { RouteMonitoringPage } from '@/pages/requests/RouteMonitoringPage'
import { RouteDetailsPage } from '@/pages/requests/RouteDetailsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'

const DevFeatureFlagsPage = lazy(() =>
  import('@/apps/motorista/pages/dev/DevFeatureFlagsPage').then((module) => ({
    default: module.DevFeatureFlagsPage,
  })),
)

// MÃ³dulos ainda sem tela prÃ³pria: mesma pÃ¡gina provisÃ³ria, sÃ³ muda o tÃ­tulo.
const COMING_SOON_ROUTES = [
  { path: 'abastecimentos', title: 'Abastecimentos' },
  { path: 'manutencoes', title: 'ManutenÃ§Ãµes' },
]

/** Rotas da aplicaÃ§Ã£o (separadas do BrowserRouter para poderem ser testadas). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route
          path="dev/feature-flags"
          element={
            isDevFeatureFlagsEnabled() ? (
              <Suspense fallback={<p>Carregando configuraÃ§Ãµesâ€¦</p>}>
                <DevFeatureFlagsPage />
              </Suspense>
            ) : (
              <NotFoundPage />
            )
          }
        />
        <Route element={<AppLayout />}>
          <Route
            path="viagens/solicitacoes"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <SolicitacoesPendentesPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            index
            element={
              <FeatureFlagRoute flag="gestor_dashboard">
                <HomePage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="veiculos"
            element={
              <FeatureFlagRoute flag="gestor_veiculos">
                <VehiclesPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="manutencoes"
            element={
              <FeatureFlagRoute flag="gestor_manutencoes">
                <ManutencoesPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="manutencoes/nova"
            element={
              <FeatureFlagRoute flag="gestor_manutencoes">
                <RegistrarManutencaoPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="manutencoes/editar/:id"
            element={
              <FeatureFlagRoute flag="gestor_manutencoes">
                <RegistrarManutencaoPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="motoristas"
            element={
              <FeatureFlagRoute flag="gestor_motoristas">
                <DriversPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="motoristas/novo"
            element={
              <FeatureFlagRoute flag="gestor_motoristas">
                <DriverFormPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="motoristas/editar/:id"
            element={
              <FeatureFlagRoute flag="gestor_motoristas">
                <DriverFormPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="motoristas/:id"
            element={
              <FeatureFlagRoute flag="gestor_motoristas">
                <DriverDetailsPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <TripsPanelPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/monitoramento"
            element={
              <FeatureFlagRoute flag="gestor_route_monitoring">
                <RouteMonitoringPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/monitoramento/:tripId"
            element={
              <FeatureFlagRoute flag="gestor_route_details">
                <RouteDetailsPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/solicitar"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <RequestFormPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/solicitacoes/:id"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <RequestDetailsPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/solicitacoes/:id/atribuir"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <AssignTripPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="viagens/:id"
            element={
              <FeatureFlagRoute flag="gestor_viagens">
                <RequestTrackingPage />
              </FeatureFlagRoute>
            }
          />
          <Route path="perfil" element={<ProfilePage />} />
          <Route
            path="notificacoes"
            element={
              <FeatureFlagRoute flag="gestor_notificacoes">
                <NotificationsPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <FeatureFlagRoute flag="gestor_usuarios">
                <UsersPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="abastecimentos"
            element={
              <FeatureFlagRoute flag="gestor_abastecimentos">
                <AbastecimentosPage />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="abastecimentos/registrar"
            element={
              <FeatureFlagRoute flag="gestor_abastecimentos">
                <RegistrarAbastecimento />
              </FeatureFlagRoute>
            }
          />
          <Route
            path="abastecimentos/editar/:id"
            element={
              <FeatureFlagRoute flag="gestor_abastecimentos">
                <RegistrarAbastecimento />
              </FeatureFlagRoute>
            }
          />
          {COMING_SOON_ROUTES.map(({ path, title }) => (
            <Route
              key={path}
              path={path}
              element={
                path === 'relatorios' ? (
                  <FeatureFlagRoute flag="gestor_relatorios">
                    <ComingSoonPage title={title} />
                  </FeatureFlagRoute>
                ) : (
                  <ComingSoonPage title={title} />
                )
              }
            />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
