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
import { RelatoriosPage } from '@/pages/relatorios/RelatoriosPage'


const DevFeatureFlagsPage = lazy(() =>
  import('@/apps/motorista/pages/dev/DevFeatureFlagsPage').then((module) => ({
    default: module.DevFeatureFlagsPage,
  })),
