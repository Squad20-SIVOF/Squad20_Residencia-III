import { lazy, Suspense } from 'react'
import { RequireDriverVehicle } from './components/RequireDriverVehicle'
import { SessionVehiclePage } from './pages/flow/SessionVehiclePage'
import { RequireAuth } from '@/components/RequireAuth/RequireAuth'
import { LoadingState } from '@/components/LoadingState/LoadingState'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoginMobile } from './pages/LoginMobile/LoginMobile'
import { TripCaptureProvider } from './components/TripCaptureContext'
import { DriverFlowLayout } from './pages/flow/DriverFlowLayout'
import { IdentifyVehiclePage } from './pages/flow/IdentifyVehiclePage'
import { CapturePanelPage } from './pages/flow/CapturePanelPage'
import { CorrectMileagePage } from './pages/flow/CorrectMileagePage'
import { ConfirmMileagePage } from './pages/flow/ConfirmMileagePage'
import { MobileTripPage } from './pages/flow/MobileTripPage'
import { NotFoundPage } from '@/pages/placeholder/NotFoundPage'
import { DriverLayout } from './layouts/DriverLayout'
import { DriverChecklistPage } from './pages/DriverChecklistPage'
import { DriverFuelPage } from './pages/DriverFuelPage'
import { DriverHomePage } from './pages/DriverHomePage'
import { DriverProfilePage } from './pages/DriverProfilePage'
import { DriverTripsPage } from './pages/DriverTripsPage'
import { useFeatureFlag } from './features/useFeatureFlags'
import { isDevFeatureFlagsEnabled } from './features/featureFlags'
import { FeatureFlagRoute } from '@/components/FeatureFlagRoute'

const DevFeatureFlagsPage = lazy(() =>
  import('./pages/dev/DevFeatureFlagsPage').then((module) => ({
    default: module.DevFeatureFlagsPage,
  })),
)
const GpsEventSimulatorPage = lazy(() =>
  import('./pages/dev/GpsEventSimulatorPage').then((module) => ({
    default: module.GpsEventSimulatorPage,
  })),
)

function FeatureFlaggedGpsSimulator() {
  const enabled = useFeatureFlag('gps_event_simulator')
  if (!isDevFeatureFlagsEnabled()) return <NotFoundPage />
  return enabled ? (
    <Suspense fallback={<LoadingState label="Carregando simulador…" />}>
      <GpsEventSimulatorPage />
    </Suspense>
  ) : (
    <Navigate to="/dev/feature-flags" replace />
  )
}

/** Rotas do app do motorista (servido na raiz do próprio domínio/porta). */
export function DriverRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginMobile />} />
      <Route element={<RequireAuth />}>
        <Route
          path="/dev/feature-flags"
          element={
            isDevFeatureFlagsEnabled() ? (
              <Suspense fallback={<LoadingState label="Carregando configuração…" />}>
                <DevFeatureFlagsPage />
              </Suspense>
            ) : (
              <NotFoundPage />
            )
          }
        />
        <Route path="/dev/gps-simulator" element={<FeatureFlaggedGpsSimulator />} />
        <Route element={<TripCaptureProvider />}>
          <Route element={<DriverFlowLayout />}>
            <Route
              path="veiculo-sessao"
              element={
                <FeatureFlagRoute flag="motorista_vinculo_veiculo">
                  <SessionVehiclePage />
                </FeatureFlagRoute>
              }
            />
          </Route>
          <Route element={<RequireDriverVehicle />}>
            <Route element={<DriverLayout />}>
              <Route
                index
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <DriverHomePage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="viagens"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <DriverTripsPage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="checklist"
                element={
                  <FeatureFlagRoute flag="motorista_checklist">
                    <DriverChecklistPage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="abastecimento"
                element={
                  <FeatureFlagRoute flag="motorista_abastecimento">
                    <DriverFuelPage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="perfil"
                element={
                  <FeatureFlagRoute flag="motorista_perfil">
                    <DriverProfilePage />
                  </FeatureFlagRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route element={<DriverFlowLayout />}>
              <Route
                path="viagens/:id"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <MobileTripPage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="viagens/:id/inicio/identificar"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <IdentifyVehiclePage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="viagens/:id/:action/painel"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <CapturePanelPage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="viagens/:id/:action/corrigir-leitura"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <CorrectMileagePage />
                  </FeatureFlagRoute>
                }
              />
              <Route
                path="viagens/:id/:action/quilometragem"
                element={
                  <FeatureFlagRoute flag="motorista_viagens">
                    <ConfirmMileagePage />
                  </FeatureFlagRoute>
                }
              />
            </Route>
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export function DriverApp() {
  return (
    <BrowserRouter>
      <DriverRoutes />
    </BrowserRouter>
  )
}
