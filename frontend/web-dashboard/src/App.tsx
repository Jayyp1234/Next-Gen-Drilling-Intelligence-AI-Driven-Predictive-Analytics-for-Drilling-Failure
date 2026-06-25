import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { DrillGuardProvider, useDrillGuard } from './context/DrillGuardContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import FleetOverview from './pages/FleetOverview';
import WellDetail from './pages/WellDetail';
import RiskAnalysis from './pages/RiskAnalysis';
import AlertManagement from './pages/AlertManagement';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDrillGuard();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useDrillGuard();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<FleetOverview />} />
        <Route path="/wells/:wellId" element={<WellDetail />} />
        <Route path="/wells/:wellId/analysis" element={<RiskAnalysis />} />
        <Route path="/alerts" element={<AlertManagement />} />
        <Route path="/history" element={<HistoricalAnalysis />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <DrillGuardProvider>
          <AppRoutes />
        </DrillGuardProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
