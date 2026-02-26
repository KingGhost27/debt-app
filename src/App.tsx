/**
 * Main App Component
 *
 * Sets up routing and wraps the app with context providers.
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { DebtsPage } from './pages/DebtsPage';
import { AssetsPage } from './pages/AssetsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PlanPage } from './pages/PlanPage';
import { TrackPage } from './pages/TrackPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

const ONBOARDING_SKIP_KEY = (userId: string) => `cowculator_onboarding_skipped_${userId}`;

function AppRouter() {
  const { settings, isLoading, updateSettings } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasSkipped, setHasSkipped] = useState(false);

  if (isLoading) return null;

  const localSkipped = user ? localStorage.getItem(ONBOARDING_SKIP_KEY(user.id)) === 'true' : false;
  const needsOnboarding = !settings.userName && !localSkipped && !hasSkipped;

  if (needsOnboarding) {
    return (
      <OnboardingPage
        onComplete={async (name) => {
          await updateSettings({ userName: name });
          navigate('/');
        }}
        onSkip={() => {
          if (user) localStorage.setItem(ONBOARDING_SKIP_KEY(user.id), 'true');
          setHasSkipped(true);
          navigate('/');
        }}
      />
    );
  }

  return (
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
  );
}

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
        <AppRouter />
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
