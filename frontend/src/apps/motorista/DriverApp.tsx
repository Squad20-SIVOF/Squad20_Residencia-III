import { SessionVehiclePage } from './pages/flow/SessionVehiclePage'
import { RequireAuth } from '@/components/RequireAuth/RequireAuth'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
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

/** Rotas do app do motorista (servido na raiz do próprio domínio/porta). */
export function DriverRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginMobile />} />
      <Route element={<RequireAuth />}>
        <Route element={<TripCaptureProvider />}>
          <Route element={<DriverLayout />}>
            <Route index element={<DriverHomePage />} />
            <Route path="viagens" element={<DriverTripsPage />} />
            <Route path="checklist" element={<DriverChecklistPage />} />
            <Route path="abastecimento" element={<DriverFuelPage />} />
            <Route path="perfil" element={<DriverProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<DriverFlowLayout />}>
            <Route path="veiculo-sessao" element={<SessionVehiclePage />} />
            <Route path="viagens/:id" element={<MobileTripPage />} />
            <Route
              path="viagens/:id/inicio/identificar"
              element={<IdentifyVehiclePage />}
            />
            <Route path="viagens/:id/:action/painel" element={<CapturePanelPage />} />
            <Route
              path="viagens/:id/:action/corrigir-leitura"
              element={<CorrectMileagePage />}
            />
            <Route
              path="viagens/:id/:action/quilometragem"
              element={<ConfirmMileagePage />}
            />
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
