import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { TripMonitoringPage } from '@/pages/trips/TripMonitoringPage';
import { RouteDetailsPage } from '@/pages/RouteDetailsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/viagens" element={<TripMonitoringPage />} />
        <Route path="/viagens/:tripId" element={<RouteDetailsPage />} />
        <Route path="*" element={<Navigate to="/viagens" replace />} />
      </Route>
    </Routes>
  );
}
