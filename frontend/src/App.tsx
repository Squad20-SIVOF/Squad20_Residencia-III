import { RelatoriosPage } from '@/pages/relatorios/RelatoriosPage'
import { AtendimentoSVOPage } from '@/pages/atendimento-svo/AtendimentoSVOPage'
import { PainelViagensPage } from '@/pages/painel-viagens/PainelViagensPage'
import AbastecimentosPage from '@/pages/abastecimentos/AbastecimentosPage'
import RegistrarAbastecimento from '@/pages/abastecimentos/registrar/RegistrarAbastecimento'
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
import { VehiclesPage } from '@/pages/vehicles/VehiclesPage'
import {
  ManutencoesPage,
  RegistrarManutencaoPage,
} from '@/pages/manutencoes/ManutencoesPage'

// Módulos ainda sem tela própria: mesma página provisória, só muda o título.
const COMING_SOON_ROUTES = [
  { path: 'abastecimentos', title: 'Abastecimentos' },
  { path: 'viagens', title: 'Viagens' },
  { path: 'manutencoes', title: 'Manutenções' },
]

/** Rotas da aplicação (separadas do BrowserRouter para poderem ser testadas). */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="veiculos" element={<VehiclesPage />} />
          <Route path="manutencoes" element={<ManutencoesPage />} />
          <Route path="manutencoes/nova" element={<RegistrarManutencaoPage />} />
          <Route path="manutencoes/editar/:id" element={<RegistrarManutencaoPage />} />
          <Route path="motoristas" element={<DriversPage />} />
          <Route path="motoristas/novo" element={<DriverFormPage />} />
          <Route path="motoristas/editar/:id" element={<DriverFormPage />} />
          <Route path="motoristas/:id" element={<DriverDetailsPage />} />
          <Route path="viagens" element={<RequestFormPage />} />
          <Route path="painel-viagens" element={<PainelViagensPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="atendimento-svo" element={<AtendimentoSVOPage />} />
          <Route path="viagens/:id" element={<RequestTrackingPage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="abastecimentos" element={<AbastecimentosPage />} />
          <Route path="abastecimentos/registrar" element={<RegistrarAbastecimento />} />
          <Route path="abastecimentos/editar/:id" element={<RegistrarAbastecimento />} />
          {COMING_SOON_ROUTES.map(({ path, title }) => (
            <Route key={path} path={path} element={<ComingSoonPage title={title} />} />
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
