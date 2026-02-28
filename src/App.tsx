/**
 * Main App Component
 *
 * Sets up routing and wraps the app with context providers.
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
import { TutorialModal } from './components/ui/TutorialModal';
import { CelebrationModal } from './components/ui/CelebrationModal';
import { useMilestoneDetection } from './hooks/useMilestoneDetection';

const ONBOARDING_SKIP_KEY = (userId: string) => `cowculator_onboarding_skipped_${userId}`;

function AppRouter() {
  const { settings, isLoading, updateSettings, debts, payments, strategy, celebrationEvent, celebrationStats, triggerCelebration, dismissCelebration } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hasSkipped, setHasSkipped] = useState(false);
  const [forceShowTutorial, setForceShowTutorial] = useState(false);

  // Handle ?tutorial=1 replay from Settings
  useEffect(() => {
    if (searchParams.get('tutorial') === '1') {
      setForceShowTutorial(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Wire milestone detection — must be called unconditionally (hooks rule)
  useMilestoneDetection({
    debts,
    payments,
    strategy,
    userName: settings.userName || 'Friend',
    triggerCelebration,
    currentCelebration: celebrationEvent,
  });

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

  const shouldShowTutorial = (
    (!settings.tutorialCompleted && !!settings.userName) || forceShowTutorial
  ) && !needsOnboarding;

  const handleTutorialComplete = async () => {
    setForceShowTutorial(false);
    await updateSettings({ tutorialCompleted: true });
  };

  return (
    <>
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
      {shouldShowTutorial && (
        <TutorialModal onComplete={handleTutorialComplete} />
      )}
      {celebrationEvent && celebrationStats && (
        <CelebrationModal
          event={celebrationEvent}
          stats={celebrationStats}
          themePreset={settings.theme?.preset || 'default'}
          onDismiss={dismissCelebration}
        />
      )}
    </>
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
