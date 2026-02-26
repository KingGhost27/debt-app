/**
 * Main App Component
 *
 * Sets up routing and wraps the app with context providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { DebtsPage } from './pages/DebtsPage';
import { AssetsPage } from './pages/AssetsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PlanPage } from './pages/PlanPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function ProtectedRoutes() {
  const { user, isLoading, isPasswordRecovery } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🌸</div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return <ResetPasswordPage />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="debts" element={<DebtsPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="strategy" element={<Navigate to="/plan" replace />} />
            <Route path="plan" element={<PlanPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="more" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
